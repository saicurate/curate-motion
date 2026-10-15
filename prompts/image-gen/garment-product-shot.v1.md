---
id: prompt.image-gen.garment-product-shot.v1
title: Garment product shot on light seamless (template)
author: "agent:assets-agent"
area: image-gen
target: Nano Banana 2.1 (gemini-nano-banana-2.1)
outcome: worked
rating: 4
why: "50 of 50 pieces usable, all logo-free, whole piece in frame: the long 'exactly one item… no logos, no text, no numbers' tail did the work. Only failures were dropped downloads, not the prompt."
inputs: []
outputs: []
parents: []
tags:
  - "persona:emma"
  - garment
  - product-shot
  - logo-free
  - template
template: true
createdAt: 2026-10-15
usedAt: []
source: marketing/videos/assets/_tools/garments.py (TEMPLATE + presentations)
addedBy: "claude-code (prompt-library seed, 2026-10-15)"
---
Studio product photograph for an online clothing catalog: {desc}. {pres} The item is centered and the entire item is fully visible with a generous empty margin on all four sides; nothing is cropped or cut off at the edges. Clean, light warm-grey seamless paper background, soft even diffused studio lighting, a gentle natural soft shadow. Realistic fabric texture, seams and stitching, true-to-life colour. Exactly one item in the frame: no person, no visible mannequin, no hanger, no props, no price tags, no labels, no brand logos, no text, no letters, no numbers, no graphics, no watermark.

## Placeholders
- {desc}: the piece in plain words, colour first, no brand (e.g. "a plain white cotton crew-neck t-shirt, women's relaxed fit, short sleeves").
- {pres}: how it's shown, one of:
  - ghost mannequin: "Shown as an invisible ghost-mannequin front view, as if worn by an invisible body, with a natural drape and realistic shape; the inside back of the neckline may be visible."
  - ghost mannequin, full length: "Shown as an invisible ghost-mannequin front view of the full length, from waistband to hem, natural shape."
  - flat lay from above: "Laid neatly flat and photographed straight from above."
  - pair at three-quarter angle: "A pair of shoes side by side, photographed at a gentle three-quarter front angle, both shoes fully visible."
  - standing at three-quarter angle: "Standing upright on its base, photographed at a slight three-quarter front angle, strap or handles visible."
  - small item from slightly above: "Arranged neatly in the center, photographed from slightly above."
