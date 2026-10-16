# AGENTS.md: how to work in curate-motion

This is the canonical guide for every AI agent and every person working in this repo (Claude Code,
Cursor, Codex, Copilot, Gemini and others). CLAUDE.md, GEMINI.md, `.cursor/rules/` and
`.github/copilot-instructions.md` all point here. If anything elsewhere disagrees with this file,
this file wins; fix the other one.

## What this repo is

**curate-motion** is Curate's project for motion-graphics marketing videos. Curate is a fashion
stylist iOS app; its mascot is **Zee**, a black plush kitten. Every asset (Zee's animations, the
marketing persona Emma, her wardrobe and camera roll, app footage, music, brand marks) is made
**once**, catalogued with an id and a licence, and reused. **A new ad is assembled from the
library, never regenerated.**

- Code and manifests (lists of assets) live here, on GitHub (private: `saicurate/curate-motion`).
- Media bytes live in the private S3 bucket `curate-motion-library-276451918677` (us-east-1).
  `tools/sync` moves them by manifest. Git never holds media.
- Videos are made with **Remotion 4.0.535** (React). `motion/` has the reusable components; `ads/`
  has one folder per ad.

## Folder map

| Folder | What goes there |
|---|---|
| `library/` | Media (gitignored, synced with S3) + one `manifest.json` per folder (tracked). `brand/`, `zee/`, `people/<persona>/`, `wardrobe/<persona>/`, `camera-roll/<persona>/`, `stock/`, `footage/<moment>/`, `screenshots/<persona>/`, `music/`, `references/`, `devices/` |
| `catalog/` | `index.json`: every asset in one machine-readable file (generated). `prompts.json` and `inspo.json`: every prompt and inspo entry (generated). `schemas/`: a JSON Schema per asset kind, prompt and inspo (generated) |
| `prompts/` | The prompt library: one Markdown file per prompt that worked (or didn't), the founder's and the agents', `prompts/<area>/<name>.v<N>.md` (see "Prompts: find, use, rate, remix") |
| `inspo/` | The inspo board: one Markdown file per inspiration, `inspo/<id>.md`; its media is a `reference` asset in `library/references/` (see "Inspo: add and reference") |
| `schemas/` | The zod source of truth for assets, ads, persona accounts, the voice config, prompts and inspo |
| `config/` | Project-wide settings as data: `voice.json` (the voiceover's mode and every mode's settings) |
| `motion/` | Reusable Remotion components (Device, PhoneFrame, ZeeActor, KineticType, BeatClock, PopOut…), plus the studio kit: `springs.ts`, `noise.ts`, `Blur.tsx`, `StableImg.tsx`, `beatmap.ts`, `sound/` |
| `ads/` | One folder per ad: `ad.json` (the ad in data), `README.md`, `index.tsx`; studio ads also brief.md, style_guide.md, shotlist.md, timeline.ts, shots.ts (see "Making a motion film") |
| `reviews/` | The critic's evidence per ad and round (`tools/critic`); images/audio are local only, `review.md`, `metrics.json` and `scores.json` are tracked |
| `.claude/skills/` | Project skills for Claude Code: `motion-reel` (the studio process) |
| `renders/` | Rendered videos by ad / channel / length (gitignored, synced to S3) |
| `tools/` | `catalog`, `prompts`, `inspo`, `sync`, `render`, `voice`, `persona`, `library-ui`, `capture.sh`, `migrate/`; studio: `beats`, `stills`, `critic`, `refframes`, `motion-check` |
| `tracker/` | The library page: browse, add, retire, render queue (`tools/library-ui`, or open `tracker/index.html` read-only) |
| `decisions/` | One short file per decision, numbered. Read them to learn why things are this way |
| `infra/` | The S3 bucket's settings as files, and `setup.sh` to re-apply them |

Every top-level folder has a README saying what goes there, what doesn't, and an example.

## Setup

```bash
npm install                 # also turns on the pre-commit hook (.githooks/)
aws sts get-caller-identity # you need AWS credentials for the Curate account to sync media
tools/sync pull --ad meet-zee   # fetch only what one ad needs, or `tools/sync pull` for everything
npm run dev                 # Remotion Studio
```

Node 23.6 or newer (tools are TypeScript run directly by Node).

## Find an asset: ask the catalog, don't read folders

```bash
tools/catalog search --kind garment --tag persona:emma --tag colour:black
tools/catalog search --tag emotion:excited --tag part:loop
tools/catalog search --kind music --tag bpm:120
tools/catalog search --text "jeans" --status approved
tools/catalog show garment.emma.jeans-straight-light-wash.v1   # full record: files, sha, licence, tags
tools/catalog list --kind footage --json                        # machine-readable
```

Tags are `key:value`: `kind:`, `status:`, `scope:`, `persona:`, `moment:`, `mood:`, `colour:`,
`season:`, `category:` (garments), `emotion:` and `part:` (Zee), `bpm:` (music), `build:` (footage),
`licence:`, plus `ai-generated` and free tags. Or read `catalog/index.json` directly.

## Naming grammar (ids and file names)

```
id    = <kind>.<scope>.<name>.v<N>
kind  = brand | font | zee | face | selfie | tryon | garment | photo | stock | footage | screenshot | music | sfx | voice | reference | device
scope = the persona (emma), Zee's emotion (excited), the source (mixkit, unsplash, curate), or a group
name  = kebab-case, most general word first:  jeans-straight-light-wash, coat-trench-khaki
vN    = version, from v1; never reused, never edited once approved
```

Examples: `garment.emma.jeans-straight-light-wash.v1`, `zee.excited.loop.v1`,
`music.mixkit.cat-walk-arulo.v1`, `face.emma.b.v1`, `footage.emma.two-taps-closet-b262.v1`,
`screenshot.emma.wardrobe-top.v1`, `stock.unsplash.coffee-in-hand.v1`, `brand.curate.logo-splash.v1`, `font.geist.medium.v1`,
`device.apple.iphone-17-pro-max-silver.v1`.

File names follow the id: `library/<folder>/<name>.v<N>.<ext>` (e.g.
`library/wardrobe/emma/jeans-straight-light-wash.v1.jpg`, cutout in `cutouts/`, thumb in `thumbs/`).
Frame sequences are folders: `library/zee/excited/loop.v1/0001.webp …`. Lowercase, kebab-case,
no spaces. Ad ids are kebab-case too (`meet-zee`); compositions are `<ad>--<format>--<length>s`.
Prompts and inspo entries use the same shape: `prompt.<area>.<name>.v<N>` (file
`prompts/<area>/<name>.v<N>.md`) and `inspo.<source>.<name>.v<N>` (file `inspo/<id>.md`).

## Status: what is safe to use

Every asset has `status` in its manifest:

- `draft`: fine for tests and drafts; not yet signed off.
- `approved`: signed off (`approvedBy`, `approvedAt` say who and when). Safe in live ads.
  **Immutable**: its files never change. To change it, make `…v<N+1>` and set `supersedes`.
- `retired`: never use in new ads (`tools/catalog` refuses retired ids at render time).

Ads have their own status in `ad.json`: `idea → draft → review → approved → live → retired`.
An `approved` or `live` ad may only use `approved` assets; `tools/catalog validate` enforces it.
Only the founder (or someone they name) approves: `tools/catalog approve <id> --by <name>`.
Agents never mark their own work approved.

## Make a new ad, step by step

1. **Brief.** Write one paragraph: who it's for, the single idea, the hook, channels, lengths.
   Look at the inspo first (`tools/inspo search --use-for <concept-or-ad>`) and at the briefs that
   worked before (`tools/prompts search --area motion-brief --outcome worked`).
2. **Find the assets** with `tools/catalog search`. Use what exists. If something is truly missing,
   see "How to add or remove an asset" (and ask before any paid generation).
3. **Copy the template:** `cp -R ads/_template ads/<ad-id>` (kebab-case id).
4. **Fill `ads/<ad-id>/ad.json`:** brief, channels, formats, lengths, `track` (a music id), every
   asset id in `assets`, the motion components used, `status: "draft"`, `createdBy`.
5. **Write `index.tsx`** from `motion/` components. Reach media only through `motion/assets.ts`
   (`src(id)`, `frameSrc(id, n)`, `<Piece id=…>`, `<ZeeActor>`, `<Track id=…>`), never a raw path.
   Place every cut on the beat clock (`clockFor(track, fromSec).frame(n)`). Lay out with
   `useFrameBox()` so every format works. Use `planScenes()` for length variants.
6. **Register it:** one line in `ads/registry.ts`.
7. **Write `ads/<ad-id>/README.md`:** what it is, how it's built, what's reusable.
8. **Check:** `npx tsc --noEmit`, `tools/catalog validate`, then preview in `npm run dev`.
9. **Render a draft** (below) and hand it over for review. The founder approves, not the agent.

## Making a motion film: the studio process

**PROPOSED** (decisions/0011): the founder decides after seeing Pop out v3. Until then these are the
studio's working rules, not RULES.md. Claude Code runs it as the project skill **`/motion-reel`**
(`.claude/skills/motion-reel/SKILL.md`: the full procedure); every other agent follows the same steps:

1. **Render contract.** Every frame from time alone (`t = frame / fps`): no timers, no `Date`, no
   `Math.random` (seeded `motion/noise` only). **60 fps** for new ads (`"fps": 60`; App Store formats
   render at 30 from the same timeline). `tools/stills <ad> --determinism --frame N` must say EQUAL;
   photos drawn at changing scales use `<StableImg>`. `tools/motion-check <ad>` scans for impurities.
2. **Motion with mass.** `motion/springs.ts`: closed-form springs and stacked `track()` values, one
   preset per object class: `ui` (≈3% overshoot), `panel` (0), `camera` (long, critically damped),
   `headline` (lands hard; hold `readHold(text)`), `mascot` (Zee only: bounces), `piece` (≈1%).
   Bouncy easing only for Zee; exponential easing for opacity/colour/blur.
3. **Blur that doesn't echo.** `<SubframeBlur samples={f => samplesFor(speed)}>` (samples ≤ 3 px
   apart; 1 when still) + `<DirectionalBlur>` from the analytic velocity.
