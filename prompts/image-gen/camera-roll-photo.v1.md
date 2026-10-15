---
id: prompt.image-gen.camera-roll-photo.v1
title: "Persona camera-roll photo: face reference + her own garments (template)"
author: "agent:assets-agent"
area: image-gen
target: Nano Banana Pro (gemini-3-pro-image)
outcome: worked
rating: 4
why: "Face B as image 1 plus each garment as its own image kept her identity and her real clothes across 33 photos. The weak spot was props: screens, tote prints, shop signs (see the remakes); say 'no logo' for every object that might carry one."
inputs: [face.emma.b.v1]
outputs: []
parents: []
tags:
  - "persona:emma"
  - camera-roll
  - phone-photo
  - multi-reference
  - template
template: true
createdAt: 2026-10-15
usedAt: []
source: marketing/videos/assets/_tools/roll.py (prompt() + PHONE_LOOK)
addedBy: "claude-code (prompt-library seed, 2026-10-15)"
---
The first image shows Emma's face. She is a 27-year-old woman from New York, 5 foot 6, average slim-to-medium build. Keep her identity exactly: the same face, features, olive skin tone, brown eyes and long dark-brown wavy hair. {for each garment n = 2, 3, …: "Image {n} is a product photo of her {garment name}. "}She is wearing exactly these pieces from her own wardrobe, reproduced faithfully (colour, fabric, cut, details); fill in only plain, unremarkable basics where something is not shown. Scene: Emma {scene}. It must look like a real, ordinary iPhone photo from a camera roll: natural light, true-to-life colour, a little sensor noise, slightly imperfect casual framing, real skin texture with pores, no retouching, no beauty filter, not a fashion shoot, not glossy. No text, no captions, no watermark, no readable signs, no brand logos anywhere. 

## Placeholders
- {scene}: where she is and what she's doing, plus the framing ("full body", "from the waist up"), e.g. "sitting at a small wooden table in a busy neighbourhood coffee shop in Astoria, Queens, holding an iced latte, morning light from the window; a friend took it across the table".
- Images: image 1 = the face reference, images 2… = the garments' product shots, in the order named.
- For a selfie or a try-on base, replace the Scene line with the selfie / try-on block (see prompt.image-gen.selfie-emma-front-camera.v1 and prompt.image-gen.tryon-base-emma-1.v1).
