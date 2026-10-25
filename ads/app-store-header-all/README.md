# app-store-header-all: the App Store header, the one film

**What:** the App Store takes ONE header video (21:9, 3840 × 1646, 5–30 s, muted, looping) and one
search card (3:2, 2880 × 1920), so the directions become one 30 s loop in the subtle palette:

| s | beat | from |
|---|---|---|
| 0–6.3 | **A** her photos give up the coat, jacket and scarf (blush, dusty blue, oat); they gather beside her real Wardrobe (build 284). The whole idea lands inside 5 s. | `ads/app-store-header` (A2 tonal's picture, a faster cut: `RollScene` with `timeline.ts › A`) |
| 6.3–13 | **B** the black tee flies onto her walk-to-work photo; Studio's real try-on; the phone with Studio | `ads/app-store-header-tryon` (B3, look "tonal"), imported, from its 0.4 s |
| 13–24.3 | **C** a week of looks on tonal cards, the camera gliding a card a step, then the whole week | `ads/app-store-header-week` (C2, variant "c2", tone "subtle"), imported, from its 0 s |
| 24.3–27.8 | **the lockup** the mark with "Curate" to its right (the brand book), "Try it. Style it. *Wear it.*" (the app's own line) on Angora White | here |
| 27.8–30 | back to frame 0: her three photos arrive on the glide and land exactly on the first frame | A at rest |

**One film, not clips:** every beat arrives on the same camera: a slow glide to the right on the
`camera` spring (critically damped, the spring C's rail glides on), 0.9 H, through a soft warm column of
light that carries the next set's colour in. The glides fall where B and C hold still, so their own
motion blur and this film's never nest.

**How B and C are reused:** imported whole (`AppStoreHeaderTryOn`, `AppStoreHeaderWeek`) and placed in
time by a pure map: a `Freeze` at the frame the map gives (`bAt`, `cAt` in `index.tsx`). Nothing in
their folders is edited. Two consequences:
- **Their changes flow in.** A change in B or C changes this film: re-render after either moves.
- **C's own lockup is covered** (the serif splash lockup under its week, header only, from C's 10.3 s):
  C needs until its ≈10.9 s to settle the week, so a feathered patch of C itself at 13.06 s (its lockup
  gone, the row not yet moving) sits over that spot (`weekLockupMask`, mirroring C's `rowBox` and
  `Lockup` geometry). Invisible at 4× contrast at 100%. If C moves its lockup, move the patch.

**Status:** draft, G2 (on the header review page as the first item, pick key `header2`, value `ALL`).

**Render (on the Mac, the founder's rule from 2026-10-24: no Lambda):**
```bash
CURATE_GL=angle tools/stills app-store-header-all --format store-header --length 30 --frames 0,270,540,960,1430,1560 --props '{}' --out ads/app-store-header-all/out/g2/one
CURATE_GL=angle tools/render app-store-header-all --format store-header --length 30 --concurrency 1 --props '{}' --name one
CURATE_GL=angle tools/render app-store-header-all --format store-search --length 30 --concurrency 1 --props '{}' --name one
```
(`--concurrency 1` and ANGLE: B's KeyLine words are GPU layers, and Chrome drops layers on these frames at
higher concurrency.)

**Length:** 30 s (the schema's lengths are 6/8/15/30/…; 30 is the App Store header's maximum).
