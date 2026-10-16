# Pop out v3: brief

**Gate:** G2 (in review: the founder approves this, `style_guide.md` and `shotlist.md` before G3).
Made by the motion studio process (`.claude/skills/motion-reel/SKILL.md`; decisions/0011, proposed).

## FILM (the one sentence)

> **Your whole closet is already in your camera roll; Curate pulls it out.**

Every shot serves this sentence. A shot that can't say how it serves it is cut.

## Who, where, how long

- **Audience:** US, 18–34, has never heard of Curate. Scrolling with the sound half on.
- **Channels:** TikTok, Reels, Shorts.
- **Duration:** 15 s master. Cut-downs planned (not built): **6 s** (HOOK → the real lift → CLOSE, no
  problem or proof beat; CTA still held 2 s) and **30 s** (adds the real `pieces-up-and-tuck`,
  "Your wardrobe is ready · 41 pieces", and one Wardrobe scroll before the close).
- **Formats:** 9:16 first (1080×1920, 60 fps). Then 4:5 and 1:1 from the same timeline at G6, re-laid
  out, never cropped; vertical keeps the biggest type and the fewest elements. App Store previews
  would render at 30 fps (Apple's limit), from the same time-based timeline.
- **Music:** Cat Walk (Arulo, Mixkit), from its drop (29.536 s): 130.00 BPM, measured with
  `tools/beats` (grid fit ±8 ms). The same track as v1 and v2, so the comparison is about motion.
  The 15 s ends on the track's own break (14.76 s, −7 dB): the loop breathes there, then restarts
  on the drop.

## The story (HOOK, PROBLEM, REVEAL, PROOF, CLOSE)

1. **HOOK, 0–1.85 s.** Her ferry photo, big and alone. On the drop her denim jacket lifts out of it.
   At 0.92 s: "Your closet is already in your camera roll."
2. **PROBLEM, 1.85–3.70 s.** The jacket settles home; the camera glides back: that photo is one of
   thirty in her camera roll. Her closet is in there, scattered.
3. **REVEAL, 3.70–7.85 s.** The camera glides into her market photo; the phone forms round it; the
   **real app** lifts her Ballet Flats out of that very photo. "Curate pulls it out."
4. **PROOF, 7.85–11.06 s.** The **real** review screen rises and counts: **41 pieces from your
   photos**. The camera pushes in on the number. No caption: the app says it.
5. **CLOSE, 11.06–15.00 s.** The Curate mark, "Curate", "On the App Store" (held 2.3 s), Zee pops up
   and bounces. Her ferry photo comes back: the last frame is the first.

## ASSETS (G1, approved: every id is `approved` in the catalog)

| Use | Asset id |
|---|---|
| Music | `music.mixkit.cat-walk-arulo.v1` (beat map in its manifest, `beatMap`) |
| Type | `font.geist.regular.v1`, `font.geist.medium.v1`, `font.geist.semibold.v1` |
| Brand | `brand.curate.splash-mark.v1` (the mark, untouched) |
| The hook's photo | `photo.emma.r26-ferry.v1` |
| The hook's piece | `garment.emma.jacket-denim.v1` (its cut-out) |
| The photo the app pulls from | `photo.emma.r06-farmers-market.v1` (the same photo the real app uses in the footage) |
| Her camera roll | `photo.emma.r01…r30` (all 30, approved) |
| Real app, reveal | `footage.emma.first-piece-lift.v1` (build 262, her account): her market photo → Ballet Flats, 0.35–3.9 s, real speed |
| Real app, proof | `footage.emma.review-count-up.v1` (build 262): the count to 41, 0.92–3.6 s at real speed, then its own last frame holds 0.5 s |
| Zee | `zee.cheer.intro.v1`, `zee.cheer.loop.v1` |
| Designed sound | made in code at G5 (`motion/sound`), then added as `sfx.curate.pop-out-v3-sound.v1` |

Real app footage stays real: no drawn or edited screens, no invented numbers. The 41 is the app's
own count from her real account. Total real app on screen: **6.4 s** (v2: about 4 s, small).

## VISUAL

Calm Angora White ground, the brand's monochrome ramp around the app, Geist only, one focal point
per beat, one virtual camera that glides. Colour comes only from her photos, her clothes and the
app. Full rules: `style_guide.md`.

## HARD LINE

- Never invent product screens or numbers. The app is shown only as recorded.
- No prices, no shopping, no "buy", no store names (RULES.md › 2).
- Never show the pipeline (no "AI is analysing", no model names, no progress of internals).
- Emma never vouches for a product. No logos but Curate's.
- AI-generated persona: the platform AI label is on (ad.json › disclosures).
