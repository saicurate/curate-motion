# Measure an Apple Product Bezel PNG for motion/Device.tsx: the display box, the visible phone (body),
# the Dynamic Island the PNG draws, and the range of circular corner radii whose rounded rect covers the
# whole display yet stays hidden under the bezel's opaque frame (Apple's corners are continuous curves).
#
#   python3 tools/device/bezel_fit.py "iPhone 17 Pro Max - Silver - Portrait.png" [...]   -> one JSON line each
#
# Free and local: ffmpeg decodes the PNG; numpy + scipy do the rest.
import sys, site

sys.path.append(site.getusersitepackages())
import json, subprocess  # noqa: E402
import numpy as np  # noqa: E402
from scipy import ndimage  # noqa: E402


def load(path):
    w, h = map(int, subprocess.check_output(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0", path]).decode().strip().split(","))
    raw = subprocess.check_output(["ffmpeg", "-v", "error", "-i", path, "-f", "rawvideo", "-pix_fmt", "rgba", "-"])
    return np.frombuffer(raw, np.uint8).reshape(h, w, 4)


def rounded(h, w, x0, y0, sw, sh, r):
    yy, xx = np.mgrid[0:h, 0:w]
    xs, ys = xx + 0.5, yy + 0.5
    inside = (xs >= x0) & (xs <= x0 + sw) & (ys >= y0) & (ys <= y0 + sh)
    cx, cy = np.clip(xs, x0 + r, x0 + sw - r), np.clip(ys, y0 + r, y0 + sh - r)
    return inside & (((xs - cx) ** 2 + (ys - cy) ** 2) <= r * r)


def fit(path):
    a = load(path)
    h, w = a.shape[:2]
    al = a[..., 3]
    clear = al < 8
    lab, _ = ndimage.label(clear)
    hole = lab == lab[h // 2, w // 2]  # the display: the transparent region at the centre
    ys, xs = np.nonzero(hole)
    x0, y0, x1, y1 = xs.min(), ys.min(), xs.max() + 1, ys.max() + 1
    sw, sh = x1 - x0, y1 - y0
    oys, oxs = np.nonzero(al > 8)
    body = dict(x=int(oxs.min()), y=int(oys.min()), w=int(oxs.max() - oxs.min() + 1), h=int(oys.max() - oys.min() + 1))
    # the island: an opaque blob inside the display box's top, not touching the frame
    top = ~hole[y0 : y0 + 240, x0:x1] & ~clear[y0 : y0 + 240, x0:x1]
    il, n = ndimage.label(top)
    island = None
    for k in range(1, n + 1):
        yy, xx = np.nonzero(il == k)
        if xx.min() > 50 and xx.max() < sw - 50 and yy.min() > 5 and len(xx) > 1000:
            island = dict(x=int(xx.min()), y=int(yy.min()), w=int(xx.max() - xx.min() + 1), h=int(yy.max() - yy.min() + 1))
    outside = clear & ~hole  # transparent but not the display (round the phone): content must never show there
    pad = 4
    sl = (slice(y0 - pad, y1 + pad), slice(x0 - pad, x1 + pad))
    hc, oc = hole[sl], outside[sl]
    ok = [r for r in range(0, 400, 2) if not (hc & ~(m := rounded(sh + 2 * pad, sw + 2 * pad, pad, pad, sw, sh, r))).any() and not (m & oc).any()]
    lo, hi = (min(ok), max(ok)) if ok else (None, None)
    return {
        "file": path.split("/")[-1],
        "dims": {"w": w, "h": h},
        "body": body,
        "screen": {"x": int(x0), "y": int(y0), "w": int(sw), "h": int(sh), "cornerRadius": (lo + hi) // 2 if ok else None, "cornerRadiusRange": [lo, hi] if ok else None},
        "island": island,
    }


for p in sys.argv[1:]:
    print(json.dumps(fit(p)), flush=True)
