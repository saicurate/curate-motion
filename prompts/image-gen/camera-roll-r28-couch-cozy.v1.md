---
id: prompt.image-gen.camera-roll-r28-couch-cozy.v1
title: "Camera roll: Cozy night in"
author: "agent:assets-agent"
area: image-gen
target: Nano Banana Pro (gemini-3-pro-image)
outcome: worked
rating: 4
why: "Picked first take: face matched B, her own pieces reproduced faithfully, a real phone-photo look, no logos or readable text."
inputs: [face.emma.b.v1, garment.emma.sweater-cable-knit-cream.v1, garment.emma.sweatpants-grey.v1]
outputs: [photo.emma.r28-couch-cozy.v1]
parents: [prompt.image-gen.camera-roll-photo.v1]
tags:
  - "persona:emma"
  - camera-roll
  - phone-photo
  - multi-reference
  - "framing:half"
createdAt: 2026-10-15
usedAt: ["2026-10-15T17:59:47Z"]
costUsd: 0.140882
source: "roll.py prompt(SHOTS['r28-couch-cozy']); calls.jsonl tag roll:r28-couch-cozy:v1"
addedBy: "claude-code (prompt-library seed, 2026-10-15)"
---
The first image shows Emma's face. She is a 27-year-old woman from New York, 5 foot 6, average slim-to-medium build. Keep her identity exactly: the same face, features, olive skin tone, brown eyes and long dark-brown wavy hair. Image 2 is a product photo of her cream cable-knit sweater. Image 3 is a product photo of her grey sweatpants. She is wearing exactly these pieces from her own wardrobe, reproduced faithfully (colour, fabric, cut, details); fill in only plain, unremarkable basics where something is not shown. Scene: Emma curled up on a couch in her apartment at night with a mug of tea and a blanket, warm lamp light, a TV glow off-frame; from the knees up. It must look like a real, ordinary iPhone photo from a camera roll: natural light, true-to-life colour, a little sensor noise, slightly imperfect casual framing, real skin texture with pores, no retouching, no beauty filter, not a fashion shoot, not glossy. No text, no captions, no watermark, no readable signs, no brand logos anywhere.
