---
id: prompt.agent-brief.pop-out-v2-one-thread.v1
title: "Pop out v2: v1's message under the one-thread motion rules"
author: "agent:main-session"
area: agent-brief
target: Claude Code subagent (general-purpose)
outcome: worked
rating: 4
why: "First take shipped as a draft after 6 still-per-beat contact-sheet passes (fixes: outlines invisible in the garment's own colour → next palette colour; lattice too faint → white; end-dolly showed the mark's own star → masked; bar-7 pieces left the frame → limited parallax; status bar flipped with the fold → held). Master renders/pop-out-v2/tiktok/15s/pop-out-v2_tiktok_9x16_15s_v2.mp4. Weak spots: short end title, the 'strongest' bar is busy rather than one clear image."
inputs: []
outputs: [sfx.curate.pop-out-v2-sound.v1]
parents: [prompt.motion-brief.one-thread-showreel.v1, prompt.agent-brief.first-real-ads.v1]
tags: [remix, ads, pop-out, motion-philosophy]
createdAt: 2026-10-16
usedAt: ["2026-10-16T01:07:55Z"]
source: "curate-app session 8dfb7189, Agent tool prompt \"Pop out v2\" 2026-10-15 (lightly trimmed: local paths removed)"
---
Make **Pop out v2**, a 15-second 9:16 ad for Curate (a fashion stylist iOS app; mascot Zee, a black plush kitten). It follows a strict motion-design philosophy, so the founder can compare it with v1 and decide whether this becomes the permanent motion rules. Quality bar: world-class motion designer, not an editor.

Repo: curate-motion. Read AGENTS.md, RULES.md and library/brand/BRAND.md. Look at ads/pop-out (v1), its renders (look at v1 first), and the motion/ components.
- Use only approved library assets by id: footage.emma.*, screenshot.emma.*, garment.emma.* (with cut-outs), photo.emma.*, zee.*, music.*, brand fonts and logo.
- Search the prompt library first (tools/prompts search), per AGENTS.md.
- Build it as a NEW ad, ads/pop-out-v2/. Don't change v1.

The philosophy (from a founder-shared brief; follow all of it)
1. Never cut, never fade. Everything transforms. Every shot is made out of the previous one: shapes, type, colour, and the real app UI's own elements morph into the next scene. One continuous line of thought:
   - the outline of a piece popping out of her photo becomes the scan's photo grid;
   - the grid's tiles fold into the Wardrobe's tiles;
   - the last piece collapses into Curate's 4-point star (redraw the mark as a vector so it can morph);
   - the star becomes the end card.
   - Real app footage still appears, but it enters and leaves THROUGH transformations: masks shaped by the previous element, matched geometry, the phone frame forming from a line.
2. Hard constraints: ONE typeface, Geist. At most THREE colours plus black and white, from Emma's wardrobe: denim #4A6A8F, camel #B8875A, sage #9DAA8C (the app footage keeps its real colours inside the phone; every graphic element is on palette). ONE camera language: a locked, straight-on camera that only ever dollies or orbits forward.
3. Rhythm: 120 BPM (or the track's real tempo, beat-mapped), and something changes on EVERY beat. The first bar is the hook; then one technique per bar (kinetic type, shape morph, a 2D→3D moment, a UI moment); the last full bar is the strongest moment; the final half bar is the end title. The FINAL FRAME MATCHES THE FIRST, so it loops (check with a pixel diff). No hold longer than 0.5 s (frame-difference scan: no 30 fps window of 15 frames may be near-static).
4. BANNED: particle bursts, glows, lens flares, camera shake, RGB split, crossfades; generic gradients; bouncy easing (critically damped or overdamped only, plus exponential easing); holds over 0.5 s; white flashes; anything template-looking. v1 used a flash and bouncy springs, so don't.
5. Real motion blur: sub-frame accumulation (CameraMotionBlur with 3+ samples, or 3 subframes blended with ffmpeg tmix), plus directional blur that follows speed on fast moves.
6. Sound design is half the motion. Keep a music bed from the library, beat-matched (Cat Walk is about 130 BPM; set the BPM from its beat map). ADD designed sound generated in code: a soft kick reinforcing each beat; a riser into the last full bar; a crisp, tasteful hit or whoosh on every transformation. Mix to −14 LUFS, true peak ≤ −1 dBTP. No paid or stock SFX.
7. Process: before the full render, render ONE STILL PER BEAT and look at them as a contact sheet. Fix anything cluttered, off-beat, overlapping or hard to read. Iterate. Only then do the full render, at --concurrency 1, and check every frame for dark or missing layers.

Content: keep v1's message. "Your closet is already in your photos" → her real pieces come out of her real photos → the real scan → her Wardrobe → Curate on the App Store, with Zee present. Keep TikTok/Reels safe zones (no text in the bottom ~20% or the right ~15%).

Output: ads/pop-out-v2/ (ad.json with assets by id + the track + status draft + disclosures; README with the philosophy and the beat map; index.tsx), registered in ads/registry.ts. Master render via tools/render (tools/sync renders push), a 720 px phone copy, and v1 vs v2 side by side at the top of the phone review page with a plain-English list of what v2 does differently. Log the founder's brief in the prompt library and this brief as a remix of it. Don't write permanent motion rules into RULES.md or AGENTS.md. No paid calls, never print secrets, no git commits.
