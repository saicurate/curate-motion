# curate-motion: architecture

Curate's motion-graphics marketing videos, in one place. Every asset (accounts, Zee's animations,
images, footage, music) is made **once**, catalogued, and reused; every new ad is **assembled**
from the library instead of regenerated.

Written 2026-10-15. Agents: start with [AGENTS.md](AGENTS.md); this file is the why and the how.
Phone view (private): https://claude.ai/artifact/BLQX6mPznbEiKrqeTYhooa

```
  ┌──────────── GitHub (private) saicurate/curate-motion ─────────────┐
  │  manifests (ids, sha256, licence, status)   motion/   ads/        │
  │  catalog/index.json  ◀── tools/catalog build ── library/**/manifest.json
  └──────────────┬──────────────────────────────────────┬──────────────┘
                 │ tools/sync pull/push (by manifest)    │ ads reference asset ids
  ┌──────────────▼──────────────┐              ┌─────────▼──────────────┐
  │ S3 (private, versioned)     │  bytes ◀───▶ │ library/ (local media) │──▶ tools/render ──▶ renders/<ad>/<channel>/<len>s/
  │ curate-motion-library-<acct>│              └────────────────────────┘        (also synced to S3 renders/)
  └─────────────────────────────┘
       ▲ add / replace / retire: tools/catalog (CLI) and tools/library-ui (founder's page)
       ▼ desired state: tools/persona → Emma's real account (wardrobe API) + simulator Photos
```

## 1. Folder layout

```
curate-motion/
├── AGENTS.md            canonical guide for every agent (CLAUDE.md, GEMINI.md, .cursor/rules, copilot point here)
├── ARCHITECTURE.md      this file
├── RULES.md             content + legal rules (licences, no prices, no logos, FTC, AI label, Remotion licence)
├── CHANGELOG.md         what changed when
├── decisions/           one short file per decision (0001-s3-not-git-lfs.md …)
├── library/             MEDIA (gitignored, synced with S3) + manifest.json per folder (tracked)
│   ├── brand/           curate/ logo marks, fonts/ Geist                     ids brand.curate.*, font.geist.*
│   ├── zee/<emotion>/   <part>.vN/0001.webp… frame sequences + <part>.vN.webp ids zee.<emotion>.<intro|loop|outro|still>.vN
│   ├── people/<persona>/  face refs, selfie/, tryon/, persona.md, account.json, account-state.json
│   ├── wardrobe/<persona>/      product shots + cutouts/ + thumbs/          ids garment.<persona>.<name>.vN
│   ├── camera-roll/<persona>/   the persona's phone photos                   ids photo.<persona>.<name>.vN
│   ├── stock/<source>/          Unsplash / Pexels, licence per file          ids stock.<source>.<name>.vN
│   ├── footage/<moment>/        app screen recordings, by persona + build    ids footage.<persona>.<moment>-b<build>.vN
│   ├── music/<source>/          tracks with bpm + beat map                   ids music.<source>.<name>.vN
│   └── references/<name>/       reels we study (never shipped)               ids reference.<group>.<name>.vN
├── catalog/             index.json (every asset, generated) + schemas/*.schema.json (generated JSON Schemas)
├── schemas/             zod source of truth: asset.ts (one schema per kind), ad.ts, account.ts
├── motion/              reusable Remotion components (section 4)
├── ads/<ad-id>/         ad.json (the ad as data) + README.md + index.tsx; registry.ts; Root.tsx
├── renders/             outputs by ad / channel / length (gitignored, synced to S3 renders/)
├── tools/               catalog, sync, render, persona, library-ui, capture.sh, migrate/
├── tracker/             the library page (browser + render queue + add/retire)
└── infra/s3/            the bucket's settings as files + setup.sh
```

Every top-level folder has a README: what goes there, what doesn't, one example.

## 2. The asset catalog

**One typed schema per asset kind**, in zod (`schemas/asset.ts`), exported to JSON Schema
(`catalog/schemas/asset.<kind>.schema.json`) by `tools/catalog build` so any tool can validate.

Kinds: `brand`, `font`, `zee`, `face`, `selfie`, `tryon`, `garment`, `photo`, `stock`, `footage`,
`music`, `sfx`, `reference`.

Every asset has:

