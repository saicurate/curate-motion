---
id: prompt.agent-brief.voice-switcher-ui.v1
title: "A Voiceover panel in the library page, plus `tools/voice use`"
author: "agent:main-session"
area: agent-brief
target: Claude Code subagent (general-purpose)
outcome: worked
rating: 4
why: "Plain-English panel at phone width, light and dark, with a guarded paid Generate; every file byte-identical after the tests."
inputs: []
outputs: []
parents:
  - prompt.voice.founder-voice-easily-configurable.v1
tags: [agent-brief, voice, library-ui]
createdAt: 2026-10-15
usedAt: ["2026-10-15T21:59:19Z"]
source: "curate-app session 8dfb7189, Agent tool prompt \"Voice switcher in the library UI\" 2026-10-15T21:59Z"
addedBy: "claude-code (prompt-library seed, 2026-10-15)"
---
In the curate-motion repo (/Users/saikumar/Desktop/Curate/curate-motion), the founder wants the voiceover to be EASILY configurable. A previous agent made it a config change in `config/voice.json` (zod schema `schemas/voice.ts`; modes captions|human|tts; tts profiles such as openai-marin, openai-cedar and say-preview; per-ad override in `ads/<ad>/ad.json › voice`; `tools/voice plan|generate|import|mark|providers`; see AGENTS.md "How to change the voice", ads/explainer/VOICE-OPTIONS.md and decisions/0009-voice-as-config.md). Read those first.

**Add a Voice panel** to the founder's local library page, `tools/library-ui` (localhost-only, token-checked; read its code).
- **Global default:** a dropdown for the mode (Captions only / Human recording / AI voice) and, for AI, a voice-profile dropdown filled from config/voice.json. A "Burn in captions" toggle.
- **Per ad:** for each ad in `ads/`, a row that is either "use default" or its own override, with the same dropdowns.
- **Hear it:**
  - A "Preview cost" button runs `tools/voice generate <ad> --dry-run` and shows the characters and the estimated $.
  - A "Play sample" button plays already-generated or cached clips if any exist.
  - A free "Preview with Mac voice" runs the `say-preview` profile. It is labelled "not for release".
  - NO paid generation from the UI unless a "Generate (costs ~$X)" button is pressed AND the config's `spendCapUsd` allows it. Show the cap and let the founder raise it in the UI, with a confirmation.
- **Saving:** writes valid JSON through the same zod schema (validate before writing, keep formatting stable, write atomically). Show a clear "Saved: next render uses …" message.
- **Plain English:** labels in plain English, no jargon, light and dark theme, works at phone width (the founder may open it from their phone on the same Wi-Fi). If you add LAN access, keep it token-protected and off by default behind a `--lan` flag.

**Also**
- A CLI one-liner, documented in AGENTS.md: `tools/voice use <captions|human|tts> [--profile …] [--ad …]`. It sets the same fields as the UI, for agents.
- Tests or quick checks: typecheck, schema validation, and a dry-run round trip through the UI API with curl.
- Update AGENTS.md ("How to change the voice": UI + CLI), the tools README and the CHANGELOG.

**Rules**
- No paid calls.
- Never print secrets.
- No git commits (the main session commits).
- A screenshots agent may be editing schemas/asset.ts and catalog files at the same time. Don't touch those; keep to tools/library-ui, tools/voice*, schemas/voice.ts if needed, and docs.
- Use they/them for the founder.

**Report:** how to open it (command + URL), what each control does, and the test results.
