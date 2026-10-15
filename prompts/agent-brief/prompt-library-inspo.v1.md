---
id: prompt.agent-brief.prompt-library-inspo.v1
title: Build the prompt library and the inspo board in curate-motion
author: "agent:main-session"
area: agent-brief
target: Claude Code subagent (general-purpose)
outcome: untested
why: In progress when seeded (this is the brief that built prompts/ and inspo/). Rate it after the founder has used them.
inputs: []
outputs: []
parents: [prompt.agent-brief.founder-prompts-and-inspo.v1]
tags: [agent-brief, prompts, inspo, library-ui]
createdAt: 2026-10-15
usedAt: ["2026-10-15T22:37:20Z"]
source: "curate-app session 8dfb7189, Agent tool prompt \"Prompt library + inspo board in repo\" 2026-10-15T22:37Z"
addedBy: "claude-code (prompt-library seed, 2026-10-15)"
---
Add two new first-class parts to the curate-motion repo (/Users/saikumar/Desktop/Curate/curate-motion). Read AGENTS.md, ARCHITECTURE.md, RULES.md, schemas/ and tools/lib/catalog.ts first, and follow the repo's conventions: zod schemas, ids `<kind>.<scope>.<name>.v<N>`, `tools/` CLIs, a README per folder, AGENTS.md sections, decisions/, CHANGELOG, validation in `tools/catalog validate` and CI, and the library-ui. Many different AI agent tools use this repo, so it has to be obvious to all of them.

**The founder's ask:** "create a new place where we store all the prompts that worked for us: worked, not worked, the ones you use and the ones I give, so we can mix and do hybrid. And also a place where we can give our inspos so that we can refer them whenever we want."

**1. The prompt library: `prompts/`, text in git (prompts are text, not media).**
- **One file per prompt,** Markdown with YAML front matter, validated by a zod schema `schemas/prompt.ts`. Fields:
  - id (`prompt.<area>.<name>.v<N>`);
  - title;
  - author: founder | agent:<name> | other;
  - area: image-gen | video-gen | voice | music | copy | motion-brief | agent-brief | research | other;
  - target (model or tool, e.g. "Nano Banana Pro", "gpt-4o-mini-tts", "Claude agent", "Remotion");
  - inputs (asset ids or refs used, e.g. a face reference id);
  - outcome: worked | didn't | mixed | untested;
  - rating 1–5;
  - outputs (asset ids it produced);
  - why (what made it work or fail);
  - tags;
  - parents (ids of prompts it was mixed or remixed from, for hybrids);
  - createdAt and usedAt[].
  - The prompt text itself is the body.
- **`tools/prompts`:**
  - `add`, from a file or stdin, with flags for the fields;
  - `search --area --outcome --tag --min-rating --text`;
  - `show`;
  - `rate <id> <1-5> --outcome … --why …`;
  - `use <id>` (logs usage);
  - `remix <id> [<id>…] --title …`: creates a new prompt with `parents` set and the bodies merged into a scaffold for editing;
  - `list`.
