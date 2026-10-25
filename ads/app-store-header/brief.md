# App Store header: brief (G2)

**FILM:** before anyone reads a word, show the one thing Curate does with the clothes you already own.

**What it is:** iOS 27's product-page **header** (21:9, 3840 × 1646) and **search-results card** (3:2),
both a 5–30 s **muted loop** (header: muted until she taps sound; search: always muted), 30 or 60 fps,
poster frame chosen in App Store Connect. Reviewed by Apple on its own; can go live on the version that's
already released (Asset Library), but we ship it **with the new-look App Store release**: the App Store
still has 1.5.0 (old look), and a new-look header now would promise screens people don't get.
Specs: WWDC26 session 205; aso.dev/app-store-connect/placements (studies/ob172 has the summary).

**Audience:** someone on Curate's App Store page or scrolling search results, sound off, phone in hand.
On a phone the header is about 393 × 168 pt, so every word is set at ≥ 6.6% of the frame's height
(≈ 11 pt there) and everything that matters sits inside the 3:2 card's width (±0.72 H of the centre).

**Duration:** 15 s, one seamless loop (the last frame is the first). Cut-downs: none (5–30 s allowed).

**Formats:** `store-header` 3840 × 1646 and `store-search` 2880 × 1920 (new in schemas/ad.ts), one
scene laid out in units of H around the centre, so one timeline fills both.

**Three directions (the founder picks one at G2):**
- **A · roll** — her photos give up what she's wearing (the coat, the denim jacket, the scarf lift off
  her DUMBO, ferry and park photos), the photos fall away, the pieces gather, her real Wardrobe fades up
  on the phone. "Every item you own, *from your photos.*"
- **B · tryon** — her walk-to-work photo and the black tee beside it; the tee flies in and Studio's real
  try-on wipes down over her (same street, same bag: only the striped tee turns black, measured to the
  pixel); the phone shows Studio with that very try-on. "See it *on you.*" / "Before you *wear it.*"
- **C · zee** — Zee waves in a pool of light; his real chat answers "What should I wear to work on
  Monday?" ("Your camel coat over the black tee and trousers"); those three pieces rise beside him.
  "Your stylist *knows your closet.*"

**ASSETS (catalog ids, see ad.json):** Emma's approved camera-roll photos r12 / r26 / r04 / r30, her
approved wardrobe cut-outs (coat-wool-camel, jacket-denim, scarf-plaid-camel, tee-black,
trousers-black), the real try-on `tryon.emma.r30-tee-black.v1` (draft, added 2026-10-24), the new-look
screenshots `screenshot.emma.nl-*` (build 264, probe on Emma's data, draft, added 2026-10-24), Zee's
approved hello / listening / happy clips (zee-sharp, 720 px), Apple's iPhone 17 Pro Max bezel (silver),
Geist. No music (muted placements; a track is listed only because the schema wants one).

**VISUAL:** a seamless Angora White studio sweep under a soft overhead light; real photos as lit prints
(ambient + key shadow); cut-outs floating with soft shadows; Apple's bezel straight on (x, y, scale and
fades only; words beside it, never on it); Geist Medium two-tone lines (key in #181818, rest #656565);
a slow critically damped camera; springs by class; sub-frame motion blur on the fast moves; light grain
and vignette on the stage, never over the bezel. No accent colour, no gradients on content.

**HARD LINE:** no invented screens or numbers (every screen is a real build-284 capture on her data; the
try-on is the real one Studio shows); no prices, discounts, URLs or promises; 4+ content; Emma is an AI
persona (disclose); never show the pipeline.

**Open (needs the founder):** the pick (A1 studio white or A2 tonal, against B, C, D on the one review
page). The phone holds a still capture of her build-284 Wardrobe; a scrolling screen recording would be
a G4 upgrade.
