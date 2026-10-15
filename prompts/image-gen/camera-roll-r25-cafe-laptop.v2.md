---
id: prompt.image-gen.camera-roll-r25-cafe-laptop.v2
title: "Camera roll: Working from a cafe (remake 2)"
author: "agent:assets-agent"
area: image-gen
target: Nano Banana Pro (gemini-3-pro-image)
outcome: worked
rating: 4
why: "Naming the brand to avoid ('not a MacBook, no Apple logo') and 'plain dark-grey unbranded' fixed it."
inputs:
  - face.emma.b.v1
  - garment.emma.shirt-oxford-blue.v1
  - garment.emma.earrings-hoops-gold.v1
  - garment.emma.bag-tote-leather-black.v1
outputs: [photo.emma.r25-cafe-laptop.v1]
parents: [prompt.image-gen.camera-roll-r25-cafe-laptop.v1]
tags:
  - "persona:emma"
  - camera-roll
  - phone-photo
  - multi-reference
  - "framing:half"
  - remake
createdAt: 2026-10-15
usedAt: ["2026-10-15T18:01:55Z"]
costUsd: 0.141898
source: "roll.py prompt(SHOTS['r25-cafe-laptop']) + redo extra; calls.jsonl tag roll:r25-cafe-laptop:v2"
addedBy: "claude-code (prompt-library seed, 2026-10-15)"
---
The first image shows Emma's face. She is a 27-year-old woman from New York, 5 foot 6, average slim-to-medium build. Keep her identity exactly: the same face, features, olive skin tone, brown eyes and long dark-brown wavy hair. Image 2 is a product photo of her blue oxford shirt. Image 3 is a product photo of her gold hoop earrings. Image 4 is a product photo of her black leather tote. She is wearing exactly these pieces from her own wardrobe, reproduced faithfully (colour, fabric, cut, details); fill in only plain, unremarkable basics where something is not shown. Scene: Emma working from a cafe window seat with a laptop that has no logo, the tote on the chair beside her, a cappuccino, looking up from the screen; from the waist up. It must look like a real, ordinary iPhone photo from a camera roll: natural light, true-to-life colour, a little sensor noise, slightly imperfect casual framing, real skin texture with pores, no retouching, no beauty filter, not a fashion shoot, not glossy. No text, no captions, no watermark, no readable signs, no brand logos anywhere.  The laptop is a plain dark-grey unbranded laptop whose lid has NO logo of any kind (not a MacBook, no Apple logo).
