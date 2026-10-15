#!/usr/bin/env python3 -I
"""Rough tempo + beat grid + loudness map for a track (numpy only).

  beats.py <audio> [--json out.json]

Prints BPM, the first-beat offset, and loudness per 2 s so a cut can pick its
section. Good enough for beat-syncing rough cuts, not a pro beat tracker.
"""
import json, subprocess, sys
import numpy as np

SR = 22050
HOP = 256


def decode(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32)


def onset_env(y):
    n = 1024
    win = np.hanning(n)
    frames = np.lib.stride_tricks.sliding_window_view(y, n)[::HOP] * win
    mag = np.abs(np.fft.rfft(frames, axis=1))
    mag = np.log1p(mag * 10)
    flux = np.maximum(0, np.diff(mag, axis=0)).sum(axis=1)
    flux = np.concatenate([[0], flux])
    flux -= np.convolve(flux, np.ones(16) / 16, mode="same")
    return np.maximum(flux, 0)


def tempo(env):
    fps = SR / HOP
    ac = np.correlate(env - env.mean(), env - env.mean(), mode="full")[len(env) - 1:]
    best, bpm = -1, 120
    for b in np.arange(70, 181, 0.25):
        lag = 60 * fps / b
        # score the lag and its double (helps pick the musical tempo)
        s = 0
        for k, w in ((1, 1.0), (2, 0.5), (4, 0.25)):
            i = lag * k
            if i < len(ac) - 1:
                lo = int(i)
                s += w * (ac[lo] * (1 - (i - lo)) + ac[lo + 1] * (i - lo))
        # mild preference for 95–135 bpm
        s *= np.exp(-0.5 * ((b - 118) / 40) ** 2)
        if s > best:
            best, bpm = s, b
    period = 60 * fps / bpm
    # beat phase: offset that maximises onset energy on the grid
    phases = np.arange(0, period, 0.5)
    scores = [env[np.arange(p, len(env) - 1, period).astype(int)].sum() for p in phases]
    off = phases[int(np.argmax(scores))] / fps
    return float(bpm), float(off)


def main():
    path = sys.argv[1]
    y = decode(path)
    env = onset_env(y)
    bpm, off = tempo(env)
    dur = len(y) / SR
    seg = int(SR * 2)
    loud = [round(float(20 * np.log10(np.sqrt(np.mean(y[i:i + seg] ** 2)) + 1e-9)), 1) for i in range(0, len(y), seg)]
    out = dict(file=path, duration=round(dur, 2), bpm=round(bpm, 2), first_beat=round(off, 3), loudness_db_per_2s=loud)
    if "--json" in sys.argv:
        json.dump(out, open(sys.argv[sys.argv.index("--json") + 1], "w"), indent=1)
    print(json.dumps({k: v for k, v in out.items() if k != "loudness_db_per_2s"}), " loud:", loud[:40])


if __name__ == "__main__":
    main()
