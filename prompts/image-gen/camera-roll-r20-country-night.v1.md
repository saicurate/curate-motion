---
id: prompt.image-gen.camera-roll-r20-country-night.v1
title: "Camera roll: Country night in Brooklyn"
author: "agent:assets-agent"
area: image-gen
target: Nano Banana Pro (gemini-3-pro-image)
outcome: worked
rating: 4
why: "Picked first take: face matched B, her own pieces reproduced faithfully, a real phone-photo look, no logos or readable text."
inputs:
  - face.emma.b.v1
  - garment.emma.camisole-satin-black.v1
  - garment.emma.jeans-straight-light-wash.v1
  - garment.emma.boots-cowboy-tan.v1
outputs: [photo.emma.r20-country-night.v1]
parents: [prompt.image-gen.camera-roll-photo.v1]
tags:
  - "persona:emma"
  - camera-roll
  - phone-photo
  - multi-reference
  - "framing:full"
createdAt: 2026-10-15
usedAt: ["2026-10-15T17:53:38Z"]
costUsd: 0.141846
source: "roll.py prompt(SHOTS['r20-country-night']); calls.jsonl tag roll:r20-country-night:v1"
addedBy: "claude-code (prompt-library seed, 2026-10-15)"
---
The first image shows Emma's face. She is a 27-year-old woman from New York, 5 foot 6, average slim-to-medium build. Keep her identity exactly: the same face, features, olive skin tone, brown eyes and long dark-brown wavy hair. Image 2 is a product photo of her black satin camisole. Image 3 is a product photo of her light-wash straight-leg jeans. Image 4 is a product photo of her tan cowboy boots. She is wearing exactly these pieces from her own wardrobe, reproduced faithfully (colour, fabric, cut, details); fill in only plain, unremarkable basics where something is not shown. Scene: Emma at a country-music bar night in Brooklyn, string lights and wood panelling behind her, mid-dance with a big grin, warm low light; full body, no readable signs. It must look like a real, ordinary iPhone photo from a camera roll: natural light, true-to-life colour, a little sensor noise, slightly imperfect casual framing, real skin texture with pores, no retouching, no beauty filter, not a fashion shoot, not glossy. No text, no captions, no watermark, no readable signs, no brand logos anywhere.
