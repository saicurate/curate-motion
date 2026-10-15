#!/usr/bin/env python3
"""Free, local cut-outs of the generated garment product shots (seamless warm-grey
paper) so pieces can float like the app's pure-float pieces.

  cutout.py            -> remotion/public/garments/<slug>.png for every manifest item
  cutout.py slug ...   -> only those

Background = a smooth surface fitted to the border; foreground = clearly different
from it; soft, textureless, neutral-darker pixels joined to the border = the floor
shadow (removed). Largest pieces kept, holes filled, edges feathered.
"""
import json, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "..", "assets", "garments")
OUT = os.path.join(HERE, "..", "remotion", "public", "garments")
H = 900


def fit_bg(a):
    h, w, _ = a.shape
    m = np.zeros((h, w), bool)
    b = 14
    m[:b], m[-b:], m[:, :b], m[:, -b:] = True, True, True, True
    ys, xs = np.nonzero(m)
    X = np.stack([np.ones_like(xs), xs / w, ys / h, (xs / w) ** 2, (ys / h) ** 2, (xs / w) * (ys / h),
                  ((xs / w) - .5) ** 4, ((ys / h) - .5) ** 4], 1).astype(np.float64)
    yy, xx = np.mgrid[0:h, 0:w]
    XA = np.stack([np.ones_like(xx), xx / w, yy / h, (xx / w) ** 2, (yy / h) ** 2, (xx / w) * (yy / h),
                   ((xx / w) - .5) ** 4, ((yy / h) - .5) ** 4], -1).astype(np.float64)
    bg = np.zeros_like(a)
    for c in range(3):
        coef, *_ = np.linalg.lstsq(X, a[ys, xs, c], rcond=None)
        bg[..., c] = XA @ coef
    return bg


_SESS = None


def u2net_mask(im):
    """Salient-object mask from ~/.u2net/u2net.onnx (rembg's model, already on this Mac).
    Needs onnxruntime (pip install --target <dir> onnxruntime; PYTHONPATH=<dir>)."""
    global _SESS
    import onnxruntime as ort
    if _SESS is None:
        _SESS = ort.InferenceSession(os.path.expanduser("~/.u2net/u2net.onnx"), providers=["CPUExecutionProvider"])
    x = np.asarray(im.resize((320, 320), Image.LANCZOS)).astype(np.float32) / 255.0
    x = (x - [0.485, 0.456, 0.406]) / [0.229, 0.224, 0.225]
    x = x.transpose(2, 0, 1)[None].astype(np.float32)
    pred = _SESS.run(None, {_SESS.get_inputs()[0].name: x})[0][0, 0]
    pred = (pred - pred.min()) / (pred.max() - pred.min() + 1e-9)
    m = Image.fromarray((pred * 255).astype(np.uint8)).resize(im.size, Image.LANCZOS)
    return np.asarray(m).astype(np.float64) / 255.0


def cut(path, out):
    im = Image.open(path).convert("RGB")
    im = im.resize((round(im.width * H / im.height), H), Image.LANCZOS)
    a = np.asarray(im).astype(np.float64)
    try:
        p = u2net_mask(im)
    except ImportError:
        p = None
    if p is not None:
        m = p > 0.5
        lab, n = ndimage.label(m)
        if n > 1:
            sizes = ndimage.sum(m, lab, range(1, n + 1))
            m = np.isin(lab, [i + 1 for i, s in enumerate(sizes) if s > 0.08 * sizes.max()])
        m = ndimage.binary_fill_holes(m)
        alpha = np.clip((p - 0.25) / 0.5, 0, 1) * ndimage.binary_dilation(m, iterations=2)
        alpha = ndimage.gaussian_filter(alpha, 0.6)
        return save(a, alpha, out)
    bg = fit_bg(a)
    d = a - bg
    dist = np.sqrt((d ** 2).sum(-1))
    lum, blum = a.mean(-1), bg.mean(-1)
    chroma = np.abs((d[..., 0] - d[..., 1])) + np.abs((d[..., 1] - d[..., 2]))
    gl = ndimage.uniform_filter(lum, 5)
    tex = np.sqrt(np.maximum(ndimage.uniform_filter(lum ** 2, 5) - gl ** 2, 0))
    shadowish = (lum < blum) & (lum > 0.5 * blum) & (chroma < 10) & (tex < 2.2)
    fg = (dist > 20) & ~shadowish
    # background = what's joined to the border through not-fg pixels
    lab, n = ndimage.label(~fg)
    border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    bgreg = np.isin(lab, list(border))
    m = ~bgreg
    m = ndimage.binary_opening(m, iterations=2)
    lab, n = ndimage.label(m)
    if n > 1:
        sizes = ndimage.sum(m, lab, range(1, n + 1))
        keep = [i + 1 for i, s in enumerate(sizes) if s > 0.08 * sizes.max()]
        m = np.isin(lab, keep)
    m = ndimage.binary_fill_holes(m)
    soft = np.clip((dist - 8) / 16, 0, 1)
    edge = m & ~ndimage.binary_erosion(m, iterations=2)
    alpha = np.where(edge, np.maximum(soft, 0.35), m.astype(float))
    alpha = ndimage.gaussian_filter(alpha, 0.8) * ndimage.binary_dilation(m, iterations=1)
    return save(a, alpha, out)


def save(a, alpha, out):
    rgba = np.dstack([a.astype(np.uint8), (np.clip(alpha, 0, 1) * 255).astype(np.uint8)])
    o = Image.fromarray(rgba)
    bb = o.getbbox()
    pad = 10
    bb = (max(bb[0] - pad, 0), max(bb[1] - pad, 0), min(bb[2] + pad, o.width), min(bb[3] + pad, o.height))
    o = o.crop(bb)
    o.save(out, optimize=True)
    return o.size


def main():
    os.makedirs(OUT, exist_ok=True)
    man = json.load(open(os.path.join(SRC, "manifest.json")))
    want = set(sys.argv[1:])
    done = {}
    for it in man["items"]:
        if want and it["slug"] not in want:
            continue
        f = os.path.join(SRC, it["file"])
        if not os.path.exists(f):
            continue
        size = cut(f, os.path.join(OUT, it["slug"] + ".png"))
        done[it["slug"]] = {"w": size[0], "h": size[1], "category": it["category"], "name": it["name"], "src": it["file"]}
        print(it["slug"], size)
    idx = os.path.join(OUT, "index.json")
    old = json.load(open(idx)) if os.path.exists(idx) else {}
    old.update(done)
    json.dump(old, open(idx, "w"), indent=1)


if __name__ == "__main__":
    main()
