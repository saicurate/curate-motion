# Start here: making Curate videos

You are making marketing videos for **Curate**, an iPhone app that styles people from the clothes they already
own. Everything you need is in this repo or in its S3 bucket, and this page says where. Nothing has to be
downloaded by hand: the tools fetch exactly the files a video uses, when it uses them.

The founder approves everything that runs. You make drafts and hand them back (see "Hand it back").

## 1. Read these, in this order

1. **[handoff/README.md](handoff/README.md)**: the brief. What the app really does, the words it uses (Closet,
   never "wardrobe" or "piece"), the look to match, the rules in plain words.
2. **[RULES.md](RULES.md)**: the content and legal rules (licences, no shopping, never show the pipeline, no
   logos, the FTC, the AI label). When a rule and a brief disagree, the rule wins.
3. **[decisions/0014-ads-redraw-the-app.md](decisions/0014-ads-redraw-the-app.md)**: social ads draw the app as
   motion, never a screen recording in Apple's frame. App Store previews are the one exception.
4. **[AGENTS.md](AGENTS.md)**: the full manual: the catalog, how to make, check and render an ad, the studio
   process, what not to do. Claude Code: the `/motion-reel` skill runs the studio process.

## 2. Set up once

- **macOS** with Google Chrome installed (renders use it), `ffmpeg`, the AWS CLI v2, and Node 23.6 or newer.
- **AWS:** the founder gives you a key for the media bucket. `aws configure --profile curate-motion`
  (region `us-east-1`), then `export AWS_PROFILE=curate-motion` in every shell. Check: `aws sts get-caller-identity`.
- **The repo:** `git clone https://github.com/saicurate/curate-motion.git && cd curate-motion && npm install`
  (this also turns on the pre-commit hook that keeps media and secrets out of git).
- **Your own branch** for all work: `git checkout -b <your-name>/<what-you-make>`. Never push to `main`.

## 3. Where everything is

Git holds the code and the **catalog**, the map of every asset. The files themselves live in the private S3
bucket **`s3://curate-motion-library-276451918677/`**:

- `library/<path>`: every asset, at the path its manifest lists (`catalog/index.json` › `files[].path`).
- `renders/<ad>/<channel>/<length>s/`: finished videos, uploaded with `tools/sync renders push`.

Ask the catalog, don't browse folders:

```bash
tools/catalog search --kind garment --tag persona:emma --status approved   # find
tools/catalog search --text "rainy"                                         # by words
tools/catalog show garment.emma.tee-black.v1                                # one asset: files, licence, status
tools/sync pull --ad ask-zee            # fetch only the files one ad lists (do this before a render)
tools/sync pull --only "zee.hello.*"    # or only some ids
```

What's in it (ids are `<kind>.<scope>.<name>.v<N>`):

