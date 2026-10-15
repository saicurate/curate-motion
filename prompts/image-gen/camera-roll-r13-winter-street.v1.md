---
id: prompt.image-gen.camera-roll-r13-winter-street.v1
title: "Camera roll: Snowy winter street"
author: "agent:assets-agent"
area: image-gen
target: Nano Banana Pro (gemini-3-pro-image)
outcome: worked
rating: 4
why: "Picked first take: face matched B, her own pieces reproduced faithfully, a real phone-photo look, no logos or readable text."
inputs:
  - face.emma.b.v1
  - garment.emma.jacket-puffer-black.v1
  - garment.emma.beanie-cream.v1
  - garment.emma.jeans-straight-light-wash.v1
  - garment.emma.sneakers-retro-runner-grey-navy.v1
outputs: [photo.emma.r13-winter-street.v1]
parents: [prompt.image-gen.camera-roll-photo.v1]
tags:
  - "persona:emma"
  - camera-roll
  - phone-photo
  - multi-reference
  - "framing:full"
createdAt: 2026-10-15
usedAt: ["2026-10-15T17:49:58Z"]
costUsd: 0.1438
source: "roll.py prompt(SHOTS['r13-winter-street']); calls.jsonl tag roll:r13-winter-street:v1"
addedBy: "claude-code (prompt-library seed, 2026-10-15)"
---
The first image shows Emma's face. She is a 27-year-old woman from New York, 5 foot 6, average slim-to-medium build. Keep her identity exactly: the same face, features, olive skin tone, brown eyes and long dark-brown wavy hair. Image 2 is a product photo of her black puffer jacket. Image 3 is a product photo of her cream beanie. Image 4 is a product photo of her light-wash straight-leg jeans. Image 5 is a product photo of her retro runners. She is wearing exactly these pieces from her own wardrobe, reproduced faithfully (colour, fabric, cut, details); fill in only plain, unremarkable basics where something is not shown. Scene: Emma on a snowy New York side street in winter, light snow falling, holding a paper coffee cup with no logo, cheeks a little pink from the cold; full body. It must look like a real, ordinary iPhone photo from a camera roll: natural light, true-to-life colour, a little sensor noise, slightly imperfect casual framing, real skin texture with pores, no retouching, no beauty filter, not a fashion shoot, not glossy. No text, no captions, no watermark, no readable signs, no brand logos anywhere.
