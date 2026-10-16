# Critic: pop-out-v3, round 9 (2026-10-16)

Render: `renders/pop-out-v3/tiktok/15s/pop-out-v3-g4-animatic_tiktok_9x16_15s_v3.mp4` (sha256 `4e9d4fb993782a61…`), 540×960, 60 fps, 15.02 s.

**Judge only the rendered frames below, never the code.** Score 1–10; 8+ on every line passes the round.

## Evidence

| File | What to look at |
|---|---|
| `contact.jpg` | the whole film at 2 fps: one focal point per beat? anything cluttered, off-brand, empty? |
| `strip.jpg`, `strip-zoom.jpg` | the fastest move (2.383 s, 17.3 px/frame): one smear, or copies? comb **0.0**, sample gap **0.6 px** (≤ 3 px or it echoes) → **clean** |
| `phone.jpg` | 360 px wide: can every word be read in the time it's up? |
| `loop.mp4`, `seam.jpg` | the loop seam: diff 1.8 vs a normal step 0.76 → **seamless** |
| `audio.wav`, `waveform.png` | the blindfold test: structure visible without picture? strong onsets on the beat grid: **0.891** |

## Measured

- Determinism: frame 143 rendered twice → EQUAL
- Loudness: -14.5 LUFS integrated (pass: −14 ± 1), true peak -4.1 dBTP (pass: ≤ −1)
- Holds ≥ 0.5 s: 0.33–0.93 s, 1.1–1.85 s, 7.17–7.87 s, 11.65–12.98 s (an end card SHOULD hold ≥ 2 s; elsewhere a hold must be a read)
- Cuts: none · layer drops: none

## Scores (1–10)

| Criterion | What an 8 looks like | Score |
|---|---|---|
| Hook in 2 s | By 2.0 s a stranger knows what this is about and wants the next second. One clear image, no warm-up. | **8** |
| Phone readability | At 360 px wide every word on screen is readable in the time it is up; one focal point per beat. | **8** |
| Motion smoothness | No echo, judder, pops or dead stops; moves have mass; the fastest move's strip shows one smear, not copies. | **8** |
| Variety | Each beat earns its place with a different idea; nothing repeats without a reason; no template look. | **8** |
| Sound sync | Blindfolded, the waveform alone shows the structure: hits on the moves, big moments on downbeats, -14 LUFS. | **N/A (G4: the music bed only, a placeholder; the designed sound is G5)** |
| Brand accuracy | Monochrome ramp, Geist, the real app, the logo untouched, the rules in RULES.md; the CTA readable for 2 s+. | **8** |

## The 3 worst defects

| # | Time | Evidence (file + what you see) | Local fix (the smallest change that fixes it) |
|---|---|---|---|
| 1 | 0.00–0.10 s | `motion-hook.png`: the photo veils to 62% in about 6 frames as the jacket lifts; in motion it reads as the jacket stepping forward, not a flash | None now; re-judge at G5 with the pop under it |
| 2 | 4.6–11.0 s | `safe-zones.jpg` (round 6): the real app bottom bar sits in the caption zone | Real UI, not the focal point; left as recorded (no edits to the app) |
| 3 | 11.06–11.24 s | `motion-phone-exit.png`: fixed. The phone drops and fades in about 4 frames, no bars; the mark lands 0.15 s after the downbeat. `motion-close.png`: fixed, the lockup is fully gone (f868) before her photo rises (f870); no second Curate | None |

## This round's fixes

- G4 PASS: every applicable score 8+. The animatic is `renders/pop-out-v3/tiktok/15s/pop-out-v3-g4-animatic_tiktok_9x16_15s_v3.mp4` (540×960, 60 fps, the Cat Walk bed).
- Determinism EQUAL on frames 143 (critic), 483 (the sheet), 668 (the phone exit), 866 (the close) and 899; frame 899 byte-identical to frame 0 (sha256 8d971025…). Loop seamless (seam 1.8 vs step 0.76).

Record the scores: `tools/critic score pop-out-v3 --round 9 hook=_ phone=_ smooth=_ variety=_ sound=_ brand=_`
