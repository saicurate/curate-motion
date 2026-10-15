---
id: prompt.agent-brief.emma-account-wardrobe.v1
title: "Create Emma's real Curate account and her wardrobe (scan first, then add-photo)"
author: "agent:main-session"
area: agent-brief
target: Claude Code subagent (general-purpose)
outcome: worked
rating: 4
why: "Her account went live on build 262 with 49 pieces, a clean photo-scan hero take and the account-state mapping; password only in SSM."
inputs: []
outputs: []
parents:
  - prompt.image-gen.founder-american-wardrobe-account.v1
tags: [agent-brief, "persona:emma", account, footage]
createdAt: 2026-10-15
usedAt: ["2026-10-15T18:06:16Z"]
source: "curate-app session 8dfb7189, Agent tool prompt \"Create Emma's account + wardrobe\" 2026-10-15T18:06Z"
addedBy: "claude-code (prompt-library seed, 2026-10-15)"
---
Create the marketing persona's REAL Curate account and build her wardrobe. The founder approved this, including about $3–4 of server AI spend. Curate is a fashion stylist iOS app (1.5.0 live, build 262 = the App Store build).

**Read first:**
- /Users/saikumar/Desktop/Curate/marketing/videos/assets/ACCOUNT-PLAN.md (the plan, onboarding answers and wardrobe paths) and persona/persona.md.
- Memories in /Users/saikumar/.claude/projects/-Users-saikumar-Desktop-Curate-curate-app/memory/: marketing-videos.md, curate-email-otp-verification.md, identify-seed-users.md, wardrobe-extraction-pipeline.md, gallery-pick-lab.md (simulator face-detection findings), curate-app-ui-probe-harness.md, real-device-screens-only.md, wardrobe-item-edit-endpoint.md, curate-app-testflight-pipeline.md.

**The plan**
1. **The account.** Email `emma.nyc@test123.com` (the OTP bypass domain; verify it in user-service EmailOtpService first).
   - Generate a strong password and store it ONLY in AWS SSM as a SecureString at `/curate/marketing/emma-password` (us-east-1). Never print it or write it to any file.
   - Sign up with email and password through the REAL app (build 262, from /Users/saikumar/Desktop/Curate/curate-app at release/1.5.0-262; make your own worktree) on your OWN new iPhone 17 Pro Max simulator. Never the booted "iPhone 17", never other sessions' simulators.
   - Use a clean status bar (9:41, full battery).
   - Do onboarding with the plan's answers: Emma Russo, Woman, born 1999-03-14, username emma.nyc, styles Minimalist/Classic/Workwear, shopping "Sometimes" $50–150, skin tone by selfie (assets/selfie/emma-selfie-v1.jpg, added to the simulator's Photos), body 5'6", 135 lb, 30" inseam.
   - Keep her a NORMAL account, not seed.
   - Record the whole sign-up and onboarding with `xcrun simctl io <udid> recordVideo` as footage, into /Users/saikumar/Desktop/Curate/marketing/videos/footage/emma/ (name each file by moment, e.g. onboarding-v1.mov).
2. **Her camera roll.** `xcrun simctl addmedia` the 30 roll photos (assets/roll/, the latest picked version of each) plus the 42 stock photos (assets/stock/), interleaved by a plausible date order if you can set dates (EXIF DateTimeOriginal via exiftool if installed; otherwise skip it).
3. **The wardrobe, path C first: the real "Find my clothes" photo scan in the app.** RECORD it end to end: the privacy shield, the Photos prompt, the selfie, the scan roll, pieces arriving, "Your wardrobe is ready". This is hero ad footage, so record clean takes.
   - If the simulator's face detection finds nobody (a known iOS 26 simulator problem), stop path C, log it, and tell the main session. A real iPhone may be needed. Don't fake it.
4. **Path A for the rest.** For garments in assets/garments/manifest.json that didn't come in through the scan, add them via the app's Add item, or the same API (`POST /api/v1/wardrobe/add-photo`) as Emma with her token. Stop at the plan's budget: no more than about $4 of server spend in total. Estimate it from the receipts the agent found (about $0.07–0.08 per piece). Check her wardrobe_ai credits first (a 402 means out).
5. **The mapping file.** Write `/Users/saikumar/Desktop/Curate/marketing/videos/assets/account-state.json` with her uid and email (NO password), the app build, and for each wardrobe item in the app: the app item id, which library garment it came from (manifest name/file), and how it got in (scan/add-item). Another agent is designing the curate-motion repo (/Users/saikumar/Desktop/Curate/curate-motion) and will define a schema for this file at library/people/emma/account-state.json. If that schema exists when you finish, follow it; otherwise use a clear shape and say so.
6. **Tracker.** Append plain-English log lines and a section with phone screenshots of her finished Wardrobe tab. Write ONLY /Users/saikumar/Desktop/Curate/marketing/videos/tracker/account.js as `window.CURATE_ACCOUNT={updated, phase, sections:[{title,items:[{path,label}]}], log:[{t,text}]}`, with paths relative to the tracker. Then tell the main session the tracker needs to load account.js.
7. **Phone view.** Publish a small artifact (load the artifact-design skill first; icon "wardrobe") with screenshots of her account: the Wardrobe tab, a piece, the chat empty state. Give the URL.
8. **Clean up.** Leave the simulator ALIVE with Emma signed in (rename it "Emma Marketing 17PM"), because footage recording continues later. Run `flutter clean` in your worktree.

**Rules**
- No app code changes (probes only if truly needed, in your own worktree).
- No other prod writes beyond Emma's own account data.
- Never print secrets.
- Use they/them for the founder.
- Server spend: no more than about $4.

**Report:** the uid, the item counts by path, the spend, the footage files, the mapping file path, any blockers, and the artifact URL.
