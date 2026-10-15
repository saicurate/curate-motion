---
id: prompt.image-gen.selfie-emma-front-camera.v1
title: "Emma's front-camera selfie"
author: "agent:assets-agent"
area: image-gen
target: Nano Banana Pro (gemini-3-pro-image)
outcome: worked
rating: 4
why: "Picked first take: face matched B, her own pieces reproduced faithfully, a real phone-photo look, no logos or readable text."
inputs: [face.emma.b.v1, garment.emma.tee-black.v1]
outputs: [selfie.emma.selfie.v1]
parents: [prompt.image-gen.camera-roll-photo.v1]
tags:
  - "persona:emma"
  - selfie
  - phone-photo
  - multi-reference
  - "framing:selfie"
createdAt: 2026-10-15
usedAt: ["2026-10-15T17:25:54Z"]
costUsd: 0.140552
source: "roll.py prompt(SHOTS['emma-selfie']); calls.jsonl tag selfie:emma-selfie:v1"
addedBy: "claude-code (prompt-library seed, 2026-10-15)"
---
The first image shows Emma's face. She is a 27-year-old woman from New York, 5 foot 6, average slim-to-medium build. Keep her identity exactly: the same face, features, olive skin tone, brown eyes and long dark-brown wavy hair. Image 2 is a product photo of her black tee. She is wearing exactly these pieces from her own wardrobe, reproduced faithfully (colour, fabric, cut, details); fill in only plain, unremarkable basics where something is not shown. Make a front-camera selfie she took at arm's length: head and shoulders, facing the camera straight on, a natural relaxed smile, soft even daylight from a window in front of her, a plain light wall behind, her full face clearly visible and sharp, hair down, no hands covering the face. It must look like a real, ordinary iPhone photo from a camera roll: natural light, true-to-life colour, a little sensor noise, slightly imperfect casual framing, real skin texture with pores, no retouching, no beauty filter, not a fashion shoot, not glossy. No text, no captions, no watermark, no readable signs, no brand logos anywhere.
