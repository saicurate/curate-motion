# /// script
# requires-python = ">=3.11,<3.13"
# dependencies = [
#   "torch>=2.6",
#   "transformers>=4.56",
#   "timm>=1.0",
#   "kornia>=0.7",
#   "einops>=0.8",
#   "numpy>=2.0",
#   "pillow>=11.0",
#   "opencv-python-headless>=4.10",
#   "pymatting>=1.1.12",
#   "huggingface-hub>=0.34",
# ]
# ///
"""tools/photo3d: free, local "2.5D photo" layers from one still (Curate's photos never leave the Mac).

  tools/depth <photo-id|file> [--out dir] [--size 770]           depth (Depth Anything V2 Small, Apache-2.0)
  tools/cutout-person <photo-id|file> [--out dir]                 the person, RGBA (BiRefNet-portrait, MIT;
                                                                  edge colours un-mixed with pymatting, MIT)
  tools/cutout-person part <photo-id|file> --name jacket \\
      --pos x,y x,y … [--neg x,y …] [--box x0,y0,x1,y1]           one piece she is WEARING, by points
                                                                  (SAM 2.1 hiera-small, Apache-2.0), inside her matte
  tools/inpaint <image> <mask> [--out file] [--long 512]          fill a hole (LaMa / big-lama, Apache-2.0)
  tools/photo3d under <photo-id> --part jacket --fill <genfill.png>  her with that piece off, from a generative fill
  tools/photo3d <photo-id> [--part name:x,y;x,y[/neg x,y;…]] …     everything a <DepthPhoto> needs, into
                                                                  .cache/photo3d/<photo>/ (then register: see AGENTS.md)

Coordinates are pixels of the ORIGINAL photo. Everything runs on the Mac (PyTorch on Apple's GPU, MPS,
or the CPU); models come from Hugging Face once and are cached (~/.cache/huggingface). No paid calls.

What photo3d writes (all the photo's size):
  depth.png         disparity of the whole photo, "rg16" (16 bits packed in RGB: R high byte, G low byte),
                    65535 = nearest (DA V2 gives relative inverse depth; the ad picks near/far)
  person.png        her cut-out, RGBA, colours un-mixed from the background at the edges
  person-depth.png  the depth her layer uses: her own depth, pushed out past her edge (no "fins")
  plate.jpg         the photo with her removed: LaMa fill in a dilated hole (only its fringe is ever seen)
  plate-depth.png   the background's depth continued behind her (pull-push fill, smoothed)
  <part>.png        a piece she wears (e.g. jacket), RGBA, inside her matte; <part>-depth.png likewise
  under-<part>.png  her cut-out with that piece taken off (the hole filled by LaMa), for a peel
  layers.json       sizes, the subject's box and depth, the depth range: what the ad reads
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
LIB = ROOT / "library"
CACHE = ROOT / ".cache" / "photo3d"

MODELS = {
    # revisions pinned: the same weights (and, for BiRefNet, the same remote code) on every run
    "depth": {"repo": "depth-anything/Depth-Anything-V2-Small-hf", "revision": "5426e4f0f36572d16453bbda7a8389317b1bef99", "licence": "Apache-2.0"},
    "matte": {"repo": "ZhengPeng7/BiRefNet-portrait", "revision": "b6561965a70070d9143fd9e558f6ca3c481510db", "licence": "MIT"},
    "parts": {"repo": "facebook/sam2.1-hiera-small", "revision": "ee5bba1d82bb8749febdf90f45e84b687142ba03", "licence": "Apache-2.0"},
    "inpaint": {"repo": "big-lama (advimman/lama), TorchScript export by enesmsahin/simple-lama-inpainting", "licence": "Apache-2.0", "url": "https://github.com/enesmsahin/simple-lama-inpainting/releases/download/v0.1.0/big-lama.pt"},
    "foreground": {"repo": "pymatting estimate_foreground_ml", "licence": "MIT"},
}


def log(*a):
    print(*a, file=sys.stderr, flush=True)


def device():
    import torch

    if torch.backends.mps.is_available():
        return torch.device("mps")
    return torch.device("cpu")


# ---------------------------------------------------------------- inputs


def resolve(ref: str) -> tuple[str, Path]:
    """A photo id (looked up in catalog/index.json) or a file path → (name, path)."""
    p = Path(ref)
    if p.exists():
        return p.stem.replace(".v1", ""), p
    idx = json.loads((ROOT / "catalog" / "index.json").read_text())
    for a in idx["assets"]:
        if a["id"] == ref:
            f = next((f for f in a["files"] if f["role"] == "original"), a["files"][0])
            return ref, LIB / f["path"]
    sys.exit(f"photo3d: {ref} is neither a file nor an asset id in catalog/index.json")


def load_rgb(p: Path) -> np.ndarray:
    return np.asarray(Image.open(p).convert("RGB"))


def save_u16(path: Path, a01: np.ndarray):
    """Depth as "rg16": 16-bit disparity packed in an 8-bit RGB PNG (R = high byte, G = low byte, B = 0),
    because browsers decode 16-bit PNGs to 8 bits; motion/DepthPhoto.tsx unpacks it in its vertex shader."""
    v = np.clip(a01 * 65535 + 0.5, 0, 65535).astype(np.uint16)
    rgb = np.dstack([(v >> 8).astype(np.uint8), (v & 255).astype(np.uint8), np.zeros_like(v, dtype=np.uint8)])
    Image.fromarray(rgb, "RGB").save(path, compress_level=6)


def load_u16(path: Path) -> np.ndarray:
    a = np.asarray(Image.open(path))
    if a.ndim == 3:  # rg16
        return (a[..., 0].astype(np.float32) * 256 + a[..., 1].astype(np.float32)) / 65535.0
    return a.astype(np.float32) / 65535.0


def save_rgba(path: Path, rgb: np.ndarray, alpha01: np.ndarray):
    a = np.clip(alpha01 * 255 + 0.5, 0, 255).astype(np.uint8)
    Image.fromarray(np.dstack([rgb.astype(np.uint8), a]), "RGBA").save(path, optimize=False, compress_level=6)


# ---------------------------------------------------------------- depth


def run_depth(rgb: np.ndarray, size: int = 770) -> np.ndarray:
    """Depth Anything V2 Small: relative disparity, normalised 0..1 (1 = nearest), at the photo's size.
    Run at `size` px on the short side (a multiple of 14) with a mirrored second pass averaged in."""
    import torch
    from transformers import AutoImageProcessor, AutoModelForDepthEstimation

    dev = device()
    repo = MODELS["depth"]["repo"]
    rev = MODELS["depth"]["revision"]
    proc = AutoImageProcessor.from_pretrained(repo, revision=rev)
    model = AutoModelForDepthEstimation.from_pretrained(repo, revision=rev).to(dev).eval()
    h, w = rgb.shape[:2]
    s = size / min(h, w)
    th, tw = int(round(h * s / 14)) * 14, int(round(w * s / 14)) * 14
    outs = []
    for flip in (False, True):
        im = rgb[:, ::-1] if flip else rgb
        inp = proc(images=Image.fromarray(np.ascontiguousarray(im)), return_tensors="pt", size={"height": th, "width": tw}, do_resize=True, keep_aspect_ratio=False, ensure_multiple_of=14)
        with torch.no_grad():
            d = model(pixel_values=inp["pixel_values"].to(dev)).predicted_depth  # (1, th, tw)
            d = torch.nn.functional.interpolate(d[:, None], size=(h, w), mode="bicubic", align_corners=False)[0, 0]
        d = d.float().cpu().numpy()
        outs.append(d[:, ::-1] if flip else d)
    d = (outs[0] + outs[1]) / 2
    lo, hi = np.percentile(d, 0.5), np.percentile(d, 99.5)
    return np.clip((d - lo) / max(1e-6, hi - lo), 0, 1).astype(np.float32)


# ---------------------------------------------------------------- matte (person)


def run_matte(rgb: np.ndarray) -> np.ndarray:
    """BiRefNet-portrait: a soft person matte 0..1 at the photo's size."""
    import torch
    from transformers import AutoModelForImageSegmentation

    dev = device()
    model = AutoModelForImageSegmentation.from_pretrained(MODELS["matte"]["repo"], revision=MODELS["matte"]["revision"], trust_remote_code=True).to(dev).eval()
    h, w = rgb.shape[:2]
    S = 1024
    x = torch.from_numpy(np.asarray(Image.fromarray(rgb).resize((S, S), Image.BICUBIC))).float().permute(2, 0, 1)[None] / 255.0
    mean = torch.tensor([0.485, 0.456, 0.406])[None, :, None, None]
    std = torch.tensor([0.229, 0.224, 0.225])[None, :, None, None]
    x = ((x - mean) / std).to(dev)
    with torch.no_grad():
        y = model(x)[-1].sigmoid()
        y = torch.nn.functional.interpolate(y, size=(h, w), mode="bilinear", align_corners=False)[0, 0]
    return y.float().cpu().numpy().clip(0, 1)