| Field | What |
|---|---|
| `id` | stable, `<kind>.<scope>.<name>.v<N>`, kebab-case, never reused (grammar in AGENTS.md) |
| `files[]` | `{role, path, sha256, bytes, mime}`; role = original / cutout / thumb / frame / proof. S3 key = `library/<path>` |
| `frames` | frame sequences (Zee): `{dir, pattern, count, fps, treeSha256, bytes}`, one hash for the whole folder |
| `dims` / `durationSec` / `fps` | pixel size, length |
| `tags` | `persona`, `moment`, `mood[]`, `colour[]`, `season[]`, free tags; plus kind fields (garment `category`, Zee `emotion`/`part`, music `bpm`, `offsetSec`, `sections`, `beats[]`, `beatGrid`) |
| `source` | `{type: generated / stock / captured / original / drawn / rendered / derived, model, prompt, author, url, tool, from[]}` |
| `licence` | **required**: `{name, url, commercial, attributionRequired, attribution, restrictions[], proof, checkedAt}` |
| `cost` | `{usd, calls}` (what it cost to make) |
| `createdBy` | `{type: agent / human, name, at}` |
| `status` | `draft` / `approved` / `retired`, with `approvedBy`, `approvedAt` (required when approved) |
| `supersedes` | the id this version replaces |
| `aiGenerated` | drives the platform AI label |

Extra rules the schema enforces: the id's kind matches `kind`; approved ⇒ approvedBy + approvedAt;
only `reference` may be non-commercial; `source.type: generated` ⇒ `aiGenerated: true`; files sit
inside their manifest's folder; ids are unique.

**Manifests:** one `manifest.json` per library folder (`{about, assets[]}`).
**Index:** `catalog/index.json` flattens every manifest into one machine-readable list, with each
file's S3 key and flat `key:value` tags for search. It is generated and committed;
`tools/catalog validate --check-index` fails if it is stale.

**Assets are referenced by id, never by raw path.** Ads call `src(id)`, `frameSrc(id, n)`,
`<Piece id>`, `<ZeeActor>` (which builds `zee.<emotion>.<part>.v1`), `<Track id>`;
`motion/assets.ts` resolves ids through the index and throws on an unknown or retired id.

**Status and approvals are data.** `draft` is fine for drafts; `approved` is safe in live ads and
**immutable** (a change is a new version, `replace` → `…vN+1` with `supersedes`); `retired` is
refused at render. An approved/live ad may only use approved assets. Approving a new version
retires the one it supersedes. Only the founder approves (`approvedBy`).

### The catalog CLI (`tools/catalog`)

`list`, `search --tag … --kind … --status … --text …`, `show <id>`, `add <file> --kind --licence
--tags --set`, `replace <id> <file>`, `tag <id> --add/--remove`, `retire <id>`, `remove <id>
[--force]`, `approve <id> --by`, `build`, `validate`. Every write validates, updates the manifest
and `catalog/index.json`, and `add`/`replace` upload to S3. Remove = retire by default; `--force`
hard-deletes drafts only (and only if no ad lists them). Code: `tools/lib/catalog.ts`, shared with
the library page.

### Validation

`tools/catalog validate` checks every manifest against its schema, the licence, id uniqueness,
that each file's sha256 matches the local file (or the S3 object's `x-amz-meta-sha256` with
`--sha s3`), frame-folder tree hashes, every ad's asset ids (exist, not retired, approved for live
ads), persona account files, `--immutable-against <ref>` (approved assets' files unchanged since
that commit) and `--check-index`.

- **GitHub Action** (`.github/workflows/validate.yml`) on every push and PR: no media / secrets in
  git, `tsc`, `catalog validate --sha none --check-index --immutable-against HEAD~1`,
  `remotion compositions`; plus `--sha s3` when the repo variable `AWS_ROLE_ARN` (a GitHub OIDC
  role with read-only access to the bucket) is set. Not set yet.
- **Pre-commit hook** (`.githooks/pre-commit`, enabled by `npm install`): blocks media
  extensions, files over 512 KB (8 MB in `catalog/`), `.env`/keys, and secret-looking strings
  (AWS keys, private keys, GitHub/OpenAI/Slack/Google tokens, JSON password fields). It prints only
  file names, never the match.

## 3. The S3 layer

**Bucket:** `curate-motion-library-276451918677` in us-east-1 (`curate-motion-library-<account-id>`:
globally unique, says what it is, ties it to the account). Tags: `project=curate-motion`,
`owner=curate-marketing`, `data=media-library`.

