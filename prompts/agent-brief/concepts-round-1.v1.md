---
id: prompt.agent-brief.concepts-round-1.v1
title: "Concepts round 1: five motion concepts with rough cuts and music"
author: "agent:main-session"
area: agent-brief
target: Claude Code subagent (general-purpose)
outcome: mixed
rating: 3
why: "Five concepts, storyboards, 8 Mixkit tracks and 10–12 s motion tests landed, but all at one length; the founder asked next for cooler transitions and the full 6 s–2 min spectrum."
inputs: []
outputs: []
parents:
  - prompt.motion-brief.founder-kickoff-motion-videos.v1
  - prompt.motion-brief.founder-channels-music-tracker.v1
tags: [agent-brief, concepts, remotion, music]
createdAt: 2026-10-15
usedAt: ["2026-10-15T15:53:13Z"]
source: "curate-app session 8dfb7189, Agent tool prompt \"Marketing video concepts (Remotion)\" 2026-10-15T15:53Z"
addedBy: "claude-code (prompt-library seed, 2026-10-15)"
---
You are making marketing motion-graphics video CONCEPTS for Curate, a fashion stylist iOS app (1.5.0 just went live on the App Store). Its mascot is Zee, a black plush kitten. The founder wants "crazy good motion graphic videos" built from the app's own animations, for ALL channels: Instagram, TikTok, Shorts, the App Store preview and the website. They have no music in mind and want to explore. Demo first: make concepts and short rough cuts now, not finished videos.

**LIVE TRACKER: the founder watches every small step in real time.**
- The tracker page is /Users/saikumar/Desktop/Curate/marketing/videos/tracker/index.html (already open in their browser). It re-reads /Users/saikumar/Desktop/Curate/marketing/videos/tracker/status.js every 3 s.
- Keep status.js updated after EVERY meaningful step: footage recorded, a scene built, a render started or finished, a track found. Rewrite the whole file each time, keeping the same shape: `window.CURATE_VIDEOS = { updated, phase, overall (0–100), concepts:[{id,title,idea,status:"queued"|"running"|"done",progress,steps:[{text,done,running}],files:[{path,label}]}], music:[{title,vibe,license,url,file}], log:[{t,text}] }`.
- Write it atomically: write a temp file, then mv.
- Paths in files/music are RELATIVE to the tracker folder, e.g. "../cuts/c1-v1.mp4" and "../music/track.mp3".
- Log lines are plain English for the founder: short, no jargon, no file paths in the text.
- Use ISO times.

**Folders:** /Users/saikumar/Desktop/Curate/marketing/videos/{footage,cuts,music,remotion}.

**Steps**
1. **Load the Remotion skills first,** via the Skill tool: `remotion:remotion-best-practices`, then `remotion:remotion-create`, `remotion:remotion-markup`, `remotion:remotion-render` as needed. Create the Remotion project in marketing/videos/remotion. Pin exact package versions.
2. **Footage from the REAL app,** never stand-ins of old screens.
   - Memory rules apply; read them in /Users/saikumar/.claude/projects/-Users-saikumar-Desktop-Curate-curate-app/memory/: real-device-screens-only.md, curate-app-ui-probe-harness.md, never-show-the-pipeline.md, curate-brand-guidelines.md, titles-geist-not-thick.md, curate-design-bar.md, no-red-message-text.md, shop-tab-preview.md (never show shopping or prices), keep-every-version.md, ask-before-spending-api-credits.md.
   - Use the app's dev probes in lib/dev/ on build 262's code: /Users/saikumar/Desktop/Curate/curate-app/.worktrees/app-262, read-only; make your own worktree from release/1.5.0-262 if you need probe tweaks.
   - Run them on your OWN new iPhone 16/17 Pro Max simulator (never the booted "iPhone 17"; never other sessions' simulators). Record with `xcrun simctl io <udid> recordVideo`, with a clean status bar via `xcrun simctl status_bar override` (9:41, full battery).
   - Moments to capture:
     - the real-speed photo scan roll with Zee's magnifier;
     - the "Up big" pieces wait and pieces lifting out (Zee naming them);
     - the Wardrobe with floating pieces;
     - Zee asks on the empty Wardrobe;
     - the chat with a look card and Style notes;
     - Zee's thinking lines;
     - the Try-ons tab;
     - the privacy shield;
     - the selfie camera with hints;
     - "Your wardrobe is ready" with Zee's cheer.
   - Earlier studies and research folders have recordings you may reuse ONLY if they show the current app, with no old screens: /Users/saikumar/Desktop/Curate/research/build-259, pieces-wait, selfie-b, photos-off, scan-face-down.
   - Zee's own clips are in the zee-sharp-v1 pack: /Users/saikumar/Desktop/Curate/research/zee-pack/app/zee-sharp-v1/. They're transparent or matted, so check. Use them as standalone motion elements too.
   - Fonts and colours: the app's Geist and Mist palette (see the app's lib/core/theme and lib/features/look/).
3. **Concepts.** Make 4–5. Keep the 4 already in the tracker, and add a 5th if you have a strong idea. For each:
   - a one-line idea, the hook in the first 1.5 s, a beat-by-beat storyboard, and on-screen words (very few; the founder hates text-heavy);
   - a 6–12 s ROUGH CUT rendered in 9:16 (1080×1920, 30 fps, H.264, small file).

   Motion-graphics feel:
   - phone frames floating in 3D space;
   - pieces flying out of photos into a closet grid;
   - kinetic type in Geist;
   - Zee as a character who reacts;
   - snappy, beat-synced cuts;
   - it must feel premium and fashion-y, not a slideshow.

   Put the cuts in marketing/videos/cuts/ as c1-v1.mp4 etc., and add each to its concept's files in status.js as soon as it renders.
4. **Music to explore.**
   - Find 6–10 royalty-free tracks across vibes: upbeat pop, chill lo-fi, fashion-house, cute/playful, cinematic.
   - Use sources whose licence allows commercial social and app-store use with no attribution trouble, e.g. the Pixabay Music license. Check and record each track's licence exactly.
   - If you can download legally (direct file links), save them to marketing/videos/music/; otherwise give the source URL.
   - List them in status.js music.
   - Cut at least one rough cut to a track, and say which.
   - No paid services, no AI music generation and no paid API calls at all.
5. **Finish.**
   - Set phase "Concepts ready: pick one", overall 100.
   - Delete your simulator and run `flutter clean` in any worktree you built.
   - Make a short summary.

**Rules**
- No prod changes, no uploads, no paid calls.
- Never print secrets.
- Use they/them for the founder.
- Don't touch other sessions' worktrees or simulators.
- If something blocks you, write it to the tracker log immediately in plain words.

**Report back:** the concepts, one line each with its file; the music list with licences; and what you'd pick.
