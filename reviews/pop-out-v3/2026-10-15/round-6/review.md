# Critic: pop-out-v3, round 6 (2026-10-15)

Render: `renders/pop-out-v3/tiktok/15s/pop-out-v3-g3-internal_tiktok_9x16_15s_v6.mp4` (sha256 `9a60408718675742…`), 540×960, 60 fps, 15.00 s.

**Judge only the rendered frames below, never the code.** Score 1–10; 8+ on every line passes the round.

## Evidence

| File | What to look at |
|---|---|
| `contact.jpg` | the whole film at 2 fps: one focal point per beat? anything cluttered, off-brand, empty? |
| `strip.jpg`, `strip-zoom.jpg` | the fastest move (2.383 s, 17.3 px/frame): one smear, or copies? comb **0.0** → **clean** |
| `phone.jpg` | 360 px wide: can every word be read in the time it's up? |
| `loop.mp4`, `seam.jpg` | the loop seam: diff 1.74 vs a normal step 0.71 → **seamless** |
| `audio.wav`, `waveform.png` | the blindfold test: structure visible without picture? strong onsets on the beat grid: **None** |

## Measured

- Determinism: frame 480 rendered twice → EQUAL
- Loudness: None LUFS integrated (FAIL: −14 ± 1), true peak None dBTP (FAIL: ≤ −1)
- Holds ≥ 0.5 s: 0.33–0.93 s, 1.1–1.85 s, 7.18–7.87 s, 11.65–12.38 s, 12.43–12.98 s (an end card SHOULD hold ≥ 2 s; elsewhere a hold must be a read)
- Cuts: none · layer drops: none

## Scores (1–10)

| Criterion | What an 8 looks like | Score |
|---|---|---|
| Hook in 2 s | By 2.0 s a stranger knows what this is about and wants the next second. One clear image, no warm-up. | **8** |
| Phone readability | At 360 px wide every word on screen is readable in the time it is up; one focal point per beat. | **8** |
| Motion smoothness | No echo, judder, pops or dead stops; moves have mass; the fastest move's strip shows one smear, not copies. | **8** |
| Variety | Each beat earns its place with a different idea; nothing repeats without a reason; no template look. | **8** |
| Sound sync | Blindfolded, the waveform alone shows the structure: hits on the moves, big moments on downbeats, -14 LUFS. | N/A (no audio until G5: the designed sound is made at G5) |
| Brand accuracy | Monochrome ramp, Geist, the real app, the logo untouched, the rules in RULES.md; the CTA readable for 2 s+. | **8** |

## The 3 worst defects

| # | Time | Evidence (file + what you see) | Local fix (the smallest change that fixes it) |
|---|---|---|---|
| 1 | 7.87–8.12 s | stills 7.87 s, strips: the sheet rises in about 0.25 s; its text is one vertical smear for about 6 frames | For G4: judge it in motion; if it reads as a flash, a longer panel response for this one move |
| 2 | 4.6–11.0 s | safe-zone overlay: the real app's bottom bar ("Tell me when it's ready" / "Add 41 to wardrobe") sits in the bottom 20% | Real app UI, not the focal point; the platform caption will cover it. Left as is (no edits to the app) |
| 3 | 14.33–14.40 s | strip f862: a faint double of "Curate" remains in the lockup's exit (2 frames) | For G4: check in motion; raise its blur cap if visible |

## This round's fixes

- PASS. No change. The G3 stills (19 + 19 at 360 px + 33 beats) are in `stills/`; 3 remaining notes go to G4.
- The render here is an INTERNAL silent 540×960 pass (`renders/pop-out-v3/tiktok/15s/pop-out-v3-g3-internal_…`), made only for the critic's strip, loop and hold measurements; it is not the G4 animatic and is not shown to the founder.
- Loudness and the blindfold test do not apply (no audio until G5).

Record the scores: `tools/critic score pop-out-v3 --round 6 hook=_ phone=_ smooth=_ variety=_ sound=_ brand=_`

## G3 checks against the brief and v2's problems (on the final stills)

| Check | Result | Evidence |
|---|---|---|
| One focal point per beat | pass: the jacket (0–1.85), the line over the roll (1.85–3.70), the market photo alone (3.78–4.6), the real app's lift (4.6–7.85), the count (7.85–11.06), the lockup (11.06–14.30), her photo (14.30–15) | `beat-strip.jpg` (all 33 beats at 360 px) |
| Real app big, ≥ 3 s | pass: 6.4 s (4.63–11.06; the in-point frame is already under the forming screen from 4.17); screen 730–788 px wide (68–73%), the count pushed in to 2.05× | `stills/shots` 4.40–11.03 s |
| End card readable, held ≥ 2 s | pass: "On the App Store" (Geist 400, 56 px) fully landed 12.01–14.30 s = 2.29 s | `stills/phone` 12.50, 13.60 s |
| No clutter, nothing overlapping | pass: line 2's last row ends above the phone's top (line 2 ends at y 252, the pushed phone starts at y 284–288: a 32 px gap); the roll clears before the phone forms; the sheet covers, never splits, the screen | `stills/shots` 6.60, 7.83 s |
| TikTok/Reels safe zones (top 8%, bottom 20%, right 15%) | pass for everything we place: line 1 x 64–808, y 199–354; the jacket's hem y 1528 (< 1536); the 41 header ends x 911 (< 918); CTA centred; Zee ends at y 1472. Note: the real app's own bottom bar sits under the caption zone 4.6–11 s (real UI, not the focal point) | `safe-zones.jpg` |
| Loop: first frame = last frame | pass: f0 and f899 are byte-identical PNGs (sha256 c99de9d8…); critic seam 1.74 vs step 0.71 (the residue is h264 at crf 30) | `seam.jpg`, `determinism.txt` |
| Determinism (repeat renders) | pass: 11 frames (0, 83, 264, 336, 396, 480, 554, 668, 816, 862, 899) EQUAL in fresh browsers after an out-of-order frame; the 19 shot stills re-rendered in a second run: 19/19 identical sha256 | `determinism.txt`, `stills/shots-repeat/` |
| Motion blur doesn't echo | pass: strip clean (fastest measured 17.3 px/frame at half size); the sheet, the phone's exit and the lockup's exit carry a DirectionalBlur along their velocity, up to 16 sub-frame samples | `strip.jpg`, `strip-zoom.jpg` |
| Sound sync | N/A until G5 (no audio in this composition yet) | |
