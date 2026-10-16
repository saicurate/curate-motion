# Critic: pop-out-v3, round 2 (2026-10-15)

Render: `renders/pop-out-v3/tiktok/15s/pop-out-v3-g3-internal_tiktok_9x16_15s_v2.mp4` (sha256 `5581034fa7487fc2…`), 540×960, 60 fps, 15.00 s.

**Judge only the rendered frames below, never the code.** Score 1–10; 8+ on every line passes the round.

## Evidence

| File | What to look at |
|---|---|
| `contact.jpg` | the whole film at 2 fps: one focal point per beat? anything cluttered, off-brand, empty? |
| `strip.jpg`, `strip-zoom.jpg` | the fastest move (4.117 s, 8.3 px/frame): one smear, or copies? comb **0.0** → **clean** |
| `phone.jpg` | 360 px wide: can every word be read in the time it's up? |
| `loop.mp4`, `seam.jpg` | the loop seam: diff 1.85 vs a normal step 0.72 → **seamless** |
| `audio.wav`, `waveform.png` | the blindfold test: structure visible without picture? strong onsets on the beat grid: **None** |

## Measured

- Determinism: frame 247 rendered twice → EQUAL
- Loudness: None LUFS integrated (FAIL: −14 ± 1), true peak None dBTP (FAIL: ≤ −1)
- Holds ≥ 0.5 s: 0.37–0.93 s, 1.1–1.85 s, 7.12–7.87 s, 11.65–12.38 s, 12.43–12.98 s (an end card SHOULD hold ≥ 2 s; elsewhere a hold must be a read)
- Cuts: none · layer drops: none

## Scores (1–10)

| Criterion | What an 8 looks like | Score |
|---|---|---|
| Hook in 2 s | By 2.0 s a stranger knows what this is about and wants the next second. One clear image, no warm-up. | **6** |
| Phone readability | At 360 px wide every word on screen is readable in the time it is up; one focal point per beat. | **8** |
| Motion smoothness | No echo, judder, pops or dead stops; moves have mass; the fastest move's strip shows one smear, not copies. | **6** |
| Variety | Each beat earns its place with a different idea; nothing repeats without a reason; no template look. | **8** |
| Sound sync | Blindfolded, the waveform alone shows the structure: hits on the moves, big moments on downbeats, -14 LUFS. | N/A (no audio until G5: the designed sound is made at G5) |
| Brand accuracy | Monochrome ramp, Geist, the real app, the logo untouched, the rules in RULES.md; the CTA readable for 2 s+. | **8** |

## The 3 worst defects

| # | Time | Evidence (file + what you see) | Local fix (the smallest change that fixes it) |
|---|---|---|---|
| 1 | 0.00–1.85 s, and f0/f899 | 1:1 crop of f0 (`seam.jpg`): the flat-lay jacket cut-out is pasted over her worn jacket from frame 0: two jackets in the hook's first frame | The cut-out is invisible at rest and fades up as it lifts (exponential), from ×1.2 to ×1.4, right 10%, up 5%; the photo veils to 0.62 |
| 2 | 7.88–8.15 s | debug still f480: the rising sheet's "9:41" and "FROM 30 PICKED PHOTOS" show about 8 copies; the old screen's status bar is cut by its 6% parallax | DirectionalBlur along the sheet's own velocity; up to 16 sub-frame samples (was 12); the old screen stays still and only dims 10% |
| 3 | 3.70–4.17 s | `contact.jpg` 4.00 s: all 30 photos fill the frame with nothing leading: no focal point while the camera glides in | The roll (and the ferry photo) clears from 3.78 s over 0.6 s, so the market photo is alone as the camera glides into it |

## This round's fixes

- Fixed all three (marked `round 2`); re-rendered the internal pass (v3).
- The render here is an INTERNAL silent 540×960 pass (`renders/pop-out-v3/tiktok/15s/pop-out-v3-g3-internal_…`), made only for the critic's strip, loop and hold measurements; it is not the G4 animatic and is not shown to the founder.
- Loudness and the blindfold test do not apply (no audio until G5).

Record the scores: `tools/critic score pop-out-v3 --round 2 hook=_ phone=_ smooth=_ variety=_ sound=_ brand=_`
