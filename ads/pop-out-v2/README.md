# pop-out-v2: Pop out, as one continuous transformation

**What:** v1's message ("Your closet is already in your photos" → her real pieces come out of her
real photos → the real scan → her Wardrobe → Curate on the App Store), remade under the founder's
one-thread motion brief (`prompt.motion-brief.one-thread-showreel.v1`) so it can be compared with
v1 (`ads/pop-out`, untouched). **A test, not the house style:** nothing here is in RULES.md or
AGENTS.md until the founder decides.

**Status:** draft. **Composition:** `pop-out-v2--9x16--15s` (9:16, 15 s, 30 fps; the brief's one
format). **Track:** `music.mixkit.cat-walk-arulo.v1` from 29.545 s, gain 0.66, plus the designed sound
`sfx.curate.pop-out-v2-sound.v1` at 0.6. Mix: −14.0 LUFS integrated, −1.9 dBTP.

## The philosophy, as built

1. **Never cut, never fade; everything transforms.** One line of thought, each shot made out of the
   one before:
   - her photo → a camel outline draws round her denim jacket → the jacket pops out;
   - the next photo floods out of the next piece's own shape (a coat-shaped, then a leggings-shaped
     window) → the coat, the leggings, the sports bra pop out;
   - the words collapse into one line; the leggings' outline morphs into the scan's photo grid (its
     gutters, measured on the real footage);
   - the line wraps the card and thickens into the phone (the phone forms from a line);
   - her photo, cut by the grid, flips tile by tile into the **real scan** behind it (matched
     geometry: the drawn gutters are the footage's);
   - the scan's fourth column folds under, its tiles lift, flip and resize into the **real
     Wardrobe's** tiles (each tile's front is the scan frame, its back the Wardrobe frame);
   - her pieces rise out of the Wardrobe (their places in the grid go empty) while the camera orbits;
   - the denim jacket, last out, fills with denim and collapses into Curate's 4-point star; the phone
     closes to a line; the mark draws around the star (redrawn as vector from
     `brand.curate.splash-mark.v1` by `trace_shapes.py`);
   - the end title; then the camera goes through the star, whose shape opens into the first
     frame's card. **The last frame is the first frame** (source frames 0 and 449 are pixel-identical).
2. **One typeface** (Geist Medium). **Three colours + black and white**, from her wardrobe:
   denim `#4A6A8F`, camel `#B8875A`, sage `#9DAA8C` (`palette.ts`, not in `motion/theme.ts`; each
   piece is outlined in a *different* palette colour, since its own colour vanishes on it). The app
   keeps its real colours inside the phone. No gradients, shadows, glows or flashes anywhere.
3. **One camera:** locked, straight-on; it dollies forward a small step on every beat (about the
   frame's centre) and orbits forward in bar 7. It never pans, shakes or pulls back.
4. **Easing:** exponential and a critically damped spring (`shapes.ts › crit`) only. Nothing overshoots.
5. **Motion blur:** sub-frame accumulation (`SubframeBlur`: 4 samples over half a frame, each a
   `<Freeze>` of the whole scene, averaged) plus `SpeedBlur`, a directional Gaussian sized by each
   moving element's velocity.
6. **Sound:** `sound.ts` (a small Node DSP script: oscillators, seeded noise, moving biquads) writes the
   WAV from the same beat map the picture uses (`timeline.ts`): a soft kick on every beat (softer in the
   track's break), a riser from beat 20 into beat 24, and a hit, whoosh, tick or patter on every
   transformation. No stock or paid sounds.

## Beat map (Cat Walk: 130.00 BPM, the drop's kick at 29.545 s = frame 0)

15 s at 130 BPM is 32.5 beats: 8 bars and half a beat (the brief's "7½ bars" was written for 120).
One beat = 13.85 frames.

| Bar | Beats | Technique | On the beats |
|---|---|---|---|
| 1 | 0–3 | Hook | 0 outline draws, 0.5 jacket pops · 1 r12 floods out of the coat's shape, 1.5 coat pops · 2 r29 floods out of the leggings, 2.5 they pop · 3 bra outline, 3.5 it pops |
| 2 | 4–7 | Kinetic type | 4 "Your closet" · 5 "is already in" · 6 "your" · 7 "photos." (denim) |
| 3 | 8–11 | Shape morph | 8 the words collapse into a line, the camera dollies past the near pieces, the card rises · 9 the leggings' outline becomes the grid · 10 the line wraps the card, 10.5 it thickens into the phone · 11 the tiles flip into the real scan |
| 4 | 12–15 | UI moment | the real scan, time-remapped: 13 "Looking for you" lands, 14 Zee's magnifier, 15 her photos turn over |
| 5 | 16–19 | 2D → 3D | 16 the fourth column folds under, 16.5 the tiles lift · 17 they flip and resize into the Wardrobe · 18 they land · 19 the first scroll |
| 6 | 20–23 | UI moment | one real Wardrobe scroll on every beat (the app's own scroll bursts, the still stretches between them skipped); the riser builds |
| 7 | 24–27 | Strongest | the camera orbits forward; 24, 25, 26 a row of her pieces rises out of the screen each beat · 27 the denim jacket rises to the front |
| 8 | 28–32.5 | End title | 28 the jacket collapses into the star, the phone closes to a line · 28.5 the mark draws · 29 "Curate" · 29.5 "On the App Store" · 30 Zee · 31 the track breaks, the chime · 31.5 through the star → frame 0 |

## Checks (on `renders/pop-out-v2/tiktok/15s/pop-out-v2_tiktok_9x16_15s_v2.mp4`)

- **Loop:** source frames 0 and 449 (Remotion PNG stills) differ in 0 pixels; in the H.264 master
  the two differ only by compression (mean 0.64/255, PSNR 44 dB).
- **Holds:** in every 15-frame window, frame i+14 differs from frame i by at least 2.3/255 on average
  (the quietest window is the end title, f402–416). v1 has near-static windows (below 1.0) across its whole end card, f388–449, about 2 s.
- **Layers:** no outlier frames (a frame unlike both neighbours), no dark frames (rendered at
  `--concurrency 1`).
- **Loudness:** −14.0 LUFS, true peak −1.9 dBTP.

## Files

- `ad.json` (assets by id), `index.tsx` (the composition), `timeline.ts` (the beat map and the sound
  cues, shared), `shapes.ts` (easings, path maths, the traced shapes), `shapes.json` (generated),
  `trace_shapes.py` (garment contours and the mark, from their library files), `sound.ts` (the
  designed sound), `palette.ts`.
- Measured on the real footage (app px): the scan's gutters at `scan-roll` 1.25 s and 6.2 s, the
  Wardrobe's cells at `wardrobe-scroll-float` 3.2 s and the item boxes at 6.0 s; the still stretches
  of both clips are identical frame to frame, which is what lets the time remap jump between them.

**Render:** `tools/sync pull --ad pop-out-v2 && tools/render pop-out-v2 --format 9x16 --length 15 --concurrency 1`.
To change the sound: edit `timeline.ts › HITS`, run `node ads/pop-out-v2/sound.ts <out.wav>`, then
`tools/catalog replace sfx.curate.pop-out-v2-sound.v1 <out.wav>` and point `SFX` in `index.tsx` at the new id.

**Draws on:** `inspo.creator.pop-off-reel.v1` (pop-out-and-return) and `inspo.app.scan-real-probe.v1`
(the scan's real timing), via v1.

**Reusable if the founder adopts the rules:** `SubframeBlur`, `SpeedBlur`, `Clip` (time-remapped
footage) and the path helpers in `shapes.ts` belong in `motion/`.
