---
id: prompt.image-gen.camera-roll-r05-office.v3
title: "Camera roll: At work in the studio (remake 3)"
author: "agent:assets-agent"
area: image-gen
target: Nano Banana Pro (gemini-3-pro-image)
outcome: worked
rating: 4
why: "Naming the brand to avoid ('not an iMac, no Apple logo') and describing a plain matte-black monitor fixed it."
inputs:
  - face.emma.b.v1
  - garment.emma.shirt-oxford-blue.v1
  - garment.emma.trousers-black.v1
  - garment.emma.necklace-pendant-gold.v1
outputs: [photo.emma.r05-office.v1]
parents: [prompt.image-gen.camera-roll-r05-office.v1]
tags:
  - "persona:emma"
  - camera-roll
  - phone-photo
  - multi-reference
  - "framing:half"
  - remake
createdAt: 2026-10-15
usedAt: ["2026-10-15T18:01:38Z"]
costUsd: 0.143918
source: "roll.py prompt(SHOTS['r05-office']) + redo extra; calls.jsonl tag roll:r05-office:v3"
addedBy: "claude-code (prompt-library seed, 2026-10-15)"
---
The first image shows Emma's face. She is a 27-year-old woman from New York, 5 foot 6, average slim-to-medium build. Keep her identity exactly: the same face, features, olive skin tone, brown eyes and long dark-brown wavy hair. Image 2 is a product photo of her blue oxford shirt. Image 3 is a product photo of her black trousers. Image 4 is a product photo of her gold pendant necklace. She is wearing exactly these pieces from her own wardrobe, reproduced faithfully (colour, fabric, cut, details); fill in only plain, unremarkable basics where something is not shown. Scene: Emma sitting at her desk in a small bright design studio in the Flatiron District, a monitor showing an abstract colour layout with no readable text, mood boards pinned behind her, turning toward the camera with a smile. It must look like a real, ordinary iPhone photo from a camera roll: natural light, true-to-life colour, a little sensor noise, slightly imperfect casual framing, real skin texture with pores, no retouching, no beauty filter, not a fashion shoot, not glossy. No text, no captions, no watermark, no readable signs, no brand logos anywhere.  Her computer is a plain matte-black external monitor on a simple stand with NO logo anywhere (not an iMac, no Apple logo), showing only a full-screen abstract colour-block layout with no menu bar, no dock and no icons.
