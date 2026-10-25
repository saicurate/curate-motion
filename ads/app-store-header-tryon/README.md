# app-store-header-tryon: the App Store header, film B "See it on you"

**What:** film B of the iOS 27 App Store header (21:9, 3840 × 1646) and search card (3:2, 2880 × 1920),
a 15 s muted seamless loop: the black tee flies onto her walk-to-work photo and Studio's real try-on runs
down over her; the phone rises with Studio showing that same try-on. v2 of `ads/app-store-header`'s
`tryon` film, made in parallel (2026-10-24); that folder keeps film A and the founder's review page.

**Status:** draft, G2 (stills for the review page in `out/g2/`: `tryon*` = B1, the Mist studio; `tryon-b2*` = B2, the colour-blocked set, `--props '{"look":"colour"}'`; `tryon-b3*` = B3, the subtle tonal set, `--props '{"look":"tonal"}'`). Not on App Store Connect.

| File | What |
|---|---|
| `brief.md` | the FILM sentence, the film, ASSETS, VISUAL, HARD LINE |
| `style_guide.md` | palette, type, layout in units of H, camera, motion classes, blur, finish, the loop |
| `shotlist.md` / `shots.ts` | HOOK → FLY → SWEEP → AFTER → PROOF → LOOP, with each still's moment |
| `timeline.ts` | the moments (s), pure data |
| `index.tsx` | `AppStoreHeaderTryOn`: Stage, PhotoLayers (her cut-out over the plate), Print, Tee, the film |

**Render** (WebGL-heavy 2D: use angle locally; full-size films on Lambda):
```bash
CURATE_GL=angle tools/stills app-store-header-tryon --times 0,1.2,2.0,2.75,4.3,8.0,12.75 --format store-header [--props '{"look":"colour"}']
CURATE_GL=angle tools/stills app-store-header-tryon --times 0,2.75,4.3,8.0 --format store-search [--props '{"look":"colour"}']
CURATE_GL=angle tools/render app-store-header-tryon --format store-header --length 15 --draft --concurrency 1 [--props '{"look":"colour"}' --name b2]
tools/render-lambda app-store-header-tryon --format store-header --length 15 [--props '{"look":"colour"}' --name b2]
tools/critic app-store-header-tryon --render <file.mp4> --samples 10 --shutter 0.35
python3 ads/app-store-header-tryon/review/product_page.py     # out/g2/<set>-product-page.png
```

**G2 stills (`out/g2/`, PNG, full size):** `tryon/` + `tryon-search/` (B1), `tryon-b2/` + `tryon-b2-search/`
(B2), `tryon-b3/` + `tryon-b3-search/` (B3), `tryon{,-b2,-b3}-product-page.png`. Moments (s): 0 poster/hook · 1.2 hook ·
2.0 the flight · 2.75 the sweep · 4.3 after · 8.0 proof (284 Studio) · 12.75 the loop (search: 0, 2.75,
4.3, 8.0). Earlier sets are kept in `out/archive-*`.

**New assets (draft):** `photo.emma.r30-walk-to-work-tryon-tee-black.v1` (Studio's try-on pasted into her
photo at its measured crop, so both versions share one frame), and the tools/photo3d layers of both
(`…-plate`, `…-cutout`, `…-depth`). The try-on is 900 × 1125, so the "after" is a little softer than her
photo at the header's full size.
