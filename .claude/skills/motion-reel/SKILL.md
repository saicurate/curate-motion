---
name: motion-reel
description: Curate's motion studio process for making a code-rendered motion film (an ad, a reel, a showreel) in curate-motion, from brief to delivered formats, with founder gates. Use when asked to make, remake or polish a motion film, ad or reel ("make Pop out v4", "a 15 s reel about try-ons", "/motion-reel <ad-or-brief>, <length>, <ratio>, reference <id>"). Covers the render contract (frames from time alone, 60 fps, determinism check), motion with mass (motion/springs presets per object class), motion blur that doesn't echo, the measured beat map (tools/beats), designed sound (motion/sound), the brief / style guide / shot list, the scored critic loop (tools/critic) and gates G1–G6 recorded in ad.json.
---

# /motion-reel: the motion studio process

**Status: PROPOSED** (decisions/0011). The founder decides after seeing Pop out v3 whether these
become house rules. Until then they live here, in AGENTS.md › "Making a motion film: the studio
process" and in each ad's style guide, NOT in RULES.md. RULES.md and the brand book still win.

Invocation: `/motion-reel <ad-id or brief>, <length>, <ratio>, reference <inspo-id>`
e.g. `/motion-reel pop-out-v3, 15s, 9:16, reference inspo.creator.pop-off-reel.v1`.
Missing parts: length 15 s, ratio 9:16, reference = `tools/inspo search --use-for ad:<ad>`.

Read first: AGENTS.md, RULES.md, library/brand/BRAND.md. Use the Remotion skills for API questions.
No paid calls without the founder's OK. Never print secrets. Agents never approve their own work.

## The studio folder (one per ad)

```
ads/<ad>/
  ad.json          the ad in data, with gates { G1…G6 } and gateLog (schemas/ad.ts)
  brief.md         FILM sentence, audience, duration + cut-downs, formats, ASSETS, VISUAL, HARD LINE
  style_guide.md   from references: palette (hex), type, shot lengths, transitions, camera, grain,
                   motion classes, blur, sound, banned defaults
  shotlist.md      every shot: time range on the measured beat map, ENTRY, EXIT, PURPOSE, motion class
  beatmap.ts       generated: tools/beats clip …
  timeline.ts      the moments (T), footage in-points, sound cues: pure data, shared by picture + sound
  shots.ts         the shot list as data (SHOTS: id, key moment, …): tools/stills --shots
  index.tsx        the composition (pure function of t = frame / fps)
  sound.ts         the designed sound (motion/sound), at G5
  README.md        what it is, how it's built, what's reusable (G6)
  out/             local outputs (stills, refs), gitignored
reviews/<ad>/<date>/round-<N>/   the critic's evidence + review.md; reviews/<ad>/scores.json
```

## 1. The render contract

- **Every frame comes from time alone.** `t = frame / fps`; every value is a pure function of `t`.
  No timers, no `Date`, no `Math.random` (use `motion/noise`: `rand01(seed, i)`, `noise1(seed, t)`),
  no state carried between frames. `tools/motion-check <ad>` scans for them.
- **60 fps for every new ad** (`"fps": 60` in ad.json; schemas/ad.ts requires it once `gates` is
  set). Think in seconds, never frames, so the same timeline renders at 30 for App Store previews
  (Root.tsx does that for `appstore-*` formats) and at 60 everywhere else.
- **Determinism check:** `tools/stills <ad> --determinism --frame N` renders frame N in a fresh
  browser and again after an out-of-order frame; the sha256s must match. tools/critic runs it on the
  fastest frame. If it fails: photos drawn at changing scales → `<StableImg>` (Chrome's JPEG
  decode-to-scale cache otherwise leaks between frames; found on v3).
- Remotion is frame-pure and stays the renderer, at `--concurrency 1` for heavy scenes (Chrome drops
  layers at 2–3 here). Measured on v3 (9:16, 60 fps, photos + real footage): about 0.07 s a frame
  with adaptive blur, 0.12 s with 16 samples everywhere; 900 frames in 78 s.

## 2. Motion with mass (`motion/springs.ts`)

Closed-form damped springs, pure functions of t, with analytic velocity. Pick the preset by WHAT
moves, never by taste per shot:

| Class | For | Overshoot | 99% settled |
|---|---|---|---|
| `ui` | buttons, chips, cards, captions | 2.8% (gives mass) | 0.34 s |
| `panel` | sheets, phones, big surfaces | 0 | 0.42 s |
| `camera` | the virtual camera | 0, long glide | 1.69 s |
| `headline` | on-screen words | 0.3%, lands hard | 0.17 s, then hold `readHold(text)` |
| `mascot` | Zee only | 23%, bounces on purpose | 0.74 s |
| `piece` | garments | 1.1%, a slight settle | 0.48 s |