| Setting | Value |
|---|---|
| Block Public Access | all four on (BlockPublicAcls, IgnorePublicAcls, BlockPublicPolicy, RestrictPublicBuckets) |
| Object ownership | BucketOwnerEnforced (ACLs off) |
| Encryption | SSE-S3 (AES256) by default, bucket key on |
| Versioning | on |
| Lifecycle | non-current versions expire after 90 days; expired delete markers cleaned; incomplete multipart uploads aborted after 7 days |
| Policy | deny any request not over TLS |

`infra/s3/setup.sh` creates the bucket or re-applies all of this (idempotent) and prints a verification.

**Layout:** `s3://<bucket>/library/<path>` mirrors `library/<path>` one to one (path plus sha check,
not content-addressed: the bucket stays browsable and the id already versions the asset, so a
path never changes meaning). Rendered videos go to `s3://<bucket>/renders/…`. Frame folders get a
`_tree.sha256` marker object holding their tree hash.

**`tools/sync`:** `status`, `pull [--ad <id>] [--only <glob>] [--kind]`, `push [--only]`,
`renders push|pull`. Push refuses a file whose bytes differ from its manifest sha (a changed file is
a new version), uploads with `x-amz-meta-sha256` + an S3 SHA256 checksum, and skips objects already
at that sha. Pull downloads to a `.part`, re-hashes, and keeps it only on a match. Sync never
deletes remotely; only `catalog remove --force` on a draft does (versioning keeps the bytes 90 days).
`pull --ad <id>` fetches exactly one ad's assets, so a checkout can render without the whole library.

**`.gitignore`:** everything under `library/` except `manifest.json`, READMEs, `persona.md`,
`account.json`, `account-state.json`; everything under `renders/`; media extensions anywhere; `.env`,
keys, `.stage/`, `.cache/`, `tracker/data/`.

**Git LFS vs S3.** LFS keeps media "in the repo", but every clone or CI run pulls through GitHub's
LFS quota and bandwidth (paid packs), files can't be fetched per ad, agents without LFS installed
see pointer files, and history is hard to prune. S3 costs cents per GB, has versioning and
lifecycle rules, works with the AWS credentials Curate already uses, can be read selectively by
manifest, and keeps the git repo small and fast for every agent. The manifest's sha256 gives us
LFS's integrity guarantee without LFS. Decision: [decisions/0001](decisions/0001-s3-not-git-lfs.md).

## 4. The Remotion structure

