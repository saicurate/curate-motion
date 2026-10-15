---
id: prompt.image-gen.tryon-base-emma-2.v1
title: "Try-on base photo 2: full body, plain wall"
author: "agent:assets-agent"
area: image-gen
target: Nano Banana Pro (gemini-3-pro-image)
outcome: worked
rating: 4
why: "Picked first take: face matched B, her own pieces reproduced faithfully, a real phone-photo look, no logos or readable text."
inputs:
  - face.emma.b.v1
  - garment.emma.tee-black.v1
  - garment.emma.jeans-straight-dark-wash.v1
  - garment.emma.sneakers-leather-white.v1
outputs: [tryon.emma.tryon-base-2.v1]
parents: [prompt.image-gen.camera-roll-photo.v1]
tags:
  - "persona:emma"
  - tryon-base
  - phone-photo
  - multi-reference
  - "framing:tryon"
createdAt: 2026-10-15
usedAt: ["2026-10-15T17:53:11Z"]
costUsd: 0.14136
source: "roll.py prompt(SHOTS['tryon-base-2']); calls.jsonl tag tryon:tryon-base-2:v1"
addedBy: "claude-code (prompt-library seed, 2026-10-15)"
---
The first image shows Emma's face. She is a 27-year-old woman from New York, 5 foot 6, average slim-to-medium build. Keep her identity exactly: the same face, features, olive skin tone, brown eyes and long dark-brown wavy hair. Image 2 is a product photo of her black tee. Image 3 is a product photo of her dark-wash straight-leg jeans. Image 4 is a product photo of her white leather sneakers. She is wearing exactly these pieces from her own wardrobe, reproduced faithfully (colour, fabric, cut, details); fill in only plain, unremarkable basics where something is not shown. Make a full-body photo for a virtual try-on app: she stands straight, facing the camera, arms relaxed slightly away from her sides, feet hip-width apart and fully visible, head to toe in frame with a little space above and below, neutral friendly expression, against a plain light-grey wall in her apartment with a light wood floor, soft even daylight, no shadows across the body. Taken by a friend with a phone at chest height. Her hair is tucked behind her shoulders. It must look like a real, ordinary iPhone photo from a camera roll: natural light, true-to-life colour, a little sensor noise, slightly imperfect casual framing, real skin texture with pores, no retouching, no beauty filter, not a fashion shoot, not glossy. No text, no captions, no watermark, no readable signs, no brand logos anywhere.
