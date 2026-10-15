# Curate brand: the rules every ad follows

The authority is the brand book, **`brand.curate.brand-guideline-2026.v1`**: a 24-page PDF in S3.
To get it, run `tools/sync pull --only brand.curate.brand-guideline-2026.v1`.
Its full text is in [`brand-guideline-2026.txt`](brand-guideline-2026.txt), next to this file. This page is the short version for people and agents.
Where this page and the PDF disagree, the PDF wins. Where the PDF and [`RULES.md`](../../RULES.md) disagree on what an ad may *say*, RULES.md wins (see "Voice" below).

## Colour: monochrome only

A strict 10-tone ramp. The book defines no accent colour.

| Name | Hex |
|---|---|
| Primary Black | `#181818` |
| Strong Grey | `#383838` |
| Winter Gray | `#656565` |
| Fashion Gray | `#8B8B8B` |
| Cute Grey | `#B3B3B3` |
| Gainsboro | `#DDDDDD` |
| Pale Silver | `#EBEBEB` |
| Angora White | `#F6F6F6` |
| Pale White | `#FCFBFC` |
| Primary White | `#FFFFFF` |

The app's "Mist" look (chat ground `#F6F7F7`) is a near-neighbour of Angora White. In ads, use the app's real colours when you show the app, and the ramp above for everything around it.

The only colour in an ad comes from the content itself: the clothes, Emma's photos, the places.

## Type: Geist, one family

- **Geist** is the only typeface, in five weights: Light, Regular, Medium, Semi-Bold, Bold. The font files are under `library/brand/fonts/`.
- **Signature device:** within one paragraph, the key phrases are in near-black (`#181818`) over Winter or Fashion Gray body text. Use it for on-screen lines.
- The app also ships a serif (Playfair Display) as an editorial wordmark. It is **not** in the brand book, so don't use it in ads unless the founder asks.

## Logo

- A circular mark with a 4-point star. The "Curate" wordmark sits to the right of the mark.
- Keep 1× clear space on every side.
- **Never recolour, stretch, rotate or add effects to the mark.** The book's incorrect-usage page forbids it.
- Files: `brand.curate.logo-*`.

## Voice

- **Clarity, confidence, simplicity.** Few words. Plain American English.
- **The book's taglines** are "Try it. Before you buy it.", "Try it. Before it arrives." and "Shop with certainty not guesswork."
  - **Don't use the buying and shopping lines right now.** Shop is hidden in the app (1.5.0), so ads say nothing about buying, prices or shopping (RULES.md).
  - Lines about wearing what you own fit today's app, such as the app's own "Try it. Style it. Wear it."
- Zee is the voice of warmth, a playful kitten stylist. The brand itself stays calm and minimal.

## In motion

- Calm ground, crisp type, one idea per beat.
- Pieces float on a clean background (the app's "pure float").
- The end card is always the logo on white or Angora White, with the App Store line and, optionally, Zee.
