# Critic: pop-out-v3, round 3 (2026-10-15)

Render: `renders/pop-out-v3/tiktok/15s/pop-out-v3-g3-internal_tiktok_9x16_15s_v3.mp4` (sha256 `4d820e8b4c4d2617…`), 540×960, 60 fps, 15.00 s.

**Judge only the rendered frames below, never the code.** Score 1–10; 8+ on every line passes the round.

## Evidence

| File | What to look at |
|---|---|
| `contact.jpg` | the whole film at 2 fps: one focal point per beat? anything cluttered, off-brand, empty? |
| `strip.jpg`, `strip-zoom.jpg` | the fastest move (2.383 s, 17.9 px/frame): one smear, or copies? comb **0.0** → **clean** |
| `phone.jpg` | 360 px wide: can every word be read in the time it's up? |
| `loop.mp4`, `seam.jpg` | the loop seam: diff 2.06 vs a normal step 0.74 → **soft** |
| `audio.wav`, `waveform.png` | the blindfold test: structure visible without picture? strong onsets on the beat grid: **None** |

## Measured

- Determinism: frame 143 rendered twice → EQUAL
- Loudness: None LUFS integrated (FAIL: −14 ± 1), true peak None dBTP (FAIL: ≤ −1)
- Holds ≥ 0.5 s: 0.37–0.93 s, 1.1–1.85 s, 7.03–7.87 s, 11.65–12.38 s, 12.43–12.98 s (an end card SHOULD hold ≥ 2 s; elsewhere a hold must be a read)
- Cuts: none · layer drops: none

## Scores (1–10)

| Criterion | What an 8 looks like | Score |
|---|---|---|
| Hook in 2 s | By 2.0 s a stranger knows what this is about and wants the next second. One clear image, no warm-up. | **8** |
| Phone readability | At 360 px wide every word on screen is readable in the time it is up; one focal point per beat. | **8** |
| Motion smoothness | No echo, judder, pops or dead stops; moves have mass; the fastest move's strip shows one smear, not copies. | **7** |
| Variety | Each beat earns its place with a different idea; nothing repeats without a reason; no template look. | **8** |
| Sound sync | Blindfolded, the waveform alone shows the structure: hits on the moves, big moments on downbeats, -14 LUFS. | N/A (no audio until G5: the designed sound is made at G5) |
| Brand accuracy | Monochrome ramp, Geist, the real app, the logo untouched, the rules in RULES.md; the CTA readable for 2 s+. | **8** |

## The 3 worst defects

| # | Time | Evidence (file + what you see) | Local fix (the smallest change that fixes it) |
|---|---|---|---|
| 1 | 14.98 → 0.00 s (loop) | `seam.jpg`, metrics loop: seam 2.06 vs a 0.74 step (soft); full-res f899 vs f0 differ by 2.4 (a 0.6 px sub-pixel shift of the photo) | The photo's return eases its last 0.6 px to exactly 0 over the final 0.25 s: f899 = f0 |
| 2 | 11.06–11.25 s | full-res strip f666–f670: the phone falls 2400 px at up to 230 px a frame; "41 pieces from your photos" shows stacked copies | Travel only 1800 px (just clears the frame) and a DirectionalBlur along that vertical move |
| 3 | 14.30–14.50 s | `contact.jpg` 14.50 s: the photo returns from 2200 px (212 px a frame), smeared in copies | Travel 1500 px (just off-frame) with the same vertical DirectionalBlur |

## This round's fixes

- Fixed all three (marked `round 3`); re-rendered the internal pass (v4).
- The render here is an INTERNAL silent 540×960 pass (`renders/pop-out-v3/tiktok/15s/pop-out-v3-g3-internal_…`), made only for the critic's strip, loop and hold measurements; it is not the G4 animatic and is not shown to the founder.
- Loudness and the blindfold test do not apply (no audio until G5).

Record the scores: `tools/critic score pop-out-v3 --round 3 hook=_ phone=_ smooth=_ variety=_ sound=_ brand=_`