4. **Measure the music.** `tools/beats <music-id> --write` (librosa) stores the beat map in the
   manifest; `tools/beats clip … --out ads/<ad>/beatmap.ts` gives the ad its window. State changes on
   beats, big moments on downbeats, whooshes on hits. Designed sound with `motion/sound` on the same
   clock; −14 LUFS; the blindfold test (audio only, its waveform).
5. **State lists.** `brief.md` (FILM sentence, audience, duration, formats, ASSETS, VISUAL, HARD LINE)
   and `shotlist.md`: HOOK 0–2 s, PROBLEM, REVEAL (a real interaction), PROOF (one real screen or
   number), CLOSE (a readable CTA held ≥ 2 s); each shot with time range, ENTRY, EXIT, PURPOSE,
   motion class; last frame = first. A beat that can't justify itself is cut.
6. **Reference → style guide.** `tools/refframes <reference-id> --ad <ad>` (frames every 0.5 s,
   palette hex, shot lengths, motion, grain) → `style_guide.md`. Take the grammar, never the
   subjects, logos or copy. Need another reference? Say what kind and ask.
7. **The critic.** `tools/critic <ad>` writes `reviews/<ad>/<date>/round-<N>/`: contact sheet,
   fastest-move strip, phone test, loop, determinism, loudness, blindfold audio, `review.md`. Judge
   only the frames; score 1–10 (hook, phone, smoothness, variety, sound, brand); fix the 3 worst;
   re-render those seconds (`tools/render <ad> --frames a-b`); repeat until every score is 8+
   (`tools/critic score`).
