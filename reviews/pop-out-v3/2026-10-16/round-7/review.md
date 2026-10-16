# Critic: pop-out-v3, round 7 (2026-10-16)

Render: `renders/pop-out-v3/tiktok/15s/pop-out-v3-g4-animatic_tiktok_9x16_15s_v1.mp4` (sha256 `cfb05b457c2713f5…`), 540×960, 60 fps, 15.02 s.

**Judge only the rendered frames below, never the code.** Score 1–10; 8+ on every line passes the round.

## Evidence

| File | What to look at |
|---|---|
| `contact.jpg` | the whole film at 2 fps: one focal point per beat? anything cluttered, off-brand, empty? |
| `strip.jpg`, `strip-zoom.jpg` | the fastest move (2.383 s, 17.3 px/frame): one smear, or copies? comb **0.0**, sample gap **0.6 px** (≤ 3 px or it echoes) → **clean** |
| `phone.jpg` | 360 px wide: can every word be read in the time it's up? |
| `loop.mp4`, `seam.jpg` | the loop seam: diff 1.75 vs a normal step 0.72 → **seamless** |
| `audio.wav`, `waveform.png` | the blindfold test: structure visible without picture? strong onsets on the beat grid: **0.891** |

## Measured

- Determinism: frame 143 rendered twice → EQUAL
- Loudness: -14.5 LUFS integrated (pass: −14 ± 1), true peak -4.1 dBTP (pass: ≤ −1)
- Holds ≥ 0.5 s: 0.33–0.93 s, 1.1–1.85 s, 7.1–7.87 s, 11.65–12.38 s, 12.43–12.98 s (an end card SHOULD hold ≥ 2 s; elsewhere a hold must be a read)
- Cuts: none · layer drops: none

## Scores (1–10)

| Criterion | What an 8 looks like | Score |
|---|---|---|
| Hook in 2 s | By 2.0 s a stranger knows what this is about and wants the next second. One clear image, no warm-up. | **8** |
| Phone readability | At 360 px wide every word on screen is readable in the time it is up; one focal point per beat. | **8** |
| Motion smoothness | No echo, judder, pops or dead stops; moves have mass; the fastest move's strip shows one smear, not copies. | **6** |
| Variety | Each beat earns its place with a different idea; nothing repeats without a reason; no template look. | **8** |
| Sound sync | Blindfolded, the waveform alone shows the structure: hits on the moves, big moments on downbeats, -14 LUFS. | **N/A (G4: the music bed only, a placeholder; the designed sound is G5)** |
| Brand accuracy | Monochrome ramp, Geist, the real app, the logo untouched, the rules in RULES.md; the CTA readable for 2 s+. | **8** |

## The 3 worst defects

| # | Time | Evidence (file + what you see) | Local fix (the smallest change that fixes it) |
|---|---|---|---|
| 1 | 7.85–8.15 s (f471–f489) | `motion-sheet.png` (24 frames from 7.80 s), `f483-f485-full.png` (1:1 stills): the review sheet carries its OWN status bar, so a second "9:41" and a second island slide up the phone and smear into bars; its text is one vertical smear for about 6 frames (peak 165 px/frame at 1080: the panel spring over the whole screen height in 0.4 s). Reads as a flash. | The sheet rises UNDER the phone status bar (the recording band 0–200 app px cut off the sheet; the full recording shown only once it has landed, same pixels); a longer panel response for this one move (critically damped, response 0.40 → 0.62 s: peak 101 px/frame, samples ≤ 3.4 px apart); the old screen dims below the status bar only |
| 2 | 14.30–14.40 s (f858–f864) | `motion-lockup.png` (f859–f866 at 1:1), `f862-full.png`: the lockup and her photo scroll the whole frame together (2016 px and 1500 px in 0.4 s: peaks 194 and 144 px/frame); 16 samples sit 6 px apart, the smear shows comb lines and its two ends read as two "Curate"s | The lockup lifts 300 px and fades out (exponential); her photo rises 480 px and fades in after it: peaks 29 and 46 px/frame. Frame 899 stays byte-identical to frame 0 |
| 3 | 4.00 s, 11.50 s | `contact.jpg`: the two hand-offs (roll → market photo, phone → mark) are thin frames, but in motion both read as one move each | None needed: judged in motion, they carry (watch again at G5 with sound) |

## This round's fixes

- Fixed defects 1 and 2 in index.tsx (marked `G4 fix (round 7)`), whole animatic re-rendered (`…g4-animatic_…_v2.mp4`, 540×960, 60 fps, the Cat Walk bed): 900 frames in about 70 s at --concurrency 1.
- The critic optical-flow "fastest move" (17.3 px/frame at 2.38 s, the camera glide) misses the sheet and the lockup (too fast for its flow window), so this round adds hand-cut motion strips of those moves as evidence: `motion-sheet.png`, `motion-lockup.png`, and 1:1 stills.
- Sound: the music bed alone measures −14.5 LUFS, true peak −4.1 dBTP, 89% of strong onsets on the beat grid (that is the music, not designed sound).

Record the scores: `tools/critic score pop-out-v3 --round 7 hook=_ phone=_ smooth=_ variety=_ sound=_ brand=_`
