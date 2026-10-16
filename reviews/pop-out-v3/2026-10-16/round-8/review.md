# Critic: pop-out-v3, round 8 (2026-10-16)

Render: `renders/pop-out-v3/tiktok/15s/pop-out-v3-g4-animatic_tiktok_9x16_15s_v2.mp4` (sha256 `4cd0247191669dc0…`), 540×960, 60 fps, 15.02 s.

**Judge only the rendered frames below, never the code.** Score 1–10; 8+ on every line passes the round.

## Evidence

| File | What to look at |
|---|---|
| `contact.jpg` | the whole film at 2 fps: one focal point per beat? anything cluttered, off-brand, empty? |
| `strip.jpg`, `strip-zoom.jpg` | the fastest move (2.383 s, 17.3 px/frame): one smear, or copies? comb **0.0**, sample gap **0.6 px** (≤ 3 px or it echoes) → **clean** |
| `phone.jpg` | 360 px wide: can every word be read in the time it's up? |
| `loop.mp4`, `seam.jpg` | the loop seam: diff 1.78 vs a normal step 0.8 → **seamless** |
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
| Motion smoothness | No echo, judder, pops or dead stops; moves have mass; the fastest move's strip shows one smear, not copies. | **7** |
| Variety | Each beat earns its place with a different idea; nothing repeats without a reason; no template look. | **8** |
| Sound sync | Blindfolded, the waveform alone shows the structure: hits on the moves, big moments on downbeats, -14 LUFS. | **N/A (G4: the music bed only, a placeholder; the designed sound is G5)** |
| Brand accuracy | Monochrome ramp, Geist, the real app, the logo untouched, the rules in RULES.md; the CTA readable for 2 s+. | **8** |

## The 3 worst defects

| # | Time | Evidence (file + what you see) | Local fix (the smallest change that fixes it) |
|---|---|---|---|
| 1 | 14.37–14.45 s (f862–f869) | `motion-close.png` (f856–f879): the round-7 fix holds (no scroll, no comb), but the lockup still fades over 0.28 s and her photo starts 0.1 s after it, so frames 866–869 show a 4–10% ghost of "Curate" above her rising photo: the double, fainter | Lockup fade 0.28 → 0.16 s; her photo starts 0.13 s after the lockup leaves (was 0.10): nothing of the lockup is left when the photo appears |
| 2 | 11.06–11.20 s (f664–f672) | `motion-phone-exit.png` (f654–f700, every 2nd): the phone leaves downward 1800 px in 0.4 s (peak 173 px/frame at 1080, pushed in at 2.05×), and its status bar and header smear into bars for about 6 frames: the same flaw the sheet had | The phone drops 420 px and fades out over 0.18 s (exponential), the mark arrives 0.15 s after the downbeat (was 0.12): peak 40 px/frame |
| 3 | 7.85–8.40 s | `motion-sheet.png` (f468–f491): fixed. One status bar; the sheet rises with readable text ("0 pieces from your photos"), no bars; it lands at about 8.5 s while the real count runs | None |

## This round's fixes

- Defects 1 and 2 fixed in index.tsx (`G4 fix (round 8)`); the whole animatic re-rendered (v3).
- Checked in motion this round, beyond the critic strip: the hook (`motion-hook.png`), the glide into the market photo and the phone forming (`motion-glide.png`), the sheet, the phone exit, the close.

Record the scores: `tools/critic score pop-out-v3 --round 8 hook=_ phone=_ smooth=_ variety=_ sound=_ brand=_`
