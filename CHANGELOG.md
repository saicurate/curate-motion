# Changelog

Newest first. One entry per change that another agent should know about. Asset additions are
in the manifests' git history; list only notable ones here.

## 2026-10-15: the prompt library (`prompts/`) and the inspo board (`inspo/`) (decisions/0010)
- **`prompts/<area>/<name>.v<N>.md`**: one Markdown file per prompt (`schemas/prompt.ts`): author
  (founder | agent:<name> | other), area, target, inputs, outputs, outcome (worked | didn't | mixed |
  untested), rating, why, parents (hybrids), tags, createdAt, usedAt[]; the text is the body.
  `tools/prompts search | list | show | add | rate | use | link | revise | remix | build | validate | scan`.
- **`inspo/<id>.md`**: one per inspiration (`schemas/inspo.ts`): kind, url and/or a `reference` asset,
  love, techniques (transitions, pacing, type, colour), useFor, tags, status. `tools/inspo add | search |
  show | edit | breakdown | archive | build`; `breakdown` is ffprobe/ffmpeg only (cuts, shots, LUFS,
  contact sheet, colours).
- **Indexes:** `catalog/prompts.json`, `catalog/inspo.json` (built by `tools/catalog build`); JSON
  Schemas `catalog/schemas/{prompt,prompt-index,inspo,inspo-index}.schema.json`.
- **Two-way links:** new optional `source.promptId` on every asset (`schemas/asset.ts`);
  `tools/catalog add … --source-prompt-id <id>` sets it and adds the asset to the prompt's outputs.
  `tools/catalog validate` checks prompts and inspo (schema, path = id, parents and no cycles, ids exist,
  links both ways, inspo media is a reference, no secrets, indexes fresh, used prompts' text unchanged).
- **Inspo is never shipped:** validate fails an ad listing a `reference`; `tools/render` refuses to stage
  one (it didn't before). RULES.md › 9.
- **Library page:** tabs Library / Prompts / Inspo (`tools/library-ui-tabs.js`, API in
  `tools/lib/boards-api.ts`): search, filter by outcome and rating, view, copy, rate, "I used it",
  Remix with…, New prompt; drop a file or paste a link with what you love, thumbnail grid, breakdown,
  archive. Localhost + token as before; `--lan` works the same.
- **Secret scan** (`tools/lib/leakscan.ts`) on every prompt/inspo write and in validate (never prints a
  value); the pre-commit hook and CI also catch `sk_…` (ElevenLabs-style) keys now.
- **Seeded** (pure extraction, no model calls): **126 prompts**. 95 image-gen (3 templates, 3 faces,
  50 garments, 30 camera-roll shots + 6 remakes, the selfie, 2 try-on bases; from
  `marketing/videos/assets/_tools/*.py`, picks and remake reasons, cost and times from `calls.jsonl`'s
  safe fields), 16 of the founder's own asks (verbatim from the session; the message with a pasted key
  was left out), 13 main-session agent briefs, 2 OpenAI voice styles. 86 of Emma's assets now point at
  the prompt that made them. **Inspo: 2 entries**: the founder's "Pop Off" reel (concept c14, ad
  `pop-out`) and the real scan-roll recording, both broken down; new asset
  `reference.app.scan-real-probe-sheet.v1` (contact sheet, in S3).

## 2026-10-15: real AI voice samples (OpenAI + ElevenLabs), ElevenLabs adapter
- **Founder's OK for paid TTS:** of the free Mac voice they said "ugly as fuck that voice is… generate.
  use open ai and eleven labs". `tts.spendCapUsd` raised 0 → **2** (through `tools/lib/voice-settings.ts`,
  validated). The default stays `"mode": "captions"`: the founder picks the voice.
- **ElevenLabs adapter** (`tools/lib/voice.ts`, provider `elevenlabs` in `schemas/voice.ts`):
  `POST /v1/text-to-speech/{voice_id}` with `xi-api-key` from SSM `/curate/elevenlabs-api-key` (a missing
  key reads "ElevenLabs: key not set up"). It checks the plan first and refuses a Free-plan key (its
  output can't be used commercially). The licence records "commercial use requires a paid ElevenLabs plan
  (Starter or above)". Cost = credits (1 a character; Flash/Turbo 0.5) × $6 / 40,000 (the Starter plan).
  `TtsProfile.name` (display only) names voices whose `voice` is an id.
- **Profiles** (`config/voice.json`, each a one-line switch: `tools/voice use tts --profile <p>`):
  `openai-{marin,cedar,coral,sage,nova,shimmer,ash,ballad,verse}` (gpt-4o-mini-tts; a warm woman style,
  a matching man style for cedar, ash, ballad, verse), `eleven-{sarah,jessica,will,chris}`
  (eleven_multilingual_v2) and `eleven-{jessica,will}-v4` (eleven_v4).
- **Made:** the explainer's 30-s cut (l01–l07, 328 characters) in all 15 profiles, as `voice` assets
  in `library/voice/` (synced to S3), plus a 30-s 9:16 draft render per voice in `renders/explainer/reels/30s/`.
- **Spend log** (all of it so far, $0.3509 of the $2 cap):
  - OpenAI: 63 calls, 2,952 characters, **$0.0557** (estimate: about $0.015 a minute of speech).
  - ElevenLabs (Starter plan): 42 calls, **1,968 credits** of the 40,000 a month, **$0.2952** at $6 / 40,000.
- Measured pace of the 60 words: OpenAI voices 130–172 wpm; ElevenLabs v2 206–255 wpm (fast for
  "unhurried"); ElevenLabs v4 162–165 wpm. The whole 2:50 explainer would cost about $0.025 (OpenAI) or
  1,270 credits ≈ $0.19 (ElevenLabs) per voice.
- **Comparison page (phone):** https://claude.ai/artifact/T1adCtYDDk63qvXakraE7M (private; every
  clip and draft video inlined). Suggested picks: `openai-marin`, `eleven-jessica-v4`. The founder picks.

