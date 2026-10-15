---
id: prompt.image-gen.camera-roll-r23-rainy-day.v1
title: "Camera roll: Rainy commute"
author: "agent:assets-agent"
area: image-gen
target: Nano Banana Pro (gemini-3-pro-image)
outcome: worked
rating: 4
why: "Picked first take: face matched B, her own pieces reproduced faithfully, a real phone-photo look, no logos or readable text."
inputs:
  - face.emma.b.v1
  - garment.emma.coat-trench-khaki.v1
  - garment.emma.jeans-straight-dark-wash.v1
  - garment.emma.boots-ankle-black.v1
outputs: [photo.emma.r23-rainy-day.v1]
parents: [prompt.image-gen.camera-roll-photo.v1]
tags:
  - "persona:emma"
  - camera-roll
  - phone-photo
  - multi-reference
  - "framing:full"
createdAt: 2026-10-15
usedAt: ["2026-10-15T17:55:45Z"]
costUsd: 0.14282
source: "roll.py prompt(SHOTS['r23-rainy-day']); calls.jsonl tag roll:r23-rainy-day:v1"
addedBy: "claude-code (prompt-library seed, 2026-10-15)"
---
The first image shows Emma's face. She is a 27-year-old woman from New York, 5 foot 6, average slim-to-medium build. Keep her identity exactly: the same face, features, olive skin tone, brown eyes and long dark-brown wavy hair. Image 2 is a product photo of her khaki trench coat. Image 3 is a product photo of her dark-wash straight-leg jeans. Image 4 is a product photo of her black ankle boots. She is wearing exactly these pieces from her own wardrobe, reproduced faithfully (colour, fabric, cut, details); fill in only plain, unremarkable basics where something is not shown. Scene: Emma walking on a wet Manhattan sidewalk on a rainy day holding a plain black umbrella, reflections on the pavement, yellow taxi blurred behind; full body. It must look like a real, ordinary iPhone photo from a camera roll: natural light, true-to-life colour, a little sensor noise, slightly imperfect casual framing, real skin texture with pores, no retouching, no beauty filter, not a fashion shoot, not glossy. No text, no captions, no watermark, no readable signs, no brand logos anywhere.
