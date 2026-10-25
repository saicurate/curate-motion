# App Store header, film B "See it on you": style guide (PROPOSED)

**Palette** (motion/theme `C`, colour only from content):
- stage: a sweep from #F8F9F9 (wall) through #F5F6F6 / #EEF0F0 to #E5E7E8 (floor), a soft white key at
  26% / 16% of the frame, a faint warm falloff (rgba 28,24,20 at 6%) at the edges
- ink #181818 for the key phrase, #656565 for the rest (KeyLine); shadows rgba(20,18,16) only
- the light edge: rgba(255,252,247) in screen blend, never pure white bloom

**Type:** Geist Medium (500), −0.035 em, line height 1.02–1.04, KeyLine word rise (stagger 0.07 s).
Header: "See it *on you.*" 0.118 H, "Before you *wear it.*" 0.092 H, both at x = −0.76 H, y ≥ −0.03 H (clear of the App Store's back button, which sits over the header's top left: x −1.08…−0.88 H, y −0.18…0.02 H). Search card:
0.088 H / 0.064 H at x = −0.66 H. Never more than two lines; never over the picture.

**Layout** (units of H around the centre; one table per format in index.tsx, re-laid out, never cropped):
- header: print 0.82 H tall at x 0.20 → 0.11 for the proof; tee 0.38 H at x 0.85; phone 0.84 H at x 0.65
- search: print 0.72 H at x 0.08 → 0.04; tee 0.27 H at x 0.54; phone 0.72 H at x 0.43
- everything keeps ≥ 0.08 H from the frame's edges (the search card is shown with round corners)

**Camera:** one push into the photo (`camera` spring, 0 → 1 at the tee's flight, 0.55 for the proof, 0 by
the loop): the print grows 2.5%, the plate behind her 3%, she 7.8%, so the street moves behind her; a slow
lateral breath (one sine over the 15 s) on the two layers. Nothing else moves the frame.

**Motion classes:** the tee: `ui` for its small gather, a critically damped spring (ζ 0.94, 0.52 s) for
the flight, an arc of 0.07 H, `piece` for its lift-off at the end; the print and the phone: `panel`;
words: KeyLine; the sweep and every opacity: exponential (expoInOut / expoOut). Hover and drift are
whole sine cycles of the 15 s loop (periods 5 s and 7.5 s), so the seam is invisible.

**Blur:** SubframeBlur (shutter 0.35: subtle, the founder 2026-10-24) only on the fast moves: the flight, the slide, the phone, the
return; 10 samples at the header's size, 1 elsewhere. The stage, grain and vignette are inside every
sample (opaque samples average exactly).

**Sharpness:** her photos are never blurred (no rack focus); depth comes from scale, the parallax and dimming. Stills are rendered at full size (3840 × 1646, 2880 × 1920) as PNG.

**Finish:** print radius 0.024 h, a 1 px inner highlight, a 118° sheen at 8.5%, two shadows
(0.4/0.8/2% and 3/6/13% of h); contact shadows under the print and the resting tee; grain 0.025;
vignette 0.12.

**The loop:** frame 899 = frame 0: the line up, the print at rest, the tee at its rest pose (every
periodic term at phase 0).

**Banned defaults:** bouncy easing, Remotion's default spring, a pure white flash, a 3D iPhone, flat
cut-outs on an unlit grey box (ob172's look), words over her photo.

## B2 (look: "colour")

The same film, timeline and layout on a colour-blocked cyclorama (the founder: "a bit more colorful";
for this App Store header only, Geist and the brand marks kept):
- before the try-on: cobalt wall #3A549E → #2A4385 over a powder-blue floor #AFBCDB → #97A5C7 (tonal;
  never blue over yellow, which reads as a flag)
- once she's wearing the black tee: rust wall #BB5A36 → #A0452A over a blush floor #E3BBA2 → #CC9F86
- the new colour comes down the whole set with the print's light edge (a soft 0.05 H mask edge and a
  warm glow line); the wall meets the floor 82% down, so the white words stay on the deep wall
- words white (#FFFFFF key, 72% white rest); shadows take the set's own dark (rgb 14,20,46 / 52,20,10):
  the print casts a soft shadow on the wall to its right (key light from the upper left), contact
  shadows on the floor, the phone's drop shadow tinted; grain 0.03, vignette 0.18

## B3 (look: "tonal")

The same film and timeline on a subtle tonal set (the founder on the colourful set: "feeling cheap… subtle
colours"), Essembl-level restraint (inspo.competitor.essembl-redesign.v1: one quiet ground, colour from the
clothes):
- before the try-on: pale dusty blue, wall #EDF1F5 → #DCE3EB over #D3DBE5 → #C5CFDB
- once she's wearing the black tee: soft blush oat, wall #F5EEE8 → #EBDDD2 over #E3D2C5 → #D6C1B2
- the new tone comes down the set with the light edge (glow 0.4), the seam 80% down; ink words as B1
- softer, wider shadows (the print on the wall: 16% of the set's dark, blur 0.055 H); grain 0.03,
  vignette 0.09 warm
- more air: print 0.72 H (search 0.64), tee 0.32 H, phone 0.76 H; words 0.112 / 0.088 H
- no drawn texture: a drawn linen weave read as a screen-door grid at full size (round 1)
