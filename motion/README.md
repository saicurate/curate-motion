# motion/

Reusable Remotion components. Ads import from `motion/index.ts`, never from each other.

| Component | Use |
|---|---|
| `PhoneFrame`, `projectOnPhone` | floating iPhone; its screen is a slot for footage |
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
| `Ground`, `Track`, `Star`, `Logo`, `EndCard` | stage, music by id, accents, brand |
| `useFrameBox`, `FORMATS`, `LENGTHS`, `planScenes` | layout per format, length variants |
| `theme.ts` (`C`, `display`, easings, `useBrandFonts`) | Mist palette + Geist |
| `assets.ts` (`asset`, `src`, `frameSrc`, `dims`) | the only way to reach media: by id |

- **Goes here:** anything two ads could share. Lay out against `useFrameBox()`, time against a `BeatClock`.
- **Doesn't:** ad-specific scenes (→ `ads/<id>/`), raw media paths, hex colours outside `theme.ts`.
- **Example:** `<PopOut at={clock.frame(4)} from={{x:300,y:900}} to={{x:540,y:700}}><Piece id="garment.emma.tee-black.v1" x={0} y={0} h={400}/></PopOut>`
