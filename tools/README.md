# tools/

Run from the repo root. TypeScript tools run directly on Node 23.6+ (`tools/<name>` wrappers).

| Tool | Does |
|---|---|
| `tools/catalog` | list / search / show / add / replace / tag / retire / remove / approve / build / validate |
| `tools/prompts` | the prompt library: `search` (before you write a prompt), `show`, `add`, `rate`, `use`, `link`, `revise`, `remix` (hybrids), `validate`, `scan` |
| `tools/inspo` | the inspo board: `add` (file or link; media → a reference asset), `search`, `show`, `edit`, `breakdown` (ffprobe/ffmpeg only), `archive` |
| `tools/sync` | S3 pull / push / status by manifest; `renders push` |
| `tools/render` | render an ad's formats × lengths through the queue (`--voice` / `--tts` override the voice; `--props '<json>'` passes composition props, e.g. a bumper variant, and `--name <variant>` puts it in the file name; `--concurrency 1` for heavy 3D / footage scenes, which drop layers above it) |
| `tools/voice` | the voiceover: `use` (choose the voice: the same fields as the library page's Voice panel), `plan`, `generate` (TTS, dry run by default; `--json` for scripts), `import` / `mark` (human takes), `providers` |
| `tools/persona` | make a persona's real account (`sync`) and simulator Photos (`roll`) match the library |
| `tools/library-ui` | the founder's local library page (http://127.0.0.1:4317), with tabs Library / Prompts / Inspo (`library-ui-tabs.js`) and the Voice panel (`library-ui-voice.js`): pick the voice, preview the cost, play samples, free Mac preview, guarded paid Generate. `--lan` (off by default) serves it to a phone on the same Wi-Fi, key-protected |
| `tools/capture.sh` | record an app moment on the simulator → footage asset |
| `tools/migrate/import-legacy.ts` | one-off: copy marketing/videos into the library |
| `lib/` | shared code: `core.ts`, `catalog.ts` (all catalog operations), `boards.ts` + `prompts.ts` + `inspo.ts` + `boards-api.ts` (prompts/ and inspo/), `frontmatter.ts` (Markdown front matter), `leakscan.ts` (secret scan, never prints a value), `s3sync.ts`, `voice.ts` (TTS adapters, cache, spend cap, takes), `voice-settings.ts` (reading and changing which voice: format-keeping JSON edits, zod validation, atomic writes; used by the Voice panel and `tools/voice use`) |

- **Goes here:** repeatable tools.
- **Doesn't:** one-off scripts for a single ad (keep them in that ad's folder), secrets.
- **Example:** `tools/catalog search --tag persona:emma --kind photo --status approved`
