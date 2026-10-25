# App Store header C: style guide (proposed)

From the founder's notes on this set (2026-10-24: "really good quality", "more colorful", then on the
colourful versions "feeling cheap… subtle colours") and the quality bar he named: Essembl's App Store set
(`inspo.competitor.essembl-redesign.v1`, grammar only: warm pale grounds, colour from the clothes,
garments as real objects with soft shadows, generous air).

## Palette (palette.ts, tokens only)

| Day | Subtle paper / deep (handed in) | Bold paper (kept version) | From the look |
|---|---|---|---|
| Mon | #DEE4EA / #C9D2DC dusty blue | #4D6CBF cobalt | the oxford shirt |
| Tue | #ECE5D8 / #DCD1BF sand | #B85E40 terracotta | the trench |
| Wed | #E8E1D9 / #D6CDC3 warm stone | #A84556 berry | knit and satin |
| Thu | #EEEADF / #DDD6C6 oat | #C99A34 ochre | the tan bag, the stripe |
| Fri | #EFE3DE / #E0CDC5 soft blush | #7D5FA0 plum | the champagne slip |
| Sat | #E2E8E0 / #CDD7CB pale sage | #3F8B70 jade | against grey and denim |
| Sun | #ECE1DA / #DCCDC3 soft clay | #C98F87 rose clay | oatmeal, the sandals |

House: Primary Black #181818 (key words, the day), Winter Gray #656565 (the rest), Mist #F6F6F6 sweep
for the close. Subtle type is always the house tones; bold type is a light tint of its paper.

## Type
Geist Medium only. The day 0.17 H (subtle; bold 0.2 H) tracked −0.045 em; the occasion 0.3 × the day in
Winter Gray; the line "A look for *every day.*" 0.07 H, two-tone, words rising out of masks on the
`headline` spring. Cards: the day 0.145 × the card's height, no occasion.

## Layout
Units of H around the centre; inside ±0.72 H for the 3:2 crop. C1: day name from −0.68 H, the look's
centre at +0.2 H (0.66 H tall, subtle). C2: the hero card 0.78 H tall at −0.34 H; neighbours one pitch
(card + 0.16 H) apart, 20% smaller and 38% fainter. The week row: seven cards across 92% of the width.

## Light and finish
Per set: a 158° paper gradient (lighter top left), a top-left key light, the deep tone's fall-off at the
far edge, a window-light diagonal (drifts on sin(2πt/15): loops exactly), a seeded paper tooth (one
512 px tile, soft-light). Pieces: two shadows down-right (contact 0.2, soft 0.15 in subtle), lengthening
while a piece is lifted; a 1 px erode removes the white rim the cut-outs were cut off. Grain 0.03,
vignette 0.05.

## Motion
camera for the glides, the week forming and the zoom back (normalised so it lands exactly at 15 s);
piece for landing; headline for words; ui for the lockup; panel for C2's rail returning. Sub-frame
blur samples follow the analytic speed (samplesFor, shutter 0.35, ≤ 3 px apart): no echo.

## Banned
Saturated colour blocks (subtle); prices, brands, shop words; drawing a cut-out above its native size;
hard cuts; Remotion's default spring; bouncy easing.
