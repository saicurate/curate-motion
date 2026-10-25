# app-store-header: the iOS 27 App Store header and search card

**What:** direction A of the 15 s muted loops for the App Store's new product-page **header** (21:9,
3840 × 1646) and **search-results card** (3:2, 2880 × 1920), one composition per format with a `film`
prop: `roll` = **A1** (her photos give up what she's wearing → her real Wardrobe, on the Mist studio
white), `roll-tonal` = **A2** (the same film, one subtle tonal ground per hero: blush, dusty blue, oat,
sand, back to Mist at the seam). `roll-colour` (saturated colour fields) is **superseded** (the founder,
2026-10-24: "feeling cheap… subtle colours"), kept as a version (stills in `out/g2-old/superseded/`).
`tryon` moved to `ads/app-store-header-tryon/` (direction B, another agent); `zee` is parked. Both stay
in `index.tsx` for history.

**Status:** draft, **G2 in review** (the founder picks a direction). Redo of studies/ob172 (HTML mockups,
rejected 2026-10-24: "all are cheap quality"). The one review page for every direction (A, B, C, D):
`review-page/build.py` (scans `ads/app-store-header*/out/g2/`). Critic: A1 round 8, A2 round 10, both 8+.

| File | What |
|---|---|
| `brief.md` | the FILM sentence, specs, audience, ASSETS, VISUAL, HARD LINE |
| `style_guide.md` | palette, type, layout in units of H, camera, motion classes, blur, finish (PROPOSED) |
| `shotlist.md` / `shots.ts` | each film's HOOK → REVEAL → PROOF → LOOP, with the still moments |
| `timeline.ts` | the moments (s), pure data |
| `index.tsx` | `AppStoreHeader` (film: roll / tryon / zee): Stage, Print, Floating, the three films |
| `review-page/` | the founder's G2 page (stills, drafts, the product-page and search mocks, picks `header2`) |

**Render:**
```bash
# full size on Remotion Lambda (stills, then the film); locally: CURATE_GL=angle, --concurrency 1
tools/render-lambda app-store-header --format store-header --length 15 --stills 36,114,192,276,540,804 --props '{"film":"roll-tonal"}' --out ads/app-store-header/out/g2/roll-tonal
tools/render-lambda app-store-header --format store-search --length 15 --stills 114,540 --props '{"film":"roll-tonal"}' --out ads/app-store-header/out/g2/roll-tonal-search --no-deploy
tools/render-lambda app-store-header --format store-header --length 15 --props '{"film":"roll-tonal"}' --name roll-tonal --no-deploy
```

**Built from:** Emma's approved photos; sharp full-resolution cut-outs `garment.emma.coat-wool-camel.v3`,
`garment.emma.jacket-denim.v3`, `garment.emma.scarf-plaid-camel.v2` (BiRefNet on the 1792 × 2400
originals; the old 383 × 776 ones went soft at 4K); her real Wardrobe on build 284,
`screenshot.emma.b284-wardrobe-rails.v1` (captured from release/1.5.1-284 @8ef12d4a with the
new_look_probe on her data); Apple's bezel. The formats `store-header` / `store-search` are new in
`schemas/ad.ts`.

**Reusable:** `Print` (a lit photo print with an optional exact crop), `Floating` (a cut-out with a
lift-dependent shadow), the stage sweep, `zeeAt` (Zee's 30 fps clips sampled by time at any fps).
