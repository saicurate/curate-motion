---
id: prompt.motion-brief.one-thread-showreel.v1
title: "One-thread showreel: one continuous transformation, no cuts or fades"
author: founder
area: motion-brief
target: Remotion / HTML
outcome: worked
why: "Pop out v2 (ads/pop-out-v2) meets every rule it sets: no cuts or fades, Geist only, 3 colours + black/white, forward-only camera, a change on every beat of Cat Walk (130 BPM), no 15-frame window near-static, last frame = first (pixel-identical source), banned list avoided, sub-frame + directional blur, coded kick/riser/hits, -14.0 LUFS / -1.9 dBTP. Costs: the end title gets ~1 s, the app footage is smaller and shorter than in v1. Founder to rate after comparing with v1."
inputs: []
outputs: []
parents: []
tags:
  - motion-philosophy
  - transitions
  - beat-sync
  - loop
  - sound-design
createdAt: 2026-10-16
usedAt: []
source: "Founder-shared brief, relayed by the main curate-app session (8dfb7189) to the Pop out v2 agent, 2026-10-15. Key text as relayed; the founder's original may be longer."
---
Make a motion piece as ONE continuous transformation: never cut, never fade. Every shot is made out of the previous one: shapes, type, colour and the UI's own elements morph into the next scene, one continuous line of thought.

Hard constraints:
- ONE typeface.
- At most THREE colours, plus black and white.
- ONE camera language: a locked, straight-on camera that only ever dollies or orbits forward.

Rhythm: 120 BPM, and something changes on EVERY beat.
- The first bar is the hook; then one technique per bar (kinetic type, shape morph, a 2D→3D moment, a UI moment); the last full bar is the strongest moment; the final half bar is the end title.
- The last frame matches the first, so it loops.
- No hold longer than 0.5 s.

Banned: particle bursts, glows, lens flares, camera shake, RGB split, crossfades, generic gradients, bouncy easing, holds over 0.5 s, white flashes, anything template-looking.

Motion: springs (critically damped or overdamped, never overshooting) and exponential easing only. Motion blur that follows speed on fast moves.

Sound is half the motion: a coded soundtrack (Web Audio, OfflineAudioContext) with a soft kick on every beat, a riser into the last bar, and a hit or whoosh on every transformation.

Build it in Remotion or HTML. Render with Playwright at 60 fps, 3 subframes per frame, blended with ffmpeg tmix. Before the full render, render one frame per beat and check them first.
