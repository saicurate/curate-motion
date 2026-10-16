# /// script
# requires-python = ">=3.11"
# dependencies = ["librosa==0.11.0", "numpy==2.5.4"]
# ///
"""tools/beats: measure a track's beat map with librosa (decisions/0011, proposed).

  tools/beats <music-id> [--json out.json]     one track: print the summary, write the beat map JSON
  tools/beats --all [--write]                  every music asset in the catalog
  tools/beats <music-id> --write               also store it as the track's `beatMap` in its manifest

Run through uv (the wrapper does: `uv run --script tools/beats.py`), so librosa is pinned and
nothing is installed globally. Free and local: ffmpeg decodes, librosa measures.

The beat map (schemas/asset.ts > BeatMap):
- bpm, offsetSec: a constant-tempo grid, comb-fitted to the kick band's onsets over the whole file
  (librosa's tracker gives the starting tempo), and how well the tracker's own beats agree
  (gridResidualMs, RMS of its in-phase beats). offsetSec is the first grid beat in the file.
- beats: every grid beat, each snapped to the kick transient within 30 ms when there is one.
- downbeats: beat 1 of each bar. librosa has no downbeat tracker, so the bar phase is the one of 4
  whose beats carry the most low-band (kick/bass) onset energy plus harmony change.
- hits: percussive onsets [t, strength 0..1] (strength vs. the track's 99th percentile), for
  clicks, whooshes and cuts. Only hits >= 0.2 are kept.
- bars: loudness (dB RMS) of each bar, from each downbeat; sections: where it jumps (drop / lift)
  or falls (break / fall) by >= 3 dB bar to bar.

Rules (the studio process): state changes on beats, big moments on downbeats, clicks and whooshes
on hits. Read the map with motion/beatmap.ts (beatAt, downbeatAt, nearestHit) in an ad.
"""
import json
import subprocess
import sys
from datetime import date
from pathlib import Path

import librosa
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
SR = 44100
HOP = 256
TOOL = "tools/beats (librosa 0.11.0)"