- **The catalog index includes prompts** (catalog/prompts.json or inside index.json), so agents can query them.
- **Link prompts and assets both ways:** an asset's source can point to its prompt id, and prompt outputs list asset ids. Validate these.
- **Seed it from real history.** NEVER copy secrets.
  - **(a) Image-generation prompts already used for Emma's assets.** Find them in /Users/saikumar/Desktop/Curate/marketing/videos/assets/_tools/ (calls.jsonl, and the scripts that built the prompts) and in the asset manifests.
    - calls.jsonl contains key-like words, so parse it with a script that extracts ONLY the prompt/model/cost/outcome fields, and scan the output for secrets before writing.
    - For each: the face candidates, the garment prompts (as a template plus per-item), the camera-roll prompts, the selfie and the try-on bases.
    - Record the outcome (picked → worked; remade for logos → didn't, with why).
  - **(b) Founder-written prompts and briefs:** the founder's own words that drove the work. Take them from the session transcript at /Users/saikumar/.claude/projects/-Users-saikumar-Desktop-Curate-curate-app/8dfb7189-122d-440a-a9c0-c4ad2cfe63b8.jsonl (only user messages from 2026-10-15 onward about marketing, videos, assets, Emma, voice, the repo). Mark author founder. Keep them verbatim but trimmed to the relevant ask.
    - The transcript contains at least one pasted API key (an ElevenLabs key starting `sk_`). Run a secret scan (patterns like sk_, AKIA, AIza, ghp_, "key", "token", "password", long hex/base64) on everything you write. Never copy any message that contains a key.
  - **(c) Agent briefs that worked:** the main session's subagent briefs in that transcript (the Agent tool `prompt` fields from 2026-10-15) for:
    - assets, Emma's account, animation capture and screenshots;
    - voice config and samples;
    - concepts rounds 1–2, the reference analysis, ad production, and this one.
    Mark author agent:main-session, area agent-brief, outcome worked or mixed, with a one-line why.
  - **(d) Voice style prompts:** from config/voice.json profiles (OpenAI style instructions).
- Don't put any paid model calls into seeding. It's pure extraction.

**2. The inspo board: `inspo/`.**
- **One entry per inspiration:** a video, image, link, ad, reel, a screenshot of a competitor's app, a typeface or a colour idea.
  - Entry metadata in git: `inspo/<id>.md` with front matter, validated by `schemas/inspo.ts`. Fields: id `inspo.<source>.<name>.v1`, title, kind (video|image|link|audio|app-screen|ad|other), url and/or a media asset id, addedBy, addedAt, what we love (bullets), techniques (transition names, pacing, type, colour), use-for (which concepts or ads), tags, status (active|archived).
  - Media goes through the existing library as kind `reference`: S3, licence "Third-party content, reference only", never-ship.
- **`tools/inspo`:** `add <file|url> --title … --love … --tags …` (copies media into library/references via catalog add, writes the entry), `search`, `show`, `archive`, plus `breakdown <id>`, which writes a technique-breakdown section using free local tools only (ffprobe/ffmpeg contact sheets for video; no paid calls).
- **Seed it with what exists:**
  - the founder's WhatsApp reel (`library/references/`: the "how to: Pop Off" Edits tutorial, with breakdown https://claude.ai/artifact/BfnhPC2vDLECNgQnyC5Fet). Link it to concept c14 and the "pop-out" ad.
  - any other references already in library/references.
- **RULES:** inspo is never shipped. A render must refuse any reference-kind asset; check this is already enforced, and add it if not.

**3. The founder's UI: `tools/library-ui`.** Add two tabs.
- **Prompts:** search and filter by outcome and rating, view, copy, rate (stars + worked/didn't + why), "Remix with…" (pick 2+ and open the merged draft to edit and save), and "New prompt".
- **Inspo:** drag and drop a file, or paste a link, plus "what I love" and tags; a grid of thumbnails; open an entry to see its breakdown; archive.
- Keep it localhost-only and token-checked, with --lan available, matching the existing Voiceover panel style, phone width, light and dark.

**4. Docs:**
- AGENTS.md: sections "Prompts: find, use, rate, remix" and "Inspo: add and reference". Make it a rule that agents MUST check `tools/prompts search` before writing a new image/video/voice prompt, and MUST log new prompts with their outcome after use.
- The README per folder.
- `decisions/00NN-prompts-and-inspo.md`.
- CHANGELOG.

**Rules**
- No paid calls.
- Never print or store secrets.
- No git commits (the main session commits).
- Other agents are working at the same time: an ad-production agent in ads/ and motion/, and a voice-samples agent in config/voice.json, tools/lib/voice.ts and library/voice/. Don't edit those. For shared files (AGENTS.md, schemas/asset.ts, tools/lib/catalog.ts, tools/library-ui.ts), re-read right before each edit and keep diffs small and additive.
- Use they/them for the founder.

**Report:** the folder layout, the schemas, the commands, the seed counts (prompts by author/area/outcome, inspo entries), the UI changes, and the test results.
