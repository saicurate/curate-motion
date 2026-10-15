---
id: prompt.agent-brief.voice-as-config.v1
title: "Make the voiceover a config switch (captions, human, TTS)"
author: "agent:main-session"
area: agent-brief
target: Claude Code subagent (general-purpose)
outcome: worked
rating: 4
why: "One-line switch proved by two renders; dry-run-by-default and the spend cap meant nothing paid ran."
inputs: []
outputs:
  - voice.explainer.l01-say-preview.v1
  - voice.explainer.l02-say-preview.v1
  - voice.explainer.l03-say-preview.v1
  - voice.explainer.l04-say-preview.v1
  - voice.explainer.l05-say-preview.v1
  - voice.explainer.l06-say-preview.v1
  - voice.explainer.l07-say-preview.v1
parents: [prompt.voice.founder-voice-as-config.v1]
tags: [agent-brief, voice, config]
createdAt: 2026-10-15
usedAt: ["2026-10-15T21:36:49Z"]
source: "curate-app session 8dfb7189, Agent tool prompt \"Voiceover as a config switch\" 2026-10-15T21:36Z"
addedBy: "claude-code (prompt-library seed, 2026-10-15)"
---
In the curate-motion repo (/Users/saikumar/Desktop/Curate/curate-motion), make the VOICEOVER a CONFIG CHANGE. The founder said: "the explainer voice… it should be a config change". Switching between no voice (captions only), a human recording, or an AI text-to-speech voice must be one config edit, with no code changes. Read AGENTS.md, ARCHITECTURE.md, RULES.md and library/brand/BRAND.md first, and follow the repo's conventions: zod schemas, ids, `tools/catalog`, S3 sync, the README per folder, the CHANGELOG, and decisions/.

**Build**
1. **A voice config file:** e.g. `config/voice.json`, with a zod schema in schemas/. It has:
   - a default `mode`: `captions` | `human` | `tts`;
   - per-mode settings:
     - **human:** a library asset id per script line, or one take id plus timestamps;
     - **tts:** provider (pluggable), voice name, speed, style;
     - **captions:** the style preset from BRAND.md (Geist, the key-phrase device);
   - per-ad overrides in each ad's `ad.json` (`voice: {mode…}`), plus a per-render CLI override (`tools/render --voice tts`).
   - Captions are ALWAYS available as a burned-in or sidecar track, whatever the mode.
2. **Scripts as data:** `ads/<ad>/script.json`, with line id, text, scene, start hint, and the key phrases to emphasise. Port the explainer's voiceover script into it, from the round-2 concepts (marketing/videos/tracker/status.js "explainer" entry, or ads/_legacy). There are about 330 words.
3. **The motion component:** a `Voice`/`Narration` component that reads the resolved config. It plays the audio (human take or generated TTS file) and drives timing: scene lengths follow the audio duration when voiced, and the script hints when captions-only. It renders captions in brand style.
4. **The TTS provider interface:** `tools/voice generate <ad> [--provider …] [--voice …] [--dry-run]`.
   - It synthesises each line to a file, registers each as a library asset (kind `voice`; add the kind to the schema if missing; licence per the provider's terms, recorded exactly), and caches by hash of (text + voice + settings) so nothing is generated twice.
   - Implement the interface plus at least one provider adapter. Pick one with clear commercial-use terms for ads (e.g. ElevenLabs, OpenAI TTS or Google Cloud TTS). Check which API keys already exist in AWS SSM or GCP Secret Manager BY NAME ONLY; never print values. NEVER use the GCP secret `anthropic-api-key`.
   - **`--dry-run` is the default and costs nothing:** it prints the character count and the estimated cost. Real generation requires `--yes` AND a spend cap in the config, because the founder must OK paid calls (memory ask-before-spending-api-credits.md).
   - **Do NOT generate any paid audio now.**
   - Also add a free local provider using macOS `say` ONLY as an offline preview: mark its output `preview-only, not for release`.
5. **Human recordings:** `tools/voice import <ad> <audio-file>` registers a recorded take and lets you mark line timestamps.
6. **Test:** render the explainer's opening (the existing 9:16 composition, or port the legacy ExOpen) once in `captions` mode and once in `tts` mode with the free `say` preview voice, as draft renders, to prove the switch is a config edit. Put them in renders/ (gitignored, synced) and report the paths.
7. **Docs:**
   - AGENTS.md: a section "How to change the voice" with the exact one-line config edits.
   - A decision note `decisions/00NN-voice-as-config.md`.
   - A CHANGELOG entry.
   - Also write a short plain-English note for the founder covering the voice options and each one's cost per 2:50 explainer (characters × provider price).

**Rules**
- No paid calls.
- Never print secrets.
- Don't touch other agents' work in progress (a screenshots agent is adding a `screenshot` kind right now, so coordinate schema edits carefully: re-read schemas/asset.ts right before editing, and keep your diff small).
- No git commits; the main session commits.
- Use they/them for the founder.

**Report:** the config shape with an example, the commands, the providers implemented, the cost table, and the test render paths.
