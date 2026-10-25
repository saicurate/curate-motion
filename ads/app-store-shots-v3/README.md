# app-store-shots-v3: App Store screenshots, the Essembl theme (product-led)

Six stills, iPhone 6.9" (1320 × 2868 RGB PNG). The founder's pick from the reference board: Essembl's
theme, no editorial. See `brief.md` (why, hard lines, copy options).

**Look:** `stock.polyhaven.linen-cream-ground.v1` (Poly Haven CC0 Rough Linen, recoloured to warm cream,
soft key light); headlines Geist, ink `#1C1916` + deep warm tone `#6A5443`; Curate's generic 3D phone
(graphite, studio HDRI, its own floor shadow) tilted and running off the bottom, the real build-284 screen on
it; Emma's wardrobe cut-outs in front with soft contact shadows down-right.

| # | Headline | Screen | In front |
|---|---|---|---|
| 1 | Today's look, / already picked. | `screenshot.emma.b284-today-artfair.v1` | blazer, skirt, boots of that look |
| 2 | Your closet, / from your photos. | `screenshot.emma.b284-wardrobe-rails.v2` | coat, denim jacket, scarf; two of her photos behind |
| 3 | See it on you, / before you wear it. | `screenshot.emma.b284-studio-offduty-tryon.v2` | her try-on print ("On you"), the tee |
| 4 | Rain or shine, / you're dressed. | `screenshot.emma.b284-today-rain.v1` | the screen's facts as chips, trench, boots |
| 5 | Your stylist, / one message away. | `screenshot.emma.b284-chat-hello.v1` | the skirt, boots and cami her starters name |
| 6 | Your photos, / your call. | (no phone) | three of her photos, two chosen; the app's own three privacy lines |

**Palettes:** `palette` "cream" (the first S-V3) or "blue" (the founder, 2026-10-24: "can we make it to subtle
blue?"): `stock.polyhaven.linen-blue-ground.v1` (the same CC0 linen, ~#E6EDF5, cool light), ink `#171B21` +
slate-navy `#33475E`, cool-tinted shadows; garment colours untouched. Blue finals: `out/final-blue-w600/`,
`out/final-blue-w500/` (`s-v3-blue-1.png … 6`).

**Render (on the Mac, the founder's rule from 2026-10-24):**

```bash
CURATE_GL=angle tools/stills app-store-shots-v3 --frames 0 --format store-shot --length 6 --props '{"shot":1,"weight":600,"palette":"blue"}' --out ads/app-store-shots-v3/out/rN/s1
```

`weight` 500 (Medium) or 600 (SemiBold). Finals: `out/final-w500/` and `out/final-w600/`
(`s-v3-1.png … s-v3-6.png`). Rounds: `out/r1–r5`. Critic (by hand, stills): `reviews/app-store-shots-v3/`.

**New library assets (drafts):** the linen ground; build-284 captures `b284-today-artfair`,
`b284-today-rain`, `b284-chat-hello`, `b284-chat-artfair-look` (probe on her data, Draw Prize 17P sim,
9:41 status bar); `b284-wardrobe-rails.v2` and `b284-studio-offduty-tryon.v2` (v1 with the charging
battery replaced by the clean one; nothing else changed).


## Calm layouts (10-24, after "garments thrown is not fine")

`layout` prop: `scatter` (the original S-V3), or `o1` phone only · `o2` phone + tidy upright row · `o3` two straight phones,
staggered · `o4` phone + one upright hero · `o5` big phone cropped by the bottom · `o6` no phone, straight UI cards.
Garments in every calm layout stand upright, on one baseline, evenly spaced; screenshot 6 is the same phone-less
privacy card in all of them (`CalmS6`).

    CURATE_GL=angle tools/stills app-store-shots-v3 --frames 0 --format store-shot --length 6 \
      --props '{"shot":1,"weight":600,"palette":"blue","layout":"o2"}' --out out/tmp

Outputs: `out/options/o{1..6}-s{1..3}.png` (SemiBold, blue); full sets `out/final-o2-w600`, `final-o2-w500`,
`final-o5-w600`, `final-o5-w500` (`s-v3-o{2,5}-{1..6}.png`). Earlier: `final-blue-w*` (scatter, blue), `final-w*` (cream).
