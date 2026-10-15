---
id: prompt.agent-brief.capture-app-screenshots.v1
title: Capture every app screen and state as screenshots (native + App Store heroes)
author: "agent:main-session"
area: agent-brief
target: Claude Code subagent (general-purpose)
outcome: worked
rating: 4
why: "143 screenshots (96 real, 23 probe, 24 App Store heroes) for $0; the 'look at EVERY shot' checklist kept out banners, red errors and old screens."
inputs: []
outputs:
  - screenshot.emma.add-item.v1
  - screenshot.emma.adjust-appstore.v1
  - screenshot.emma.adjust.v1
  - screenshot.emma.at-work-pill-longer.v1
  - screenshot.emma.at-work-pill.v1
  - screenshot.emma.calendar.v1
  - screenshot.emma.chat-drawer-search.v1
  - screenshot.emma.chat-drawer.v1
  - screenshot.emma.chat-empty-appstore.v1
  - screenshot.emma.chat-empty.v1
  - screenshot.emma.composer-typing.v1
  - screenshot.emma.create-outfit.v1
  - screenshot.emma.dates-card-picked.v1
  - screenshot.emma.dates-card.v1
  - screenshot.emma.duplicate-review-pick.v1
  - screenshot.emma.duplicate-review.v1
  - screenshot.emma.email-signup.v1
  - screenshot.emma.empty-wardrobe-zee.v1
  - screenshot.emma.extraction-found.v1
  - screenshot.emma.extraction-wait.v1
  - screenshot.emma.front-door-appstore.v1
  - screenshot.emma.front-door-sign-in.v1
  - screenshot.emma.front-door.v1
  - screenshot.emma.import-review-appstore.v1
  - screenshot.emma.import-review-undo.v1
  - screenshot.emma.import-review.v1
  - screenshot.emma.location-ask.v1
  - screenshot.emma.location-sky-appstore.v1
  - screenshot.emma.location-sky.v1
  - screenshot.emma.look-card-appstore.v1
  - screenshot.emma.look-card-landing.v1
  - screenshot.emma.look-card.v1
  - screenshot.emma.multiple-looks-2-appstore.v1
  - screenshot.emma.multiple-looks-2.v1
  - screenshot.emma.multiple-looks-3.v1
  - screenshot.emma.notifications-tryons.v1
  - screenshot.emma.notifications.v1
  - screenshot.emma.ob-about.v1
  - screenshot.emma.ob-body-tapes.v1
  - screenshot.emma.ob-body.v1
  - screenshot.emma.ob-mirror-payoff.v1
  - screenshot.emma.ob-mirror-reading-appstore.v1
  - screenshot.emma.ob-mirror-reading.v1
  - screenshot.emma.ob-pairs-appstore.v1
  - screenshot.emma.ob-pairs-ranked.v1
  - screenshot.emma.ob-pairs.v1
  - screenshot.emma.ob-username.v1
  - screenshot.emma.outfits-planned.v1
  - screenshot.emma.outfits-recent.v1
  - screenshot.emma.outfits-tried.v1
  - screenshot.emma.photos-off-two-taps-appstore.v1
  - screenshot.emma.photos-off-two-taps.v1
  - screenshot.emma.photos-off-yay.v1
  - screenshot.emma.photos-permission.v1
  - screenshot.emma.piece-detail-appstore.v1
  - screenshot.emma.piece-detail.v1
  - screenshot.emma.piece-edit.v1
  - screenshot.emma.pieces-arriving-appstore.v1
  - screenshot.emma.pieces-arriving.v1
  - screenshot.emma.pieces-first-piece.v1
  - screenshot.emma.pieces-style-fact.v1
  - screenshot.emma.pieces-up-big-appstore.v1
  - screenshot.emma.pieces-up-big.v1
  - screenshot.emma.privacy-shield-appstore.v1
  - screenshot.emma.privacy-shield.v1
  - screenshot.emma.profile-appstore.v1
  - screenshot.emma.profile-edit.v1
  - screenshot.emma.profile-gallery.v1
  - screenshot.emma.profile.v1
  - screenshot.emma.question-card-appstore.v1
  - screenshot.emma.question-card.v1
  - screenshot.emma.ready-pill.v1
  - screenshot.emma.required-update.v1
  - screenshot.emma.saved-outfits.v1
  - screenshot.emma.scan-found.v1
  - screenshot.emma.scan-roll-appstore.v1
  - screenshot.emma.scan-roll.v1
  - screenshot.emma.scan-start.v1
  - screenshot.emma.selfie-hint-circle.v1
  - screenshot.emma.selfie-hint-light.v1
  - screenshot.emma.selfie-hint-perfect.v1
  - screenshot.emma.selfie-step.v1
  - screenshot.emma.selfie-thats-you-appstore.v1
  - screenshot.emma.selfie-thats-you.v1
  - screenshot.emma.selfie-there-you-are.v1
  - screenshot.emma.settings-appearance.v1
  - screenshot.emma.settings-body-measurements.v1
  - screenshot.emma.settings-notifications.v1
  - screenshot.emma.settings-scrolled.v1
  - screenshot.emma.settings-skin-tone.v1
  - screenshot.emma.settings.v1
  - screenshot.emma.splash.v1
  - screenshot.emma.style-notes-appstore.v1
  - screenshot.emma.style-notes-scrolled.v1
  - screenshot.emma.style-notes.v1
  - screenshot.emma.tell-me-notification.v1
  - screenshot.emma.tonight-reply.v1
  - screenshot.emma.tonight-thread.v1
  - screenshot.emma.trip-look.v1
  - screenshot.emma.trip-thread.v1
  - screenshot.emma.tryon-add-item.v1
  - screenshot.emma.tryon-curtain-appstore.v1
  - screenshot.emma.tryon-curtain.v1
  - screenshot.emma.tryon-item-placed.v1
  - screenshot.emma.tryon-result-dress-appstore.v1
  - screenshot.emma.tryon-result-dress.v1
  - screenshot.emma.tryon-result-tee.v1
  - screenshot.emma.tryon-reveal.v1
  - screenshot.emma.tryon-start.v1
  - screenshot.emma.tryons-history.v1
  - screenshot.emma.tryons.v1
  - screenshot.emma.wardrobe-chip-accessories.v1
  - screenshot.emma.wardrobe-chip-bags.v1
  - screenshot.emma.wardrobe-chip-bottoms.v1
  - screenshot.emma.wardrobe-chip-dresses.v1
  - screenshot.emma.wardrobe-chip-outerwear.v1
  - screenshot.emma.wardrobe-chip-shoes.v1
  - screenshot.emma.wardrobe-chip-tops.v1
  - screenshot.emma.wardrobe-new-pieces.v1
  - screenshot.emma.wardrobe-ready-cheer-appstore.v1
  - screenshot.emma.wardrobe-ready-cheer.v1
  - screenshot.emma.wardrobe-scrolled-1.v1
  - screenshot.emma.wardrobe-scrolled-2.v1
  - screenshot.emma.wardrobe-scrolled-3.v1
  - screenshot.emma.wardrobe-top-appstore.v1
  - screenshot.emma.wardrobe-top.v1
  - screenshot.emma.work-look.v1
  - screenshot.emma.zee-a1-refine.v1
  - screenshot.emma.zee-a2-look-changed.v1
  - screenshot.emma.zee-a3-loved.v1
  - screenshot.emma.zee-a4-typing.v1
  - screenshot.emma.zee-asks-on-it.v1
  - screenshot.emma.zee-b10-long-wait.v1
  - screenshot.emma.zee-b13-welcome-back.v1
  - screenshot.emma.zee-b5-night.v1
  - screenshot.emma.zee-b6-morning.v1
  - screenshot.emma.zee-b7-pet.v1
  - screenshot.emma.zee-b8-saved.v1
  - screenshot.emma.zee-b9-idea.v1
  - screenshot.emma.zee-remembers.v1
  - screenshot.emma.zee-thinking-appstore.v1
  - screenshot.emma.zee-thinking-b.v1
  - screenshot.emma.zee-thinking.v1
