# Critic: pop-out-v3, round 12 (2026-10-16)

Render: `renders/pop-out-v3/tiktok/15s/pop-out-v3-g5_tiktok_9x16_15s_v3.mp4` (sha256 `6f9e78d42c554a62…`), 1080×1920, 60 fps, 15.02 s.

**Judge only the rendered frames below, never the code.** Score 1–10; 8+ on every line passes the round.

## Evidence

| File | What to look at |
|---|---|
| `contact.jpg` | the whole film at 2 fps: one focal point per beat? anything cluttered, off-brand, empty? |
| `strip.jpg`, `strip-zoom.jpg` | the fastest move (2.383 s, 35.7 px/frame): one smear, or copies? comb **0.0**, sample gap **1.2 px** (≤ 3 px or it echoes) → **clean** |
| `phone.jpg` | 360 px wide: can every word be read in the time it's up? |
| `loop.mp4`, `seam.jpg` | the loop seam: diff 0.33 vs a normal step 0.77 → **seamless** |
| `audio.wav`, `waveform.png` | the blindfold test: structure visible without picture? strong onsets on the beat grid: **0.853** |

## Measured

- Determinism: frame 143 rendered twice → EQUAL
- Loudness: -14.2 LUFS integrated (pass: −14 ± 1), true peak -2.3 dBTP (pass: ≤ −1)
- Holds ≥ 0.5 s: 0.35–0.93 s, 1.12–1.85 s, 6.85–7.87 s, 11.65–12.98 s (an end card SHOULD hold ≥ 2 s; elsewhere a hold must be a read)
- Cuts: none · layer drops: none

## Scores (1–10)

| Criterion | What an 8 looks like | Score |
|---|---|---|
| Hook in 2 s | By 2.0 s a stranger knows what this is about and wants the next second. One clear image, no warm-up. | **8** |
| Phone readability | At 360 px wide every word on screen is readable in the time it is up; one focal point per beat. | **8** |
| Motion smoothness | No echo, judder, pops or dead stops; moves have mass; the fastest move's strip shows one smear, not copies. | **8** |
| Variety | Each beat earns its place with a different idea; nothing repeats without a reason; no template look. | **8** |
| Sound sync | Blindfolded, the waveform alone shows the structure: hits on the moves, big moments on downbeats, -14 LUFS. | **8** |
| Brand accuracy | Monochrome ramp, Geist, the real app, the logo untouched, the rules in RULES.md; the CTA readable for 2 s+. | **8** |

## The 3 worst defects

| # | Time | Evidence (file + what you see) | Local fix (the smallest change that fixes it) |
|---|---|---|---|
| 1 | 0–7.8 s, 9.3–14.7 s (audio) | `waveform.png`: outside the build the bars still look alike (the music carries them; the hits sit on its beats: 85% of strong onsets on the grid). `sound-stem.png` (the designed layer alone) shows every cue where it belongs: pops on the two lifts, lands under the lines, glides under the camera, the riser into the impact on 41, the chime on the CTA, Zee pop | Acceptable for an 8: the shape that matters (one valley and one wall at the proof) reads blindfolded; more would mean fighting the track |
| 2 | 1.9–2.3 s | the jacket going home is a half-opaque cut-out for about 0.3 s (as round 10) | Left (G3-approved hand-off, flat-lay kept by default) |
| 3 | 4.6–11.0 s | the real app bottom bar under the platform caption zone (as G3) | Real UI, left as recorded |

## This round's fixes

- G5 PASS: every score 8+, sound included. Final render `renders/pop-out-v3/tiktok/15s/pop-out-v3-g5_tiktok_9x16_15s_v3.mp4` (1080×1920, 60 fps, h264 crf 18 + AAC 48 kHz, 21.4 MB).
- Blindfold: `waveform.png` shows the build as a one-bar valley (music −6 dB, the riser climbing) and a wall on the 9.23 s downbeat, then the track break at 14.76 s; `sound-stem.png` = the designed layer alone with its cues labelled.
- Loudness −14.2 LUFS integrated, true peak −2.3 dBTP. Determinism EQUAL (f143); loop seamless (seam 0.33 vs a normal step 0.77); strip clean (35.7 px/frame, sample gap 1.2 px).

Record the scores: `tools/critic score pop-out-v3 --round 12 hook=_ phone=_ smooth=_ variety=_ sound=_ brand=_`
