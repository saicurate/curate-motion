# tools/

Run from the repo root. TypeScript tools run directly on Node 23.6+ (`tools/<name>` wrappers).

| Tool | Does |
|---|---|
| `tools/catalog` | list / search / show / add / replace / tag / retire / remove / approve / build / validate |
| `tools/prompts` | the prompt library: `search` (before you write a prompt), `show`, `add`, `rate`, `use`, `link`, `revise`, `remix` (hybrids), `validate`, `scan` |
| `tools/inspo` | the inspo board: `add` (file or link; media → a reference asset), `search`, `show`, `edit`, `breakdown` (ffprobe/ffmpeg only), `archive` |
| `tools/sync` | S3 pull / push / status by manifest; `renders push` |
| `tools/render` | render an ad's formats × lengths through the queue (`--frames a-b` re-renders only those frames, for a critic fix; `--voice` / `--tts` override the voice; `--props '<json>'` passes composition props, e.g. a bumper variant, and `--name <variant>` puts it in the file name; `--concurrency 1` for heavy 3D / footage scenes, which drop layers above it) |
| `tools/voice` | the voiceover: `use` (choose the voice: the same fields as the library page's Voice panel), `plan`, `generate` (TTS, dry run by default; `--json` for scripts), `import` / `mark` (human takes), `providers` |
| `tools/persona` | make a persona's real account (`sync`) and simulator Photos (`roll`) match the library |
| `tools/library-ui` | the founder's local library page (http://127.0.0.1:4317), with tabs Library / Prompts / Inspo (`library-ui-tabs.js`) and the Voice panel (`library-ui-voice.js`): pick the voice, preview the cost, play samples, free Mac preview, guarded paid Generate. `--lan` (off by default) serves it to a phone on the same Wi-Fi, key-protected |
| `tools/capture.sh` | record an app moment on the simulator → footage asset |
| `tools/device/` | phone frames: `register.ts` (measure + register Apple's bezels, or our generic 3D phone + its HDRI), `bezel_fit.py` (a bezel's screen box, island and safe corner radius; ffmpeg + numpy + scipy), `phone_generic.py` (Blender: builds the generic 3D phone GLB; `--hero` ray-traces a still) |
| `tools/photo3d` | a photo's 2.5D layers, free and local (decisions/0013): depth (Depth Anything V2 Small), her cut-out (BiRefNet-portrait + pymatting), the plate behind her (LaMa), their depths, pieces she wears (SAM 2.1) → `.cache/photo3d/<photo>/`; `under` (her with a piece off), `register` (derived catalog assets). Python via uv, pinned by `photo3d.py.lock`; single steps: `tools/depth`, `tools/cutout-person [part]`, `tools/inpaint` |
| `tools/genfill` | a generative fill for holes LaMa can't fill (a body under a garment, a skyline behind a person): SDXL 1.0 Inpainting (OpenRAIL++-M) on the Mac's GPU, the prompt from `prompts/` by id, colour-matched; `--rows`, `--open` (pinned by `genfill.py.lock`) |
| `tools/beats` | a track's beat map with librosa (pinned, via uv): `<music-id> --write` / `--all --write` stores `beatMap` in the manifest; `clip <id> --from --length --fps 60 --out ads/<ad>/beatmap.ts` (studio) |
| `tools/stills` | single frames of an ad: `--frames`, `--times`, `--shots` (one per shot from `shots.ts`), `--determinism --frame N` (render twice, compare sha256) (studio) |
| `tools/critic` | the evidence for judging a render by its frames: contact sheet, fastest-move strip (echo test), phone test, loop, determinism, loudness, blindfold audio, `review.md`; `score`, `history`, `selftest` (studio; Python via uv) |
| `tools/refframes` | a reference pulled apart for a style guide: frames every 0.5 s, palette hex, cuts/shot lengths, motion, grain (studio) |
| `tools/motion-check` | spring presets vs their spec, stacked-track continuity, seeded noise, an ad's frame purity (studio) |
| `tools/migrate/import-legacy.ts` | one-off: copy marketing/videos into the library |
| `lib/` | shared code: `core.ts`, `catalog.ts` (all catalog operations), `boards.ts` + `prompts.ts` + `inspo.ts` + `boards-api.ts` (prompts/ and inspo/), `frontmatter.ts` (Markdown front matter), `leakscan.ts` (secret scan, never prints a value), `s3sync.ts`, `voice.ts` (TTS adapters, cache, spend cap, takes), `voice-settings.ts` (reading and changing which voice: format-keeping JSON edits, zod validation, atomic writes; used by the Voice panel and `tools/voice use`) |

- **Goes here:** repeatable tools.
- **Doesn't:** one-off scripts for a single ad (keep them in that ad's folder), secrets.
- **Example:** `tools/catalog search --tag persona:emma --kind photo --status approved`
