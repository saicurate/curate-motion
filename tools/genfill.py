# /// script
# requires-python = ">=3.11,<3.13"
# dependencies = [
#   "torch>=2.6",
#   "diffusers>=0.35",
#   "transformers>=4.56",
#   "accelerate>=1.0",
#   "safetensors>=0.4",
#   "numpy>=2.0",
#   "pillow>=11.0",
#   "opencv-python-headless>=4.10",
#   "huggingface-hub>=0.34",
# ]
# ///
"""tools/genfill: a generative fill for a hole LaMa can't fill (a body under a garment), free and local.

  tools/genfill <photo> <hole-mask.png> --prompt-id <prompt.image-gen.….vN> [--out file] [--seed 7]
                [--steps 30] [--strength 0.99] [--crop x0,y0,x1,y1] [--rows y0:y1]
  tools/genfill --download                     fetch the weights once (~7 GB, fp16), nothing else

Model: SDXL 1.0 Inpainting 0.1 (diffusers/stable-diffusion-xl-1.0-inpainting-0.1), CreativeML OpenRAIL++-M:
commercial use allowed under its use-based restrictions (none apply to a persona's own clothes). It runs on
the Mac's GPU (MPS); no paid calls. The prompt TEXT comes from the prompt library (tools/prompts) by id, so
every fill is logged with its outcome (AGENTS.md › Prompts). Only the hole changes: outside it the photo's
own pixels are kept exactly, and the fill is feathered in over a few px.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
REPO = "diffusers/stable-diffusion-xl-1.0-inpainting-0.1"
REVISION = "115134f363124c53c7d878647567d04daf26e41e"  # pinned: the same weights every run
LICENCE = "CreativeML OpenRAIL++-M"


def prompt_text(pid: str) -> tuple[str, str]:
    """The prompt body (and an optional `negative:` line) from prompts/<area>/<name>.vN.md."""
    m = re.match(r"^prompt\.([a-z0-9-]+)\.([a-z0-9-]+)\.v(\d+)$", pid)
    if not m:
        sys.exit(f"genfill: {pid} is not a prompt id")
    p = ROOT / "prompts" / m.group(1) / f"{m.group(2)}.v{m.group(3)}.md"
    body = p.read_text().split("---", 2)[2].strip()
    pos, neg = [], ""
    for line in body.splitlines():
        if line.lower().startswith("negative:"):
            neg = line.split(":", 1)[1].strip()
        elif line.strip():
            pos.append(line.strip())
    return " ".join(pos), neg


def main():
    ap = argparse.ArgumentParser(prog="genfill")
    ap.add_argument("photo", nargs="?")
    ap.add_argument("mask", nargs="?")
    ap.add_argument("--prompt-id")
    ap.add_argument("--out")
    ap.add_argument("--seed", type=int, default=7)
    ap.add_argument("--steps", type=int, default=30)
    ap.add_argument("--strength", type=float, default=0.99)
    ap.add_argument("--guidance", type=float, default=7.0)
    ap.add_argument("--crop", help="x0,y0,x1,y1: work on this box of the photo (default: the hole's box, padded)")
    ap.add_argument("--open", type=int, default=0, help="px: drop the hole's thin tendrils (e.g. hair wisps) before filling: SDXL paints strands into strand-shaped holes; LaMa already filled them")
    ap.add_argument("--rows", help="y0:y1: fill only these rows of the hole (e.g. the sky above a railing; LaMa keeps the rest)")
    ap.add_argument("--download", action="store_true")
    a = ap.parse_args()

    from huggingface_hub import snapshot_download

    path = snapshot_download(REPO, revision=REVISION, allow_patterns=["*.json", "*.txt", "unet/*.fp16.safetensors", "vae/*.fp16.safetensors", "text_encoder/*.fp16.safetensors", "text_encoder_2/*.fp16.safetensors", "tokenizer/*", "tokenizer_2/*", "scheduler/*"])
    if a.download:
        print(path)
        return
    if not (a.photo and a.mask and a.prompt_id):
        sys.exit("genfill: usage: tools/genfill <photo> <mask> --prompt-id <id>")

    import cv2
    import torch
    from diffusers import StableDiffusionXLInpaintPipeline

    rgb = np.asarray(Image.open(a.photo).convert("RGB"))
    hole = np.asarray(Image.open(a.mask).convert("L")) > 127
    H, W = hole.shape
    if a.open:
        k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * a.open + 1, 2 * a.open + 1))
        hole = cv2.morphologyEx(hole.astype(np.uint8), cv2.MORPH_OPEN, k) > 0
    if a.rows:
        y0r, y1r = [int(v) for v in a.rows.split(":")]
        band = np.zeros_like(hole)
        band[max(0, y0r):min(H, y1r)] = True
        hole = hole & band
    if a.crop:
        x0, y0, x1, y1 = [int(v) for v in a.crop.split(",")]
    else:
        ys, xs = np.nonzero(hole)
        pad = int(0.08 * W)
        x0, y0, x1, y1 = max(0, xs.min() - pad), max(0, ys.min() - pad), min(W, xs.max() + pad), min(H, ys.max() + pad)
    crop = rgb[y0:y1, x0:x1]
    hc = hole[y0:y1, x0:x1]
    ch, cw = crop.shape[:2]
    s = 1024 / max(ch, cw)
    tw, th = int(round(cw * s / 8)) * 8, int(round(ch * s / 8)) * 8
    pos, neg = prompt_text(a.prompt_id)
    print(f"genfill: {Path(a.photo).name} box {x0},{y0}-{x1},{y1} at {tw}x{th}, {REPO} ({LICENCE}), seed {a.seed}", file=sys.stderr)
    dev = "mps" if torch.backends.mps.is_available() else "cpu"
    pipe = StableDiffusionXLInpaintPipeline.from_pretrained(path, torch_dtype=torch.float16, variant="fp16").to(dev)
    pipe.set_progress_bar_config(disable=True)
    g = torch.Generator(device="cpu").manual_seed(a.seed)
    out = pipe(prompt=pos, negative_prompt=neg or None, image=Image.fromarray(crop).resize((tw, th), Image.LANCZOS), mask_image=Image.fromarray((hc * 255).astype(np.uint8)).resize((tw, th), Image.NEAREST),
               width=tw, height=th, num_inference_steps=a.steps, strength=a.strength, guidance_scale=a.guidance, generator=g).images[0]
    fill = cv2.resize(np.asarray(out).astype(np.float32), (cw, ch), interpolation=cv2.INTER_CUBIC)
    # colour match: SDXL's VAE shifts colour a little, which shows as a seam round the hole. Measure the
    # shift on a ring just OUTSIDE the hole (where both the photo and the fill exist) and take it out of the fill.
    ring = cv2.dilate(hc.astype(np.uint8), np.ones((25, 25), np.uint8)).astype(bool) & ~hc
    if ring.any():
        fill = fill + (crop.astype(np.float32)[ring].mean(axis=0) - fill[ring].mean(axis=0))
    soft = cv2.GaussianBlur(hc.astype(np.float32), (0, 0), 5.0)
    soft = np.clip(soft * 1.8, 0, 1) * hc
    res = rgb.astype(np.float32).copy()
    res[y0:y1, x0:x1] = crop * (1 - soft[..., None]) + fill * soft[..., None]
    outp = Path(a.out) if a.out else Path(a.photo).with_name(Path(a.photo).stem + f"-genfill-s{a.seed}.png")
    Image.fromarray(np.clip(res + 0.5, 0, 255).astype(np.uint8)).save(outp)
    (outp.with_suffix(".json")).write_text(json.dumps({"model": REPO, "licence": LICENCE, "promptId": a.prompt_id, "seed": a.seed, "steps": a.steps, "strength": a.strength, "guidance": a.guidance, "box": [int(x0), int(y0), int(x1), int(y1)], "size": [tw, th]}, indent=2))
    print(outp)


if __name__ == "__main__":
    main()
