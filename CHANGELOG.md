# Changelog

Newest first. One entry per change that another agent should know about. Asset additions are
in the manifests' git history; list only notable ones here.

## 2026-10-24: the library catches up with the new look (build 284)
- **The gap:** every approved app recording (141) and screenshot (143) was build 262, the old look; 284 is
  the new look (new tabs, Today, Studio for Try-ons, the scan on the Wardrobe tab, a two-screen sign-up).
  The map, moment by moment (SAME / CHANGED / NEW / GONE, how to capture, ad value):
  `library/footage/INVENTORY-b284.md`.
- **Old look tagged:** the 284 build-262 recordings and screenshots carry `look:v1` (nothing retired: old ads
  still render); so does `footage.curate.b284-tryons-flow.v1` (284's code, but the old Try-ons tab).
- **Recorded from 284 (drafts):** 29 recordings + 44 screenshots of Emma's account in the new look
  (`footage.emma.b284-*`, `screenshot.emma.b284-*`, tags `area:` and `origin:probe`), from `captures/b284.json`.
- **Tools:** `tools/take` (shot lists → simulator → library), `tools/probe-photos` (a persona's things for the
  probes), `tools/export-media` (a plain copy per build in `../app-media/b<build>/`, the founder's raw
  material; no Google Drive). curate-app probe changes: branch `chore/motion-capture-284` (lib/dev only).
- **Not yet:** Event Draw (its probe's prize is an iPhone: a third-party brand), the selfie camera's live
  hints, and real-account results (paid).

## 2026-10-16: premium for $0: 2.5D photos, cut-outs, a finishing pass, two hooks (PROPOSED, decisions/0013)
- **tools/** (free, local, Python via uv, pinned by `*.py.lock`, model revisions pinned): `tools/photo3d`
  (depth: Depth Anything V2 Small, Apache-2.0; her matte: BiRefNet-portrait + pymatting, MIT; plate: LaMa,
  Apache-2.0; pieces she wears: SAM 2.1 hiera-small, Apache-2.0; wisps painted out; `under`; `register`),
  single steps `tools/depth`, `tools/cutout-person [part]`, `tools/inpaint`; `tools/genfill` (SDXL 1.0
  Inpainting, OpenRAIL++-M, on MPS; prompt by id; `--rows`, `--open`, colour-matched). Excluded on licence:
  DA V2 Base/Large (CC BY-NC), Apple Depth Pro (research only), FLUX.1 Fill dev (non-commercial).
- **Schema:** file role `depth` (rg16 PNG: 16-bit disparity packed in R+G); length `8` (a hook on its own).
- **Assets (derived drafts, in S3):** `photo.emma.{r28-couch-cozy,r10-night-out,r26-ferry}-{depth,cutout,plate}.v1`,
  `photo.emma.r26-ferry-plate.v2` (LaMa deck + SDXL skyline; v1 retired), `photo.emma.r26-ferry-jacket.v2`
  (v1 retired), `photo.emma.r26-ferry-under-jacket.v1` (SDXL: her striped sleeves). Prompts:
  `prompt.image-gen.genfill-under-jacket-striped-tee.v1`, `prompt.image-gen.genfill-plate-ferry-skyline.v1`.
- **motion/:** `DepthPhoto` (+ `depthRig`, `rigCss`, `EDITORIAL` grade in the shader), `Finish` (`Grain`,
  `Vignette`, `ContactShadow`, `LightWrap`), `KeyLine`; `StableImg fit` (decode once at the drawn size:
  deterministic grids under sub-frame blur).
- **tools/render** adds `--gl=angle` for ads listing an asset with a `depth` file; **tools/persona roll**
  skips derived layers (they are not photos on her phone).
- **Ads:** `ads/hook-zee-critic/` and `ads/hook-camera-roll/` (8 s, 9:16, 60 fps; studio folders).

## 2026-10-16: real phones: Apple's bezels + our generic 3D phone (PROPOSED, decisions/0012)
- **New asset kind `device`** (`schemas/asset.ts › DeviceAsset`, `library/devices/manifest.json`): screen
  box, corner radius, island, allowed `moves`, `rules`, `creditLine`. Apple devices may only pan/zoom/fade
  and can't be 3D (validated). Licence presets `apple-bezel` and `cc0` (`tools/lib/catalog.ts`).
- **Assets (draft, in S3):** Apple Product Bezels `device.apple.iphone-17-pro-max-{silver,deep-blue,cosmic-orange}.v1`
  and `device.apple.iphone-18-pro-max-{silver,black,burgundy,glacier}.v1` (licence proof files attached);
  `device.curate.phone-generic.v1` (our GLB); `stock.polyhaven.hdri-studio-small-09.v1` (CC0 HDRI).
- **motion/:** `Device` (bezel: Apple's PNG over the masked screen; pan/zoom/fade props only; sub-pixel
  transforms), `Device3D` (three.js via `@remotion/three`; `@remotion/media` headless video texture),
  `devices.ts`, `assets.ts › findAssets`. `PhoneFrame` unchanged. New deps: `@remotion/three` 4.0.535,
  `three` 0.186.0, `@react-three/fiber` 9.8.1, `@types/three`.
- **tools/device/** (`register.ts`, `bezel_fit.py`, `phone_generic.py`); `tools/render` adds `--gl=angle`
  for ads that list a 3D device; `probe` knows glb/hdr/txt/rtf.
- **Study:** `ads/_demos/device-study` (current vs bezel vs 3D, 6 s, 60 fps), `render.ts`; page
  https://claude.ai/artifact/AGC9UrR9ucfR7EAp8nJn5z (source: `ads/_demos/device-study/review-page.html`).
- **Review page template** (`tools/review-page/ads-phone.html`): ads now play inside Apple's iPhone 18 Pro
  Max bezel (CSS only; needs `b/` next to the page, see its README).
- No ad switched: the founder picks first.

## 2026-10-16: Pop out v3 through G4 and G5 (studio rules still PROPOSED)
- **G3 approved** by the founder ("not quite up to the mark but would like to see the results"); open
  choices left at the defaults (flat-lay jacket cut-out, phone position). G4 approved (agent, critic
  rounds 7–9), G5 in review (rounds 10–12, all 8). `reviews/pop-out-v3/2026-10-16/`, `scores.json`.
- **Motion fixes judged in motion** (`ads/pop-out-v3/index.tsx`, `G4 fix`): the review sheet rises under
  the phone's status bar on a longer panel response (0.62 s); the phone's exit, the lockup's exit and her
  photo's return are short moves with exponential fades in sequence (style_guide.md updated).
- **Sound:** `ads/pop-out-v3/sound.ts` (motion/sound) → `sfx.curate.pop-out-v3-sound.v2` (draft; v1
  retired); the music sinks 6 dB under the riser into 41 (`timeline.ts › musicGain`). −14.2 LUFS, true
  peak −2.3 dBTP. The composition now plays the music bed + the designed sound (outside SubframeBlur).
- **tools/catalog validate:** an ad's own designed sound (an `sfx` tagged `ad:<id>`) may be draft after
  G1 is approved, until G5 is approved (a warning, not an error).
- Renders: `renders/pop-out-v3/tiktok/15s/pop-out-v3-g4-animatic_…_v1-3` (540×960) and
  `pop-out-v3-g5_…_v1-3` (1080×1920, 60 fps; v3 is final), pushed to S3. Phone copy:
  `../marketing/videos/cuts/real-pop-out-v3-15s-9x16-v1.mp4`. Pages: the phone review page
  (`tools/review-page/ads-phone.html`, v1 vs v2 vs v3) and the storyboard (`ads/pop-out-v3/review-page/`).

## 2026-10-15: the motion studio process (`/motion-reel`), PROPOSED (decisions/0011); Pop out v3 at G2
- **Skill:** `.claude/skills/motion-reel/SKILL.md` (Claude Code project skill, `/motion-reel <ad-or-brief>,
  <length>, <ratio>, reference <id>`), mirrored in AGENTS.md › "Making a motion film: the studio process".
  Rules PROPOSED until the founder's OK after v3; RULES.md unchanged.
- **Render contract:** `fps` may be 24/30/60 (`schemas/ad.ts`); new ads 60 (template); App Store formats
  always render at 30 (`fpsFor`, Root.tsx). `tools/stills <ad> --determinism --frame N`.
- **motion/:** `springs.ts` (closed-form springs, stacked `track`, presets ui/panel/camera/headline/mascot/
  piece, `readHold`, exponential easings), `noise.ts` (seeded), `Blur.tsx` (`SubframeBlur` with a per-frame
  sample count, `samplesFor`, `DirectionalBlur`), `StableImg.tsx` (fixes Chrome's decode-to-scale cache,
  which broke determinism), `beatmap.ts`, `sound/` (v2's DSP as a module; v2's `sound.ts` now uses it,
  byte-identical output).
- **tools/:** `beats` (librosa via uv; replaces the rough numpy `beats.py`; `clip` writes an ad's
  `beatmap.ts`), `stills`, `critic` (+ `score`, `history`, `selftest`), `refframes`, `motion-check`;
  `render --frames a-b`; staging moved to `tools/lib/stage.ts`.
- **Beat maps** measured and stored (`beatMap` in `library/music/manifest.json`) for all 8 tracks. Their
  old `bpm` / `offsetSec` fields are untouched (existing ads were cut to them), but note: Cat Walk's grid
  is measured at offset 0.003 s, not the estimated 0.423 s (≈ 38 ms off the beat for `clockFor` users);
  Lo-fi 01 measures 100 BPM, not 75; Sleepy Cat 67.5.
- **AdSpec:** `gates` (G1–G6: pending / review / approved / skipped) and `gateLog`; validate checks gate
  order, founder approval (byType human) at G2/G3, 60 fps for studio ads, G1 ⇒ every asset approved,
  each gate's files.
- **reviews/** (new folder): `reviews/pop-out-v2/2026-10-15/round-1/` is the strip-test demo: v2's
  fastest move (13.2 s, 145 px/frame) echoes (4 samples, 24 px gaps).
- **Pop out v3** (`ads/pop-out-v3/`): G1 approved (mechanical), G2 in review: brief.md, style_guide.md,
  shotlist.md, one still per shot. Registered (`pop-out-v3--9x16--15s`).

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

## 2026-10-16
- Phones: the founder picked Apple's real iPhone bezels (option B). The 7 Apple device assets are approved; AGENTS.md and decisions/0012 are accepted. New ads use <Device> (bezel, Silver).