Remotion 4.0.535, React 19.2.3, zod 4.5.4. `remotion.config.ts`: entry `ads/index.ts`, **public dir
= `library/`**, rspack, the installed Chrome when present (the bundled headless shell never fires
requestAnimationFrame on the founder's Mac), JPEG frames.

**`motion/`: the component library** (ported from the motion tests in marketing/videos):

| Component | What it does |
|---|---|
| `PhoneFrame` (+ `projectOnPhone`) | iPhone 17 Pro Max silhouette that floats in 3D; the screen is a slot for footage |
| `ZeeActor` | Zee by emotion cues: intro → loop → outro, hard on-beat cuts, loop offsets |
| `KineticType`: `Words`, `Slam`, `TypeOn` | words rise from a mask / one word slams on a beat / letter-by-letter |
| `BeatClock` (`beatClock`, `clockFor`) | BPM → frames from a music asset: `frame(n)`, `bar(b, n)`, `section("drop")`, `beatAt(f)` |
| `PopOut` (+ `popCurve`) | scale out of the source (15% → 100%) with overshoot, hold, return |
| `TitleBehind` | title typed or risen BEHIND a cut-out subject |
| `FlashPrint` (`Flash`, `printLand`) | white flash, then a print lands tilted, overshoots and sticks |
| `ScanTrace` (`ScanDots`, `traceFilter`) | dots sweep a rect, then a white outline traces the piece |
| `Ellipse` | hand-drawn marker loop that draws itself on |
| `StrokeFrame` | gradient stroke drawn round a rounded rect |
| `WhipPan` | fast sideways whip between two scenes with motion blur |
| `ClosetReveal` | a scatter of garments slams into a closet grid on the drop |
| `Piece`, `Look` | a garment cutout by id; a flat-lay look by roles |
| `Ground`, `Track`, `Star`, `Logo`, `EndCard` | Mist background, music by id, the mark's star, brand end card |
| `useFrameBox()` | the frame's size, centre, `u` (1% of the short side) and platform safe areas |
| `planScenes()` | keep / drop scenes per length variant, laid end to end on the beat |
| `theme.ts` | Mist palette (from curate-app's `curate_palette.dart`), Geist via `useBrandFonts()`, easings |

**Formats** (`schemas/ad.ts › FORMATS`): `9x16` 1080×1920, `4x5` 1080×1350, `1x1` 1080×1080,
`16x9` 1920×1080, `appstore-iphone` 886×1920, `appstore-ipad` 1200×1600 (App Store previews 15–30 s).
**Lengths:** 6, 15, 30, 60, 90, 120 s. **Channels** map to a default format (tiktok/reels/shorts →
9x16, meta-feed → 4x5, youtube/website → 16x9, appstore → appstore-iphone, x → 1x1).

**`ads/<ad-id>/`:** `ad.json` (validated by `schemas/ad.ts`: brief, hook, channels, formats,
lengths, track, every asset id, components, status, approval, disclosures, createdBy),
`README.md`, `index.tsx` (the component + a zod props schema + defaults). `ads/registry.ts` lists
the ads; `ads/Root.tsx` registers one composition per ad × format × length, id
`<ad>--<format>--<length>s`, with the zod schema so Studio shows editable props. One ad, many
outputs: layout comes from `useFrameBox()`, timing from the beat clock, length from `planScenes()`.

**Rendering** (`tools/render <ad> [--format] [--length] [--draft]`): jobs go into
`renders/queue.json`; each job stages only the ad's assets into `.stage/<ad>/` by hard link and
renders with `--public-dir` pointed there, so a render never copies the whole library into the
bundle. Output: `renders/<ad>/<channel>/<length>s/<ad>_<channel>_<format>_<length>s_v<N>.mp4`,
never overwritten.

First ad: `ads/meet-zee/` (motion test c2 rebuilt from the library: 9x16, 4x5, 1x1 at 6 and 15 s).
Verified end to end on a scratch copy of the migrated library: compositions listed, renders made.

## 5. Personas and accounts

A persona is a made-up person whose life the ads show (Emma: 27, Astoria NYC, olive skin, face B).
Her folder `library/people/<persona>/` holds `persona.md` (the sheet), face references
(`face.emma.b.v1` approved; A and C retired), selfies, try-ons, and two account files:

- **`account.json`** (`schemas/account.ts › PersonaAccount`): who the account is. Email, sign-in
  method, uid, username, flags (test account, origin ORGANIC so push footage still works), test
  devices, status (planned / active / retired), and **the NAME of the password secret**, never the
  value: AWS SSM Parameter Store SecureString `/curate/marketing/<persona>-password` (us-east-1).
- **`account-state.json`** (`schemas/account.ts › AccountState`): what the account actually holds,
  mapped to library ids. Shape:

```json
{
  "$schema": "../../../catalog/schemas/account-state.schema.json",
  "persona": "emma", "uid": "<firebase uid>", "env": "prod",
  "updatedAt": "2026-10-15T18:00:00Z", "updatedBy": "<agent or tool>",
  "wardrobe": [
    { "libraryId": "garment.emma.tee-black.v1", "sha256": "<sha of the file sent>",
      "photoId": "cm:garment.emma.tee-black.v1", "appItemIds": ["<wardrobe item id>"],
      "appNames": ["Black tee"], "via": "api-add-photo", "status": "synced", "at": "2026-10-15T18:00:00Z" },
    { "libraryId": "photo.emma.r01-coffee-shop.v1", "appItemIds": ["…", "…"], "via": "gallery-scan",
      "status": "synced", "at": "…", "note": "pieces the scan found in this photo" }
  ],
  "unmanaged": [{ "appItemId": "…", "appName": "…", "note": "added by hand in the app" }],
  "cameraRoll": [{ "device": "<simulator UDID>", "libraryIds": ["photo.emma.r01-coffee-shop.v1"],
                   "loadedAt": "…", "method": "simctl-addmedia" }],
  "spendUsd": 0
}
```

`via`: api-add-photo / app-add-item / gallery-scan / manual. `status`: pending / synced / removed /
failed. `libraryId` may be null when an item can't be traced to an asset (then it belongs in
`unmanaged`). The file never holds a password or a token.

**Desired state → `tools/persona`.** The library is the desired state:
- `tools/persona sync <persona> --dry-run | --yes [--include-drafts]`: approved, non-retired
  garments vs her live wardrobe (`GET /api/v1/wardrobe`, signed in as her through Firebase's
  email/password REST sign-in with the password read from SSM into memory). Adds:
  `POST /api/v1/wardrobe/add-photo` with the product photo and `photoId: "cm:<library id>"`; the
  call is async (202), so it waits for items whose `sourcePhotoId` matches. Removes:
  `DELETE /api/v1/wardrobe/items/{itemId}` (soft delete). Pieces already in the app with a matching
  `sourcePhotoId` are adopted, not re-added. Items no asset accounts for are listed as unmanaged and
  never touched. Each add costs about $0.07-0.08 of server AI (one look + one drawing + tags), so
  applying needs `--yes` and the founder's OK. `PATCH /api/v1/wardrobe/items/{id}` (name /
  category / colour) exists for relabels.
