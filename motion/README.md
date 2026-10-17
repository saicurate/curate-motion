# motion/

Reusable Remotion components. Ads import from `motion/index.ts`, never from each other.

| Component | Use |
|---|---|
| `Device`, `DeviceScreen`, `deviceLayout`, `device` | the app's real screen in a real phone, by id (kind `device`): `bezel` = Apple's iPhone Product Bezel as is (pan, zoom, fade only: Apple's rules), `3d` = our generic phone in three.js (rotation, camera, shadow); decisions/0012 |
| `Device3D` | the `3d` variant itself: GLB + CC0 HDRI + soft contact shadow, the screen a frame-exact video texture; render with `--gl=angle` |
| `PhoneFrame`, `projectOnPhone` | the OLD drawn phone (black rounded rectangle), kept for ads already cut to it; new ads use `Device` |
| `ZeeActor`, `zeeId` | Zee by emotion cues (intro/loop/outro), on-beat cuts |
| `Words`, `Slam`, `TypeOn` (KineticType) | moving type, Geist Medium |
| `beatClock`, `clockFor` (BeatClock) | BPM → frames from a music asset; `frame(n)`, `bar()`, `section("drop")` |
| `PopOut`, `popCurve` | scale from source with overshoot and return |
| `TitleBehind` | title behind a cut-out subject |
| `FlashPrint`, `Flash`, `printLand` | flash, then a tilted print sticks |
| `ScanDots`, `traceFilter` (ScanTrace) | dot scan + outline trace |
| `Ellipse` | hand-drawn ellipse |
| `StrokeFrame` | stroke drawn round a rounded rect |
| `WhipPan` | sideways whip with motion blur |
| `ClosetReveal` | scatter of garments slams into a grid |
| `Piece`, `Look` | garment cutout by id; flat-lay look |
| `Ground`, `Track`, `Star`, `Logo`, `EndCard` | stage, music by id (`duck` dips it under a voice), accents, brand |
| `Narration`, `narrationPlan` | the voiceover from config: plays the audio, burns in brand captions |
| `narration-plan.ts` (`sceneOf`, `lineOf`, `phraseFrame`, `duckGain`, `toSrt`, `toVtt`) | the timeline an ad hangs its picture off; pure, shared with tools/ |
| `Footage` | real app footage by id (OffthreadVideo of the 60 fps master; `from`, `rate`, `zoom` push-in); put it in `<PhoneFrame island={false}>` |
| `MotionBlur` | directional motion blur (SVG Gaussian, separate x / y) for whips and leaps |
| `StoreEndCard` | the real-ads end card: optional line, the mark, "Curate", "On the App Store", Zee peeking over a ledge; inside the safe area |
| `ZeeLeap`, `Fur`, `ZeeWindow` | Zee as a transition: leap at / away from the lens, fur black, a Zee-shaped window onto the next scene |
| `useFrameBox`, `FORMATS`, `LENGTHS`, `planScenes` | layout per format, length variants |
| `theme.ts` (`C`, `display`, easings, `useBrandFonts`) | Mist palette + Geist |
| `assets.ts` (`asset`, `src`, `frameSrc`, `dims`) | the only way to reach media: by id |

**The 2.5D kit** (decisions/0013, PROPOSED: premium for $0 from free local models; AGENTS.md › "2.5D photos"):

| Module | Use |
|---|---|
| `DepthPhoto.tsx` (`DepthPhoto`, `depthRig`, `rigCss`, `depthOf`, `EDITORIAL`) | a photo's layers (tools/photo3d) as depth-displaced meshes seen by a real perspective camera (three.js, frame-pure, `--gl=angle`); `rigCss(...).plane(Z)` puts an HTML layer at depth Z between canvases (titles behind her); a layer's `move` lifts it as an object; the grade is in its shader |
| `Finish.tsx` (`Grain`, `Vignette`, `ContactShadow`, `LightWrap`) | the finishing pass: seeded film grain, an optical vignette, contact shadows and light wrap for anything composited into a photo |
| `KeyLine.tsx` | the brand's on-screen line: Geist Medium, `*key phrase*` in #181818 over #656565, words rising on the `headline` spring |

**The studio kit** (decisions/0011, PROPOSED until the founder's OK after Pop out v3; the process: `.claude/skills/motion-reel/SKILL.md`):

| Module | Use |
|---|---|
| `springs.ts` (`spring`, `springVel`, `track`, `trackVel`, `trackVec`, `PRESETS`, `readHold`, `expoOut`/`expoIn`/`expoInOut`, `expApproach`) | closed-form springs, pure functions of t (seconds); stacked retargets; one preset per object class: `ui`, `panel`, `camera`, `headline`, `mascot` (Zee only), `piece`. Checked by `tools/motion-check` |
| `noise.ts` (`hash`, `rand01`, `noise1`, `fbm1`, `stream`) | seeded randomness: no Math.random anywhere |
| `Blur.tsx` (`SubframeBlur`, `samplesFor`, `DirectionalBlur`, `useBlurId`) | motion blur that doesn't echo: sub-frame accumulation whose sample count follows the speed, plus a Gaussian along the analytic velocity |
| `StableImg.tsx` | a photo/cut-out decoded once at full size into a canvas: identical pixels whatever was rendered before (fixes Chrome's decode-to-scale cache, caught by the determinism check) |
| `beatmap.ts` (`beatClockOf`, `AdBeatMap`) | an ad's window onto a track's measured beat map (`tools/beats clip`): `beat(n)`, `bar(b, n)`, `hitNear(t)`, `onBeat(t)` |
| `sound/` (`createSound`, `scoreFromBeats`, `HIT_KINDS`) | designed sound in code on the picture's clock: kicks, risers, named hits; seeded, byte-identical; Node only (an ad's `sound.ts`) |

- **Goes here:** anything two ads could share. Lay out against `useFrameBox()`, time against a `BeatClock`.
- **Doesn't:** ad-specific scenes (→ `ads/<id>/`), raw media paths, hex colours outside `theme.ts`.
- **Example:** `<PopOut at={clock.frame(4)} from={{x:300,y:900}} to={{x:540,y:700}}><Piece id="garment.emma.tee-black.v1" x={0} y={0} h={400}/></PopOut>`
