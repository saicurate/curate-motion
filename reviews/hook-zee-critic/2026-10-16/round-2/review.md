# Critic: hook-zee-critic, round 2 (2026-10-16)

Render: `renders/hook-zee-critic/tiktok/8s/hook-zee-critic-pass4_tiktok_9x16_8s_v1.mp4` (sha256 `8ccbfdacb58e1670…`), 1080×1920, 60 fps, 8.00 s.

**Judge only the rendered frames below, never the code.** Score 1–10; 8+ on every line passes the round.

## Evidence

| File | What to look at |
|---|---|
| `contact.jpg` | the whole film at 2 fps: one focal point per beat? anything cluttered, off-brand, empty? |
| `strip.jpg`, `strip-zoom.jpg` | the fastest move (6.45 s, 11.3 px/frame): one smear, or copies? comb **0.0** → **clean** |
| `phone.jpg` | 360 px wide: can every word be read in the time it's up? |
| `loop.mp4`, `seam.jpg` | the loop seam: diff 80.98 vs a normal step 1.69 → **jump** |
| `audio.wav`, `waveform.png` | the blindfold test: structure visible without picture? strong onsets on the beat grid: **0.043** |

## Measured

- Determinism: not run
- Loudness: -16.0 LUFS integrated (FAIL: −14 ± 1), true peak -2.1 dBTP (pass: ≤ −1)
- Holds ≥ 0.5 s: none (an end card SHOULD hold ≥ 2 s; elsewhere a hold must be a read)
- Cuts: none · layer drops: none

## Scores (1–10)

| Criterion | What an 8 looks like | Score |
|---|---|---|
| Hook in 2 s | By 2.0 s a stranger knows what this is about and wants the next second. One clear image, no warm-up. | _ |
| Phone readability | At 360 px wide every word on screen is readable in the time it is up; one focal point per beat. | _ |
| Motion smoothness | No echo, judder, pops or dead stops; moves have mass; the fastest move's strip shows one smear, not copies. | _ |
| Variety | Each beat earns its place with a different idea; nothing repeats without a reason; no template look. | _ |
| Sound sync | Blindfolded, the waveform alone shows the structure: hits on the moves, big moments on downbeats, -14 LUFS. | _ |
| Brand accuracy | Monochrome ramp, Geist, the real app, the logo untouched, the rules in RULES.md; the CTA readable for 2 s+. | _ |

## The 3 worst defects

| # | Time | Evidence (file + what you see) | Local fix (the smallest change that fixes it) |
|---|---|---|---|
| 1 | | | |
| 2 | | | |
| 3 | | | |

## This round's fixes

- (what changed, and the seconds re-rendered: `tools/render <ad> --frames a-b`)

Record the scores: `tools/critic score hook-zee-critic --round 2 hook=_ phone=_ smooth=_ variety=_ sound=_ brand=_`