parents:
  - prompt.agent-brief.founder-screenshots-brand-book.v1
tags: [agent-brief, screenshots, capture]
createdAt: 2026-10-15
usedAt: ["2026-10-15T21:36:31Z"]
source: "curate-app session 8dfb7189, Agent tool prompt \"Capture every app screen as screenshots\" 2026-10-15T21:36Z"
addedBy: "claude-code (prompt-library seed, 2026-10-15)"
---
Capture SCREENSHOTS of every screen and state of the Curate iOS app (1.5.0, build 262) from the marketing persona Emma's real account, and add them to the curate-motion library. Curate is a fashion stylist app whose mascot is Zee, a black plush kitten. The screenshots are for ads, App Store pages, the website and social posts.

**Setup (read first)**
- Repo: /Users/saikumar/Desktop/Curate/curate-motion. Read AGENTS.md, RULES.md and library/brand/BRAND.md, and follow them: id grammar, `tools/catalog add`, licences, approvals, sync.
- library/footage/INVENTORY.md lists every screen and animation, with file:line. Use it as your checklist.
- **Emma's simulator:** "Emma Marketing 17PM", UDID B0202502-C8FB-4DAA-8E29-EAE4866B0C14 (booted, signed in, 49 wardrobe pieces, Mist look, location Astoria).
  - ALWAYS target that exact UDID, never `booted`.
  - Never touch the "iPhone 17" simulator or other sessions' simulators.
  - Her password is in SSM /curate/marketing/emma-password, if needed. Never print it.
