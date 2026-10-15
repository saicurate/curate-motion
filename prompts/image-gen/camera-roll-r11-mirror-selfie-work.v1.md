---
id: prompt.image-gen.camera-roll-r11-mirror-selfie-work.v1
title: "Camera roll: Mirror selfie before work"
author: "agent:assets-agent"
area: image-gen
target: Nano Banana Pro (gemini-3-pro-image)
outcome: "didn't"
rating: 2
why: "A tote bag with a print and words hung on the coat rack, and the mirror had dust specks."
inputs:
  - face.emma.b.v1
  - garment.emma.turtleneck-black.v1
  - garment.emma.skirt-midi-satin-camel.v1
  - garment.emma.boots-ankle-black.v1
outputs: []
parents: [prompt.image-gen.camera-roll-photo.v1]
tags:
  - "persona:emma"
  - camera-roll
  - phone-photo
  - multi-reference
  - "framing:full"
createdAt: 2026-10-15
usedAt: ["2026-10-15T17:42:26Z"]
costUsd: 0.14345
source: "roll.py prompt(SHOTS['r11-mirror-selfie-work']); calls.jsonl tag roll:r11-mirror-selfie-work:v1; legacy file roll/r11-mirror-selfie-work-v1.jpg kept, not catalogued"
addedBy: "claude-code (prompt-library seed, 2026-10-15)"
---
The first image shows Emma's face. She is a 27-year-old woman from New York, 5 foot 6, average slim-to-medium build. Keep her identity exactly: the same face, features, olive skin tone, brown eyes and long dark-brown wavy hair. Image 2 is a product photo of her black turtleneck. Image 3 is a product photo of her camel satin midi skirt. Image 4 is a product photo of her black ankle boots. She is wearing exactly these pieces from her own wardrobe, reproduced faithfully (colour, fabric, cut, details); fill in only plain, unremarkable basics where something is not shown. Scene: Emma a mirror selfie in her apartment hallway mirror before work, holding a phone in a plain matte beige case with no logo, morning light, a coat rack behind her; full body. It must look like a real, ordinary iPhone photo from a camera roll: natural light, true-to-life colour, a little sensor noise, slightly imperfect casual framing, real skin texture with pores, no retouching, no beauty filter, not a fashion shoot, not glossy. No text, no captions, no watermark, no readable signs, no brand logos anywhere.
