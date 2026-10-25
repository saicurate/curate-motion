# app-store-header-week: App Store header, direction C "A week of looks"

**What:** the iOS 27 App Store product-page header (21:9, 3840 × 1646) and search card (3:2,
2880 × 1920): a 15 s muted loop. Monday to Sunday, a look from Emma's own wardrobe each day, each on
its own set; the close is the whole week as seven cards, "A look for every day." and the Curate lockup.
Made 2026-10-24 alongside `ads/app-store-header` (A, roll) and `ads/app-store-header-tryon` (B).

**Status:** draft, G2: stills for the founder's review page in `out/g2/`. Not on App Store Connect.

| Variant | Props | What |
|---|---|---|
| C1 flip | `{"variant":"c1","tone":"subtle"}` | each day the whole frame; the next set glides in |
| C2 rail | `{"variant":"c2","tone":"subtle"}` | the sets as cards on a rail; one hero at a time |
| (kept) | `"tone":"bold"` | the first, colourful pass (founder: "feeling cheap… subtle colours") |

| File | What |
|---|---|
| `brief.md`, `style_guide.md`, `shotlist.md` | the film, the look, the shots |
| `palette.ts` | the seven days: looks, names, both tones (all colour lives here) |
| `timeline.ts`, `shots.ts` | the moments (s) and each still's moment |
| `index.tsx` | `AppStoreHeaderWeek`: DaySet (a lit paper set with its flat-lay and name), Look, Line, Lockup, Flip, Rail |

**Reusable:** `DaySet` + `Look` (a flat-lay of any look on any paper, whole-frame or card layout,
morphing between them), `Defringe` (a 1 px erode that removes the white rim of cut-outs on colour),
`toothTile` (a seeded paper texture tile), `landsAtLoop` (a camera spring that lands exactly on the
loop point).

**Render:**
```bash
CURATE_GL=angle tools/stills app-store-header-week --times 0.6,3.9,12 --format store-header --props '{"variant":"c1","tone":"subtle"}'
tools/render-lambda app-store-header-week --format store-header --length 15 --props '{"variant":"c1","tone":"subtle"}' --name c1-subtle
```
Bold films (v1) and subtle films are in `renders/app-store-header-week/master/15s/`.
