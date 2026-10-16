# Critic: pop-out-v3, round 11 (2026-10-16)

Render: `renders/pop-out-v3/tiktok/15s/pop-out-v3-g5_tiktok_9x16_15s_v2.mp4` (sha256 `b1635157be9c00af…`), 1080×1920, 60 fps, 15.02 s.

**Judge only the rendered frames below, never the code.** Score 1–10; 8+ on every line passes the round.

## Evidence

| File | What to look at |
|---|---|
| `contact.jpg` | the whole film at 2 fps: one focal point per beat? anything cluttered, off-brand, empty? |
| `strip.jpg`, `strip-zoom.jpg` | the fastest move (2.383 s, 35.8 px/frame): one smear, or copies? comb **0.0**, sample gap **1.2 px** (≤ 3 px or it echoes) → **clean** |
| `phone.jpg` | 360 px wide: can every word be read in the time it's up? |
| `loop.mp4`, `seam.jpg` | the loop seam: diff 0.33 vs a normal step 0.77 → **seamless** |
| `audio.wav`, `waveform.png` | the blindfold test: structure visible without picture? strong onsets on the beat grid: **0.853** |

## Measured

- Determinism: frame 143 rendered twice → EQUAL
- Loudness: -14.0 LUFS integrated (pass: −14 ± 1), true peak -2.3 dBTP (pass: ≤ −1)
- Holds ≥ 0.5 s: 0.35–0.93 s, 1.12–1.85 s, 6.87–7.87 s, 11.65–12.98 s (an end card SHOULD hold ≥ 2 s; elsewhere a hold must be a read)
- Cuts: none · layer drops: none

## Scores (1–10)

| Criterion | What an 8 looks like | Score |
|---|---|---|
| Hook in 2 s | By 2.0 s a stranger knows what this is about and wants the next second. One clear image, no warm-up. | **8** |
| Phone readability | At 360 px wide every word on screen is readable in the time it is up; one focal point per beat. | **8** |
| Motion smoothness | No echo, judder, pops or dead stops; moves have mass; the fastest move's strip shows one smear, not copies. | **8** |
| Variety | Each beat earns its place with a different idea; nothing repeats without a reason; no template look. | **8** |
| Sound sync | Blindfolded, the waveform alone shows the structure: hits on the moves, big moments on downbeats, -14 LUFS. | **6** |
| Brand accuracy | Monochrome ramp, Geist, the real app, the logo untouched, the rules in RULES.md; the CTA readable for 2 s+. | **8** |

## The 3 worst defects

| # | Time | Evidence (file + what you see) | Local fix (the smallest change that fixes it) |
|---|---|---|---|
| 1 | 7.85–9.23 s (audio) | `waveform.png`: still flat. Measured RMS (`audio.wav`): the 0.14 s breath before 9.23 s is −19.4 dB vs −20.7 in round 10: the louder riser fills exactly the gap the music leaves, and a 2.5 dB ease is too small to see under the music peaks | Make the build a real valley: from the sheet (7.85 s) the music sinks 6 dB in about 0.3 s and stays down while the riser climbs alone; back in full on 9.23 s with the impact. Sound file unchanged (v2); only `timeline.ts › musicGain` |
| 2 | 1.9–2.3 s | as round 10: the jacket going home is a half-opaque cut-out for about 0.3 s | Left (G3-approved hand-off) |
| 3 | — | picture identical to round 10 (only the mix changed) | — |

## This round's fixes

- Defect 1 changed for round 12 (`musicGain`: −6 dB valley under the riser, no breath). Mix kept at music 0.64, sfx 0.6. Round 11 measured −14.0 LUFS, true peak −2.3 dBTP.

Record the scores: `tools/critic score pop-out-v3 --round 11 hook=_ phone=_ smooth=_ variety=_ sound=_ brand=_`
