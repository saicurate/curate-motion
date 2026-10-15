---
id: prompt.image-gen.camera-roll-r25-cafe-laptop.v1
title: "Camera roll: Working from a cafe"
author: "agent:assets-agent"
area: image-gen
target: Nano Banana Pro (gemini-3-pro-image)
outcome: "didn't"
rating: 2
why: "The laptop lid had an Apple logo ('a laptop that has no logo' wasn't enough)."
inputs:
  - face.emma.b.v1
  - garment.emma.shirt-oxford-blue.v1
  - garment.emma.earrings-hoops-gold.v1
  - garment.emma.bag-tote-leather-black.v1
outputs: []
parents: [prompt.image-gen.camera-roll-photo.v1]
tags:
  - "persona:emma"
  - camera-roll
  - phone-photo
  - multi-reference
  - "framing:half"
createdAt: 2026-10-15
usedAt: ["2026-10-15T17:55:52Z"]
costUsd: 0.143294
source: "roll.py prompt(SHOTS['r25-cafe-laptop']); calls.jsonl tag roll:r25-cafe-laptop:v1; legacy file roll/r25-cafe-laptop-v1.jpg kept, not catalogued"
addedBy: "claude-code (prompt-library seed, 2026-10-15)"
---
The first image shows Emma's face. She is a 27-year-old woman from New York, 5 foot 6, average slim-to-medium build. Keep her identity exactly: the same face, features, olive skin tone, brown eyes and long dark-brown wavy hair. Image 2 is a product photo of her blue oxford shirt. Image 3 is a product photo of her gold hoop earrings. Image 4 is a product photo of her black leather tote. She is wearing exactly these pieces from her own wardrobe, reproduced faithfully (colour, fabric, cut, details); fill in only plain, unremarkable basics where something is not shown. Scene: Emma working from a cafe window seat with a laptop that has no logo, the tote on the chair beside her, a cappuccino, looking up from the screen; from the waist up. It must look like a real, ordinary iPhone photo from a camera roll: natural light, true-to-life colour, a little sensor noise, slightly imperfect casual framing, real skin texture with pores, no retouching, no beauty filter, not a fashion shoot, not glossy. No text, no captions, no watermark, no readable signs, no brand logos anywhere.
