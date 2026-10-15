# Changelog

Newest first. One entry per change that another agent should know about. Asset additions are
in the manifests' git history; list only notable ones here.

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
