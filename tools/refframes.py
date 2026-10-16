# /// script
# requires-python = ">=3.11"
# dependencies = ["numpy==2.2.6", "pillow==11.3.0", "opencv-python-headless==4.12.0.88"]
# ///
"""tools/refframes: pull a reference apart for a style guide (decisions/0011, proposed).

  tools/refframes <reference-id | video.mp4> [--every 0.5] [--ad <ad>] [--from s] [--to s] [--name x]

Writes (to ads/<ad>/out/refs/ with --ad, else .cache/refframes/<name>/):
  frames.jpg    a frame every 0.5 s, stamped with its time (6 across)
  palette.png   the 8 main colours (k-means over every pulled frame) as swatches with hex + share
  refs.json     the numbers a style guide is written from: palette hex, hard cuts and shot
                lengths, motion per second (how busy), how much the frame is flat ground,
                grain (noise in flat areas), brightness and contrast

Take the GRAMMAR (pacing, shot lengths, how things enter and leave, the camera, the palette's
shape), never the subjects, logos, people or copy. References are never shipped (RULES.md › 9).
Free and local: ffmpeg + numpy + OpenCV.
"""
import json
import subprocess
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
import critic as C  # noqa: E402  (frame decoding, labels, tiles)

ROOT = Path(__file__).resolve().parents[1]


def resolve(src):
    p = Path(src)
    if p.exists():
        return p.resolve(), p.stem
    idx = json.loads((ROOT / "catalog" / "index.json").read_text())
    a = next((x for x in idx["assets"] if x["id"] == src), None)
    if not a:
        raise SystemExit(f"{src}: not a file or a catalog id")
    vids = [f for f in a["files"] if f["path"].endswith((".mp4", ".mov", ".m4v", ".webm"))]
    f = ROOT / "library" / (vids or a["files"])[0]["path"]
    if not f.exists():
        raise SystemExit(f"{f.relative_to(ROOT)} not on disk (tools/sync pull --only {src})")
    return f, src.split(".")[2] if src.count(".") >= 3 else src


def kmeans_palette(pixels, k=8):
    data = pixels.reshape(-1, 3).astype(np.float32)
    if len(data) > 200000:
        data = data[np.linspace(0, len(data) - 1, 200000).astype(int)]
    crit = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 50, 0.5)
    cv2.setRNGSeed(7)  # seeded: the same reference gives the same palette
    _, lab, cen = cv2.kmeans(data, k, None, crit, 3, cv2.KMEANS_PP_CENTERS)
    share = np.bincount(lab.ravel(), minlength=k) / len(lab)
    order = np.argsort(-share)
    return [("#%02X%02X%02X" % tuple(int(round(c)) for c in cen[i]), round(float(share[i]), 3)) for i in order]


def main():
    a = sys.argv[1:]
    if not a or a[0].startswith("--"):
        print(__doc__)
        sys.exit(1)
    src, stem = resolve(a[0])
    every = float(a[a.index("--every") + 1]) if "--every" in a else 0.5
    t0 = float(a[a.index("--from") + 1]) if "--from" in a else 0.0
    p = C.probe(src)
    t1 = float(a[a.index("--to") + 1]) if "--to" in a else p["duration"]
    name = a[a.index("--name") + 1] if "--name" in a else stem
    out = ROOT / "ads" / a[a.index("--ad") + 1] / "out" / "refs" / name if "--ad" in a else ROOT / ".cache" / "refframes" / name
    out.mkdir(parents=True, exist_ok=True)

    # every frame at low res, for cuts and motion; the pulled frames at 240 px for the sheet
    g = C.frames(src, 180)
    fps = p["fps"]
    lo, hi = int(t0 * fps), min(len(g), int(t1 * fps))
    g = g[lo:hi]
    diff = np.zeros(len(g))
    diff[1:] = np.abs(g[1:].astype(np.int16) - g[:-1].astype(np.int16)).mean(axis=(1, 2))
    cuts = [i for i in range(1, len(g) - 1) if diff[i] > 14 and diff[i] > 3 * max(diff[i - 1], diff[i + 1], 1)]
    edges = [0] + cuts + [len(g)]
    shots = [round((b - a2) / fps, 2) for a2, b in zip(edges[:-1], edges[1:])]
    per_sec = [round(float(diff[int(s * fps):int((s + 1) * fps)].mean()), 2) for s in range(int(len(g) / fps))]

    rgb = C.frames(src, 240, gray=False, fps=1 / every, start=t0)
    rgb = rgb[: int((t1 - t0) / every) + 1]
    tiles = [C.label(Image.fromarray(f), f"{t0 + i * every:5.2f}s") for i, f in enumerate(rgb)]
    C.tile(tiles, 6).save(out / "frames.jpg", quality=86)
    pal = kmeans_palette(rgb)
    sw = Image.new("RGB", (8 * 150, 190), (255, 255, 255))
    from PIL import ImageDraw
    d = ImageDraw.Draw(sw)
    f = C.font(16)
    for i, (hx, sh) in enumerate(pal):
        d.rectangle([i * 150 + 6, 6, i * 150 + 144, 140], fill=hx)
        d.text((i * 150 + 8, 148), f"{hx}  {sh * 100:.0f}%", fill=(20, 20, 20), font=f)
    sw.save(out / "palette.png")

    # flat ground and grain: blocks with almost no structure, and the noise left in them
    grays = np.stack([cv2.cvtColor(x, cv2.COLOR_RGB2GRAY).astype(np.float32) for x in rgb])
    flat, grain = [], []
    for im in grays:
        hp = im - cv2.GaussianBlur(im, (0, 0), 3)
        loc = cv2.blur(np.abs(hp), (15, 15))
        m = loc < 2.0
        flat.append(float(m.mean()))
        if m.any():
            grain.append(float(np.abs(hp[m]).mean()))
    res = {
        "source": a[0], "file": str(src.relative_to(ROOT)) if str(src).startswith(str(ROOT)) else str(src),
        "window": [t0, round(t1, 2)], "every": every, "frames": len(rgb), "fps": fps, "size": [p["width"], p["height"]],
        "palette": [{"hex": h, "share": s} for h, s in pal],
        "cuts": [round(t0 + c / fps, 2) for c in cuts],
        "shots": {"count": len(shots), "lengths": shots, "mean": round(float(np.mean(shots)), 2), "shortest": min(shots), "longest": max(shots)},
        "motionPerSec": per_sec,
        "flatGroundShare": round(float(np.mean(flat)), 3),
        "grain": round(float(np.mean(grain)), 3) if grain else None,
        "brightness": round(float(grays.mean()), 1), "contrast": round(float(grays.std()), 1),
    }
    (out / "refs.json").write_text(json.dumps(res, indent=1) + "\n")
    print(f"{a[0]}: {len(rgb)} frames every {every} s → {out.relative_to(ROOT)}/")
    print(f"  palette {' '.join(h for h, _ in pal)}")
    print(f"  {len(shots)} shots (mean {res['shots']['mean']} s, {res['shots']['shortest']}–{res['shots']['longest']} s), cuts at {res['cuts']}")
    print(f"  flat ground {res['flatGroundShare'] * 100:.0f}% · grain {res['grain']} · brightness {res['brightness']} contrast {res['contrast']}")


if __name__ == "__main__":
    main()
