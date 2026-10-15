---
id: prompt.image-gen.camera-roll-r01-coffee-shop.v1
title: "Camera roll: Coffee shop in Astoria"
author: "agent:assets-agent"
area: image-gen
target: Nano Banana Pro (gemini-3-pro-image)
outcome: worked
rating: 4
why: "Picked first take: face matched B, her own pieces reproduced faithfully, a real phone-photo look, no logos or readable text."
inputs:
  - face.emma.b.v1
  - garment.emma.tee-white.v1
  - garment.emma.blazer-black.v1
  - garment.emma.earrings-hoops-gold.v1
outputs: [photo.emma.r01-coffee-shop.v1]
parents: [prompt.image-gen.camera-roll-photo.v1]
tags:
  - "persona:emma"
  - camera-roll
  - phone-photo
  - multi-reference
  - "framing:half"
createdAt: 2026-10-15
usedAt: ["2026-10-15T17:38:31Z"]
costUsd: 0.141862
source: "roll.py prompt(SHOTS['r01-coffee-shop']); calls.jsonl tag roll:r01-coffee-shop:v1"
addedBy: "claude-code (prompt-library seed, 2026-10-15)"
---
The first image shows Emma's face. She is a 27-year-old woman from New York, 5 foot 6, average slim-to-medium build. Keep her identity exactly: the same face, features, olive skin tone, brown eyes and long dark-brown wavy hair. Image 2 is a product photo of her white tee. Image 3 is a product photo of her black blazer. Image 4 is a product photo of her gold hoop earrings. She is wearing exactly these pieces from her own wardrobe, reproduced faithfully (colour, fabric, cut, details); fill in only plain, unremarkable basics where something is not shown. Scene: Emma sitting at a small wooden table in a busy neighbourhood coffee shop in Astoria, Queens, holding an iced latte, morning light from the window; a friend took it across the table. It must look like a real, ordinary iPhone photo from a camera roll: natural light, true-to-life colour, a little sensor noise, slightly imperfect casual framing, real skin texture with pores, no retouching, no beauty filter, not a fashion shoot, not glossy. No text, no captions, no watermark, no readable signs, no brand logos anywhere.
