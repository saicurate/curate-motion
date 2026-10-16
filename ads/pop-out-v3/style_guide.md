# Pop out v3: style guide

**Status: PROPOSED.** These studio rules are pending the founder's OK after v3. They are not in
RULES.md; the founder decides after seeing v3. Gate G2 approved by the founder (2026-10-15); G3 in review.

## Sources (reference → grammar)

Frames were pulled every 0.5 s (the hook every 0.25 s) with `tools/refframes`; the numbers below come
from `ads/pop-out-v3/out/refs/*/refs.json` (local, not in git).

| Reference | What we measured | Grammar we TAKE | What we never take |
|---|---|---|---|
| `inspo.creator.pop-off-reel.v1` (the hook, 0–3.83 s) | one shot, 3.8 s, no cut; the title at 1.0 s; motion 1.9–3.3 per s (calm) | **picture first, words at about 1 s**; ONE subject, big, on a calm stage; things come **out** of a phone/photo and go back home; the phone as the stage | her, the city, Edits/Instagram UI, the condensed white title face, the captions, the flash |
| `inspo.creator.pop-off-reel.v1` (whole reel) | 15 shots, mean 2.15 s; 42% flat ground; grain 0.38 (phone camera) | shots of about 2 s; a calm, flat ground under busy content | jump cuts, tutorial structure, the grain |
| Pop out v2 (`renders/pop-out-v2/…_v2.mp4`, our own) | one shot; motion 8–9 per s in bars 5–8 (busy); end title about 1 s; fastest move 145 px/frame at 30 fps, **echoing** (4 samples, 24 px gaps: `reviews/pop-out-v2/2026-10-15/round-1/strip-zoom.jpg`) | one continuous line of thought; matched geometry into the real app; designed sound on the beat map; the loop | 30 fps; too few blur samples; no overshoot anywhere (stiff); four things a bar; a 1 s end title; small app |
| Pop out v1 (our own) | motion up to 10 per s in the burst; a 2 s static end card | pieces popping out of her photos; the real scan grid | the flash; bouncy springs on everything; the burst |

