---
id: prompt.image-gen.camera-roll-r19-fall-game-day.v1
title: "Camera roll: Saturday in the park"
author: "agent:assets-agent"
area: image-gen
target: Nano Banana Pro (gemini-3-pro-image)
outcome: worked
rating: 4
why: "Picked first take: face matched B, her own pieces reproduced faithfully, a real phone-photo look, no logos or readable text."
inputs:
  - face.emma.b.v1
  - garment.emma.jacket-varsity-navy-cream.v1
  - garment.emma.tee-white.v1
  - garment.emma.jeans-straight-light-wash.v1
  - garment.emma.sneakers-leather-white.v1
outputs: [photo.emma.r19-fall-game-day.v1]
parents: [prompt.image-gen.camera-roll-photo.v1]
tags:
  - "persona:emma"
  - camera-roll
  - phone-photo
  - multi-reference
  - "framing:full"
createdAt: 2026-10-15
usedAt: ["2026-10-15T17:45:14Z"]
costUsd: 0.14347
source: "roll.py prompt(SHOTS['r19-fall-game-day']); calls.jsonl tag roll:r19-fall-game-day:v1"
addedBy: "claude-code (prompt-library seed, 2026-10-15)"
---
The first image shows Emma's face. She is a 27-year-old woman from New York, 5 foot 6, average slim-to-medium build. Keep her identity exactly: the same face, features, olive skin tone, brown eyes and long dark-brown wavy hair. Image 2 is a product photo of her varsity jacket. Image 3 is a product photo of her white tee. Image 4 is a product photo of her light-wash straight-leg jeans. Image 5 is a product photo of her white leather sneakers. She is wearing exactly these pieces from her own wardrobe, reproduced faithfully (colour, fabric, cut, details); fill in only plain, unremarkable basics where something is not shown. Scene: Emma on a crisp fall Saturday in Prospect Park, sitting on a low stone wall, autumn trees behind her, holding a paper cup of cider; full body. It must look like a real, ordinary iPhone photo from a camera roll: natural light, true-to-life colour, a little sensor noise, slightly imperfect casual framing, real skin texture with pores, no retouching, no beauty filter, not a fashion shoot, not glossy. No text, no captions, no watermark, no readable signs, no brand logos anywhere.
