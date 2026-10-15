#!/usr/bin/env python3
"""blackcheck.py video.mp4 : flags frames whose brightness drops sharply vs neighbours (GPU glitch check)."""
import subprocess, sys, numpy as np
v = sys.argv[1]
w, h = 54, 96
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", v, "-vf", f"scale={w}:{h},format=gray", "-f", "rawvideo", "-"], capture_output=True).stdout
f = np.frombuffer(raw, np.uint8).reshape(-1, h, w).astype(float)
m = f.mean((1, 2))
bad = [i for i in range(1, len(m) - 1) if m[i] < m[i - 1] - 25 and m[i] < m[i + 1] - 25]
print(len(m), "frames; isolated dark frames:", bad)
