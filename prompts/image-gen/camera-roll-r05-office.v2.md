---
id: prompt.image-gen.camera-roll-r05-office.v2
title: "Camera roll: At work in the studio (remake 2)"
author: "agent:assets-agent"
area: image-gen
target: Nano Banana Pro (gemini-3-pro-image)
outcome: "didn't"
rating: 2
why: "Still an iMac with an Apple logo: 'no logos on the monitor' wasn't enough; it needed 'not an iMac, no Apple logo'."
inputs:
  - face.emma.b.v1
  - garment.emma.shirt-oxford-blue.v1
  - garment.emma.trousers-black.v1
  - garment.emma.necklace-pendant-gold.v1
outputs: []
parents: [prompt.image-gen.camera-roll-r05-office.v1]
tags:
  - "persona:emma"
  - camera-roll
  - phone-photo
  - multi-reference
  - "framing:half"
  - remake
createdAt: 2026-10-15
usedAt: ["2026-10-15T17:59:07Z"]
costUsd: 0.141888
source: "roll.py prompt(SHOTS['r05-office']) + redo extra; calls.jsonl tag roll:r05-office:v2; legacy file roll/r05-office-v2.jpg kept, not catalogued"
addedBy: "claude-code (prompt-library seed, 2026-10-15)"
---
The first image shows Emma's face. She is a 27-year-old woman from New York, 5 foot 6, average slim-to-medium build. Keep her identity exactly: the same face, features, olive skin tone, brown eyes and long dark-brown wavy hair. Image 2 is a product photo of her blue oxford shirt. Image 3 is a product photo of her black trousers. Image 4 is a product photo of her gold pendant necklace. She is wearing exactly these pieces from her own wardrobe, reproduced faithfully (colour, fabric, cut, details); fill in only plain, unremarkable basics where something is not shown. Scene: Emma sitting at her desk in a small bright design studio in the Flatiron District, a monitor showing an abstract colour layout with no readable text, mood boards pinned behind her, turning toward the camera with a smile. It must look like a real, ordinary iPhone photo from a camera roll: natural light, true-to-life colour, a little sensor noise, slightly imperfect casual framing, real skin texture with pores, no retouching, no beauty filter, not a fashion shoot, not glossy. No text, no captions, no watermark, no readable signs, no brand logos anywhere.  The monitor shows only one full-screen abstract colour-block layout: no menu bar, no dock, no app icons, no interface, no logos on the monitor or keyboard.