- The previous capture agent's scripts are in curate-motion/tools/capture/ (s.sh, pr.sh, ui.py and others, for driving and recording the simulator). Reuse them.
- For states the real account can't reach (the selfie camera, Photos-off, Zee's 13 moments, the update sheet), that agent used dev probes on a separate simulator, "Emma Probe 17PM" (CE85B987, now shut down), from the worktree /Users/saikumar/Desktop/Curate/.worktrees/app-capture-262, with Emma's real assets swapped in. Do the same, and tag those shots `source:probe`.

**What to capture**
1. **Every screen and meaningful state.** That includes:
   - the front door;
   - each onboarding step;
   - the privacy shield;
   - the selfie step and camera hints;
   - Photos-off "Two taps";
   - the scan roll mid-scan;
   - the Up big wait;
   - pieces arriving;
   - "Your wardrobe is ready" with the cheer;
   - the import review;
   - the Wardrobe tab (top, scrolled, each filter chip);
   - piece detail and edit;
   - Add item;
   - the duplicate review;
   - the empty chat with Zee;
   - Zee thinking;
   - each look card;
   - multiple looks;
   - question cards;
   - the location ask;
   - Adjust;
   - the Style notes notebook;
   - the chat drawer;
   - the Try-ons tab and a result;
   - Profile and Settings;
   - the "Curate at work" pill.
2. **Format:** full-resolution PNGs at the device's native 1320×2868, with a clean status bar (`xcrun simctl status_bar override`: 9:41, full battery and signal, no carrier).
   - For the most important 20–25 hero screens, make 2 variants each: the plain screenshot, and an App Store-ready 1290×2796 (6.7") PNG.
   - Check ASC's accepted sizes. 1320×2868 is the 6.9" set and is also accepted.
3. **Quality checks.** Look at EVERY shot. Never ship one with:
   - another session's app or banner;
   - a red error, a debug banner or an overflow stripe;
   - old screens (e.g. the old "Your wardrobe is already in your photos" door);
   - another person's data;
   - prices or shopping.
   Retake it instead.
4. **Register** each shot with `tools/catalog add --kind screenshot` if that kind exists. Otherwise add a `screenshot` kind to the schema (schemas/asset.ts plus KIND_FIELDS) in a small, clean commit-ready change, and document it in AGENTS.md's kind list.
   - Ids look like `screenshot.emma.wardrobe-top.v1`.
   - Tags: screen, state, appBuild=262, persona=emma, source=app|probe, size.
   - Licence `curate`, status draft.
   - Then `tools/catalog build && tools/catalog validate && tools/sync push`.
5. **Server spend cap: $1.** Only spend if a new chat look or try-on is truly needed; reuse her existing chat looks and try-ons.
6. **Phone view.** Publish a single-file artifact (load the artifact-design skill first; icon "image"), with images inlined as small JPEG thumbnails and the file under 15 MB, grouped by screen. Give the URL.
7. **Live progress.** Write /Users/saikumar/Desktop/Curate/marketing/videos/tracker/screens.js as `window.CURATE_SCREENS = {updated, phase, done, total, sections:[{title, items:[{path,label}]}], log:[{t,text}]}`, atomically. Paths are relative to the tracker; put thumbnails in marketing/videos/footage/_screens/.

**Rules**
- No app code changes, except probe stand-in assets in your own worktree.
- No git commits in curate-motion; the main session commits.
- Never print secrets.
- Use they/them for the founder.
- Leave Emma's simulator booted and signed in on the Wardrobe tab, and shut down any probe simulator you start.

**Report:** the counts (total, real, probe), the ids, the hero list, the spend, the artifact URL, and any schema change you made.