- `spring(t - t0, "piece")`, `springVel`, and **stacking** for a value that retargets:
  `track(t, v0, [{ t, v, spring? }…])` = v0 + Σ (v_i − v_{i−1}) × spring(t − t_i), with `trackVel`
  and `trackVec`. Position and velocity stay continuous through every change.
- Bouncy easing is banned except `mascot`. Exponential easing (`expoOut`, `expoIn`, `expoInOut`,
  `expApproach`) for opacity, colour, blur amounts: things that are not objects.
- Zoom in log space (`Math.exp(track(t, log z0, keys))`): glides feel even.
- `tools/motion-check` prints every preset's measured overshoot and settle time against its spec.
- Never `Easing.bezier` / Remotion's default `spring()` in a new ad.

## 3. Motion blur that doesn't echo (`motion/Blur.tsx`)

- `<SubframeBlur samples={(f) => samplesFor(speedPxPerFrame(f))} shutter={0.5}>`: real sub-frame
  accumulation, its sample count following the analytic speed: neighbouring samples ≤ 3 px apart,
  1 sample when still (cheap), 8–16 on fast moves.
- `<DirectionalBlur vx vy>` along the analytic velocity, sized to the gap between samples.
- **The strip test:** tools/critic finds the fastest move and saves 12 consecutive frames at 1:1
  (`strip.jpg`, `strip-zoom.jpg`) with optical-flow speed and an echo comb score; with
  `--samples N` it also checks the sample gap (speed × shutter / (N − 1) must be ≤ 3 px). Pop out
  v2's strip is the reference failure: 4 samples, 24 px gaps, "9:41" ×4.
  `tools/critic selftest` proves the detector on synthetic sharp / echo / smooth moves.

## 4. Measure the music

- `tools/beats <music-id> --write` (librosa, pinned, through uv; free and local) stores the track's
  `beatMap` in its manifest: comb-fitted grid (bpm, offsetSec, fit in ms), every beat, downbeats,
  percussive hits [t, strength], loudness per bar, sections (drop / lift / break / fall).
  `tools/beats --all --write` for the library. It never changes the old `bpm` / `offsetSec` fields
  (existing ads were cut to them).
- `tools/beats clip <music-id> --from <s> --length <s> --fps 60 --out ads/<ad>/beatmap.ts` writes
  the ad's window (start on a downbeat; it prints the nearest). Read it with
  `beatClockOf(BEATMAP)` (motion/beatmap.ts): `beat(n)`, `bar(b, n)`, `hitNear(t)`, `onBeat(t)`.
- **State changes on beats, big moments on downbeats, clicks and whooshes on hits.**
- Designed sound in code on the same clock: `ads/<ad>/sound.ts` with `createSound` +
  `scoreFromBeats` from `motion/sound` (kicks, risers, named hits: pop, land, glide, settle, swish,
  whoosh, impact, chime…), seeded, byte-identical every run. Mix to −14 LUFS integrated, true peak
  ≤ −1 dBTP (tools/critic measures the render). No stock or paid SFX.
- **Blindfold test:** tools/critic writes `audio.wav` and `waveform.png` (waveform + onset envelope
  + beats + downbeats). Judge the sound from those alone before watching.

## 5. State lists: brief.md and shotlist.md

**brief.md:** the FILM sentence (one line the whole film serves), audience, duration and cut-downs,
formats (9:16 first), ASSETS (ids, approved), VISUAL, HARD LINE (never invent product screens or
numbers; no prices or shopping; never show the pipeline).

**shotlist.md**, structure:
- HOOK 0–2 s: one image that makes the promise; words at about 1 s.
- PROBLEM: the pain, in a picture.
- REVEAL: the product through a REAL interaction (real footage, big: at least about 3 s).
- PROOF: one real screen or one real number.
- CLOSE: a clean final state and a READABLE CTA held at least 2 s.
- The final frame matches the first, so it loops.

