# App Store header D "Colour story": style guide (PROPOSED)

## Palette: quiet (the hand-in)
Six tonal rooms pushed toward Mist. Wall (the edges), spot (the light on the wall), floor (the sweep),
shadow (rgb). Words are always ink on these.

| Room | Wall | Spot | Floor | Shadow | Hero |
|---|---|---|---|---|---|
| Oat | #E8E2D7 | #F8F5EF | #DCD4C6 | 92,80,62 | cable-knit sweater (cream) |
| Sand | #E3D6C5 | #F5EEE4 | #D6C6B1 | 96,72,46 | wool coat (camel) |
| Blush | #EADCD7 | #F8F0ED | #DECBC4 | 100,70,64 | slip dress (champagne) |
| Sage | #DCE2D6 | #F0F3EC | #CDD6C7 | 60,74,56 | flannel shirt (green and navy) |
| Dusty blue | #D8DFE7 | #EEF2F6 | #CAD3DD | 52,64,82 | denim jacket |
| Stone | #DDDBD7 | #F1F0ED | #D0CDC8 | 56,54,50 | blazer (black) |

The finale stands on the Mist stage (#FAFAFA → #E8E8E7, a soft overhead light), the phone is Silver.

## Palette: bold (the kept versions)
Cream #E3CFB1/#FBF3E4, Camel #B4723C/#E9B37E, Sage #7D9C77/#C4DABB, Denim #2F5C9C/#7DA6DE, Navy
#18244A/#46609F, Black #141415/#55555B (wall/spot), white words in the three dark rooms.

## Type
Geist Medium. Hook "Your wardrobe, *in every colour.*" 0.068 H in the left column (two-tone: the key
phrase #181818, the rest #656565). Room names 0.068 H #181818 under a 0.019 H count ("02 / 06", #8A8A86,
caps tracking 0.16 em). Proof "Every colour you own, *in one place.*" 0.056 H. Words rise out of masks on
`headline`.

## Layout
One hero right of centre (x +0.15 H rooms, +0.2 H row), standing on the floor at +0.31 H; the words in
the left column (x −0.66 H); air everywhere else. Finale: the palette or row from −0.63 H, the phone at
+0.44 H (0.84 H tall).

## Motion
- The dolly (d1): ζ 1, response 0.85 s (lands in ≈0.8 s), a move every 1.6 s, the next room's light a soft
  band travelling with it; hero depth 1.06 (parallax).
- The arrivals and steps aside (d2): ζ 0.95, response 0.8 s; the ground cross-fades 0.7 s.
- Shrink, tiles, chips, the way back: `expoInOut` on fixed windows (the loop lands exactly); tiles fly on
  `piece`, leave on `panel`.
- Idle: 0.6% H breath, period 7.5 s.

## Shadows and blur
Soft real shadows: a contact shadow under each hero, its drop shadow in the room's shadow colour, and a
long soft cast shadow across the floor (light from the upper left). No blur on pieces at rest;
`SubframeBlur` (shutter 0.35) only on the dolly, the arrivals, the shrink and the flights.

## Finish
Grain 0.022, Vignette 0.08 (quiet), 0.2 / 0.12 (bold).

## Banned here
Saturated colour in the hand-in, more than one hero on stage at once (quiet), rack focus, a seam or bleed
between rooms at rest, bouncy easing, words on the phone.
