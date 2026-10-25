# app-store-shots-v1: App Store screenshots, set S-V1 (v1 colour campaign, v2 quiet palette)

Six stills for iPhone 6.9" (1320 × 2868 PNG, RGB, no alpha), made on the founder's 7 principles (2026-10-24,
Scrnsht Studio): screen 1 = the value prop, one outcome per screenshot, readable without the words, a real
person, honest trust lines only, short oversized headlines. The colourful header's world (A2): lit fields
sampled from Emma's photos, her photos as prints, her wardrobe cut-outs with real shadows, the real build-284
screens in Apple's bezel (straight on, whole, nothing over it), Geist Medium. Status: draft (G2, for the founder).

| # | Headline | Picture |
|---|---|---|
| 1 | Always know *what to wear.* · "Today's look, from your own clothes." | her cut-out in Off-duty black, behind the build-284 Studio screen showing that look (brick) |
| 2 | Your closet, *from your photos.* · "Every item you wear, found in your photos." | three prints (ferry, DUMBO, park), the coat, scarf and jacket from them, the build-284 Wardrobe (blue) |
| 3 | See it *on you.* · "Try anything you own on your own photo." | walk-to-work before, the black tee, the try-on "On you" (orange) |
| 4 | A look for *every day.* | seven of her days, each on its own colour tile (cream) |
| 5 | *Ask* your stylist. | her question, the look from her wardrobe, her at dinner "Tonight", Zee small (wine) |
| 6 | Your photos, *your call.* | her mirror selfie, the app's own three shield lines word for word, the splash lockup (cream) |

```bash
tools/render-lambda app-store-shots-v1 --format store-shot --length 6 --stills 0 --props '{"shot":1}' --out ads/app-store-shots-v1/out/lambda/s1
tools/stills app-store-shots-v1 --frames 0 --format store-shot --length 6 --props '{"shot":1}' --out ads/app-store-shots-v1/out/r8/s1   # local
```

- Finals: `out/final-v1/s-v1-1.png … -6.png` (rendered on Lambda). Rounds kept in `out/r1 … r7`.
- The founder's page (both sets): `review-page/build.py` → https://claude.ai/artifact/UNeFuE3DW4EqzHPvAkXEvL (picks: `shots`).
- Critic: `reviews/app-store-shots-v1/2026-10-24/` (round 1 brand 6 → round 2 all 8+; smooth/sound n/a for stills).
- Colour: the founder asked for colour in the store set; the palette `P` lives in `index.tsx`, the app stays mono.
- Left to do: build-284 captures of Today and Chat, so 1/4/5 can carry those screens instead of photo-led layouts.
- Disclosures: the Apple trademark line; Emma and her photos are AI-generated.

## v2: quiet palette (2026-10-24, the founder on v1: "feeling cheap… the colours please subtle colours")

`version: "v2"` (code in `v2.tsx`; v1 untouched, same composition with `version: "v1"`). One quiet palette: oat,
dusty blue, warm stone, pale sage, soft blush, sand, each taken from its photo and pushed toward Mist, lit softly
from above; a centred two-line headline whose second line is the ground's deep tone (grammar studied from the
Essembl store set, inspo only). One hero each: the phone (1–2: the same size and place) or her photo (3, 5: the
same top line); clothes and prints only BEHIND the phone; nothing tilted; no sublines.
Finals: `out/final-v1v2/s-v1v2-1.png … -6.png` (local stills; rounds in `out/v2-r1 … r3`). Critic round 3: all 8+.

```bash
tools/stills app-store-shots-v1 --frames 0 --format store-shot --length 6 --props '{"shot":1,"version":"v2"}' --out ads/app-store-shots-v1/out/v2-r4/s1
```