## 2026-10-15: the voice is a dropdown (library page + `tools/voice use`)
- `tools/library-ui` has a **Voiceover** panel: the default (Captions only / Human recording / AI voice,
  which AI voice, Burn in captions) and each ad's own choice or "Use the default". Per ad: Preview cost
  (`tools/voice generate --dry-run`), Play sample (clips already made), Preview with Mac voice (free,
  not for release), and Generate (paid: a fresh estimate no higher than the one shown, a confirmation,
  and `tts.spendCapUsd` covering spent + estimate, checked in the server and again in `tools/lib/voice.ts`).
  The spending limit is shown and raised there by the founder, with a confirmation (max $50).
- Saves go through `tools/lib/voice-settings.ts`: edits the JSON text in place (hand formatting kept;
  a save and its undo give back the same bytes), checks the result equals the intended change,
  validates with `VoiceConfig` / `AdSpec` / `resolveVoice`, refuses if the file changed since the page
  loaded it, writes atomically. Then: "Saved: next render of … uses …".
- `tools/voice use <captions|human|tts|default> [--profile …] [--ad …] [--burn-in on|off] [--dry-run]`:
  the same fields, for agents. Never touches the spend cap. `tools/voice use` alone prints every ad's next render.
- `tools/voice generate … --json` prints the estimate/result as JSON (the panel reads it).
- `tools/library-ui --lan` (off by default): also serves the page on the Wi-Fi; every LAN request needs
  the per-run key (link shown only on the Mac's page, never printed; then an HttpOnly cookie). Static
  files now answer byte ranges, so audio plays in Safari on iPhone.

## 2026-10-15: the voiceover is config (decisions/0009)
- `config/voice.json` (`schemas/voice.ts`): one switch, `"mode": "captions" | "human" | "tts"`, plus
  caption presets (BRAND.md key-phrase device), TTS profiles (`tts.use`), `tts.spendCapUsd` (0), timing.
  Per-ad override `ad.json › voice`; per-render `tools/render --voice <mode> [--tts <profile>]`.
- Scripts as data: `ads/<ad>/script.json`. The explainer's 26 lines (244 words) ported from round 2.
- `motion/Narration.tsx` + `motion/narration-plan.ts`: plays the voice, burns in captions, ducks the
  music; scenes follow the audio when voiced, the hints when captions-only. Ads may set their length
  from props (`metadata` in `ads/registry.ts` → `calculateMetadata`).
- New asset kind `voice` (`library/voice/manifest.json`, ids `voice.<ad>.<name>.vN`): TTS clips cached
  by sha256 of text + voice + settings; human takes with line marks; `previewOnly` clips can't be approved.
- `tools/voice` (plan, generate, import, mark, providers). Providers: OpenAI (paid; `--yes` + spend
  cap) and macOS `say` (free, preview only). Dry run is the default.
- `tools/render` stages the voice, writes `.srt` + `.vtt` beside each mp4, refuses missing or
  preview-only voices where they don't belong. `tools/sync pull --ad` also fetches `voice.<ad>.*`.
- New ad `explainer` (opening chapter, 9x16 + 16x9, 30-s variant). Draft renders: captions (v1) and
  say-preview TTS (v2) in `renders/explainer/reels/30s/`. 7 free preview clips; no paid audio made.

## 2026-10-15: scaffold (0.1.0)
- Repo created (private, saicurate/curate-motion) and the S3 bucket `curate-motion-library-276451918677`
  (private, SSE-S3, versioned, non-current versions expire after 90 days, TLS only).
- Schemas: one zod schema per asset kind (13 kinds), ad.json, persona account + account-state;
  JSON Schemas generated into catalog/schemas/.
- Tools: `catalog` (list, search, show, add, replace, tag, retire, remove, approve, build, validate),
  `sync` (S3 pull/push by manifest with sha256 checks), `render` (queue, staged public dir),
  `persona` (desired-state sync of Emma's account and simulator photos), `library-ui` (local page),
  `capture.sh` (simulator footage → footage asset), `migrate/import-legacy.ts`.
- motion/: PhoneFrame, ZeeActor, KineticType (Words, Slam, TypeOn), BeatClock, PopOut, TitleBehind,
  FlashPrint, ScanTrace, Ellipse, StrokeFrame, WhipPan, ClosetReveal, Piece/Look, Ground/Track/Star/Logo/EndCard,
  formats + length presets, ported from the marketing/videos motion tests.
- First ad: `meet-zee` (from motion test c2), 9x16 / 4x5 / 1x1 at 6 and 15 s.
- Agent guides: AGENTS.md (canonical), CLAUDE.md, GEMINI.md, .cursor/rules, copilot-instructions.
- CI (GitHub Action) + pre-commit hook: no media or secrets in git; schemas, licences, ids, index freshness.
- Not yet: the migration of marketing/videos (ARCHITECTURE.md › 10). The library is empty until then.

## 2026-10-15
- Migrated the marketing library from marketing/videos: 192 assets, media in S3, validated with 0 errors.
- Emma's Curate account is live (49 wardrobe pieces); account files under library/people/emma/.
- Fixed tools/sync for Zee frame folders.