8. **Gates in ad.json** (`gates`, `gateLog`; validated): G1 assets approved · **G2** style guide +
   shot list + one still per shot (**founder**) · **G3** stills critiqued (**founder**) · G4 animatic
   · G5 full pass, polish, sound · G6 formats, loop check, poster frame, README. Stop at G2 and G3
   with a phone page for the founder.

Studio folder: `ads/<ad>/` brief.md, style_guide.md, shotlist.md, beatmap.ts, timeline.ts, shots.ts,
index.tsx, sound.ts, README.md, ad.json, out/ (local) + `reviews/<ad>/`. First ad made this way:
`ads/pop-out-v3/`.

## Render

```bash
tools/sync pull --ad <ad-id>                             # make sure the ad's media is here
tools/render <ad-id> --format 9x16 --length 15 --draft   # half-size, quick
tools/render <ad-id>                                     # every format × length in ad.json
tools/render <ad-id> --voice tts --tts say-preview       # this render only: another voice (see "How to change the voice")
tools/render queue                                       # status of the render queue
tools/sync renders push                                  # upload finished renders to S3
```

Output: `renders/<ad>/<channel>/<length>s/<ad>_<channel>_<format>_<length>s_v<N>.mp4`. Renders are
never overwritten; each run takes the next `vN`. Formats: `9x16` 1080×1920, `4x5` 1080×1350,
`1x1` 1080×1080, `16x9` 1920×1080, `appstore-iphone` 886×1920, `appstore-ipad` 1200×1600.
Lengths: 6, 15, 30, 60, 90, 120 s (App Store previews: 15–30 s only).

