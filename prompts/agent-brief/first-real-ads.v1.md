---
id: prompt.agent-brief.first-real-ads.v1
title: "Produce the first three real ads (Pop out, Rain or shine, Zee wipe)"
author: "agent:main-session"
area: agent-brief
target: Claude Code subagent (general-purpose)
outcome: untested
why: In production when this library was seeded. Rate it when the ads land.
inputs: []
outputs: []
parents:
  - prompt.motion-brief.founder-best-ads-transitions.v1
tags: [agent-brief, ads, transitions, remotion]
createdAt: 2026-10-15
usedAt: ["2026-10-15T22:31:50Z"]
source: "curate-app session 8dfb7189, Agent tool prompt \"Produce the first 3 real ads\" 2026-10-15T22:31Z"
addedBy: "claude-code (prompt-library seed, 2026-10-15)"
---
You are the motion designer and editor producing Curate's FIRST REAL ADS. Curate is a fashion stylist iOS app whose mascot is Zee, a black plush kitten; 1.5.0 is on the US App Store. The founder asked: "give me some of the best ads that you can do, the best motion graphic video with some really cool transitions." Quality is everything: these must feel premium, fashion-forward and native to TikTok/Reels, not like a slideshow.

**The repo is curate-motion:** /Users/saikumar/Desktop/Curate/curate-motion. Read first:
- AGENTS.md, RULES.md, ARCHITECTURE.md, library/brand/BRAND.md;
- library/footage/INVENTORY.md;
- motion/ (the PhoneFrame, PopOut, TitleBehind, FlashPrint, ScanTrace, Ellipse, StrokeFrame, WhipPan, ClosetReveal, ZeeActor, KineticType, BeatClock, Piece/Look, EndCard components);
- ads/meet-zee and ads/explainer (how an ad is structured: ad.json, index.tsx, registry, formats and lengths);
- ads/_legacy/remotion-src (the earlier motion tests, including c14 Pop out, c9 Rain or shine, c7 Zee wipe and c12 Mon to Sun);
- the concept storyboards in /Users/saikumar/Desktop/Curate/marketing/videos/tracker/status.js (c1–c14).

Use ONLY approved library assets, by id, via `tools/catalog search`. That means:
- the 141 real app-animation clips `footage.emma.*`, recorded from the real app on Emma's account at 60 fps, 1320×2868;
- 143 screenshots `screenshot.emma.*`;
- Emma's 50 garments with cut-outs (`garment.emma.*`) and her 30 camera-roll photos (`photo.emma.*`);
- 48 Zee clips (`zee.*`);
- 8 Mixkit music tracks (`music.*`), with beat maps where present;
- brand fonts and logo.

Run `tools/sync pull --ad <id>`, or pull by id, to get the media locally.

**Make these 3 ads.** The founder didn't pick, so these are the strongest concepts. Each one is 9:16 1080×1920 at 30 fps, H.264, with the music bed, no voiceover, and words kinetic in Geist, very few:
1. **"Pop out"** (concept c14, from the founder's reference reel: cut-outs pop out of the phone and return).
   - **15 s:** a top-down phone showing her camera roll. On the beat, her real pieces burst out of her own photos with an overshoot spring, hold, and sink back. The line types on behind the pieces at about 1 s, e.g. "Your closet is already in your photos."
   - Then a match cut into the app's REAL scan roll footage, then pieces arriving (real footage), then the Wardrobe with floating pieces.
   - **End card:** the logo, "Curate", "On the App Store", and Zee peeking.
   - Also make a **30 s** cut and a **6 s** bumper.
   - Track: Cat Walk, or whichever library track fits best by beat map.
2. **"Rain or shine"** (c9).
   - **15 s:** a windshield-wiper sweep transition clears rain to reveal the look swapping for the weather, using Emma's real looks from her chat (real footage of the look card landing and Zee thinking: "Going through your 49 pieces…").
   - Weather words kinetic. End card.
3. **"Zee wipe"** (c7).
   - **Three 6 s bumpers** plus one **15 s** compilation. Zee leaps at the lens and her fur wipes to the next look/moment (the real app footage of looks, Wardrobe and Try-ons).
   - End card.

**Quality bar: non-negotiable.**
- **Transitions:** match cuts, whip pans with motion blur, masks through the phone and through Zee, spring physics, beat-synced cuts (use BeatClock and the track's beat map; check drops by analysing the audio), parallax depth, light leaks or flashes used sparingly, and a 3D phone tilt with perspective.
- **The real app footage looks crisp:** use the 60 fps masters, scale them carefully, and put them in a clean phone frame with a soft shadow. Never show a status bar other than the clean one, and NEVER old screens, prices, shopping, logos of other brands, or the pipeline.
- **Safe zones** for TikTok/Reels UI: keep words and the logo out of the bottom ~20% and right ~15%.
- **The hook is in the first 1 s.** No dead frames. Loop-friendly endings for the 6 s ones.
- **Brand:** monochrome ground (BRAND.md ramp), Geist only, colour comes from the clothes and photos.
- **Check every render frame by frame:** extract a contact sheet at 10 fps and LOOK at it.
  - Chrome sometimes dropped layers at high concurrency (black phone screens, missing pieces) in earlier renders. Render at concurrency ≤3 and check for dark or missing frames. Redo anything broken.
- **Audio:** music loudness about −14 LUFS, a clean fade or button ending, no clipping.

**Output**
- Each ad lives in `ads/<ad-id>/` (ad.json with assets by id, the track id, lengths, channels, status draft, plus README.md and index.tsx), registered in the repo's registry. Follow the repo's conventions exactly. Don't break meet-zee or explainer.
- Render with `tools/render` into renders/ (gitignored); run `tools/sync renders push`.
- Also make a 4:5 (1080×1350) version of the Pop out 15 s, for the Instagram feed.
- Update the live tracker /Users/saikumar/Desktop/Curate/marketing/videos/tracker/status.js: add a "Real ads" phase and, for each ad, files pointing to small preview copies in marketing/videos/cuts/. Plain-English log lines.
- **Phone page:** publish ONE artifact (load the artifact-design skill first; icon "video"), a single file with all the ads inlined as phone-friendly H.264 copies (under 15 MB total; make 720×1280 previews if needed), each with its length, track and a one-line idea. Give the URL.

**Rules**
- No paid calls (no voice, no image or video generation).
- Never print secrets.
- No git commits (the main session commits).
- Another agent may be generating voice samples (touching config/voice.json, tools/lib/voice.ts and library/voice/). Don't touch those files.
- Use they/them for the founder.

**Report:** each ad with its file paths, lengths, track and transitions used; the artifact URL; anything you'd improve next; and which one you'd run first.