- `tools/persona roll <persona> --dry-run | --yes [--with-stock]`: rebuilds the simulator's Photos
  from `camera-roll/<persona>` (+ stock), copying the files to /tmp first (the simulator hangs on
  Desktop privacy) and adding them with `xcrun simctl addmedia`. simctl can't delete one photo, so
  any removal shuts the simulator down, clears `data/Media/DCIM` and `data/Media/PhotoData`, boots
  it and re-adds everything wanted. Recorded in `account-state.json › cameraRoll`.

**Footage from that account** is catalogued per moment and app build: `footage.<persona>.<moment>-b<build>.vN`,
with `app {build, version, commit, env}`, `account`, `device`, `cleanStatusBar`, `marks`.

## 6. Footage capture (`tools/capture.sh`)

```
tools/capture.sh <persona> <moment> <probe> <stop-marker|-> <max-seconds> [--dart-define=…]
```

1. Reads the app version + build from the curate-app checkout's `pubspec.yaml` and its commit.
2. Overrides the simulator status bar (9:41, full battery, 4 bars, wifi).
3. Optionally (`CAPTURE_SIGNIN=1`) reads the persona's password from SSM into a 0600 temp file passed
   with `--dart-define-from-file` (never echoed or logged, deleted on exit).
4. Runs the `lib/dev/<probe>.dart` probe on the simulator, starts `simctl io recordVideo` once the
   app is up, stops at the probe's stop marker or the time limit, clears the status bar.
5. Saves `library/footage/<moment>/<persona>-b<build>.v<N>.mp4` (next free N), turns any
   `MARK <name> <unix-time>` lines from the probe into `marks`, and runs `tools/catalog add` (draft,
   uploaded to S3). Logs go to `.cache/capture/`, never into the library.

## 7. Rules

