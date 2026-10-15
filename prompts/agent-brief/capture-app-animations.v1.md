---
id: prompt.agent-brief.capture-app-animations.v1
title: "Capture every app animation as footage clips (real account first, probes where needed)"
author: "agent:main-session"
area: agent-brief
target: Claude Code subagent (general-purpose)
outcome: worked
rating: 4
why: "141 clips (117 of 131 moments) at 60 fps from Emma's real account, 27 via probes; the brief pins the simulator's UDID because another session once hijacked a recording."
inputs: []
outputs:
  - footage.emma.add-item-sheet.v1
  - footage.emma.adjust-from-notes.v1
  - footage.emma.adjust-pill-open.v1
  - footage.emma.adjust-sheet-dismiss.v1
  - footage.emma.adjust-slider-toast.v1
  - footage.emma.at-work-pill-rise.v1
  - footage.emma.chat-drawer-close.v1
  - footage.emma.chat-drawer-open.v1
  - footage.emma.chat-drawer-reopen.v1
  - footage.emma.chat-drawer-search.v1
  - footage.emma.chat-new-from-drawer.v1
  - footage.emma.chat-open-starters.v1
  - footage.emma.chat-thinking-lines.v1
  - footage.emma.chat-thinking-lines.v2
  - footage.emma.chat-thinking-lines.v3
  - footage.emma.cold-launch-splash.v1
  - footage.emma.cold-launch-splash.v2
  - footage.emma.composer-type-send.v1
  - footage.emma.composer-type-send.v2
  - footage.emma.dates-card-arrive.v1
  - footage.emma.dates-card-pick.v1
  - footage.emma.duplicate-review-keep.v1
  - footage.emma.duplicate-review-pick.v1
  - footage.emma.duplicate-review-sheet.v1
  - footage.emma.email-signup-push.v1
  - footage.emma.extraction-found-tag.v1
  - footage.emma.extraction-wait.v1
  - footage.emma.first-piece-lift.v1
  - footage.emma.first-piece-lift.v2
  - footage.emma.front-door-doors-open.v1
  - footage.emma.front-door-type-reel.v1
  - footage.emma.item-detail-back.v1
  - footage.emma.item-detail-open.v1
  - footage.emma.item-edit-sheet.v1
  - footage.emma.location-ask-alert.v1
  - footage.emma.location-ask-foggy-window.v1
  - footage.emma.location-ask-sky-wipe.v1
  - footage.emma.look-card-landing.v1
  - footage.emma.look-card-landing.v2
  - footage.emma.look-card-landing.v3
  - footage.emma.look-love-it.v1
  - footage.emma.look-piece-keep.v1
  - footage.emma.look-piece-lift.v1
  - footage.emma.multiple-looks-swipe.v1
  - footage.emma.notebook-sheet.v1
  - footage.emma.ob-about-name-birthday.v1
  - footage.emma.ob-body-3d-tapes.v1
  - footage.emma.ob-body-3d.v1
  - footage.emma.ob-budget-card-flip.v1
  - footage.emma.ob-handle-stamp-fly.v1
  - footage.emma.ob-mirror-payoff.v1
  - footage.emma.ob-mirror-reading.v1
  - footage.emma.ob-pairs-bracket-fold.v1
  - footage.emma.ob-username-check.v1
  - footage.emma.photos-off-two-taps.v1
  - footage.emma.photos-off-yay.v1
  - footage.emma.pieces-photo-up-big.v1
  - footage.emma.pieces-up-and-tuck.v1
  - footage.emma.privacy-shield-zee-peek.v1
  - footage.emma.question-card-answer.v1
  - footage.emma.question-card-arrive.v1
  - footage.emma.ready-pill-change.v1
  - footage.emma.ready-pill-to-cheer.v1
  - footage.emma.required-update.v1
  - footage.emma.review-add-to-wardrobe.v1
  - footage.emma.review-count-up.v1
  - footage.emma.review-remove-undo.v1
  - footage.emma.scan-found-end.v1
  - footage.emma.scan-roll.v1
  - footage.emma.scan-stage-rise-deck.v1
  - footage.emma.selfie-hand-back.v1
  - footage.emma.selfie-hand-back.v2
  - footage.emma.selfie-live-hints.v1
  - footage.emma.selfie-live-hints.v2
  - footage.emma.selfie-ring-opens.v1
  - footage.emma.selfie-ring-opens.v2
  - footage.emma.selfie-ring-zee-peek.v1
  - footage.emma.selfie-ring-zee-peek.v2
  - footage.emma.selfie-shutter-thats-you.v1
  - footage.emma.selfie-shutter-thats-you.v2
  - footage.emma.style-fact-pill.v1
  - footage.emma.style-notes-open.v1
  - footage.emma.style-notes-scroll.v1
  - footage.emma.tab-switch.v1
  - footage.emma.take-add-item-extraction.v1
  - footage.emma.take-chat-drawer.v1
  - footage.emma.take-chat-hero.v1
  - footage.emma.take-chat-look-explore.v1
  - footage.emma.take-chat-look-tonight.v1
  - footage.emma.take-chat-look-trip.v1
  - footage.emma.take-chat-look-work.v1
  - footage.emma.take-cold-launch.v1
  - footage.emma.take-duplicate-keep.v1
  - footage.emma.take-find-more.v1
  - footage.emma.take-onboarding.v1
  - footage.emma.take-photo-scan.v1
  - footage.emma.take-probe-photos-off.v1
  - footage.emma.take-probe-pieces-wait.v1
  - footage.emma.take-probe-required-update.v1
  - footage.emma.take-probe-selfie-flow-2.v1
  - footage.emma.take-probe-selfie-flow.v1
  - footage.emma.take-probe-wardrobe-leave.v1
  - footage.emma.take-probe-zee-back.v1
  - footage.emma.take-probe-zee-beach.v1
  - footage.emma.take-probe-zee-empty.v1
  - footage.emma.take-probe-zee-idea.v1
  - footage.emma.take-probe-zee-kept.v1
  - footage.emma.take-probe-zee-morning.v1
  - footage.emma.take-probe-zee-night.v1
  - footage.emma.take-probe-zee-peek.v1
  - footage.emma.take-probe-zee-pet.v1
  - footage.emma.take-probe-zee-wait.v1
  - footage.emma.take-tabs.v1
  - footage.emma.take-tryon-dress.v1
  - footage.emma.take-tryon-tee-trousers.v1
  - footage.emma.take-wardrobe.v1
  - footage.emma.tell-me-notification-ask.v1
  - footage.emma.tryon-add-item-sheet.v1
  - footage.emma.tryon-curtain-reveal.v1
  - footage.emma.tryon-curtain-reveal.v2
  - footage.emma.tryon-item-lands.v1
  - footage.emma.wardrobe-chip-filter.v1
  - footage.emma.wardrobe-ready-cheer.v1
  - footage.emma.wardrobe-scroll-float.v1
  - footage.emma.zee-a1-refine.v1
  - footage.emma.zee-a2-look-changed.v1
  - footage.emma.zee-a3-loved.v1
  - footage.emma.zee-a4-typing.v1
  - footage.emma.zee-a4-typing.v2
  - footage.emma.zee-asks-empty-wardrobe.v1
  - footage.emma.zee-asks-on-it.v1
  - footage.emma.zee-b10-long-wait.v1
  - footage.emma.zee-b11-peek.v1
  - footage.emma.zee-b12-empty.v1
  - footage.emma.zee-b13-welcome-back.v1
  - footage.emma.zee-b5-night.v1
  - footage.emma.zee-b6-morning.v1
  - footage.emma.zee-b7-pet.v1
  - footage.emma.zee-b8-saved.v1
  - footage.emma.zee-b9-idea.v1
  - footage.emma.zee-pet.v1
