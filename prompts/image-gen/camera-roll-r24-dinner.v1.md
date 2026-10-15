---
id: prompt.image-gen.camera-roll-r24-dinner.v1
title: "Camera roll: Dinner date"
author: "agent:assets-agent"
area: image-gen
target: Nano Banana Pro (gemini-3-pro-image)
outcome: "didn't"
rating: 2
why: "The 'candlelit… at night' scene came out looking like daytime."
inputs:
  - face.emma.b.v1
  - garment.emma.camisole-satin-black.v1
  - garment.emma.necklace-pendant-gold.v1
  - garment.emma.earrings-hoops-gold.v1
outputs: []
parents: [prompt.image-gen.camera-roll-photo.v1]
tags:
  - "persona:emma"
  - camera-roll
  - phone-photo
  - multi-reference
  - "framing:half"
createdAt: 2026-10-15
usedAt: ["2026-10-15T17:55:36Z"]
costUsd: 0.14193
source: "roll.py prompt(SHOTS['r24-dinner']); calls.jsonl tag roll:r24-dinner:v1; legacy file roll/r24-dinner-v1.jpg kept, not catalogued"
addedBy: "claude-code (prompt-library seed, 2026-10-15)"
---
The first image shows Emma's face. She is a 27-year-old woman from New York, 5 foot 6, average slim-to-medium build. Keep her identity exactly: the same face, features, olive skin tone, brown eyes and long dark-brown wavy hair. Image 2 is a product photo of her black satin camisole. Image 3 is a product photo of her gold pendant necklace. Image 4 is a product photo of her gold hoop earrings. She is wearing exactly these pieces from her own wardrobe, reproduced faithfully (colour, fabric, cut, details); fill in only plain, unremarkable basics where something is not shown. Scene: Emma sitting at a candlelit table in a small West Village restaurant at night, glass of red wine, warm low light, a soft smile across the table; from the waist up. It must look like a real, ordinary iPhone photo from a camera roll: natural light, true-to-life colour, a little sensor noise, slightly imperfect casual framing, real skin texture with pores, no retouching, no beauty filter, not a fashion shoot, not glossy. No text, no captions, no watermark, no readable signs, no brand logos anywhere.