## How to add or remove an asset

Any kind: wardrobe pieces, camera-roll photos, stock, selfies, try-ons, music, footage, Zee clips,
references, brand files. Two ways in, same code underneath (`tools/lib/catalog.ts`), so both
validate, update the manifest and `catalog/index.json`, and upload to S3.

**The founder's way: the library page.** Run `tools/library-ui`, open http://127.0.0.1:4317, drop
files on the page, pick the kind, licence and tags, press Add. Each card has Approve, Retire,
Delete (drafts only), Tag and New version buttons. It's localhost only. Opened straight from disk
(`tracker/index.html`), the same page is a read-only browser.

**The CLI (agents and the founder):**

```bash
# add: copies the file into library/, names it by the grammar, hashes it, writes the manifest entry, uploads to S3
tools/catalog add ~/Downloads/navy-skirt.jpg --kind garment --scope emma --name skirt-pleated-navy \
  --licence ai-owned --tags colour=navy,season=fall --set category=bottom --set "name=Navy pleated skirt" \
  --extra cutout:$HOME/Downloads/navy-skirt-cutout.png --source-model gemini-nano-banana-2.1 --cost-usd 0.06 --by <agent>
tools/catalog add ~/Downloads/track.mp3 --kind music --scope mixkit --licence mixkit --set bpm=120 --by <agent>
tools/catalog add ~/Downloads/latte.jpg --kind stock --scope unsplash --licence unsplash \
  --set "shows=latte art" --source-url https://unsplash.com/photos/… --source-author "…" --by <agent>
tools/catalog add frames/excited-loop.webp --kind zee --set emotion=excited --set part=loop --set pack=zee-sharp-v2 \
  --frames frames/excited-loop/ --licence curate --by <agent>

tools/catalog replace garment.emma.skirt-pleated-navy.v1 ~/Downloads/navy-skirt-better.jpg   # → …v2 (draft), supersedes v1
tools/catalog tag     garment.emma.skirt-pleated-navy.v2 --add mood=polished --remove season=fall
tools/catalog retire  garment.emma.skirt-pleated-navy.v1 --for garment.emma.skirt-pleated-navy.v2
tools/catalog remove  garment.emma.skirt-pleated-navy.v2            # = retire (the default)
tools/catalog remove  garment.emma.skirt-pleated-navy.v2 --force    # hard delete: DRAFTS ONLY
tools/catalog approve garment.emma.skirt-pleated-navy.v2 --by <founder>   # founder only; retires v1
```

Licence presets: `ai-owned` (our generated images), `curate` (our own footage, Zee, brand),
`unsplash`, `pexels`, `mixkit`, `ofl` (fonts), `cc0` (public domain, e.g. Poly Haven), `apple-bezel`
(Apple's Product Bezels: read "Phones in ads" first), `reference` (study only, never shipped). Or pass a
full licence as JSON. **No licence, no asset.** Kind-specific fields go in `--set` (garment:
`category`, `name`; zee: `emotion`, `part`, `pack`; footage: `moment`, `app.build`, `app.version`;
stock: `shows`; try-on: `wearing`; screenshot: `screen`, `state`, `app.build`, `app.version`,
`capture` (screenshot | frame), `origin` (app | probe), `variant` (native | appstore-6.9)). App footage is easiest through `tools/capture.sh`, which
records and adds it in one go. Then commit the changed manifest(s) and `catalog/index.json`.

Removal rules: **retire is the default** and is always safe. Approved assets are never hard-deleted.
`--force` deletes a draft's entry, its local files and its S3 objects (S3 keeps the bytes 90 days
as old versions). An asset an ad lists can't be deleted until the ad stops listing it.

## Phones in ads: `<Device>` (ACCEPTED 2026-10-16, decisions/0012)

