# Hook A: style guide

- **Palette:** the photos' own colour, graded with `EDITORIAL` (warm-neutral: S-curve 0.22, warmth 0.30, highlight shoulder 0.55, fade 0.018) in the DepthPhoto shader, the same on every layer of a photo. Around the app: Angora White `#F6F6F6`. Type: key phrase Primary Black `#181818`, body Winter Gray `#656565`; on the night street the word is Primary White `#FFFFFF`.
- **Type:** Geist Medium (500), −0.04 em, KeyLine (words rise out of masks on the `headline` spring, 0.06–0.2 s apart). The POV line 88 px, the verdict 168 px, SLAY. 262 px, the phone line 62 px.
- **Depth staging:** wall → words → Zee → her (couch); street → SLAY. → her → Zee (night). Words sit on a plane between the wall and her (`rigCss.plane(Z)`), so her hair overlaps their first letters and the camera moves them less than her.
- **Camera:** `camera` springs only (1.6 s glides); one reverse dolly-zoom (expo in-out, 0.95 s) that lands ON the drop, then a dead stop with a 70 ms damped shake. No whip pans, no punch-zooms.
- **Zee:** `mascot` spring (the only bounce), squash/stretch from its velocity; graded into the room (sepia .16, brightness .86, a 0.3 px soften); `LightWrap` from the lamp side (warm 255,204,146) on the couch, from the street lights at night; a `ContactShadow` on the pavement.
- **Transitions:** fades only (exponential, 0.36 s): Apple allows fades on its devices.
- **Finish:** `Vignette` (0.30 couch, 0.36 night), `Grain` (seeded, every 2 frames, 0.055–0.06) on photo shots only, never over the bezel.
- **Banned:** bouncy easing on anything but Zee, `Easing.bezier`, stickers on top of photos, type on the phone.