def decode(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(path), "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).copy()


def r3(x):
    return round(float(x), 3)


def analyse(path):
    y = decode(path)
    dur = len(y) / SR
    y_perc = librosa.effects.percussive(y, margin=2.0)
    env = librosa.onset.onset_strength(y=y_perc, sr=SR, hop_length=HOP, aggregate=np.median)
    tempo, beat_frames = librosa.beat.beat_track(onset_envelope=env, sr=SR, hop_length=HOP, tightness=120, units="frames")
    bt = librosa.frames_to_time(beat_frames, sr=SR, hop_length=HOP)
    if len(bt) < 8:
        raise SystemExit(f"{path}: only {len(bt)} beats found; not a beat-driven track?")

    # the kick band's onset envelope: what a house/pop beat grid is made of
    S = np.abs(librosa.stft(y_perc, n_fft=2048, hop_length=HOP))
    freqs = librosa.fft_frequencies(sr=SR, n_fft=2048)
    low = S[freqs < 160].sum(axis=0)
    low_on = np.maximum(0, np.diff(np.log1p(low), prepend=np.log1p(low[0])))
    times = librosa.frames_to_time(np.arange(len(low_on)), sr=SR, hop_length=HOP)
    fps_env = SR / HOP
    comb = np.maximum.reduce([np.roll(low_on, k) for k in (-1, 0, 1)]) + 0.5 * np.maximum.reduce([np.roll(env / (env.max() + 1e-9) * low_on.max(), k) for k in (-1, 0, 1)])

    # constant-tempo grid (library tracks are made on a grid): a comb fit. Around the tracker's
    # tempo (median beat interval, ±2%), try every tempo (0.01 BPM steps) and phase (one hop) and
    # keep the grid whose beats land on the most kick/onset energy over the whole file.
    bpm0 = 60 / float(np.median(np.diff(bt)))
    best = (-1.0, bpm0, 0.0)
    for cand in np.arange(bpm0 * 0.98, bpm0 * 1.02, 0.01):
        per = 60 / cand * fps_env
        grid = np.arange(0, len(comb) - 1, per)
        for ph in np.arange(0, per, 1.0):
            sc = comb[np.round(grid + ph).astype(int) % len(comb)].mean()
            if sc > best[0]:
                best = (sc, cand, ph)
    _, bpm, ph = best
    if abs(bpm - round(bpm)) < 0.03:  # snap to a clean tempo when it's that close, then re-phase
        bpm = float(round(bpm))
        per = 60 / bpm * fps_env
        grid = np.arange(0, len(comb) - 1, per)
        ph = max(np.arange(0, per, 0.25), key=lambda q: comb[np.round(grid + q).astype(int) % len(comb)].mean())
    period = 60 / bpm
    first = (ph / fps_env) % period
    grid_t = np.arange(first, dur, period)
    # how well the tracker agrees with the grid (RMS of its in-phase beats, and the share in phase)
    gres = bt - (first + period * np.round((bt - first) / period))
    inl = np.abs(gres) < 0.06
    grid_residual_ms = float(np.sqrt(np.mean(gres[inl] ** 2)) * 1000) if inl.any() else 999.0
    in_phase = float(inl.mean())

    # the beats: every grid beat, each snapped to the kick transient within 30 ms when there is one
    win = int(0.03 * fps_env)
    thr = 0.12 * np.percentile(low_on, 99.5)
    beats = []
    for t in grid_t:
        i = int(round(t * fps_env))
        lo, hi = max(0, i - win), min(len(low_on), i + win + 1)
        j = lo + int(np.argmax(low_on[lo:hi])) if hi > lo else i
        beats.append(times[j] if hi > lo and low_on[j] > thr else t)
    beats = np.array(beats)

    # downbeat phase: low-band onset + harmony change, summed per phase of 4
    chroma = librosa.feature.chroma_cqt(y=librosa.effects.harmonic(y), sr=SR, hop_length=HOP)
    bf = np.clip(np.round(beats * SR / HOP).astype(int), 0, chroma.shape[1] - 1)
    cb = chroma[:, bf]
    chg = np.concatenate([[0], np.linalg.norm(np.diff(cb, axis=1), axis=0)])
    lo_at = np.array([low_on[max(0, k - 2):k + 3].max() for k in bf])
    z = lambda v: (v - v.mean()) / (v.std() + 1e-9)
    score = z(lo_at) + 0.6 * z(chg)
    phase = int(np.argmax([score[p::4].mean() for p in range(4)]))
    downbeats = beats[phase::4]

    # hits: percussive onsets with strength
    on_frames = librosa.onset.onset_detect(onset_envelope=env, sr=SR, hop_length=HOP, backtrack=False, units="frames")
    strength = env[on_frames] / (np.percentile(env[on_frames], 99) + 1e-9) if len(on_frames) else np.array([])
    on_t = librosa.frames_to_time(on_frames, sr=SR, hop_length=HOP)
    hits = [[r3(t), round(float(min(1.0, s)), 2)] for t, s in zip(on_t, strength) if s >= 0.2]

    # loudness per bar and the big changes between bars
    bars = []
    edges = list(downbeats) + [min(dur, downbeats[-1] + 4 * period)]
    for t0, t1 in zip(edges[:-1], edges[1:]):
        seg = y[int(t0 * SR):int(t1 * SR)]
        bars.append(round(float(20 * np.log10(np.sqrt(np.mean(seg ** 2)) + 1e-9)), 1) if len(seg) else -90.0)
    sections = []
    for k in range(1, len(bars)):
        d = bars[k] - bars[k - 1]
        if abs(d) >= 3:
            big = abs(d) >= 6
            sections.append({"t": r3(downbeats[k]), "kind": ("drop" if big else "lift") if d > 0 else ("break" if big else "fall"), "db": round(d, 1)})

    return {
        "tool": TOOL,
        "measuredAt": date.today().isoformat(),
        "durationSec": r3(dur),
        "bpm": round(bpm, 3),
        "offsetSec": r3(first),
        "gridResidualMs": round(grid_residual_ms, 1),
        "beatsPerBar": 4,
        "beats": [r3(t) for t in beats],
        "downbeats": [r3(t) for t in downbeats],
        "hits": hits,
        "bars": bars,
        "sections": sections,
        "note": f"comb-fit grid; tracker tempo {float(np.atleast_1d(tempo)[0]):.2f} BPM, {in_phase * 100:.0f}% of its beats in phase with the grid; downbeat phase {phase} of 4 by low-band + harmony",
    }


def music_assets():
    idx = json.loads((ROOT / "catalog" / "index.json").read_text())
    return [a for a in idx["assets"] if a["kind"] == "music"]


def main():
    argv = sys.argv[1:]
    write = "--write" in argv
    out = argv[argv.index("--json") + 1] if "--json" in argv else None
    ids = [a for a in argv if not a.startswith("--") and a != out]
    assets = music_assets()
    if "--all" in argv:
        ids = [a["id"] for a in assets]
    if not ids:
        print(__doc__)
        sys.exit(1)
    results = {}
    for mid in ids:
        a = next((x for x in assets if x["id"] == mid), None)
        if not a:
            raise SystemExit(f"{mid}: not a music asset in the catalog")
        f = ROOT / "library" / a["files"][0]["path"]
        if not f.exists():
            raise SystemExit(f"{mid}: {f.relative_to(ROOT)} not on disk (tools/sync pull --only {mid})")
        m = analyse(f)
        results[mid] = m
        drop = next((s["t"] for s in m["sections"] if s["kind"] == "drop"), None)
        print(f"{mid}: {m['bpm']} BPM (grid fit ±{m['gridResidualMs']} ms), first beat {m['offsetSec']} s, "
              f"{len(m['beats'])} beats, {len(m['downbeats'])} bars, {len(m['hits'])} hits"
              + (f", first drop {drop} s" if drop is not None else ""))
    if out:
        Path(out).parent.mkdir(parents=True, exist_ok=True)
        Path(out).write_text(json.dumps(results if len(results) > 1 else next(iter(results.values())), indent=1) + "\n")
    cache = ROOT / ".cache" / "beats"
    cache.mkdir(parents=True, exist_ok=True)
    for mid, m in results.items():
        (cache / f"{mid}.beats.json").write_text(json.dumps(m, indent=1) + "\n")
    if write:
        # hand the maps to the catalog writer (validates with zod, keeps formatting, rebuilds the index)
        subprocess.run(["node", str(ROOT / "tools" / "lib" / "beatmap-store.ts"), *[str(cache / f"{mid}.beats.json") for mid in results]], check=True)


if __name__ == "__main__":
    main()
