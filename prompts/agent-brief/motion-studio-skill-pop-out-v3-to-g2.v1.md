---
id: prompt.agent-brief.motion-studio-skill-pop-out-v3-to-g2.v1
title: Motion studio skill + Pop out v3 to G2
author: "agent:main-session"
area: agent-brief
target: Claude Code subagent (general-purpose)
outcome: untested
inputs: []
outputs: []
parents:
  - prompt.motion-brief.smoother-clearer-motion-build-the-studio-skill-and.v1
  - prompt.agent-brief.pop-out-v2-one-thread.v1
tags: [studio-process, pop-out, motion-philosophy]
createdAt: 2026-10-16
usedAt: []
addedBy: "agent:motion-studio"
---
Build Curate's MOTION STUDIO SKILL in the curate-motion repo, then take Pop out v3 through its first gates (G1–G2), then STOP for the founder.

Why v2 isn't smooth enough: 30 fps; too few motion-blur samples (fast moves echo); ALL overshoot banned (stiff); some bars too busy; end title ~1 s; the real app on screen too briefly; no scored critic loop.

Implement the article's method as reusable tooling, not one-off scripts:
1. Render contract: frames from time alone, no timers / Math.random (seeded noise only), DEFAULT 60 fps for new ads, a determinism check (render frame N twice, hashes match). Keep Remotion at 60 fps; if too slow or flaky, say so and benchmark.
2. Motion with mass: motion/springs.ts, closed-form springs (pure functions of t), stacking track(t) = v0 + Σ (v_i − v_{i−1}) × spring(t − t_i), presets per object class (ui ~2–4% overshoot, panel ~0%, camera long critically damped, headline lands hard and holds to read, mascot (Zee) bounces on purpose, piece has mass and a slight settle). Bouncy easing banned except mascot. Exponential easing helpers.
3. Motion blur that doesn't echo: 8+ sub-frame samples on fast moves, directional blur from the analytic velocity, a STRIP test (12 frames around the fastest move, checked for echo/ghosting).
4. Measure the music: tools/beats (Python, librosa) → beats.json (bpm, beats, downbeats, hits) stored as each track's beat map in its manifest. State changes on beats, big moments on downbeats, clicks and whooshes on hits. Sound synthesised in code on the same clock (extend v2's sound.ts into motion/sound/), −14 LUFS. Blindfold test: audio-only render judged by waveform and onset shape.
5. State lists: shotlist.md per ad: time range, ENTRY, EXIT, PURPOSE, motion class; HOOK 0–2 s, PROBLEM, REVEAL (a real interaction), PROOF (one real screen or number), CLOSE (clean final state, READABLE CTA held ≥ 2 s); last frame = first. A beat that can't justify itself is cut.
6. Reference → style_guide.md: frames every 0.5 s with ffmpeg; palette hex, type, shot lengths, transitions, camera, grain, banned defaults; take the grammar, never the subjects, logos or copy. Ask for a new reference by kind; don't invent.
7. THE CRITIC: tools/critic <ad> [--render <file>]: contact sheet 2 fps 6 across, fastest-move strip, phone test (360 px), loop check (twice back to back), determinism hash, loudness → reviews/<ad>/<date>/ with a scoring template: hook in 2 s, phone readability, motion smoothness, variety, sound sync, brand accuracy (1–10); the 3 worst defects with timestamp, evidence, local fix; fix, re-render those seconds, repeat until every score is 8+; record scores per round.
8. Gates in ad.json (G1 assets approved; G2 style guide + shot list (founder); G3 stills for every shot, critiqued (founder); G4 960×540 animatic, placeholder audio; G5 full pass, polish, sound; G6 formats from the same timeline, never cropped, loop check, poster frame, README), in the AdSpec schema, validated.
9. Package as .claude/skills/motion-reel/SKILL.md (/motion-reel <ad-or-brief>, <length>, <ratio>, reference <id>), mirrored in AGENTS.md; studio folder per ad; decisions/ + CHANGELOG.

Pop out v3 through G1–G2: G1 the asset list (approved; real footage stays real). G2: brief.md (FILM: "Your whole closet is already in your camera roll; Curate pulls it out."; US 18–34; 15 s with 6 s / 30 s cut-downs planned; 9:16 first; ASSETS; VISUAL; HARD LINE: never invent product screens or numbers; no prices or shopping), style_guide.md, shotlist.md on the measured beat map: smoother and clearer than v2 (fewer simultaneous elements, one focal point per beat, longer gliding camera, ≥ 3 s of real footage big, end card ≥ 2 s, 60 fps); one still per shot. Publish a phone page for the founder (brief, style guide with swatches, storyboard, what's different from v2) and STOP.

Rules: no paid calls; never print secrets; no git commits; don't write the motion rules into RULES.md: mark them proposed, pending the founder's OK after v3; they/them for the founder.
