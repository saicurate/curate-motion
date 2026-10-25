# app-store-header-colour: direction D "Colour story" of the iOS 27 App Store header

**What:** her wardrobe by colour, for the App Store product-page header (21:9, 3840 × 1646) and the search
card (3:2, 2880 × 1920). 15 s muted loops at 60 fps. Four films (prop `film`):

| film | what | phone |
|---|---|---|
| `d1` (hand-in) | Tonal rooms: a dolly through six quiet rooms, one hero each, then a palette of six tiles beside her real Wardrobe | Silver |
| `d2` (hand-in) | Tonal row: one hero at a time on a tonal sweep, each stepping aside into a row, then six colour chips beside her real Wardrobe | Silver |
| `d1-bold` (kept) | Colour rooms: the first, rich cut, three pieces a room | Deep Blue |
| `d2-bold` (kept) | Colour wheel: a carousel in coloured light, then six colour strips | Cosmic Orange |

Why quiet: the founder, 2026-10-24, on the colourful cut: "feeling cheap… the colours please subtle colours".

**How it's built:** `index.tsx` (pure function of t; layout in H units around the centre so one scene fills
both crops), `timeline.ts` (ROOMS, ROW, WHEEL), `shots.ts`, brief.md, style_guide.md, shotlist.md. The
garments are v2 cut-outs at full resolution (BiRefNet via `tools/cutout-person` on the originals). The
phone is Apple's bezel straight on with `screenshot.emma.b284-wardrobe-rails.v1` (build 284).

**Render:** `tools/render-lambda app-store-header-colour --format store-header --length 15 --props '{"film":"d1"}' --name d1`
(about 90 s and $0.30 a film), stills with `--stills <frames>`. Stills for review: `out/g2/colour-d1/`,
`colour-d1-search/`, `colour-d2/`, `colour-d2-search/` (and the `-bold` ones).

**Reusable:** `World` (rooms with a travelling light band, no seam at rest), `RoomTile` (a whole frame
scaled and clipped into a tile), the soft cast shadow in `Garment`.