parents:
  - prompt.motion-brief.founder-exact-app-animations.v1
tags: [agent-brief, footage, app-animations, capture]
createdAt: 2026-10-15
usedAt: ["2026-10-15T19:02:00Z"]
source: "curate-app session 8dfb7189, Agent tool prompt \"Capture every app animation as footage\" 2026-10-15T19:02Z"
addedBy: "claude-code (prompt-library seed, 2026-10-15)"
---
Capture EVERY animation in the Curate iOS app, exactly as it runs today, as footage clips in the curate-motion library. The founder wants the ads to use the app's exact animations, not re-creations. Curate is a fashion stylist app whose mascot is Zee, a black plush kitten; 1.5.0 build 262 is the App Store build.

**Sources**
- **App code:** /Users/saikumar/Desktop/Curate/.worktrees/app-emma-262 (release/1.5.0-262 @5aff9592, already built for the simulator). Read-only; no app code changes. You may add probe files in a worktree of your own if needed.
- **Emma's account is live** on simulator "Emma Marketing 17PM", UDID B0202502-C8FB-4DAA-8E29-EAE4866B0C14 (booted, signed in, 49 wardrobe pieces, 73 photos in the roll).
  - ALWAYS target this exact UDID, never `booted`: other sessions hijacked a recording once.
  - Never touch the "iPhone 17" simulator or any other session's simulator.
  - Her password is in SSM /curate/marketing/emma-password, if you ever need to sign in again. Never print it.
