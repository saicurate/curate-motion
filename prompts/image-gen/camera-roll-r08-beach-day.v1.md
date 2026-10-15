---
id: prompt.image-gen.camera-roll-r08-beach-day.v1
title: "Camera roll: Beach day at Rockaway"
author: "agent:assets-agent"
area: image-gen
target: Nano Banana Pro (gemini-3-pro-image)
outcome: worked
rating: 4
why: "Picked first take: face matched B, her own pieces reproduced faithfully, a real phone-photo look, no logos or readable text."
inputs:
  - face.emma.b.v1
  - garment.emma.shirt-linen-white.v1
  - garment.emma.tank-ribbed-black.v1
  - garment.emma.shorts-denim-cutoff.v1
  - garment.emma.sandals-tan.v1
outputs: [photo.emma.r08-beach-day.v1]
parents: [prompt.image-gen.camera-roll-photo.v1]
tags:
  - "persona:emma"
  - camera-roll
  - phone-photo
  - multi-reference
  - "framing:full"
createdAt: 2026-10-15
usedAt: ["2026-10-15T17:42:50Z"]
costUsd: 0.143566
source: "roll.py prompt(SHOTS['r08-beach-day']); calls.jsonl tag roll:r08-beach-day:v1"
addedBy: "claude-code (prompt-library seed, 2026-10-15)"
---
The first image shows Emma's face. She is a 27-year-old woman from New York, 5 foot 6, average slim-to-medium build. Keep her identity exactly: the same face, features, olive skin tone, brown eyes and long dark-brown wavy hair. Image 2 is a product photo of her white linen shirt. Image 3 is a product photo of her black ribbed tank. Image 4 is a product photo of her denim cutoff shorts. Image 5 is a product photo of her tan sandals. She is wearing exactly these pieces from her own wardrobe, reproduced faithfully (colour, fabric, cut, details); fill in only plain, unremarkable basics where something is not shown. Scene: Emma on the sand at Rockaway Beach on a bright summer day, linen shirt worn open over the tank, ocean and a few distant beachgoers behind her, wind in her hair, squinting happily in the sun; full body. It must look like a real, ordinary iPhone photo from a camera roll: natural light, true-to-life colour, a little sensor noise, slightly imperfect casual framing, real skin texture with pores, no retouching, no beauty filter, not a fashion shoot, not glossy. No text, no captions, no watermark, no readable signs, no brand logos anywhere.
