---
id: inspo.competitor.essembl-redesign.v1
title: "Essembl 1.0.0 redesign: in-app UI and App Store set (competitor teardown)"
kind: app-screen
status: active
url: "https://apps.apple.com/us/app/essembl-outfit-planner/id6479642952"
asset: reference.essembl.appstore-iphone-07.v1
source: "the founder (3 phone screenshots of the store frames, 2026-10-19); full set from the iTunes Lookup API and the App Store web page"
addedBy: claude-code
addedAt: 2026-10-19
love:
  - "One accent colour (olive #3B4932) on a warm sage-tinted off-white; every other colour comes from the clothes"
  - "The Today card: a 3x2 flat-lay of cut-outs on a tinted stage, a poetic colour name ('Olive and cherry'), '6 pieces · Suggested', one 'Take a closer look' row"
  - "Counts and scores everywhere: 1/5, IDEA 2 OF 7, 7 pieces found, 8/10"
  - "Store frames read as an ad: two-line two-tone headline, real garments around a big phone, stickers that reuse the app's chips"
  - "Rate my look: a halo cut-out of the person with numbered hotspots tied to What works / What to change"
techniques:
  pacing:
    - "Store story: problem + proof, own clothes, speed (widget), ideas, rate (dark break frame), wardrobe, daily with occasions"
  type:
    - "One heavy neo-grotesk, about 38 pt titles with tight tracking; 11 pt letterspaced caps kickers"
    - "Store headline: font size about 10% of frame width; line 1 black, line 2 accent"
  colour:
    - "Ground #FBFCF6, stage #EDEFE4, hairline #E0E2D5, accent #3B4932; store ground cream linen #F9F0E7, break frame #2D382A with tan #D8B48A"
  other:
    - "Flat fills and 1 px hairlines instead of shadows; the tab bar is flat with a tinted pill behind the selected icon"
    - "UI cards pulled out of the phone, props overlapping the bezel (we can't: Apple bezel rules; put props beside or behind)"
useFor: [app-store-screenshots, ui-direction, "ad:appstore-set-v2"]
tags:
  - competitor
  - app-store
  - in-app-ui
  - design-system
  - essembl
links:
  - {"label":"Essembl on the App Store","url":"https://apps.apple.com/us/app/essembl-outfit-planner/id6479642952"}
---
Competitor teardown, 2026-10-19. Essembl: Outfit Planner (Essembl SA, App Store id 6479642952, subtitle "Daily Style Maker", 4.5 from 4,709 US ratings). Version 1.0.0 shipped 2026-10-18 as "a brand-new design, built around four tabs": Today, Wardrobe, Studio, Shop. No App Store preview video. The founder sent 3 phone screenshots of these store frames; they are this set. (It is not Whering: Whering's store set is lilac/lime with Styling/Canvas tabs.)

Grammar only. Never copy their copy, layout or images into Curate.

## Media in the library (all `reference`, never shipped)

- Current store set (v1.0.0, 1179x2556): reference.essembl.appstore-iphone-01.v1 … -07.v1
- iPad set (v1.0.0, 2064x2752, flat full screens, best for reading the UI): reference.essembl.appstore-ipad-01.v1 … -05.v1
- Previous store set (v0.2.32, serif era, 1242x2688): reference.essembl.appstore-iphone-prev-01.v1 … -08.v1
- The founder's 3 phone screenshots: reference.essembl.founder-frame-200-clothes.v1, reference.essembl.founder-frame-dressed-for-any-plan.v1, reference.essembl.founder-frame-outfits-you-own.v1
- Files: library/references/competitors/essembl/

## In-app design system (measured from the PNG pixels; sizes at 402 pt wide, about ±3%)

Colour
- Ground #FBFCF6 (warm off-white, faint sage). White #FFFFFF for inputs, the selected segment, row cards.
- Stage #EDEFE4: behind every garment (Today card, wardrobe tiles, photo stage). Track #ECECE4 (segmented control, filter button, outfit canvas).
- Wells: icon well #EFEFE5 / #E4E8DA, tab selected pill #E6EADB, avatar #E9EDE1.
- Hairlines #DFE0DA to #E9EAE5, 1 px. Tab bar top rule #DCDDD7.
- One accent, olive #3B4932: primary buttons, selected chip, + button, camera button, hotspots, ticks. The AI hero card is a gradient #3D4A34 to #546346 with a large faint 4-point sparkle.
- Text: primary near-black (#0B0C08 to #171A0F), secondary #63645E / #6A6C60, tertiary #757670 / #90918B, caps labels #585953 / #616357, inactive tab #77796D, active tab label #30372C, score text olive #5D643E.

Type (one neo-grotesk, Inter Display-like; the exact family can't be confirmed from pixels)
- Large title (Today / Wardrobe / Studio): cap height about 27.5 pt, so about 38 pt, heavy, tracking about -3%.
- Card hero name ("Olive and cherry"): about 27 pt bold. Detail title: about 30 pt bold, 2 lines.
- Subhead ("My outfit", "Pick up where you left off"): about 20 pt semibold.
- Row and body text: 14 to 15 pt. Meta ("6 pieces · Suggested", "9° · London"): about 13 pt, grey.
- Caps kicker ("PICKED FOR TODAY 1/5", "YOUR LATEST", "WHAT WORKS"): 10.5 to 11 pt semibold, about +8% tracking, grey.
- Grid item: name about 12 pt semibold, colour line about 11.5 pt lowercase grey ("olive green"). Tab label 11 pt, icons about 20 pt line.

Shape and space
- Gutter about 20 pt. Today card 327 pt wide, 14 pt gap, about 40 pt of the next card peeking.
- Radii: big cards about 20 pt, garment tiles about 12 pt, segmented control and search field about 12 pt, chips and buttons capsule, + and avatar 44 pt circles.
- Almost no shadows in the app. Objects separate by fill (stage on ground) plus 1 px hairlines.
- Tab bar: 4 tabs, icon over label, flat ground with a top hairline, the selected tab sits on a tinted rounded pill (about 53x31 pt). It does not float.

## App Store grammar

- Ground: cream linen #F9F0E7 with a woven texture and soft window-light shadow; one dark olive frame (#2D382A) as the pattern break, with a tan line 2 (#D8B48A).
- Headline: 2 lines, near the top. Font size about 10% of frame width (cap height 7.4%). Heavy grotesk, tight. Line 1 near-black #1F1F1C, line 2 olive #2E4A2B. Line 1 sets the problem or claim; line 2 pays it off.
- Device: a photoreal iPhone, mostly straight on and about 65 to 70% of the frame width; tilted in frame 1, cropped off the edge in frames 4 and 6. UI cards are pulled out of the phone (Today card, idea card, piece cards, rating card).
- Props: real product shots at life scale next to the phone (leather jacket, cable knit, jeans, loafers, trench), lit from the top left with soft shadows, overlapping the bezel.
- Stickers: white capsules with heavy near-black text, rotated 3 to 6°, soft shadow; one olive (selected). The same chip language as the app.
- Social proof only on frame 1: a laurel "4.5/5 App Store" plus "Featured in ELLE · Forbes 30 Under 30".
- Story: problem hook + proof, outfits from what you own, widget speed, ideas, rate (the dark frame), wardrobe, daily Today with occasions.

## Curate rules that change what we can borrow

- Apple bezel as is (decisions/0012): straight on, never cropped or covered, no added shadow, nothing in or out of its screen. So props and stickers sit beside or behind the phone, never over it.
- Monochrome brand, Geist only. Their olive two-tone becomes our grey-to-#181818 two-tone (the brand's own signature device).