Full text in [RULES.md](RULES.md): licences tracked and required; no shopping or prices; never show
the pipeline; no logos; FTC (personas never vouch for products); the "AI-generated" label where
platforms require it (from each asset's `aiGenerated`, recorded in `ad.json › disclosures`); the
Remotion licence (free for teams of 3 or fewer, a paid company licence beyond that).

## 8. The library page (tracker → library browser)

`tracker/index.html` was the live status page; it becomes the **library browser**:
- every asset as a card (thumb / audio / video preview, status, licence, tags, id to copy), with
  search and kind / status filters;
- **People and accounts**: each persona's account status, how much of her wardrobe is synced, what
  is on the test phone;
- **Render queue**: `renders/queue.json` (queued / rendering / done / failed) with links to outputs.

Two modes: opened from disk it is **read-only** (it loads `tracker/data/catalog.js` and `queue.js`,
written by `catalog build` and `render`, every 3 s). Run **`tools/library-ui`** and open
http://127.0.0.1:4317 for **editing**: drag and drop files to add (pick kind, scope, name, licence,
tags and the kind's fields), and Approve / Retire / Delete (drafts) / Tag / New version on each
card. The server binds 127.0.0.1 only, checks the Host header, and requires a per-run token baked
into the page for every write; it calls the same `tools/lib/catalog.ts` as the CLI.

## 9. Made for many agents

AGENTS.md is the canonical guide (what the repo is, folder map, catalog search, new ad step by
step, render, add/remove assets, Emma's account, the rules, what NOT to do). CLAUDE.md, GEMINI.md,
`.cursor/rules/curate-motion.mdc` and `.github/copilot-instructions.md` point to it. One
machine-readable index (`catalog/index.json`) and JSON Schemas for every kind mean an agent never
has to read folders. Ids and file names follow one grammar. Each ad has an `ad.json` + README.
Status and approvals are data. Validation runs in CI and in a pre-commit hook. History lives in
CHANGELOG.md and `decisions/`.

## 10. Migration plan (marketing/videos → curate-motion)

Run LATER by the main session, once the asset and concept agents have finished writing in
`marketing/videos/`. Everything is a **copy**; nothing there is moved or deleted.

The importer `tools/migrate/import-legacy.ts` already knows the legacy layout. A dry run on
2026-10-15 planned 184 assets in 8 manifests (1,678 files, 328 MB): 6 brand + fonts, 48 Zee clips
(12 emotions × intro/loop/outro/still), 50 garments (with cutouts and thumbs, noun-first names),
6 people assets (face B approved, A and C retired, selfie, try-ons), 22 camera-roll photos, 42
stock, 8 music tracks (BPM / first beat / drop from the motion-test cuts), 2 references. A full
apply + build + validate + two renders of `meet-zee` passed on a scratch copy.

1. **Wait for the writers.** Check nothing changed recently:
   `find ~/Desktop/Curate/marketing/videos -newermt '-15 minutes' -not -path '*/node_modules/*' | head`
   is empty, and the tracker shows the agents done.
2. **Update the repo:** `cd ~/Desktop/Curate/curate-motion && git pull && npm install`.
3. **Dry run:** `node tools/migrate/import-legacy.ts`. Read every `note`:
   - roll photos on disk but not in `assets/roll/manifest.json` (older takes; skipped on purpose,
     but check the manifest is final);
   - garments missing from `GARMENT_NAMES`, music missing from `BEATS` or `licences.json`, anything
     in `footage/raw/` (needs a moment + build: add it with `tools/catalog add … --kind footage`).
   Add names/BPMs to the importer's tables if new items appeared, and re-run.
4. **Apply:** `node tools/migrate/import-legacy.ts --apply`.
5. **Index and check:** `tools/catalog build && tools/catalog validate --sha local` (0 errors).
6. **Keep the legacy code for reference (not compiled):**
   ```bash
   mkdir -p ads/_legacy tools/legacy/assets tracker/legacy catalog/provenance
   cp -R ../marketing/videos/remotion/src ads/_legacy/remotion-src
   cp ../marketing/videos/tools/*.py ../marketing/videos/tools/*.sh tools/legacy/
   cp ../marketing/videos/assets/_tools/*.py tools/legacy/assets/
   cp ../marketing/videos/tracker/*.html ../marketing/videos/tracker/*.js tracker/legacy/
   cp ../marketing/videos/assets/ACCOUNT-PLAN.md library/people/emma/ 2>/dev/null || true
   grep -iE 'key|token|secret|password' ../marketing/videos/assets/_tools/calls.jsonl || cp ../marketing/videos/assets/_tools/calls.jsonl catalog/provenance/emma-assets-calls.jsonl
   ```
   (`ads/_legacy` and `tools/legacy` are excluded from `tsc`; add `!library/**/ACCOUNT-PLAN.md` to
   .gitignore if it is kept there.)
7. **Upload:** `tools/sync push --dry-run`, then `tools/sync push` (about 330 MB), then
   `tools/sync renders push` (the old motion-test cuts, copied to `renders/mt-c*/`).
8. **Verify against S3:** `tools/catalog validate --sha s3` (0 errors). Then a clean-clone test:
   ```bash
   git clone https://github.com/saicurate/curate-motion /tmp/cm-check && cd /tmp/cm-check
   npm ci && tools/sync pull --ad meet-zee && tools/render meet-zee --format 9x16 --length 6 --draft
   ```
9. **Commit + push** the manifests, `catalog/index.json`, schemas and legacy code; add a CHANGELOG
   entry ("migrated marketing/videos: N assets").
10. **Approvals:** the founder reviews in `tools/library-ui` and approves what may ship (brand, fonts,
    Zee, music, the garments that should be in Emma's account). Nothing else is auto-approved.
11. **Port the remaining motion tests** to ads one at a time, from `ads/_legacy/remotion-src/mt/`
    (c1, c3, c4, c5, c7, c9, c12, c14, the explainer opening; c2 is `meet-zee`), each with an
    `ad.json` and README, replacing raw paths with asset ids.
12. **Only when the founder confirms**, leave a `MOVED.md` in `marketing/videos/` pointing here.
    Don't delete the folder.
