#!/usr/bin/env python3
"""Pop out v2: trace the vector shapes the ad morphs between (free, local; numpy + scipy + PIL).

  python3 ads/pop-out-v2/trace_shapes.py      (run from the repo root; writes ads/pop-out-v2/shapes.json)

- every garment cut-out the ad pops or morphs: its outer contour, resampled to N points, clockwise,
  starting at the top-most point, in fractions of the cut-out's own width / height;
- the Curate mark (brand.curate.splash-mark.v1), redrawn as vector: every outline of the mark, and
  the 4-point star on its own (so the star can morph while the rest of the mark draws on).
Media is read from library/ by the paths catalog/index.json gives for each id; nothing is written there.
"""
import json, os
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
INDEX = json.load(open(os.path.join(ROOT, "catalog", "index.json")))
BY_ID = {a["id"]: a for a in INDEX["assets"]}


def path_of(asset_id, role):
    f = next(x for x in BY_ID[asset_id]["files"] if x["role"] == role)
    return os.path.join(ROOT, "library", f["path"])


def trace(mask):
    """Outer boundary of the largest component (Moore-neighbour), as float (x, y) pixel coords."""
    lab, n = ndimage.label(mask)
    if n == 0:
        raise SystemExit("empty mask")
    sizes = ndimage.sum(mask, lab, range(1, n + 1))
    comp = ndimage.binary_fill_holes(lab == (1 + int(np.argmax(sizes))))
    m = np.pad(comp, 1)
    ys, xs = np.nonzero(m)
    i = np.argmin(ys * 100000 + xs)
    start = (ys[i], xs[i])
    dirs = [(-1, 0), (-1, 1), (0, 1), (1, 1), (1, 0), (1, -1), (0, -1), (-1, -1)]  # clockwise from N
    pts = [start]
    cur, back = start, 6  # we came from the west
    for _ in range(4 * m.size):
        for k in range(8):
            d = (back + 1 + k) % 8
            ny, nx = cur[0] + dirs[d][0], cur[1] + dirs[d][1]
            if m[ny, nx]:
                back = (d + 4) % 8
                cur = (ny, nx)
                break
        # stop when the first step repeats (survives one-pixel spikes, where the start is revisited)
        if len(pts) > 2 and pts[-1] == start and cur == pts[1]:
            pts.pop()
            break
        pts.append(cur)
    p = np.array([(x - 1 + 0.5, y - 1 + 0.5) for y, x in pts], dtype=float)
    return p


def smooth(p, win):
    if win <= 1:
        return p
    k = np.ones(win) / win
    ext = np.concatenate([p[-win:], p, p[:win]])
    return np.stack([np.convolve(ext[:, j], k, mode="same")[win:-win] for j in range(2)], axis=1)


def resample(p, n):
    q = np.concatenate([p, p[:1]])
    seg = np.linalg.norm(np.diff(q, axis=0), axis=1)
    s = np.concatenate([[0], np.cumsum(seg)])
    t = np.linspace(0, s[-1], n, endpoint=False)
    out = np.stack([np.interp(t, s, q[:, 0]), np.interp(t, s, q[:, 1])], axis=1)
    i = int(np.argmin(out[:, 1] + out[:, 0] * 1e-3))  # start at the top-most point
    return np.roll(out, -i, axis=0)


def contour(img_path, n, win, crop=None):
    im = np.asarray(Image.open(img_path).convert("RGBA"))
    a = im[:, :, 3] > 127
    if crop:
        x0, y0, x1, y1 = crop
        c = np.zeros_like(a)
        c[y0:y1, x0:x1] = a[y0:y1, x0:x1]
        a = c
    p = resample(smooth(trace(a), win), n)
    return p, im.shape[1], im.shape[0]


def norm(p, w, h):
    return [[round(x / w, 5), round(y / h, 5)] for x, y in p]


GARMENTS = [
    "jacket-denim", "coat-wool-camel", "leggings-sage", "sports-bra-sage",
]
N = 240
out = {"n": N, "garments": {}, "mark": {}}
for g in GARMENTS:
    gid = f"garment.emma.{g}.v1"
    p, w, h = contour(path_of(gid, "cutout"), N, 5)
    out["garments"][gid] = {"w": w, "h": h, "pts": norm(p, w, h)}

mark = path_of("brand.curate.splash-mark.v1", "original")
im = np.asarray(Image.open(mark).convert("RGBA"))
W, H = im.shape[1], im.shape[0]
alpha = im[:, :, 3] > 127
lab, n = ndimage.label(alpha)
comps = []
for k in range(1, n + 1):
    cm = lab == k
    if cm.sum() < 50:
        continue
    p = trace(cm)
    p = resample(smooth(p, 3), max(200, min(1600, len(p) // 2)))
    comps.append(norm(p, W, H))
ys, xs = np.nonzero(alpha)
out["mark"] = {
    "w": W, "h": H,
    "bbox": [int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())],
    "outlines": comps,
}
# the star: the mark's centre, cut at the tips where its side points meet the swirls
sp, _, _ = contour(mark, N, 3, crop=(508, 430, 645, 720))
out["mark"]["star"] = norm(sp, W, H)
json.dump(out, open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "shapes.json"), "w"), separators=(",", ":"))
print("garments", len(out["garments"]), "mark outlines", len(comps), "points", [len(c) for c in comps], "bbox", out["mark"]["bbox"])
