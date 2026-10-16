# Critic: pop-out-v3, round 10 (2026-10-16)

Render: `renders/pop-out-v3/tiktok/15s/pop-out-v3-g5_tiktok_9x16_15s_v1.mp4` (sha256 `85a977b337dc3f49…`), 1080×1920, 60 fps, 15.02 s.

**Judge only the rendered frames below, never the code.** Score 1–10; 8+ on every line passes the round.

## Evidence

| File | What to look at |
|---|---|
| `contact.jpg` | the whole film at 2 fps: one focal point per beat? anything cluttered, off-brand, empty? |
| `strip.jpg`, `strip-zoom.jpg` | the fastest move (2.383 s, 35.7 px/frame): one smear, or copies? comb **0.0**, sample gap **1.2 px** (≤ 3 px or it echoes) → **clean** |
| `phone.jpg` | 360 px wide: can every word be read in the time it's up? |
| `loop.mp4`, `seam.jpg` | the loop seam: diff 0.33 vs a normal step 0.77 → **seamless** |
| `audio.wav`, `waveform.png` | the blindfold test: structure visible without picture? strong onsets on the beat grid: **0.837** |

## Measured

- Determinism: frame 143 rendered twice → EQUAL
- Loudness: -14.2 LUFS integrated (pass: −14 ± 1), true peak -1.9 dBTP (pass: ≤ −1)
- Holds ≥ 0.5 s: 0.35–0.93 s, 1.12–1.85 s, 6.85–7.87 s, 11.65–12.98 s (an end card SHOULD hold ≥ 2 s; elsewhere a hold must be a read)
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
| 1 | 0–15 s (audio) | `waveform.png` (the blindfold test): every bar looks the same. The designed layer is there (89% → 84% of strong onsets on the grid) but it is buried under the music: the build into the proof (7.85–9.23 s) and the impact on 41 do not show; without picture you could not say where the big moment is | Give the build a shape on the same clock: the music eases down 2.5 dB under the riser and takes a 0.14 s breath (−8 dB) before 9.23 s, back in full on the downbeat; riser gain 0.42 → 0.75, impact gain 0.6 → 1 (sound v2, `sfx.curate.pop-out-v3-sound.v2`); re-balance to −14 LUFS |
| 2 | 1.9–2.3 s | `phone.jpg` 2.0 s: as the jacket settles home it is a half-opaque cut-out over the veiled photo (two jackets at 40% each for about 0.3 s, the cut-out a touch below the photo edge) | Left: the G3-approved hand-off (flat-lay cut-out kept by the founder default); in motion it reads as the jacket going back in |
| 3 | 8.00 s | `phone.jpg` 8.0 s: one frame of the rising sheet header smeared at 360 px | Motion blur at 101 px/frame for one frame; in motion it reads as a sheet rising. Left |

## This round's fixes

- Fixed defect 1 for round 11: `timeline.ts › musicGain` (the music duck, a pure function of t), `RISER_GAIN`, the impact gain; `sound.ts` re-run (byte-identical on repeat runs) and registered as `sfx.curate.pop-out-v3-sound.v2` (draft; v1 retired for it). Mix: music 0.64, sfx 0.6.
- This round: the first full pass, 1080×1920, 60 fps, --concurrency 1, 900 frames in 76 s: −14.2 LUFS, true peak −1.9 dBTP, determinism EQUAL, loop seamless (seam 0.33 vs step 0.77), strip clean (35.7 px/frame, sample gap 1.2 px).

Record the scores: `tools/critic score pop-out-v3 --round 10 hook=_ phone=_ smooth=_ variety=_ sound=_ brand=_`