| What | Ids | Notes |
|---|---|---|
| The app, new look (build 284) | `footage.emma.b284-*`, `screenshot.emma.b284-*` | Real recordings, the reference for drawing the app. Drafts. Map: `library/footage/INVENTORY-b284.md`. They still say "Wardrobe": the app now says "Closet". |
| The app's Event Draw (build 285) | `footage.emma.b285-draw-*`, `screenshot.emma.b285-draw-*` | The draw's ticket on Today and in the Closet tab, the steps, "You're in!". Drafts. |
| The app, old look | anything tagged `look:v1` | Approved but outdated: don't use for new work. |
| Emma's photos | `photo.emma.r01…r30-*` | 30 photos of her life in New York (AI-generated). Some have 2.5D layers: `…-cutout`, `…-plate` (without her), `…-depth`. Who she is: `library/people/emma/persona.md`. |
| Her face, selfie, try-ons | `face.emma.b.v1`, `selfie.emma.selfie.v1`, `tryon.emma.*`, `photo.emma.r30-walk-to-work-tryon-tee-black.v1` | Try-ons = her photo wearing other clothes. |
| Her clothes | `garment.emma.*` (Jake's: `garment.jake.*`) | Every item has a transparent cut-out (`files[].role: "cutout"`) and the product shot on white. |
| Zee, the mascot | `zee.<mood>.{intro,loop,outro,still}.v1` | 12 moods, the app's 384 px pack. Larger 1080 px renders are being added. |
| Music | `music.*` | Each with BPM, a measured beat map, its licence and any credit line. |
| Stock | `stock.unsplash.*`, `stock.polyhaven.*` | New York, food, coffee, flowers, beaches, dogs, grounds, a studio HDRI. |
| Brand | `brand.curate.*`, `font.geist.*` | The mark, the lockup, the app icon, the brand book (PDF), Geist. The vector mark and Apple's App Store badge are SVGs in `handoff/`. |
| Phones | `device.curate.phone-generic.v1` (ours, 3D) · `device.apple.*` | Apple's frames only around the real app as it runs (AGENTS.md › Phones). |
| Inspo | `reference.*` | Other people's work, for study only. Never in an ad: the tools refuse it. |

Each asset's `status`: `approved` is fine in a video that runs, `draft` is fine in drafts, `retired` is never
used. Only the founder approves.

## 4. Make a video

1. **Start from what works.** The approved look is the App Store header film (`ads/app-store-header-all`).
   The designed ads are `ads/rain-or-shine-v2`, `ads/ask-zee` and `ads/see-it-on-you`, built from the kit in
   `motion/Designed.tsx` (grounds, prints, garments, the redrawn app UI, the pan through the light, the lockup).
   Copy one of them, or `ads/_template`, into `ads/<new-id>/`. The App Store films are there too:
   `ads/app-store-previews-hybrid` (the three previews: real recordings in Apple's frame, as previews must be) and
   `ads/app-store-shots-*` (the store screenshots).
2. **Follow the studio process** in AGENTS.md › "Making a motion film" (`/motion-reel` in Claude Code): a brief,
   a shot list, the beat map (`tools/beats`), cuts on the beat, the hook in the first 2 s, a CTA held 2 s or more,
   the last frame equal to the first.
3. **List every asset id** in `ad.json` and register the ad in `ads/registry.ts`.
4. **Check:** `npx tsc --noEmit -p .` and `tools/catalog validate`. Then `tools/stills <ad> --times 0.5,2,4,…` to
   look at frames.
5. **Render on your Mac:** `tools/sync pull --ad <ad>`, then `tools/render <ad> --format 9x16 --length 15
   --channel tiktok --concurrency 1`. Use concurrency 1: higher values drop layers on heavy frames. Then look at
   frames of the finished video, not only stills: some faults only show in the video.

Formats: 9:16 1080×1920 at 60 fps for social. Keep words and UI inside the safe area: 8% from the top, 20% from
the bottom, 6% from the sides.

## 5. Hand it back

- `tools/sync renders push` uploads your renders to the bucket's `renders/`.
- Push your branch (`git push -u origin <your-branch>`) and open a pull request. CI validates the catalog.
- Send the founder the video and, for a new idea, stills of each shot first (G2/G3 in the studio process).
  The founder approves; nothing is posted or run without that.

## 6. Ask the founder first

- Before any **paid** generation: new AI images, video, voices or try-ons. Use what's in the catalog first.
- Before **adding** an asset (`tools/catalog add` uploads it to S3), or changing one that exists.
- Before **posting, uploading or sending** anything outside this repo and its bucket.
- When something looks missing or wrong: say what and ask. Don't invent a feature or a screen.

## 7. Never

- Never commit media or secrets (the hook blocks them). Media goes through `tools/catalog add` / `tools/sync`.
- Never mark anything approved, never edit an approved asset (make `…v<N+1>`), never delete an asset (retire it).
- Never show prices, shopping, other brands' logos, or how the app works inside.
- Never put a redrawn screen in Apple's iPhone frame, and never redistribute Apple's bezel files.
- Never use a `reference` asset in an ad.
- Never push to `main`.

## 8. What's true right now (2026-10-24)

- **The app's words changed after the 284 recordings.** The tab is Closet, the scan is "Whole closet scan",
  adding one is "Add one closet item", and the scan sorts photos into "picked" and "not picked". New recordings
  come with the next build.
- **Not recorded yet:** the selfie camera's live hints, try-on results from a real account.
- **Drafts waiting for the founder:** the 284 recordings, about half the garment versions, Emma's 2.5D layers,
  the new brand files (mark 2048, lockup, app icon), Jake.
- **The three designed ads are rough cuts** (music only, no sound design yet). Ask Zee and See it on you still
  say "wardrobe" on screen.
- **Remotion's licence** is free for companies of up to 3 people. If you make Curate 4, it needs a Remotion
  Company License before anything new is rendered (RULES.md › 7). Check with the founder.