def largest_only(alpha: np.ndarray) -> np.ndarray:
    """Keep her, drop strays: the matte's largest solid part and its soft fringe (a passer-by's boot at the
    frame edge, a bag on the next table), measured on r10-night-out."""
    import cv2

    solid = (alpha > 0.5).astype(np.uint8)
    n, lab, stats, _ = cv2.connectedComponentsWithStats(solid, connectivity=8)
    if n <= 2:
        return alpha
    k = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
    keep = cv2.dilate((lab == k).astype(np.uint8), disk(max(6, alpha.shape[1] // 200)))
    return (alpha * keep).astype(np.float32)


def unmix(rgb: np.ndarray, alpha: np.ndarray) -> np.ndarray:
    """Foreground colours at the soft edge without the background mixed in (pymatting), so a cut-out
    over a NEW background has no halo of the old one."""
    from pymatting import estimate_foreground_ml

    img = rgb.astype(np.float64) / 255.0
    fg = estimate_foreground_ml(img, alpha.astype(np.float64), return_background=False)
    return np.clip(fg * 255 + 0.5, 0, 255).astype(np.uint8)


# ---------------------------------------------------------------- parts (a garment she wears)


def run_part(rgb: np.ndarray, pos: list[tuple[float, float]], neg: list[tuple[float, float]], box=None) -> np.ndarray:
    """SAM 2.1 hiera-small, prompted by points (and an optional box): the best of its 3 masks, 0..1."""
    import torch
    from transformers import Sam2Model, Sam2Processor

    dev = device()
    repo = MODELS["parts"]["repo"]
    rev = MODELS["parts"]["revision"]
    proc = Sam2Processor.from_pretrained(repo, revision=rev)
    model = Sam2Model.from_pretrained(repo, revision=rev).to(dev).eval()
    pts = [[list(p) for p in pos + neg]]
    labels = [[1] * len(pos) + [0] * len(neg)]
    kw = dict(images=Image.fromarray(rgb), input_points=[pts], input_labels=[labels], return_tensors="pt")
    if box:
        kw["input_boxes"] = [[list(box)]]
    inp = proc(**kw).to(dev)
    with torch.no_grad():
        out = model(**inp, multimask_output=True)
    masks = proc.post_process_masks(out.pred_masks.cpu(), inp["original_sizes"].cpu(), binarize=False)[0]  # (1, 3, H, W) logits
    scores = out.iou_scores.cpu().numpy().reshape(-1)
    k = int(np.argmax(scores))
    log(f"  SAM 2.1: scores {np.round(scores, 3).tolist()}, kept mask {k}")
    m = masks[0, k].float().numpy()
    return 1 / (1 + np.exp(-m))


# ---------------------------------------------------------------- inpaint


def lama_model():
    import torch

    url = MODELS["inpaint"]["url"]
    dst = Path.home() / ".cache" / "curate-photo3d" / "big-lama.pt"
    if not dst.exists():
        dst.parent.mkdir(parents=True, exist_ok=True)
        log(f"  downloading big-lama ({url})")
        torch.hub.download_url_to_file(url, str(dst), progress=False)
    return torch.jit.load(str(dst), map_location="cpu").eval()


def run_inpaint(rgb: np.ndarray, hole: np.ndarray, long_side: int = 512) -> np.ndarray:
    """LaMa at `long_side` px (it is fully convolutional), upsampled into the hole only; outside it the
    photo's own pixels stay exactly as they were."""
    import cv2
    import torch

    h, w = rgb.shape[:2]
    s = min(1.0, long_side / max(h, w))
    sh, sw = int(round(h * s / 8)) * 8, int(round(w * s / 8)) * 8
    small = cv2.resize(rgb, (sw, sh), interpolation=cv2.INTER_AREA)
    hm = (cv2.resize(hole.astype(np.float32), (sw, sh), interpolation=cv2.INTER_LINEAR) > 0.01).astype(np.float32)
    model = lama_model()
    img_t = torch.from_numpy(small).float().permute(2, 0, 1)[None] / 255.0
    m_t = torch.from_numpy(hm)[None, None]
    with torch.no_grad():
        out = model(img_t, m_t)[0].permute(1, 2, 0).clamp(0, 1).numpy()
    fill = cv2.resize((out * 255).astype(np.float32), (w, h), interpolation=cv2.INTER_CUBIC)
    # feather the seam over a few px INSIDE the hole
    soft = cv2.GaussianBlur(hole.astype(np.float32), (0, 0), 2.0) * hole
    soft = np.clip(soft * 1.5, 0, 1)[..., None]
    res = rgb.astype(np.float32) * (1 - soft) + fill * soft
    return np.clip(res + 0.5, 0, 255).astype(np.uint8)


# ---------------------------------------------------------------- depth filling (no model: pull-push)


def pull_push(values: np.ndarray, known: np.ndarray) -> np.ndarray:
    """Fill unknown pixels smoothly from the known ones (a pull-push pyramid). values: HxW float,
    known: HxW bool. Known pixels keep their values."""
    import cv2

    v = np.where(known, values, 0).astype(np.float32)
    wgt = known.astype(np.float32)
    levels = []
    while min(v.shape) > 4:
        levels.append((v, wgt))
        v2 = cv2.resize(v * wgt, (max(1, v.shape[1] // 2), max(1, v.shape[0] // 2)), interpolation=cv2.INTER_AREA)
        w2 = cv2.resize(wgt, (v2.shape[1], v2.shape[0]), interpolation=cv2.INTER_AREA)
        v = np.where(w2 > 1e-6, v2 / np.maximum(w2, 1e-6), 0)
        wgt = np.clip(w2 * 4, 0, 1)
    filled = v
    for lv, lw in reversed(levels):
        up = cv2.resize(filled, (lv.shape[1], lv.shape[0]), interpolation=cv2.INTER_LINEAR)
        filled = lv * lw + up * (1 - lw)
    return np.where(known, values, filled).astype(np.float32)


def fill_holes(m: np.ndarray) -> np.ndarray:
    """Close the holes a garment mask gets where SAM leaves out its buttons, studs and pocket flaps:
    every region of background not connected to the image border becomes part of the mask."""
    import cv2

    inv = (m < 0.5).astype(np.uint8)
    n, lab = cv2.connectedComponents(inv, connectivity=4)
    border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    keep_bg = np.isin(lab, list(border))
    return np.where(keep_bg, 0.0, 1.0).astype(np.float32)


def strand_mask(fg: np.ndarray, hard: np.ndarray, closed: np.ndarray) -> np.ndarray:
    """Hair over a garment, in its top third: pixels off the piece's hue (warm brown on blue denim) and
    darker than its median (measured on r26)."""
    import cv2

    m = closed > 0.5
    ys, _ = np.nonzero(m)
    top = ys.min() + (ys.max() - ys.min()) // 3
    f = fg.astype(np.float32)
    lum = f @ np.array([0.2126, 0.7152, 0.0722], np.float32)
    med = np.median(f[m], axis=0)
    # hue only: hair is warm brown (red over blue), the denim's own shadows stay blue; "dark" alone would
    # take the collar's shadows too (measured on r26: big pale fills)
    warm = (f[..., 0] - f[..., 2]) > (med[0] - med[2]) + 18
    rows = np.zeros_like(m)
    rows[:top] = True
    s = m & rows & warm & (lum < float(np.median(lum[m])))
    # (not a black-hat: denim's own weave is thin dark lines, and it took the whole collar; measured on r26)
    return cv2.morphologyEx(s.astype(np.uint8), cv2.MORPH_OPEN, disk(1)) > 0


def disk(r: int):
    import cv2

    r = max(1, int(r))
    return cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * r + 1, 2 * r + 1))


def layer_depth(depth: np.ndarray, alpha: np.ndarray, erode_px: int) -> np.ndarray:
    """A cut-out layer's depth: its own depth inside (eroded, away from the blurred depth edge), pushed
    outwards past its edge so the edge pixels sit at the subject's depth, not halfway to the wall."""
    import cv2

    core = cv2.erode((alpha > 0.5).astype(np.uint8), disk(erode_px)) > 0
    d = pull_push(depth, core)
    return cv2.GaussianBlur(d, (0, 0), 1.5)


def plate_depth(depth: np.ndarray, alpha: np.ndarray, grow_px: int) -> np.ndarray:
    """The background's depth carried on behind the subject: depth outside a generous dilation of her
    matte (the depth net blurs her edge into the wall), filled inwards smoothly, then softened."""
    import cv2

    hole = cv2.dilate((alpha > 0.02).astype(np.uint8), disk(grow_px)) > 0
    d = pull_push(depth, ~hole)
    return cv2.GaussianBlur(d, (0, 0), 3.0)


# ---------------------------------------------------------------- commands


def out_dir(name: str, out: str | None) -> Path:
    d = Path(out) if out else CACHE / name.replace("photo.emma.", "").replace(".v1", "")
    d.mkdir(parents=True, exist_ok=True)
    return d


def preview(path: Path, a: np.ndarray):
    Image.fromarray(np.clip(a * 255, 0, 255).astype(np.uint8)).resize((a.shape[1] // 3, a.shape[0] // 3)).save(path)


def cmd_depth(a):
    name, p = resolve(a.photo)
    d = out_dir(name, a.out)
    rgb = load_rgb(p)
    log(f"depth: {name} ({rgb.shape[1]}x{rgb.shape[0]}) with {MODELS['depth']['repo']} ({MODELS['depth']['licence']})")
    dep = run_depth(rgb, a.size)
    save_u16(d / "depth.png", dep)
    preview(d / "depth-preview.jpg", dep)
    print(d / "depth.png")


def cmd_cutout(a):
    name, p = resolve(a.photo)
    d = out_dir(name, a.out)
    rgb = load_rgb(p)
    log(f"cutout-person: {name} with {MODELS['matte']['repo']} ({MODELS['matte']['licence']})")
    alpha = largest_only(run_matte(rgb))
    fg = unmix(rgb, alpha)
    save_rgba(d / "person.png", fg, alpha)
    print(d / "person.png")


def parse_pts(xs):
    return [tuple(float(v) for v in s.split(",")) for s in (xs or [])]


def cmd_part(a):
    name, p = resolve(a.photo)
    d = out_dir(name, a.out)
    rgb = load_rgb(p)
    person = d / "person.png"
    if not person.exists():
        sys.exit(f"cutout-person part: run `tools/cutout-person {a.photo}` first ({person} is missing)")
    pa = np.asarray(Image.open(person)).astype(np.float32)
    alpha, fg = pa[..., 3] / 255.0, pa[..., :3]
    box = tuple(float(v) for v in a.box.split(",")) if a.box else None
    log(f"part {a.name}: {name} with {MODELS['parts']['repo']} ({MODELS['parts']['licence']})")
    m = run_part(rgb, parse_pts(a.pos), parse_pts(a.neg), box)
    import cv2

    # her matte's soft edge where the part meets the background; SAM's own edge inside her
    hard = fill_holes(cv2.morphologyEx((m > 0.5).astype(np.float32), cv2.MORPH_OPEN, disk(2)))
    soft = cv2.GaussianBlur(hard, (0, 0), 1.2)
    pal = np.clip(soft, 0, 1) * alpha
    save_rgba(d / f"{a.name}.png", fg, pal)
    print(d / f"{a.name}.png")


def cmd_inpaint(a):
    rgb = load_rgb(Path(a.image))
    hole = np.asarray(Image.open(a.mask).convert("L")).astype(np.float32) / 255.0 > 0.5
    log(f"inpaint: {a.image} with big-lama ({MODELS['inpaint']['licence']})")
    res = run_inpaint(rgb, hole, a.long)
    out = Path(a.out) if a.out else Path(a.image).with_name(Path(a.image).stem + "-filled.jpg")
    Image.fromarray(res).save(out, quality=95)
    print(out)


def cmd_under(a):
    """her with a piece off, RGBA: a full-photo fill (tools/genfill) inside the piece's hole, her own
    un-mixed colours elsewhere, her matte as alpha."""
    import cv2

    name, _ = resolve(a.photo)
    d = out_dir(name, a.out)
    pa = np.asarray(Image.open(d / "person.png")).astype(np.float32)
    alpha, fg = pa[..., 3] / 255.0, pa[..., :3]
    fill = np.asarray(Image.open(a.fill).convert("RGB")).astype(np.float32)
    hole = np.asarray(Image.open(d / f"{a.part}-hole.png").convert("L")).astype(np.float32) / 255.0
    soft = np.clip(cv2.GaussianBlur(hole, (0, 0), 2.0) * 1.4, 0, 1)[..., None]
    rgb = fg * (1 - soft) + fill * soft
    save_rgba(d / f"under-{a.part}.png", np.clip(rgb + 0.5, 0, 255).astype(np.uint8), alpha)
    print(d / f"under-{a.part}.png")


def cmd_all(a):
    import cv2

    name, p = resolve(a.photo)
    d = out_dir(name, a.out)
    rgb = load_rgb(p)
    h, w = rgb.shape[:2]
    U = w / 1000.0  # 1 unit = 0.1% of the width

    if a.force or not (d / "depth.png").exists():
        log("1/5 depth")
        save_u16(d / "depth.png", run_depth(rgb, a.size))
    dep = load_u16(d / "depth.png")
    save_u16(d / "depth.png", dep)  # (re)written as rg16
    preview(d / "depth-preview.jpg", dep)

    if a.force or not (d / "person.png").exists():
        log("2/5 her matte")
        al = largest_only(run_matte(rgb))
        save_rgba(d / "person.png", unmix(rgb, al), al)
    pa = np.asarray(Image.open(d / "person.png")).astype(np.float32)
    alpha, fg = pa[..., 3] / 255.0, pa[..., :3]

    log("3/5 plate (LaMa)")
    # wind-blown hair wisps the matte missed (alpha ≈ 0) would hang in the sky once she moves: thin dark
    # lines (a black-hat transform) within reach of her head, painted out first (LaMa does thin lines well)
    near = cv2.dilate((alpha > 0.3).astype(np.uint8), disk(200 * U)) > 0
    gray = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)
    bh = cv2.morphologyEx(gray, cv2.MORPH_BLACKHAT, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (int(9 * U) | 1, int(9 * U) | 1)))
    ys0 = np.nonzero(alpha > 0.5)[0].min()
    upper = np.zeros_like(near)
    upper[: ys0 + int(0.25 * h)] = True
    wisps = (bh > 22) & near & upper & (alpha < 0.3)
    wisps = cv2.dilate(cv2.morphologyEx(wisps.astype(np.uint8), cv2.MORPH_OPEN, disk(1)), disk(2)) > 0
    if wisps.sum() > 50:
        log(f"  {int(wisps.sum())} px of stray hair painted out")
        rgb_w = run_inpaint(rgb, wisps, 1400)
    else:
        rgb_w = rgb
    # generous: her faint hair wisps (alpha ≈ 0.01) must go too, or they hang in the sky when the plate shows
    hole = cv2.dilate((alpha > 0.008).astype(np.uint8), disk(22 * U)) > 0
    Image.fromarray((hole * 255).astype(np.uint8)).save(d / "plate-hole.png")
    plate = run_inpaint(rgb_w, hole, a.long)
    Image.fromarray(plate).save(d / "plate.jpg", quality=95)

    log("4/5 layer depths")
    save_u16(d / "person-depth.png", layer_depth(dep, alpha, int(6 * U)))
    save_u16(d / "plate-depth.png", plate_depth(dep, alpha, int(30 * U)))
    preview(d / "plate-depth-preview.jpg", load_u16(d / "plate-depth.png"))

    parts = []
    for spec in a.part or []:
        # name:x,y;x,y[/x,y;x,y]   (positive points, then optional negative points after '/')
        pname, rest = spec.split(":", 1)
        pos_s, _, neg_s = rest.partition("/")
        pos = parse_pts(pos_s.split(";"))
        neg = parse_pts(neg_s.split(";")) if neg_s else []
        log(f"5/5 part {pname}: {len(pos)} + / {len(neg)} − points")
        m = run_part(rgb, pos, neg)
        hard = fill_holes(cv2.morphologyEx((m > 0.5).astype(np.float32), cv2.MORPH_OPEN, disk(2)))
        worn = np.clip(cv2.GaussianBlur(hard, (0, 0), 1.2), 0, 1) * alpha  # the piece as seen (hair over it cut out)
        # the WHOLE piece, for lifting it off her: close the notches her hair cut into it and fill them from the
        # piece's own fabric (LaMa does small holes well at a higher working size)
        closed = fill_holes(cv2.morphologyEx(hard, cv2.MORPH_CLOSE, disk(34 * U)))
        # a fabric edge, not a torn one: smooth the outline (blur + threshold rounds off the lumps)
        closed = (cv2.GaussianBlur(closed, (0, 0), 5 * U) > 0.5).astype(np.float32)
        notch = (closed > 0.5) & (hard < 0.5)
        # hair strands lying on the piece (dark, not the piece's colour) come off with it unless painted out too
        strands = strand_mask(fg, hard, closed)
        fix = notch | strands
        pfg = fg.astype(np.uint8)
        if fix.any():
            # the fill's context is the piece's OWN colour carried outwards (pull-push), not her hair
            keep = (hard > 0.5) & ~strands
            ext = np.dstack([pull_push(fg[..., c].astype(np.float32), keep) for c in range(3)])
            ctx = np.where(keep[..., None], fg, ext)
            pfg = run_inpaint(np.clip(ctx, 0, 255).astype(np.uint8), cv2.dilate(fix.astype(np.uint8), disk(3)) > 0, 1400)
        # the whole, smoothed shape, every pixel of it the piece's own fabric (filled above): a soft 1.5 px edge
        whole = cv2.morphologyEx(closed, cv2.MORPH_OPEN, disk(3 * U))
        pal = np.clip(cv2.GaussianBlur(whole, (0, 0), 1.5), 0, 1)
        save_rgba(d / f"{pname}.png", pfg, pal)
        save_rgba(d / f"{pname}-worn.png", fg, worn)
        Image.fromarray((cv2.dilate((worn > 0.04).astype(np.uint8), disk(4 * U)) * 255).astype(np.uint8)).save(d / f"{pname}-hole.png")
        # a garment that will turn in 3D: a smoother depth, or its panel/sleeve steps smear when it twists
        save_u16(d / f"{pname}-depth.png", cv2.GaussianBlur(layer_depth(dep, pal, int(4 * U)), (0, 0), 6 * U))
        # her, with the piece taken off: the piece's area filled by LaMa (with the plate behind as context);
        # a body under a garment is beyond LaMa: tools/genfill makes the real under-layer from <part>-hole.png
        under_hole = cv2.dilate((worn > 0.04).astype(np.uint8), disk(4 * U)) > 0
        ctx = (rgb.astype(np.float32) * alpha[..., None] + plate.astype(np.float32) * (1 - alpha[..., None])).astype(np.uint8)
        under = run_inpaint(ctx, under_hole, a.long)
        ualpha = alpha.copy()
        save_rgba(d / f"under-{pname}.png", np.where(under_hole[..., None], under, fg.astype(np.uint8)), ualpha)
        ys, xs = np.nonzero(pal > 0.5)
        parts.append({"name": pname, "box": [int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())], "depth": float(np.median(dep[pal > 0.5]))})

    ys, xs = np.nonzero(alpha > 0.5)
    meta = {
        "photo": name,
        "size": [w, h],
        "subject": {"box": [int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())], "depth": float(np.median(dep[alpha > 0.5]))},
        "depthRange": {"min": float(dep.min()), "max": float(dep.max()), "plateMedian": float(np.median(load_u16(d / "plate-depth.png")))},
        "parts": parts,
        "models": MODELS,
        "encoding": "rg16: depth PNGs are 16-bit disparity packed in RGB (R = high byte, G = low byte), 65535 = nearest (relative; the ad picks near/far)",
    }
    (d / "layers.json").write_text(json.dumps(meta, indent=2))
    print(d)


def main():
    ap = argparse.ArgumentParser(prog="photo3d")
    sub = ap.add_subparsers(dest="cmd", required=True)
    s = sub.add_parser("depth")
    s.add_argument("photo"); s.add_argument("--out"); s.add_argument("--size", type=int, default=770)
    s = sub.add_parser("cutout")
    s.add_argument("photo"); s.add_argument("--out")
    s = sub.add_parser("part")
    s.add_argument("photo"); s.add_argument("--name", required=True); s.add_argument("--pos", nargs="+", required=True)
    s.add_argument("--neg", nargs="*"); s.add_argument("--box"); s.add_argument("--out")
    s = sub.add_parser("inpaint")
    s.add_argument("image"); s.add_argument("mask"); s.add_argument("--out"); s.add_argument("--long", type=int, default=512)
    s = sub.add_parser("under")
    s.add_argument("photo"); s.add_argument("--part", required=True); s.add_argument("--fill", required=True); s.add_argument("--out")
    s = sub.add_parser("all")
    s.add_argument("photo"); s.add_argument("--out"); s.add_argument("--size", type=int, default=770)
    # LaMa was trained at 256-512 px: a hole the size of a person fills with grey "smoke" at 1280, with wall
    # and couch at 512 (measured on r28, 2026-10-16). Only the plate's fringe next to her is ever seen.
    s.add_argument("--long", type=int, default=512)
    s.add_argument("--part", action="append", help="name:x,y;x,y[/x,y;x,y] positive points, '/' then negative points")
    s.add_argument("--force", action="store_true")
    a = ap.parse_args()
    os.environ.setdefault("PYTORCH_ENABLE_MPS_FALLBACK", "1")
    {"depth": cmd_depth, "cutout": cmd_cutout, "part": cmd_part, "inpaint": cmd_inpaint, "under": cmd_under, "all": cmd_all}[a.cmd](a)


if __name__ == "__main__":
    main()
