---
id: prompt.image-gen.camera-roll-r10-night-out.v1
title: "Camera roll: Night out downtown"
author: "agent:assets-agent"
area: image-gen
target: Nano Banana Pro (gemini-3-pro-image)
outcome: worked
rating: 4
why: "Picked first take: face matched B, her own pieces reproduced faithfully, a real phone-photo look, no logos or readable text."
inputs:
  - face.emma.b.v1
  - garment.emma.dress-little-black.v1
  - garment.emma.heels-black.v1
  - garment.emma.bag-mini-black.v1
  - garment.emma.earrings-hoops-gold.v1
outputs: [photo.emma.r10-night-out.v1]
parents: [prompt.image-gen.camera-roll-photo.v1]
tags:
  - "persona:emma"
  - camera-roll
  - phone-photo
  - multi-reference
  - "framing:full"
createdAt: 2026-10-15
usedAt: ["2026-10-15T17:44:06Z"]
costUsd: 0.14329
source: "roll.py prompt(SHOTS['r10-night-out']); calls.jsonl tag roll:r10-night-out:v1"
addedBy: "claude-code (prompt-library seed, 2026-10-15)"
---
The first image shows Emma's face. She is a 27-year-old woman from New York, 5 foot 6, average slim-to-medium build. Keep her identity exactly: the same face, features, olive skin tone, brown eyes and long dark-brown wavy hair. Image 2 is a product photo of her little black dress. Image 3 is a product photo of her black heels. Image 4 is a product photo of her black mini bag. Image 5 is a product photo of her gold hoop earrings. She is wearing exactly these pieces from her own wardrobe, reproduced faithfully (colour, fabric, cut, details); fill in only plain, unremarkable basics where something is not shown. Scene: Emma a night out on the Lower East Side, standing outside a bar on the sidewalk at night, shot with the phone's flash, warm city lights and blurred people behind; full body, fun and candid, no readable signs. It must look like a real, ordinary iPhone photo from a camera roll: natural light, true-to-life colour, a little sensor noise, slightly imperfect casual framing, real skin texture with pores, no retouching, no beauty filter, not a fashion shoot, not glossy. No text, no captions, no watermark, no readable signs, no brand logos anywhere.
