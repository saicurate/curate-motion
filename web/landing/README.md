# Curate landing page: "One Day"

The new curatefashions.com home page: one scroll story through a day in Emma's life, built as a
Framer code component so it drops into the live Framer site.

| File | What it is |
|---|---|
| `prototype/curate-one-day.html` | The approved prototype and the **source of truth** for the story and its motion. Open it in a browser to review. |
| `build-framer.mjs` | Turns the prototype into the Framer component: scopes the CSS, wraps the script with clean-up, adds image slots. |
| `framer/CurateOneDay.tsx` | **Generated.** The Framer code component. Don't edit by hand: edit the prototype and rebuild. |
| `framer/qr.svg` | QR code to https://curatefashions.com, shown on desktop at the close (replaceable in Framer). |

```bash
node web/landing/build-framer.mjs   # rebuild the component after changing the prototype
```

## The story

7:48 hero (Emma; her clothes lift off her photo into the Today card) → 8:20 try-on flipbook (16 looks on one
photo) → 8:40 Whole closet scan → 12:30 the Chrome extension → 15:00 rain → 19:12 Ask Zee and Try it on →
23:10 a reel DM'd to @askcurate → close: App Store, Google Play, Chrome, then the day loops to 7:00.

Throughout: a draggable day bar, the "On you" picture that changes outfit each chapter, and Zee as the guide.
Colour is the light of the day (Mist palette). Only what the app does; no prices, stores or third-party logos.

## Putting it in Framer

1. In the Curate project, add a new page (for example `/new`), not the live home page.
2. Add the component (Assets > Code > New file, paste `CurateOneDay.tsx`, or install it over the Framer MCP).
3. Place it at full width (width fill, height auto) with no Framer nav above it: the component draws its own header.
4. Fill the image slots in the right-hand panel with real assets (empty slots keep the drawn stand-ins), and set
   the store links. Use the official App Store, Google Play and Chrome Web Store badges before going live.

## Still to confirm (founder)

- The privacy line in the closet chapter: "You choose which photos Curate can see."
- Instagram linking happens inside the Curate app; the reel reply includes the closet match.
- Store URLs for Google Play and the Chrome extension; QR target (site or App Store).
- Emma's photos are AI-generated: OK to use on the website?