**Do we need another reference?** The founder could add one of these kinds (we won't invent one):
a **calm product film with long camera glides into a phone** (an Apple-style feature film), for the
camera language; and a **fashion title card** that holds a two-line sentence for 2–3 s, for the type.

## Palette (hex)

The brand ramp (brand book) around the app; the app keeps its own colours inside the phone; colour
otherwise comes only from her photos and clothes. No accent colour, no gradients.

| Role | Name | Hex |
|---|---|---|
| Key phrase in a line; the wordmark | Primary Black | `#181818` |
| The rest of a line; "On the App Store" | Winter Gray | `#656565` |
| Hairlines, secondary text (if ever) | Fashion Gray | `#8B8B8B` |
| Photo placeholders while loading | Gainsboro | `#DDDDDD` |
| **The ground** (every frame outside the phone) | Angora White | `#F6F6F6` |
| Cards, highlights | Primary White | `#FFFFFF` |
| Inside the phone only | the app's screen ground (build 262) | `#F4F4F4` |
| Phone body | near-black | `#111214` |

## Type

- **Geist only.** Lines in Medium (500), "On the App Store" in Regular (400). Never bold.
- **The signature device:** the key phrase in Primary Black, the rest in Winter Gray
  ("Your closet is already in your **camera roll.**", "Curate **pulls it out.**").
- Size on 9:16: lines 7.4u (80 px; u = 1% of the short side), the wordmark 11u, the CTA 5.2u.
  Vertical keeps these sizes; 4:5 and 1:1 drop the second line before shrinking type.
- At most 8 words a line-set, at most 2 lines. Left-aligned at the safe side margin (6%), never in
  the bottom 20% or the right 15% (TikTok/Reels UI).
- **Hold to read:** a line stays fully landed for `readHold(text)` = 0.6 s + 0.24 s a word, never
  under 1.2 s (`motion/springs.ts`). Line 1: 2.78 s held (needs 2.52). Line 2: 1.84 s (needs 1.56).
  The CTA: 2.29 s (the brief: at least 2 s).

## Shot lengths and rhythm

- 5 shots in 15 s, 1.85–4.15 s each (the reference's mean is 2.15 s; v2 changed something every
  0.46 s). Inside a shot, one state change at a time, each on a beat.
- **State changes on beats; big moments on downbeats; whooshes on the bar-end hits** (the clap at
  x.625: 1.625, 3.471, 5.317 … s, from the measured beat map).
- One focal point per beat. When the phone forms, the rest of the roll leaves.

## Transitions

- **No cuts and no scene crossfades.** Shots join by the camera's glide and by matched geometry:
  the tile IS the app's photo card (measured on the footage: x 345–976, y 629–1479 app px, −2.5°).
- Real-to-real: inside the phone, one recording rises over the other as a panel (a push, not a
  dissolve); the flats the app lifted are the first tile of the review grid.
- The only opacity moves: the roll's tiles arriving and leaving (exponential), words arriving, and
  the 4-frame handover from the drawn tile to the identical real card (hidden by identical pixels).

## Camera

- ONE virtual camera (world centre + zoom, zoom in log space), the `camera` preset: critically
  damped, 99% in 1.7 s. It glides back, glides in, pushes in to make a real number readable.
- Never shakes, orbits, whips or rolls. No handheld noise.
- Words are pinned to the screen, never to the camera.

## Motion with mass (`motion/springs.ts`, closed-form, stacked)

| Class | Here | ζ | Response | Overshoot | Settled (99%) |
|---|---|---|---|---|---|
| `ui` | the mark, the CTA | 0.75 | 0.32 s | 2.8% | 0.34 s |
| `panel` | the phone forming, the screen push, the phone out, the loop back | 1.00 | 0.40 s | 0% | 0.42 s |
| `camera` | every glide and push | 1.00 | 1.60 s | 0% | 1.69 s |
| `headline` | the two lines, "Curate" | 0.88 | 0.22 s | 0.3% | 0.17 s |
| `mascot` | Zee only | 0.42 | 0.42 s | 23% | 0.74 s |
| `piece` | the denim jacket | 0.82 | 0.50 s | 1.1% | 0.48 s |

Bouncy easing stays banned everywhere except Zee. Opacity, blur and colour use exponential easing.
Values that retarget (the jacket out and home; the camera's four moves) are stacked springs, so
position AND velocity stay continuous: no restarts, no hitches.

## Motion blur (no echo)

- A 180° shutter (half a frame) at 60 fps.
- `SubframeBlur` follows the speed: `samplesFor(speed)` keeps neighbouring samples ≤ 3 px apart
  (1 sample when still; up to 16 on the fastest moves: raised from 12 at G3), from the analytic velocity of the camera
  and the moving objects. `DirectionalBlur` along the analytic velocity covers the gap: on the
  sheet rising in the phone, the phone's exit, the lockup's exit and her photo's return (G3).
- The strip test (`tools/critic`) must say **clean**: no copies in the 12 frames of the fastest move.
- Photos are drawn with `StableImg` (decoded once at full size), so frames are identical whatever
  was rendered before (the determinism check).

## Texture

No grain, no vignette, no glow. Shadows only the app's soft Mist float (`0 30 80 rgba(16,20,24,.16)`
on the phone; a small contact shadow under a lifted piece).

## Sound (G5)

Music −14 LUFS integrated, true peak ≤ −1 dBTP. Designed sound from `motion/sound` on the same
clock: a soft kick on every beat; a pop when the jacket lifts and when the app lifts the flats; a
dry "land" under each line; a low "glide" under each camera move; a swish for the screen push; a
riser into 41 and a soft impact on it; a chime on the CTA; Zee's pop. Judged blindfolded first
(`audio.wav` + `waveform.png`).

## Banned defaults

Particle bursts · glows · lens flares · camera shake · RGB split · white flashes · generic
gradients · scene crossfades · bouncy easing (except Zee) · Remotion's default `spring()` config ·
letter-by-letter typing · emoji · stock sounds · more than one moving focal point · a line held
less than `readHold` · real footage under about 70% of the frame width when it is the subject ·
drawn or edited app screens · any number the app didn't show · prices, shopping, store names ·
Math.random, Date, timers (frames come from time alone).

## The loop

The last frame matches the first: her ferry photo returns from below as the lockup lifts away
(14.30–15.00 s), on the track's break. Checked by `tools/critic` (seam vs a normal frame step).
