# App Store header: style guide (PROPOSED, G2)

Pending the founder at G2. Grammar from Pop out v3's style guide (our own reference, ads/pop-out-v3)
and from Apple's own product-page headers (calm stage, one subject, long camera glides). We take the
grammar, never anyone's subjects or copy. **Wanted reference** (founder, if he has one): a premium
App Store header or product film he loves, for the camera and the pacing.

## Palette

| Role | Hex |
|---|---|
| Key phrase, wordmark | Primary Black `#181818` |
| Rest of the line | Winter Gray `#656565` |
| The stage (a sweep, top → floor) | `#FAFAFA` → `#F6F6F6` (Angora White) → `#F0F0EF` → `#E8E8E7` |
| Light | a white radial pool at 50% / 30%, the corners falling 7% darker |
| Inside the phone | the app's own screen (real captures) |

Colour only from her photos and clothes and the real app. No accent colour.

**A2 (`roll-tonal`):** the same stage tinted by one quiet tone at a time, each taken from the hero
photo's own palette and pushed close to Mist (Essembl-level restraint, `inspo.competitor.essembl-redesign.v1`):
Mist `#F4F3F0` → blush stone `#ECDFD7` (the coat, DUMBO's brick) → dusty blue `#DDE5EC` (the jacket, the
ferry's sky) → oat `#EFE5D3` (the scarf, the park) → sand `#F3EDE3` (under the phone) → Mist at the seam,
0.7 s expo crossfades. One hero at a time: the other prints dim 20%. Never saturated fields: the colour-block
cut (`roll-colour`, blue `#4F7FC9` / brick `#9C4A36` / orange `#C2702A`) read cheap and is superseded.

## Type

Geist Medium, the two-tone KeyLine (`motion/KeyLine`): words rise out of masks on the `headline` spring
(lands hard), held ≥ readHold(text). Sizes in H (the frame's height): lines 6.6–7.5% H (≈ 11–12.5 pt in
the 168 pt header on a phone; the 3:2 card is taller, so the same H reads bigger), at most 2 lines and
≈ 4 words a line. Left-aligned beside the subject, never over a photo, never on the phone.

## Layout

One scene in units of H around the centre (cx, cy). The 3:2 card shows ±0.75 H, the header ±1.17 H:
everything that carries the story sits inside ±0.72 H; the header's extra width only shows more stage
(and the outer prints in A). The phone: Apple's bezel, 0.86 H tall (≥ 200 px at every size), at
+0.40–0.42 H, straight on.

## Shot lengths and rhythm

15 s, 3–4 states, one change at a time: HOOK (0–1.7 s, one subject, words at 0.9 s) → REVEAL (the real
interaction, ≥ 2.5 s) → PROOF (the real screen, ≥ 4 s held) → back to frame 0 (a loop, ≥ 2 s).

## Transitions

No cuts. Prints leave by sliding out with an exponential fade; the phone fades (Apple: fades only);
the try-on is a wipe under a soft light edge (the real before and after, registered to the pixel:
crop 64, 116, 1664 × 2080 of her photo).

## Camera

One virtual camera: a push of 3–3.5% on the `camera` preset (critically damped, 1.7 s) at the hook,
eased back before the loop. Never shakes, orbits or whips. Words and the phone are not on the camera.

## Motion classes

`piece` for garments (lift, gather, return), `panel` for the photo sliding for the phone, `camera`
for the push and the photo centring, `headline` for words, exponential for opacity, blur and dimming.
Zee plays his own clips (30 fps, sampled by time), no springs on him.

## Blur and depth

No photo blur (the founder, 2026-10-24: "why is it so blurry?"): when the pieces lift, the photos only dim
(A1 32%, A2 12% + 20% off-hero) and step back 3.5% in scale. Sub-frame motion blur (`SubframeBlur`, 0.35
shutter, 8 samples at 3840 × 1646) on the fast windows only (the gather and the return).

## Finish

`Grain` 0.03 and `Vignette` 0.14 over the stage and the photos, under the bezel. Prints: ambient
`0 0.6% 1.8%` + key `0 5% 11%` shadows. Cut-outs: drop shadow growing with lift + a `ContactShadow`
once they rest in a row.

## Banned defaults

Flat cut-outs on a flat grey; bouncy easing outside Zee; text on photos or on the phone; drawn or
invented screens; the old look (build 262 footage); a hard cut at the loop point.
