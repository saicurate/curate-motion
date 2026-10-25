# Critic: app-store-previews, round 2 (2026-10-24)

Render: `renders/app-store-previews/appstore/30s/app-store-previews-p2-blue_appstore_appstore-iphone_30s_v1.mp4` (sha256 `342a9b926d99417e…`), 886×1920, 30 fps, 23.50 s.

**Judge only the rendered frames below, never the code.** Score 1–10; 8+ on every line passes the round.

## Evidence

| File | What to look at |
|---|---|
| `contact.jpg` | the whole film at 2 fps: one focal point per beat? anything cluttered, off-brand, empty? |
| `strip.jpg`, `strip-zoom.jpg` | the fastest move (9.133 s, 73.4 px/frame): one smear, or copies? comb **0.082** → **clean** |
| `phone.jpg` | 360 px wide: can every word be read in the time it's up? |
| `loop.mp4`, `seam.jpg` | the loop seam: diff 71.03 vs a normal step 0.01 → **jump** |
| `audio.wav`, `waveform.png` | the blindfold test: structure visible without picture? strong onsets on the beat grid: **None** |

## Measured

- Determinism: not run
- Loudness: None LUFS integrated (FAIL: −14 ± 1), true peak None dBTP (FAIL: ≤ −1)
- Holds ≥ 0.5 s: 0.73–2.3 s, 2.53–4.3 s, 4.53–6.1 s, 6.33–8.9 s, 9.2–9.9 s, 10.07–10.63 s, 11.63–12.1 s, 14.03–18.63 s, 19.0–20.97 s, 21.9–23.47 s (an end card SHOULD hold ≥ 2 s; elsewhere a hold must be a read)
- Cuts: 9.933 · layer drops: none

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

Record the scores: `tools/critic score app-store-previews --round 2 hook=_ phone=_ smooth=_ variety=_ sound=_ brand=_`
