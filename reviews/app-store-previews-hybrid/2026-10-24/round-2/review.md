# Critic: app-store-previews-hybrid, round 2 (2026-10-24)

Render: `renders/app-store-previews-hybrid/appstore/30s/app-store-previews-hybrid-h2_appstore_appstore-iphone_30s_v1.mp4` (sha256 `1a07c0cc85b8b05e…`), 886×1920, 30 fps, 16.50 s.

**Judge only the rendered frames below, never the code.** Score 1–10; 8+ on every line passes the round.

## Evidence

| File | What to look at |
|---|---|
| `contact.jpg` | the whole film at 2 fps: one focal point per beat? anything cluttered, off-brand, empty? |
| `strip.jpg`, `strip-zoom.jpg` | the fastest move (13.067 s, 57.6 px/frame): one smear, or copies? comb **0.039** → **clean** |
| `phone.jpg` | 360 px wide: can every word be read in the time it's up? |
| `loop.mp4`, `seam.jpg` | the loop seam: diff 42.32 vs a normal step 0.16 → **jump** |
| `audio.wav`, `waveform.png` | the blindfold test: structure visible without picture? strong onsets on the beat grid: **None** |

## Measured

- Determinism: not run
- Loudness: None LUFS integrated (FAIL: −14 ± 1), true peak None dBTP (FAIL: ≤ −1)
- Holds ≥ 0.5 s: 1.63–2.3 s, 4.3–5.27 s, 5.63–6.63 s, 7.43–9.17 s, 10.1–12.8 s, 14.63–16.47 s (an end card SHOULD hold ≥ 2 s; elsewhere a hold must be a read)
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

Record the scores: `tools/critic score app-store-previews-hybrid --round 2 hook=_ phone=_ smooth=_ variety=_ sound=_ brand=_`
