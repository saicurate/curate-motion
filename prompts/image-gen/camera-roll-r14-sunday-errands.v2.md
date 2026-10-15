---
id: prompt.image-gen.camera-roll-r14-sunday-errands.v2
title: "Camera roll: Sunday coffee run (remake 2)"
author: "agent:assets-agent"
area: image-gen
target: Nano Banana Pro (gemini-3-pro-image)
outcome: worked
rating: 4
why: "Pushing the storefront out of focus and listing every place words appear (signs, awning, newspaper boxes) fixed it."
inputs:
  - face.emma.b.v1
  - garment.emma.hoodie-navy.v1
  - garment.emma.sweatpants-grey.v1
  - garment.emma.sneakers-retro-runner-grey-navy.v1
  - garment.emma.cap-baseball-navy.v1
outputs: [photo.emma.r14-sunday-errands.v1]
parents:
  - prompt.image-gen.camera-roll-r14-sunday-errands.v1
tags:
  - "persona:emma"
  - camera-roll
  - phone-photo
  - multi-reference
  - "framing:full"
  - remake
createdAt: 2026-10-15
usedAt: ["2026-10-15T17:59:54Z"]
costUsd: 0.145704
source: "roll.py prompt(SHOTS['r14-sunday-errands']) + redo extra; calls.jsonl tag roll:r14-sunday-errands:v2"
addedBy: "claude-code (prompt-library seed, 2026-10-15)"
---
The first image shows Emma's face. She is a 27-year-old woman from New York, 5 foot 6, average slim-to-medium build. Keep her identity exactly: the same face, features, olive skin tone, brown eyes and long dark-brown wavy hair. Image 2 is a product photo of her navy hoodie. Image 3 is a product photo of her grey sweatpants. Image 4 is a product photo of her retro runners. Image 5 is a product photo of her navy baseball cap. She is wearing exactly these pieces from her own wardrobe, reproduced faithfully (colour, fabric, cut, details); fill in only plain, unremarkable basics where something is not shown. Scene: Emma a lazy Sunday morning outside a corner deli in Queens, holding a coffee to go, relaxed and a little sleepy, soft morning light; full body, no readable signs. It must look like a real, ordinary iPhone photo from a camera roll: natural light, true-to-life colour, a little sensor noise, slightly imperfect casual framing, real skin texture with pores, no retouching, no beauty filter, not a fashion shoot, not glossy. No text, no captions, no watermark, no readable signs, no brand logos anywhere.  Keep the deli storefront plain and out of focus: no signs, no awning lettering, no newspaper boxes, no readable words anywhere.
