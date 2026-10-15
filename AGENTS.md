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
| `library/` | Media (gitignored, synced with S3) + one `manifest.json` per folder (tracked). `brand/`, `zee/`, `people/<persona>/`, `wardrobe/<persona>/`, `camera-roll/<persona>/`, `stock/`, `footage/<moment>/`, `screenshots/<persona>/`, `music/`, `references/` |
| `catalog/` | `index.json`: every asset in one machine-readable file (generated). `schemas/`: a JSON Schema per asset kind (generated) |
| `schemas/` | The zod source of truth for assets, ads and persona accounts |
| `config/` | Project-wide settings as data: `voice.json` (the voiceover's mode and every mode's settings) |
| `motion/` | Reusable Remotion components (PhoneFrame, ZeeActor, KineticType, BeatClock, PopOut…) |
| `ads/` | One folder per ad: `ad.json` (the ad in data), `README.md`, `index.tsx` |
| `renders/` | Rendered videos by ad / channel / length (gitignored, synced to S3) |
| `tools/` | `catalog`, `sync`, `render`, `persona`, `library-ui`, `capture.sh`, `migrate/` |
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
kind  = brand | font | zee | face | selfie | tryon | garment | photo | stock | footage | screenshot | music | sfx | voice | reference
scope = the persona (emma), Zee's emotion (excited), the source (mixkit, unsplash, curate), or a group
name  = kebab-case, most general word first:  jeans-straight-light-wash, coat-trench-khaki
vN    = version, from v1; never reused, never edited once approved
```

Examples: `garment.emma.jeans-straight-light-wash.v1`, `zee.excited.loop.v1`,
`music.mixkit.cat-walk-arulo.v1`, `face.emma.b.v1`, `footage.emma.two-taps-closet-b262.v1`,
`screenshot.emma.wardrobe-top.v1`, `stock.unsplash.coffee-in-hand.v1`, `brand.curate.logo-splash.v1`, `font.geist.medium.v1`.

File names follow the id: `library/<folder>/<name>.v<N>.<ext>` (e.g.
`library/wardrobe/emma/jeans-straight-light-wash.v1.jpg`, cutout in `cutouts/`, thumb in `thumbs/`).
Frame sequences are folders: `library/zee/excited/loop.v1/0001.webp …`. Lowercase, kebab-case,
no spaces. Ad ids are kebab-case too (`meet-zee`); compositions are `<ad>--<format>--<length>s`.

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
`unsplash`, `pexels`, `mixkit`, `ofl` (fonts), `reference` (study only, never shipped). Or pass a
full licence as JSON. **No licence, no asset.** Kind-specific fields go in `--set` (garment:
`category`, `name`; zee: `emotion`, `part`, `pack`; footage: `moment`, `app.build`, `app.version`;
stock: `shows`; try-on: `wearing`; screenshot: `screen`, `state`, `app.build`, `app.version`,
`capture` (screenshot | frame), `origin` (app | probe), `variant` (native | appstore-6.9)). App footage is easiest through `tools/capture.sh`, which
records and adds it in one go. Then commit the changed manifest(s) and `catalog/index.json`.

Removal rules: **retire is the default** and is always safe. Approved assets are never hard-deleted.
`--force` deletes a draft's entry, its local files and its S3 objects (S3 keeps the bytes 90 days
as old versions). An asset an ad lists can't be deleted until the ad stops listing it.

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
  `config/voice.json` covers everything spent so far plus the estimate; it is `0` until the founder
  raises it. Keys come from SSM by name (`/curate/openai-api-key`); never print them.
- **`say-preview` (macOS `say`) is free, offline and PREVIEW ONLY**: its clips are `previewOnly`,
  can never be approved, carry a "Preview voice · not for release" label on screen, and an
  approved/live ad refuses them.
- An AI voice needs the AI disclosure (OpenAI's terms): list it in `ad.json › disclosures`.
- In an ad, build the plan with `narrationPlan()` and hang the picture off `sceneOf` / `lineOf` /
  `phraseFrame`, then put `<Narration plan={plan}/>` on top (see `ads/explainer/index.tsx`).

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
- **Never hand-edit `catalog/index.json` or `catalog/schemas/`**; run `tools/catalog build`.
- Don't move or delete anything in `../marketing/videos/` (the legacy folder) until the migration
  in ARCHITECTURE.md has been run and checked.

## Where to learn more

- `ARCHITECTURE.md`: the whole design (catalog, S3, Remotion structure, personas, capture,
  tracker, migration).
- `RULES.md`: the content and legal rules.
- `decisions/`: why S3, why Remotion, why Emma, why ids, and the rest.
- `CHANGELOG.md`: what changed when.