- **Library repo:** /Users/saikumar/Desktop/Curate/curate-motion. Read AGENTS.md first and follow it: the naming grammar, `tools/catalog add --kind footage …`, `tools/capture.sh`, licences/status, and `tools/sync push`.
- **Existing footage** in /Users/saikumar/Desktop/Curate/marketing/videos/footage/emma/: photo-scan-v1.mov (a clean 6-minute hero take of the whole scan), onboarding-v1.mov (clean), signup-v1.mov (messy). Cut clips from these where they already show a moment cleanly, instead of re-recording.

**Steps**
1. **Inventory.** List every animation and motion moment in the app from the code (file:line), grouped by screen. At least:
   - the front door type reel ("Try it. Style it. Wear it.");
   - onboarding steps;
   - the privacy shield with Zee peeking;
   - the selfie step (Zee over the ring) and camera (ring opens, hints, shutter, "That's you!", hand-back);
   - Photos-off "Two taps" with the Yay;
   - the scan roll (real speed, Zee's magnifier, photos lifting into Picked);
   - the "Up big" pieces wait (Zee's lines, piece names, first piece lifting out);
   - "Tell me when it's ready" with the notification ask;
   - the Curate-at-work pill → "Your wardrobe is ready ›" → Zee's cheer screen;
   - the Wardrobe tab with pure-float pieces;
   - Zee asks on an empty wardrobe;
   - Zee's 13 extra moments (ob83);
   - the chat: the Mist look, the composer, Zee's thinking lines while a look is made, the look card landing, question cards, the location ask (the foggy window), Adjust, Style notes (notebook, close-ups floating), the chat drawer sliding in;
   - Try-ons (avatar, Add an item sheet, the result);
   - the in-app update sheet;
   - haptic-free transitions between tabs;
   - any loading shimmer that's on brand.

   Write the inventory to curate-motion/library/footage/INVENTORY.md, with a status column.
2. **Capture each one** on Emma's simulator, from her REAL account wherever the state can be reached:
   - Use `xcrun simctl io <UDID> recordVideo --codec=hevc` for quality, with a clean status bar (9:41, full battery, full signal).
   - Real speed. Take 2+ clean takes of the important ones. Mist look; check that it's on for her.
   - Navigate with what works on the simulator (simctl, idb or AppleScript taps if available; check what earlier agents used).
   - Where a state can't be reached on her account or on a simulator (the selfie CAMERA, since the simulator has no camera; maybe the pieces wait if no import is running; error states), use the app's own dev probes in lib/dev/ with Emma's REAL assets as inputs. For the camera, use her selfie at curate-motion/library/people/emma/ as the stand-in feed. Label those clips `source: probe` in the manifest.
   - Never show old screens (e.g. the old "Your wardrobe is already in your photos" door), stale assets or other people's data.
3. **Trim** each moment into its own clip: lossless, or high-quality HEVC/H.264, cut at the start and end of the animation with about 0.5 s of handle each side. Also keep the full takes. Name and register each clip with `tools/catalog add` as kind footage, with:
   - tags `moment=<slug>`, `screen=<screen>`, `appBuild=262`, `persona=emma`, `source=app|probe`;
   - status draft;
   - the licence preset for our own footage, per AGENTS.md.
   Example id grammar: `footage.emma.scan-roll.v1`.
4. **Paid actions:** server spend cap **$2 total**. Chat looks cost about $0.19 each, try-ons a few cents. Use at most about 5 chat looks and 2 try-ons. Reuse looks that are already in her chat where possible. Log the spend.
5. **Push:** `tools/catalog build && tools/catalog validate`, then `tools/sync push`.
   - Check that the earlier sync bug fix is in tools/lib/s3sync.ts (EMPTY_BODY). The main session may still be pushing; wait until `ps aux | grep "tools/sync push"` shows none before you push.
   - Don't git commit or push; the main session will.
6. **Live tracker.** Write /Users/saikumar/Desktop/Curate/marketing/videos/tracker/captures.js as `window.CURATE_CAPTURES = {updated, phase, done, total, sections:[{title, items:[{path,label}]}], log:[{t,text}]}`, atomically, after each captured moment.
   - Paths are relative to the tracker. Make small mp4 or jpg previews in marketing/videos/footage/_previews/.
   - The main session will wire the page.
7. **Phone view.** At the end, publish an artifact (load the artifact-design skill first; icon "video") with the inventory and small preview clips of every moment, under 64 MB. Give the URL.
8. **Leave Emma's simulator** booted and signed in, on the Wardrobe tab.

**Rules:** no app code changes, no prod changes beyond Emma's own usage, never print secrets, use they/them for the founder.

**Report:** the inventory counts (total / captured / via probe / not possible), the clip ids, the spend, any blockers, and the artifact URL.
