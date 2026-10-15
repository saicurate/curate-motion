---
id: prompt.agent-brief.curate-motion-architecture.v1
title: "Architect and scaffold curate-motion (repo, S3, catalog, motion components)"
author: "agent:main-session"
area: agent-brief
target: Claude Code subagent (general-purpose)
outcome: worked
rating: 4
why: "Private repo, private S3 bucket, catalog and schemas, motion/ components and the migration plan, all first time; CI passed on the first push."
inputs: []
outputs: []
parents:
  - prompt.agent-brief.founder-motion-project-library.v1
  - prompt.agent-brief.founder-architect-private-repo.v1
  - prompt.agent-brief.founder-repo-for-many-agents.v1
  - prompt.agent-brief.founder-easy-add-remove-assets.v1
tags: [agent-brief, repo, architecture]
createdAt: 2026-10-15
usedAt: ["2026-10-15T17:43:14Z"]
source: "curate-app session 8dfb7189, Agent tool prompt \"Architect + scaffold curate-motion repo\" 2026-10-15T17:43Z"
addedBy: "claude-code (prompt-library seed, 2026-10-15)"
---
Design the architecture for, and scaffold, **curate-motion**: Curate's dedicated project for motion-graphics marketing videos. Curate is a fashion stylist iOS app whose mascot is Zee, a black plush kitten. The founder wants everything (accounts, animations, images, footage, music) in ONE place, made once and reused, so every new ad is ASSEMBLED from the library instead of regenerated.

**Approved:**
- code and lists (manifests) live on GitHub as a PRIVATE repo;
- big media (video, images, audio) lives in a PRIVATE Amazon S3 bucket, with a one-command sync.

**What exists today** (in /Users/saikumar/Desktop/Curate/marketing/videos/; read it, don't move it yet; two other agents are still writing there):
- **remotion/:** a Remotion 4.0.535 project (react 19.2.3; renders with the installed Google Chrome via remotion.config.ts; Zee frames in public/zee/; garments in public/garments; tools/capture.sh; compositions for concepts c1–c5+).
- **cuts/:** motion tests.
- **music/:** 8 Mixkit tracks plus licences.json.
- **assets/:** "Emma", the marketing persona (27, NYC, olive skin; face reference persona/emma-face-B-v1.jpg; persona.md), with garments/ (about 50 AI product shots + manifest.json), roll/ (her camera roll), selfie/, tryon/, stock/ (Pexels/Unsplash with licences) and _thumbs/.
- **references/:** a breakdown of a creator reel.
- **tracker/:** index.html is a live local page re-reading status.js, assets.js and references.js every 3 s.
- Zee's source pack: /Users/saikumar/Desktop/Curate/research/zee-pack/app/zee-sharp-v1/.
- App code (for brand tokens and fonts): /Users/saikumar/Desktop/Curate/curate-app (lib/core/theme, lib/features/look/).

**Deliverables**
1. **ARCHITECTURE.md** in the new repo, plus a phone-viewable Artifact of it (load the artifact-design skill first; icon "diagram"; use a simple diagram). It covers:
   - **The folder layout:**
     - `library/`: brand, zee, people/<persona>, wardrobe/<persona>, camera-roll/<persona>, footage/<moment>, music, references;
     - `motion/`: reusable Remotion components;
     - `ads/`: each ad is a composition built from library refs + motion components + a track;
     - `renders/`: by ad/channel/length;
     - `tools/`;
     - RULES.md.
   - **The asset catalog:** one typed manifest schema (JSON Schema or zod) per asset kind. Give each asset a stable id, path in S3, sha256, dimensions/duration, tags (persona, garment category/colour, moment, mood, BPM/beat map for music), source and LICENCE (required), cost, and created-by. Assets are referenced by id in ads, never by raw path.
   - **The S3 layer:**
     - bucket naming;
     - a private bucket with Block Public Access, SSE, versioning and lifecycle rules;
     - `tools/sync` (pull/push by manifest, content-addressed or path plus sha check);
     - how local `library/` maps to S3;
     - .gitignore for media.
     Weigh Git LFS vs S3 briefly and say why S3.
   - **The Remotion structure:** a `motion/` component library. Start the list from what exists:
     - PhoneFrame, ZeeActor, KineticType, BeatClock (BPM → frames);
     - PopOut (scale-from-source with overshoot and return), TitleBehind, FlashPrint, ScanTrace, Ellipse, StrokeFrame, WhipPan, ClosetReveal;
     - plus format presets (9:16 1080×1920, 4:5, 1:1, 16:9, App Store preview sizes) and length variants (6/15/30/60/90–120 s);
     - `ads/<ad-id>/` with props validated by zod, so one ad renders to many formats and lengths.
   - **Personas and accounts:** how a marketing persona's app account is recorded (email, NOT the password). Secrets go in AWS SSM or GCP Secret Manager, never in git. Also how footage captured from that account is catalogued by moment and app build.
   - **Footage capture:** the tools/capture flow (simulator recording, clean status bar), naming, and the manifest entry.
   - **Rules:**
     - licences are tracked and required;
     - no shopping or prices;
     - never show the pipeline;
     - no logos;
     - FTC (personas never vouch for products);
     - an "AI-generated" note where platforms require it;
     - the Remotion licence (free for teams of ≤3, else paid).
   - **The tracker → library browser:** the local page turns into a browser of the catalog plus a render queue and status.
   - **Migration plan** from marketing/videos/ into the repo, as exact steps, run LATER by the main session once the other agents finish.
2. **Scaffold** the repo at /Users/saikumar/Desktop/Curate/curate-motion:
   - `git init`, README, ARCHITECTURE.md, RULES.md, the schemas, tools/sync (a script using the aws cli), .gitignore, and a minimal motion/ folder.
   - Either a copy of the existing Remotion project structure re-laid-out (copy the code, not media), or a fresh Remotion 4.0.535 workspace that compiles (`npx tsc --noEmit` or `npx remotion compositions` works).
   - Commit messages end with: Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
3. **Create the private GitHub repo** with `gh repo create saicurate/curate-motion --private` (check that the saicurate org is where the other Curate repos live: `gh repo list saicurate --limit 5`) and push. Verify it's PRIVATE.
4. **Create the S3 bucket** in us-east-1 (e.g. `curate-motion-library-<account-id>`):
   - block all public access, default encryption, versioning on, and a lifecycle rule to expire non-current versions after 90 days;
   - tag it project=curate-motion;
   - verify with get-public-access-block.
   - Don't upload media yet; that's the migration.

**Rules**
- Don't move or delete anything in marketing/videos/.
- Never print secrets.
- No paid model calls.
- Use they/them for the founder.

**Report:** the repo URL (and that it's private), the bucket name and its settings, the artifact URL, the component list, and the migration steps.
