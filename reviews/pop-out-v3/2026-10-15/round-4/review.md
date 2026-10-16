# Critic: pop-out-v3, round 4 (2026-10-15)

Render: `renders/pop-out-v3/tiktok/15s/pop-out-v3-g3-internal_tiktok_9x16_15s_v4.mp4` (sha256 `57422f01bf772576…`), 540×960, 60 fps, 15.00 s.

**Judge only the rendered frames below, never the code.** Score 1–10; 8+ on every line passes the round.

## Evidence

| File | What to look at |
|---|---|
| `contact.jpg` | the whole film at 2 fps: one focal point per beat? anything cluttered, off-brand, empty? |
| `strip.jpg`, `strip-zoom.jpg` | the fastest move (2.383 s, 17.9 px/frame): one smear, or copies? comb **0.0** → **clean** |
| `phone.jpg` | 360 px wide: can every word be read in the time it's up? |
| `loop.mp4`, `seam.jpg` | the loop seam: diff 1.6 vs a normal step 0.73 → **seamless** |
| `audio.wav`, `waveform.png` | the blindfold test: structure visible without picture? strong onsets on the beat grid: **None** |

## Measured

- Determinism: frame 143 rendered twice → EQUAL
- Loudness: None LUFS integrated (FAIL: −14 ± 1), true peak None dBTP (FAIL: ≤ −1)
- Holds ≥ 0.5 s: 0.37–0.93 s, 1.1–1.85 s, 11.65–12.38 s, 12.43–12.98 s (an end card SHOULD hold ≥ 2 s; elsewhere a hold must be a read)
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
| 1 | 14.33–14.45 s | strip f860–f864: the lockup lifts at about 200 px a frame and "Curate" shows copies | DirectionalBlur on the lockup along its exit velocity |
| 2 | 0.05–0.17 s | strip f3–f10: the cut-out is fully on before the photo veils: two full jackets for about 5 frames | The veil leads (fully on at 25% of the lift), the cut-out follows (45%); on the way home the jacket fades first |
| 3 | 4.63–7.85 s | `phone.jpg` 5.0–7.0 s: the real app's own labels ("Ballet Flats") are small at 360 px | Accepted, not changed: it's the real app at 68–73% of the frame; the flats themselves are big and "Curate pulls it out." carries the read |

## This round's fixes

- Fixed 1 and 2 (marked `round 4`); 3 accepted. Re-rendered the internal pass (v5).
- The render here is an INTERNAL silent 540×960 pass (`renders/pop-out-v3/tiktok/15s/pop-out-v3-g3-internal_…`), made only for the critic's strip, loop and hold measurements; it is not the G4 animatic and is not shown to the founder.
- Loudness and the blindfold test do not apply (no audio until G5).

Record the scores: `tools/critic score pop-out-v3 --round 4 hook=_ phone=_ smooth=_ variety=_ sound=_ brand=_`
