# Critic: pop-out-v3, round 1 (2026-10-15)

Render: `renders/pop-out-v3/tiktok/15s/pop-out-v3-g3-internal_tiktok_9x16_15s_v1.mp4` (sha256 `c90e3a4f7679ba9b…`), 540×960, 60 fps, 15.00 s.

**Judge only the rendered frames below, never the code.** Score 1–10; 8+ on every line passes the round.

## Evidence

| File | What to look at |
|---|---|
| `contact.jpg` | the whole film at 2 fps: one focal point per beat? anything cluttered, off-brand, empty? |
| `strip.jpg`, `strip-zoom.jpg` | the fastest move (4.117 s, 8.3 px/frame): one smear, or copies? comb **0.0** → **clean** |
| `phone.jpg` | 360 px wide: can every word be read in the time it's up? |
| `loop.mp4`, `seam.jpg` | the loop seam: diff 1.86 vs a normal step 0.58 → **seamless** |
| `audio.wav`, `waveform.png` | the blindfold test: structure visible without picture? strong onsets on the beat grid: **None** |

## Measured

- Determinism: frame 247 rendered twice → EQUAL
- Loudness: None LUFS integrated (FAIL: −14 ± 1), true peak None dBTP (FAIL: ≤ −1)
- Holds ≥ 0.5 s: 0.37–0.93 s, 1.1–1.85 s, 6.18–7.85 s, 11.65–12.38 s, 12.43–12.98 s (an end card SHOULD hold ≥ 2 s; elsewhere a hold must be a read)
- Cuts: none · layer drops: none

## Scores (1–10)

| Criterion | What an 8 looks like | Score |
|---|---|---|
| Hook in 2 s | By 2.0 s a stranger knows what this is about and wants the next second. One clear image, no warm-up. | **7** |
| Phone readability | At 360 px wide every word on screen is readable in the time it is up; one focal point per beat. | **7** |
| Motion smoothness | No echo, judder, pops or dead stops; moves have mass; the fastest move's strip shows one smear, not copies. | **6** |
| Variety | Each beat earns its place with a different idea; nothing repeats without a reason; no template look. | **8** |
| Sound sync | Blindfolded, the waveform alone shows the structure: hits on the moves, big moments on downbeats, -14 LUFS. | N/A (no audio until G5: the designed sound is made at G5) |
| Brand accuracy | Monochrome ramp, Geist, the real app, the logo untouched, the rules in RULES.md; the CTA readable for 2 s+. | **8** |

## The 3 worst defects

| # | Time | Evidence (file + what you see) | Local fix (the smallest change that fixes it) |
|---|---|---|---|
| 1 | 7.85–8.30 s | `contact.jpg` 8.00 s, `phone.jpg` 8.0 s: the screen push shows the flats screen's bottom ("Tell me when it's ready") over the review screen's top; Zee is cut at the phone's top edge | The review screen rises OVER the flats screen as a sheet; the old one stays put |
| 2 | 4.17–4.63 s | `contact.jpg` 4.50 s: the phone frame has grown to full size round a small photo: an empty white phone | Put the real app's in-point frame under the forming screen from 4.17 s, drawn at the full screen's geometry, so the growing screen reveals the real app round the card |
| 3 | 6.18–7.85 s | metrics holds: 1.68 s with nothing moving (`contact.jpg` 6.0–7.5 s identical) on the real app | A slow camera push (×1.08, camera class) from 6.01 s about a point near the phone's top, so the top stays clear of the line |

## This round's fixes

- Fixed all three in `ads/pop-out-v3/index.tsx` (marked `G3 fix (round 1, …)`); re-rendered the internal pass (v2).
- The render here is an INTERNAL silent 540×960 pass (`renders/pop-out-v3/tiktok/15s/pop-out-v3-g3-internal_…`), made only for the critic's strip, loop and hold measurements; it is not the G4 animatic and is not shown to the founder.
- Loudness and the blindfold test do not apply (no audio until G5).

Record the scores: `tools/critic score pop-out-v3 --round 1 hook=_ phone=_ smooth=_ variety=_ sound=_ brand=_`
