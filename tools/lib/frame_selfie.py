"""A selfie re-framed as curate-app's stand-in camera expects its picture (lib/dev/selfie_camera_fakes.dart,
StandInFace: 560 x 700, the face where the app's own stand-in face is), for tools/probe-photos.

  python3 frame_selfie.py <in.jpg> <out.jpg> <face x> <face y> <face w>

The face box is Apple Vision's (VNDetectFaceRectanglesRequest) on <in>, in pixels from the top left. The
stand-in face's own Vision box is TARGET. Outside the scaled selfie the edges carry on, blurred, so the fake
camera (which draws the whole frame) shows a soft background instead of a hard edge.
"""
import sys

import numpy as np
from PIL import Image, ImageFilter

SIZE = (560, 700)
TARGET = (287.0, 181.0, 152.0)  # the stand-in face's Vision box: centre x, centre y, width

src, dst = sys.argv[1], sys.argv[2]
fx, fy, fw = (float(v) for v in sys.argv[3:6])
im = Image.open(src).convert("RGB")
s = TARGET[2] / fw
small = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
left = round(TARGET[0] - (fx + fw / 2) * s)
top = round(TARGET[1] - (fy + fw / 2) * s)

# Pad the scaled selfie out to the frame by repeating its edge pixels, then blur only what was added.
a = np.asarray(small)
pad = ((max(top, 0), max(SIZE[1] - top - a.shape[0], 0)), (max(left, 0), max(SIZE[0] - left - a.shape[1], 0)), (0, 0))
padded = np.pad(a, pad, mode="edge")
y0, x0 = max(-top, 0), max(-left, 0)
frame = Image.fromarray(padded[y0 : y0 + SIZE[1], x0 : x0 + SIZE[0]])
mask = Image.new("L", SIZE, 255)
mask.paste(0, (max(left, 0) + 12, max(top, 0) + 12, min(left + a.shape[1], SIZE[0]) - 12, min(top + a.shape[0], SIZE[1]) - 12))
mask = mask.filter(ImageFilter.GaussianBlur(10))
frame = Image.composite(frame.filter(ImageFilter.GaussianBlur(18)), frame, mask)
frame.save(dst, quality=90)
