# drop.py <audio> <bpm> <from_s> <to_s>: loudness at 0.25 s steps + beat phase in the window
import sys, numpy as np
sys.path.insert(0, '.')
from beats import decode, onset_env, SR, HOP
y = decode(sys.argv[1]); bpm = float(sys.argv[2]); a, b = float(sys.argv[3]), float(sys.argv[4])
st = int(SR * 0.25)
for i in range(int(a / 0.25), int(b / 0.25)):
    seg = y[i * st:(i + 1) * st]
    print(f"{i*0.25:6.2f} {20*np.log10(np.sqrt(np.mean(seg**2))+1e-9):6.1f}", end=" | " if i % 4 != 3 else "\n")
env = onset_env(y); fps = SR / HOP; period = 60 * fps / bpm
lo, hi = int(a * fps), int(b * fps)
best = max(np.arange(0, period, 0.25), key=lambda p: env[np.arange(lo + p, hi, period).astype(int)].sum())
first = (lo + best) / fps
print("\nbeat grid in window starts at", round(first, 3), "s; beats:", [round(first + k * 60 / bpm, 3) for k in range(8)])