**The founder picked option B, Apple's real iPhone bezels** ("i think B is good", 2026-10-16): every
NEW phone shot uses `<Device>` with the default `bezel` variant. Default colour: Silver. Don't use
the drawn `PhoneFrame` in new ads (old ads keep it until they're re-cut). The `3d` generic phone was
NOT picked: use it only if the founder asks for a shot that tilts or has things leave the screen.
New phone shots use `motion/Device.tsx`, by catalog id (kind `device`):

```tsx
<Device model="iphone-17-pro-max" color="silver" width={560} x={540} y={980} scale={push}>
  <Footage id="footage.emma.scan-roll.v1" />
</Device>
<Device variant="3d" color="graphite" screen={{ id: "footage.emma.scan-roll.v1" }} rotation={{ x: 6, y: -20 }} />
```

- **`bezel` (default): Apple's official iPhone Product Bezel, as is.** Apple's rules (licence
  `apple-bezel`, each asset's `rules`): straight on; after a shot of the whole phone you may pan and
  zoom; fades between shots; words beside it, never on it; no rotation, tilt, spin, added shadow or
  reflection, cropping or covering; **nothing may come out of or go into its screen** (no Pop out from
  it); at least 200 px tall; the newest device; the app as it really runs. Any ad using one adds the
  credit line to `ad.json › disclosures`: "iPhone is a trademark of Apple Inc., registered in the U.S.
  and other countries." The component only takes x, y, scale, width, opacity, so it can't break them.
  Animate x, y and scale (sub-pixel transforms), not width.
- **Which iPhone:** `iphone-17-pro-max` matches our captures (17 Pro Max simulator) to the pixel,
  island included. `iphone-18-pro-max` (the latest) has a narrower island, so use it only with footage
  captured on the iPhone 18 Pro Max simulator. Colours: `tools/catalog search --kind device`.
- **`3d`: our own generic phone** (`device.curate.phone-generic.v1`, `tools/device/phone_generic.py`)
  rendered with three.js: `rotation`, `camera.fov`, `shadow`, `environment` (an HDRI id, turn,
  strength). It is not an iPhone: Apple forbids 3D iPhones in marketing; never add Apple-only details
  or call it one. Any move is fine, including pieces leaving the screen. Renders need `--gl=angle`
  (`tools/render` adds it when an ad lists a 3D device; stills: `CURATE_GL=angle tools/stills …`).
- `deviceLayout(...)` says where a bezel's phone and screen land on the canvas, to place words beside it.
- Hero stills ray-traced in Blender: `Blender -b -P tools/device/phone_generic.py -- --glb x.glb --hero
  <screen.png> --hdri <hdr> --out hero.png` (transparent PNG; ~7 s at 1080×1920).
- New bezels (next iPhone): download from developer.apple.com/design/resources › Product Bezels, mount
  the DMG read-only, then `node tools/device/register.ts bezels …` (measures and registers them).

## How to change the voice

The voiceover is **config, not code** ([decisions/0009](decisions/0009-voice-as-config.md)). An ad's
words live in `ads/<ad>/script.json` (line id, text, scene, start/end hints, key phrases); which
voice says them is ONE edit. Precedence: `tools/render --voice` > `ads/<ad>/ad.json › voice` >
`config/voice.json`. Captions are always there too: burned in, and as `.srt` + `.vtt` next to every mp4.

**The founder's way: the Voice panel.** `tools/library-ui`, open http://127.0.0.1:4317, section
"Voiceover". The default (Captions only / Human recording / AI voice, which AI voice, Burn in
captions), each ad's own choice or "Use the default", and per ad: Preview cost (a dry run), Play
sample (clips already made), Preview with Mac voice (free, not for release) and Generate (paid:
only after Preview cost, a confirmation, and a spending limit that allows it; the limit is shown
and only the founder raises it there). Save validates and writes the files, then says what the next
render uses. `tools/library-ui --lan` also serves it to their phone on the same Wi-Fi (off by
default; the link with the per-run key is on the Mac's page, never printed).

**Agents: one line.** It sets exactly the fields the panel does, validated, formatting kept:

```bash
tools/voice use tts --profile openai-marin              # every ad: the AI voice Marin (config/voice.json)
tools/voice use captions                                # every ad: no voice, captions only
tools/voice use human --burn-in off                     # every ad: the recording; captions as .srt/.vtt only
tools/voice use tts --profile say-preview --ad explainer   # one ad (ads/explainer/ad.json › voice)
tools/voice use default --ad explainer                  # that ad follows the default again
tools/voice use                                         # what every ad's next render uses
```

`tools/voice use` never changes `tts.spendCapUsd` (the founder's call, in the panel). Add
`--dry-run` to validate without writing.

| To get | Or edit exactly this |
|---|---|
| no voice, captions only (every ad) | `config/voice.json`: `"mode": "captions"` |
| the AI voice (every ad) | `config/voice.json`: `"mode": "tts"` |
| a different AI voice | `config/voice.json`: `"use": "openai-marin"` (inside `"tts"`; a key of `tts.profiles`) |
| the human recording (every ad) | `config/voice.json`: `"mode": "human"` |
| one ad only | `ads/<ad>/ad.json`: `"voice": { "mode": "tts" }` |
| one render only | `tools/render <ad> --voice tts` (add `--tts say-preview` for another profile) |
| captions not burned in (sidecar only) | `config/voice.json`: `"burnIn": false` (inside `"captions"`; ignored in captions mode) |

Then make the audio the mode needs (the render refuses a voiced cut with missing lines):

```bash
tools/voice plan explainer --voice tts          # the resolved voice, every line's time, what's missing
tools/voice generate explainer                  # DRY RUN (the default): characters + estimated cost, nothing spent
tools/voice generate explainer --yes            # make the clips (cached: the same text + voice is never made twice)
tools/voice import explainer ~/take-1.wav --auto --speaker Sai --release <signed-release>   # a human take, lines marked from its pauses
tools/voice import explainer ~/l03.wav --line l03                                            # or one file per line
tools/voice mark voice.explainer.take.v1 --marks "l01=0.40-3.52,l02=3.90-7.10"               # fix marks by hand
tools/voice providers                           # adapters, prices, licences, whether their key exists (name only)
```

- **Paid TTS needs the founder's OK.** `generate --yes` refuses any cost unless `tts.spendCapUsd` in
  `config/voice.json` covers everything spent so far plus the estimate (the founder set it to $2 on
  2026-10-15). Keys come from SSM by name (`/curate/openai-api-key`, `/curate/elevenlabs-api-key`);
  never print them. A missing key shows as "key not set up" in `tools/voice providers`.
- **Providers:** `openai` (gpt-4o-mini-tts; profiles `openai-<voice>`, e.g. marin, cedar, coral),
  `elevenlabs` (profiles `eleven-<name>`; `voice` is an ElevenLabs voice id, `name` its display name,
  `model` eleven_multilingual_v2 or eleven_v4) and `say` (preview only). ElevenLabs bills the
  account's Starter plan (40,000 credits a month, 1 credit a character; Flash/Turbo 0.5); the spend log
  prices a credit at $6 / 40,000. Commercial use needs that paid plan: the adapter refuses a Free-plan key.
- **Adding or replacing the ElevenLabs key:** elevenlabs.io › Developers › API keys › Create key (Text to
  Speech access; "User: read" lets the adapter check the plan), then
  `aws ssm put-parameter --region us-east-1 --name /curate/elevenlabs-api-key --type SecureString --overwrite --value "$(pbpaste)"`
  (copy the key first; it never lands in shell history). Check with `tools/voice providers`.
- **`say-preview` (macOS `say`) is free, offline and PREVIEW ONLY**: its clips are `previewOnly`,
  can never be approved, carry a "Preview voice · not for release" label on screen, and an
  approved/live ad refuses them.
- An AI voice needs the AI disclosure (OpenAI's terms; ElevenLabs' too): list it in `ad.json › disclosures`.
- In an ad, build the plan with `narrationPlan()` and hang the picture off `sceneOf` / `lineOf` /
  `phraseFrame`, then put `<Narration plan={plan}/>` on top (see `ads/explainer/index.tsx`).

## Prompts: find, use, rate, remix

Every prompt we have used lives in `prompts/`: image, video and voice prompts, on-screen words,
video briefs, the founder's own asks and the briefs agents were given. One Markdown file each,
`prompts/<area>/<name>.v<N>.md`: YAML front matter (`schemas/prompt.ts`) and **the prompt text as the
body**. Each records who wrote the words (`founder`, `agent:<name>`, `other`), what it was for
(`target`), what went in (`inputs`, asset ids) and came out (`outputs`, asset ids), the `outcome`
(`worked | didn't | mixed | untested`), a 1–5 `rating`, `why`, and `parents` (what a hybrid was
mixed from). Ids: `prompt.<area>.<name>.v<N>`; areas: `image-gen video-gen voice music copy
motion-brief agent-brief research other`.

**Two rules for every agent:**
1. **Before you write a new image, video or voice prompt, you MUST run `tools/prompts search`** for
   that area and subject, and start from what worked (or remix it). Read the `why` of the ones that
   didn't, so you don't repeat them.
2. **After you use a prompt, you MUST log it with its outcome:** a new one with `tools/prompts add …
   --outcome …`, an existing one with `tools/prompts use <id>` and `tools/prompts rate <id> …`, and
   link what it made (`--output <asset-id>`, or `tools/catalog add … --source-prompt-id <id>`).

```bash
tools/prompts search --area image-gen --outcome worked --text "ghost mannequin"   # start here
tools/prompts search --area image-gen --outcome didnt                            # what to avoid, with why
tools/prompts search --author founder                                            # the founder's own words
tools/prompts show prompt.image-gen.garment-product-shot.v1                      # meta + text
tools/prompts show prompt.image-gen.garment-product-shot.v1 --text-only | pbcopy # just the text
pbpaste | tools/prompts add - --title "…" --area image-gen --target "Nano Banana Pro" --author agent:<you> \
  --inputs face.emma.b.v1 --outcome worked --rating 4 --why "…" --tags persona:emma   # or: add <file.md>
tools/prompts use  <id> --output photo.emma.r31-gallery.v1 --cost-usd 0.14       # log a use + what it made
tools/prompts rate <id> 2 --outcome didnt --why "the sign had readable words"   # didn't / mixed need a why
tools/prompts revise <id> new-text.md                                            # changed text = vN+1 (parents: <id>)
tools/prompts remix <id-a> <id-b> --title "…" --author agent:<you>              # hybrid: parents set, texts stacked to edit
tools/prompts link <id> <asset-id…>                                              # prompt.outputs + the asset's source.promptId
tools/prompts validate                                                           # the prompts/inspo part of tools/catalog validate
```

- **The founder's way:** `tools/library-ui`, tab **Prompts**: search, filter by outcome and rating,
  View, Copy text, Rate (stars, worked/didn't, why), "I used it", tick 2+ and **Remix with…** (opens
  the merged draft to edit and save), **New prompt**.
- **The text of a prompt that was used or rated never changes** (CI checks it): `revise` makes vN+1.
  Its metadata (rating, outcome, why, usedAt, outputs, tags) can change any time.
- A remix draft keeps `<!-- remix: … -->` markers until someone merges the parts; validate warns.
- `catalog/prompts.json` (generated by `tools/catalog build`) holds every prompt with its text, for
  agents that prefer one file. Never hand-edit it.
- **Never paste a key into a prompt.** `tools/prompts add`, the page and `validate` refuse anything
  that looks like a secret (and never print it). Write the SSM parameter NAME instead.
- Seed ratings (2026-10-15): 5 = the founder picked it, 4 = used as the first take (or the fix that
  worked), 3 = good but not chosen / partly worked, 2 = remade because of it. Founder asks are unrated
  until they rate them.

## Inspo: add and reference

`inspo/` is the board of things we love and want to refer back to: reels, ads, videos, images,
links, competitors' app screens, typefaces, colour ideas. One Markdown file per entry,
`inspo/<id>.md` (`schemas/inspo.ts`), id `inspo.<source>.<name>.v<N>`: what we love (`love`),
`techniques` (`transitions`, `pacing`, `type`, `colour`), `useFor` (`concept:c14`, `ad:pop-out`),
tags, `status` (active / archived), and the notes as the body. **Its media goes into the library as
kind `reference`** (S3, licence "Third-party content, reference only", `never-ship`), with the
same id grammar (`reference.<source>.<name>.v<N>`).

```bash
tools/inspo search --use-for c14                      # what feeds a concept or an ad (also --technique whip-pan, --text, --tag)
tools/inspo show inspo.creator.pop-off-reel.v1
tools/inspo add ~/Downloads/reel.mp4 --title "…" --source creator --love "…" --love "…" --tags transition \
  --transition match-cut --use-for ad:pop-out --url https://… --from "the founder, on WhatsApp" --by <you>
tools/inspo add https://… --title "…" --love "…"      # a link only (no media)
tools/inspo breakdown <id>                            # free and local (ffprobe/ffmpeg): length, frame, audio + LUFS, every hard cut,
                                                      # shot lengths, a 24-tile contact sheet (a derived reference asset), colours
tools/inspo edit <id> --transition whip-pan --pacing "…" --add-love "…"
tools/inspo archive <id>                              # (--undo to bring it back)
```

- **The founder's way:** `tools/library-ui`, tab **Inspo**: drag and drop a file or paste a link,
  add "what I love" and tags, a grid of thumbnails, open an entry for its breakdown, Archive.
- **Inspo is never shipped.** `tools/catalog validate` fails an ad that lists a `reference` asset and
  `tools/render` refuses to stage one (RULES.md › 9). Borrow the technique, never the footage.
- Read the inspo for an ad before you storyboard it, and say in the ad's README which entries it
  draws on.

## How to change Emma's wardrobe in the app

Emma's library is the **desired state**; her real Curate account and test phone follow it.
`library/people/emma/account.json` says who the account is (email, uid, the SSM name of the
password: `/curate/marketing/emma-password`). `library/people/emma/account-state.json` records
what the app actually holds, mapped to library ids. Never put a password in either file.

1. Change the library: add, replace or retire garments in `library/wardrobe/emma/` (above), and get
   the founder to approve the ones that should be in her account (`sync` uses approved pieces only;
   `--include-drafts` for tests).
2. Preview: `tools/persona sync emma --dry-run`: lists ADD, REMOVE, ADOPT (already in the app) and
   unmanaged items (in the app but not from the library; never touched).
3. Apply: `tools/persona sync emma --yes`. Adds go through `POST /api/v1/wardrobe/add-photo` as
   Emma (about $0.07-0.08 of server AI per piece, so **get the founder's OK first**); removes go
   through `DELETE /api/v1/wardrobe/items/{id}`. Progress is saved to `account-state.json` after
   every step.
4. Her phone's photos: `tools/persona roll emma --dry-run`, then `--yes`. This loads
   `library/camera-roll/emma/` (and `--with-stock`) into the simulator with `xcrun simctl addmedia`.
   simctl can't delete single photos, so a removal **resets the simulator's photo library** and
   re-adds everything wanted.
5. Commit `account-state.json`. If you change her account by hand in the app, record it there too.

## The rules (full text in RULES.md)

- **Licences are tracked and required** for every asset.
- **No shopping and no prices** in ads (the Shop is hidden in the app).
- **Never show the pipeline**: no model names, steps, progress of AI internals on screen.
- **Brand:** read [`library/brand/BRAND.md`](library/brand/BRAND.md) before making anything: monochrome ramp, Geist only, logo rules, voice. The full brand book is `brand.curate.brand-guideline-2026.v1` (PDF in S3); its text is in `library/brand/brand-guideline-2026.txt`.
- **No logos** of other brands (garments are logo-free; stock is checked for logos).
- **FTC**: personas never vouch for products ("worth it", "true to size", "I love this brand").
- **AI-generated label** wherever a platform requires it; `aiGenerated` on each asset tells you.
- **Remotion licence**: free for teams of 3 or fewer; above that a company licence is needed.
- **Inspo is never shipped**: `reference` assets (the inspo board's media) never go in an ad.

## What NOT to do

- **Never regenerate an asset that exists.** Search the catalog first. Paid generation needs the
  founder's OK first (no paid model calls without asking).
- **Never commit media or secrets.** The pre-commit hook and CI block them. Media → S3 via
  `tools/sync push`. Secrets → AWS SSM Parameter Store; record only the parameter NAME.
- **Never edit an approved (or picked) asset**, its file or its manifest entry's files. Make a new
  version (`…v2`, `supersedes: …v1`) and leave the old one alone.
- **Never delete an asset entry**; retire it (`tools/catalog retire <id> --for <new-id>`).
- **Never reference media by raw path** in an ad; always by asset id.
- **Never mark your own work approved.** Approvals come from the founder.
- **Never print a secret** (passwords, keys, tokens) in logs, commits or messages.
- **Never hand-edit `catalog/index.json`, `catalog/prompts.json`, `catalog/inspo.json` or `catalog/schemas/`**; run `tools/catalog build`.
- **Never write a new image, video or voice prompt without `tools/prompts search` first, and never
  use one without logging it** (`tools/prompts add` / `use` / `rate`, with the outcome).
- **Never put a `reference` (inspo) asset in an ad**, and never paste a key into a prompt or inspo file.
- Don't move or delete anything in `../marketing/videos/` (the legacy folder) until the migration
  in ARCHITECTURE.md has been run and checked.

## Where to learn more

- `ARCHITECTURE.md`: the whole design (catalog, S3, Remotion structure, personas, capture,
  tracker, migration).
- `RULES.md`: the content and legal rules.
- `decisions/`: why S3, why Remotion, why Emma, why ids, and the rest.
- `CHANGELOG.md`: what changed when.