Each shot: time range on the measured beat map, ENTRY state, EXIT state, PURPOSE, motion class(es),
the one focal point. **If a beat can't justify itself, cut it.** Mirror it as data in `shots.ts`
(`key` = the still's moment) and `timeline.ts`.

## 6. Reference → style guide

- `tools/refframes <reference-id|file> --ad <ad> [--every 0.5] [--from --to]`: frames every 0.5 s
  (stamped), an 8-colour palette (hex, share), cuts and shot lengths, motion per second, flat-ground
  share, grain, brightness/contrast → `ads/<ad>/out/refs/<name>/`.
- Run it on the inspo reference(s) AND on the previous version of the ad (its lessons).
- `style_guide.md`: palette in hex (brand ramp around the app; colour only from content), type
  (Geist; the key phrase in #181818, the rest #656565; sizes in u; `readHold`), shot lengths,
  transitions, camera, grain, motion classes, blur, sound, safe areas, banned defaults, the loop.
- **Take the grammar, never the subjects, logos or copy.** References are never shipped.
- If another reference is needed, say what KIND and ask the founder; never invent one.

## 7. The critic loop

```
tools/critic <ad> [--render <file>] [--samples N --shutter 0.5] [--from <track s>]
tools/critic score <ad> --round N hook=_ phone=_ smooth=_ variety=_ sound=_ brand=_ [--note "…"]
tools/critic history <ad>
```

It writes `reviews/<ad>/<date>/round-<N>/`: `contact.jpg` (2 fps, 6 across), `strip.jpg` +
`strip-zoom.jpg` (the fastest move), `phone.jpg` (360 px wide), `loop.mp4` + `seam.jpg` (twice back
to back), the determinism hashes, loudness, `audio.wav` + `waveform.png`, `metrics.json`, and
`review.md` (the scoring template with every measurement filled in).

**Judge only the rendered frames, never the code.** Score 1–10: hook in 2 s, phone readability,
motion smoothness, variety, sound sync, brand accuracy. List the **3 worst defects** with timestamp,
evidence (file + what you see) and a LOCAL fix. Fix those three, re-render only those seconds
(`tools/render <ad> --frames a-b --concurrency 1`), run the next round. Repeat until every score is
8+. Record each round with `tools/critic score`.

## 8. The gates (record them in ad.json)

| Gate | What | Who approves |
|---|---|---|
| G1 | assets: every id listed, all `approved` in the catalog; real footage only | mechanical (validate checks) |
| G2 | brief.md + style_guide.md + shotlist.md, and ONE still per shot (`tools/stills <ad> --shots`) on a phone page | **the founder** |
| G3 | stills for every shot, critiqued (critic on the stills; fixes) | **the founder** |
| G4 | a 960×540 animatic (540×960 for 9:16: `--scale 0.5`) with placeholder audio (the music only) | agent, critic round |
| G5 | the full pass: polish, motion blur, designed sound, −14 LUFS, critic rounds to 8+ | agent → founder review |
| G6 | formats from the same timeline (re-laid out, never cropped; vertical = bigger type, fewer elements), the loop check, a poster frame, README | agent → founder |

`ad.json`:
```json
"gates": { "G1": "approved", "G2": "review", "G3": "pending", "G4": "pending", "G5": "pending", "G6": "pending" },
"gateLog": [{ "gate": "G2", "status": "review", "by": "<agent>", "byType": "agent", "at": "YYYY-MM-DD", "note": "…" }]
```
Statuses: pending → review → approved (or skipped, never for G2/G3). A gate opens only when the one
before is approved; G2/G3 approved need a gateLog entry with `byType: "human"` (the founder);
approved/live ads need every gate closed; `tools/catalog validate` checks all of it, plus each gate's
files (G2: brief, style guide, shot list; G3: shots.ts; G6: README).

**At G2 and G3, STOP.** Publish a phone page for the founder (the artifact-design skill; icon
"film"): the brief, the style guide with palette swatches, the storyboard (each shot: time, still,
entry → exit, purpose, motion class) and what changed since the last version. Give the URL and wait.

## Commands, in order

```bash
tools/catalog search …                         # G1: the assets (approved only)
tools/inspo show <id>; tools/refframes <reference-id> --ad <ad>      # the references
tools/beats <music-id> --write                 # once per track
tools/beats clip <music-id> --from <s> --length 15 --fps 60 --out ads/<ad>/beatmap.ts
# write brief.md, style_guide.md, shotlist.md, timeline.ts, shots.ts, index.tsx; register in ads/registry.ts
npx tsc --noEmit && tools/catalog validate --sha none && tools/motion-check <ad>
tools/stills <ad> --shots                      # G2 stills → phone page → STOP for the founder
tools/stills <ad> --determinism --frame N      # any time
tools/render <ad> --concurrency 1             # G4/G5 renders; --frames a-b for a critic fix
node ads/<ad>/sound.ts <out.wav> && tools/catalog add <out.wav> --kind sfx --scope curate …   # G5
tools/critic <ad> [--samples N]; tools/critic score <ad> --round N …                          # every round
```
