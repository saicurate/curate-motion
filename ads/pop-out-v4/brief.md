# Pop out v4: brief

**Gate:** G1 in review (four draft assets wait for the founder), G2 package ready (this file, `style_guide.md`,
`shotlist.md`, one still per shot). Made by the motion studio process (`.claude/skills/motion-reel/SKILL.md`).

**Why v4:** v3's app footage is build 262, the old look: its reveal (one piece lifting out of a photo) and its
proof (the review screen counting to 41) are screens 284 no longer has. And the founder has since said how the
videos should be: like the App Store header film (`ads/app-store-header-all`: "perfect the header video is soo
good") and its portrait form, the hybrid previews ("I want them to be the header way"). v4 is Pop out made that
way, around the new-look scan. v3 stays as it was.

## FILM (the one sentence, as v3)

> **Your whole closet is already in your camera roll; Curate pulls it out.**

## Who, where, how long

- **Audience:** US, 18–34, has never heard of Curate. Scrolling with the sound half on.
- **Channels:** TikTok, Reels, Shorts. **Format:** 9:16, 1080 × 1920, 60 fps; 4:5 and 1:1 at G6.
- **Duration:** 15 s, a loop (the last frame is the first).
- **Music:** Cat Walk (Arulo, Mixkit) from its drop (29.536 s), 130 BPM, the same window as v3
  (`beatmap.ts`, measured by `tools/beats`). Every beat in `timeline.ts` sits on its bars and beats.

## The story

1. **HOOK, 0–1.85 s.** Her three photos on a soft ground. On the drop the camel coat lifts out of her DUMBO
   photo, on the next beat the denim jacket out of the ferry, then the scarf out of the park; the ground takes
   each photo's tone (blush, dusty blue, oat). At 0.92 s: "Your closet is already *in your camera roll.*"
2. **PROBLEM, 1.85–3.70 s.** The camera glides back: those are three of the thirty photos in her camera roll.
   The three pieces stay held over it.
3. **REVEAL, 3.70–7.38 s.** The roll recedes; the phone fades up whole and straight with the **real** build-284
   scan at real speed: her photos sorted from the everyday ones, then fanned while her items are found. The
   pieces glide down to rest beside the phone. "Curate finds *every photo of you.*"
4. **PROOF, 7.38–11.06 s.** The camera pushes into the phone, past the pieces: the real landing, her rails, and
   the app's own line "Added 14 wardrobe items from 7 photos". "Every item, *found and sorted.*" (the approved
   preview's line).
5. **CLOSE, 11.06–15.00 s.** The pan through a soft column of light to the header's lockup: the mark, "Curate",
   "Try it. Style it. *Wear it.*", then "On the App Store", held 2.2 s. Her three photos glide back in.

## ASSETS (G1)

| Use | Asset id | Status |
|---|---|---|
| Music | `music.mixkit.cat-walk-arulo.v1` | approved |
| Type, mark, phone | `font.geist.*`, `brand.curate.splash-mark.v1`, `device.apple.iphone-17-pro-max-silver.v1` | approved |
| Her photos (the hook's three and her roll) | `photo.emma.r01…r30` | approved |
| The pieces | `garment.emma.coat-wool-camel.v3`, `garment.emma.jacket-denim.v3`, `garment.emma.scarf-plaid-camel.v2` (the header film's own cut-outs) | **draft** |
| Real app | `footage.emma.b284-scan-sort-fan-land.v1`: the 284 scan with her photos, recorded 2026-10-24 (tools/take) | **draft** |

## VISUAL

The header's world in portrait: tonal grounds (each a photo's own colour pushed close to Mist), her photos as
soft-shadowed prints, garment cut-outs that lift and glide and rest with contact shadows, one camera (pull, push,
pans through the light), Geist lines with the key phrase in ink. Full rules: `style_guide.md`.

## HARD LINE

- Never invent product screens or numbers: the app is shown only as recorded. The "14 items from 7 photos" is
  the test build's count on her real photos and wardrobe; `ad.json › disclosures` says so.
- No prices, no shopping, no store names (RULES.md › 2). Never show the pipeline. No logos but Curate's.
- Apple's bezel licence: the phone straight on and whole, pan / zoom / fade only, nothing over it and nothing
  entering or leaving its screen (the pieces rest beside it). The trademark line is in the disclosures.
- Emma never vouches for a product. AI-generated persona: the platform AI label is on.
