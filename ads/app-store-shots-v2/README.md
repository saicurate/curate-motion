# app-store-shots-v2: App Store screenshots, set S-V2 (editorial)

Six stills for iPhone 6.9" (1320 × 2868 PNG, no alpha): a bright magazine look with oversized two-tone
Geist headlines, Emma's real photos, her own garments as cut-outs and the real build-284 screens in
Apple's bezel. Brief, style guide and shot list beside this file. Status: draft (G2, for the founder).

```bash
tools/stills app-store-shots-v2 --frames 0 --format store-shot --length 6 --props '{"shot":1}' --out ads/app-store-shots-v2/out/r3/s1
```

Then flatten to RGB (App Store refuses alpha): the finals are `out/s1.png … out/s6.png`. Renders by round in
`out/r1`, `out/r2`, `out/r3` (kept); `out/s4.v1.png` is the first week grid (masonry, read Sun before Fri). Review evidence: `reviews/app-store-shots-v2/2026-10-24/`.

- **Reusable:** `Head` (kicker + two-tone headline), `Photo` (cover crop as a lit print), `Garment`, `Tag`, `Bubble`, `Check` in `index.tsx`.
- **Screens:** only build-284 captures exist for Wardrobe and Studio, so 1, 4, 5 and 6 are photo-led (no phone). Add a phone to 1 (Today) and 5 (Chat) once build-284 captures of those screens are in the library.
- **Disclosures:** the Apple trademark line; Emma and her photos are AI-generated.
