import { Audio } from "@remotion/media";
import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { FormatId } from "../../schemas/ad";
import { DepthPhoto, EDITORIAL, Grain, has, KeyLine, StableImg, SubframeBlur, Vignette, depthRig, rigCss, samplesFor, src, useBrandFonts, type DepthCam, type DepthLayer, type Spring } from "../../motion";
import { expoInOut, expoOut, mix, progress, spring, track } from "../../motion/springs";
import { BUILD, buildGain, COLS, driveGain, FERRY_COL, FERRY_ROW, FROM_SEC, GAP, ROW, scrollAt, scrollSpeed, STOP_Y, T, TILE, TRACK } from "./timeline";

// Hook B, "Your camera roll is secretly a closet" (8 s, 9:16, 60 fps), made for $0.
// S1 her REAL camera roll (the 30 photos the app scans) flicks past faster and faster, with true sub-frame
// motion blur; it stops dead on her ferry photo and the music cuts. S2 the tile grows into the frame (the
// 2.5D camera's own lens: an exact match, no swap) and the photo becomes a place: the skyline drifts behind
// her, the title rises BEHIND her. S3 her denim jacket peels off her, slow, toward the camera; she is left
// in her striped tee and the focus racks to the jacket. Every value is a function of t = frame / fps.

export const schema = z.object({ format: FormatId, length: z.number(), music: z.boolean(), volume: z.number().min(0).max(1), sfxVolume: z.number().min(0).max(1) });
export const defaults = { music: true, volume: 1, sfxVolume: 0.85 }; // the drive and build gains are in timeline.ts (measured: ≈ −15 LUFS, the freeze's silence is the design)
const SFX = "sfx.curate.hook-camera-roll-sound.v2";
export const metadata = () => ({ durationInFrames: 8 * 60 });

const FERRY = { photo: "photo.emma.r26-ferry.v1", plate: "photo.emma.r26-ferry-plate.v2", under: "photo.emma.r26-ferry-under-jacket.v1", jacket: "photo.emma.r26-ferry-jacket.v3" };
const ROLL = [
  "r01-coffee-shop", "r02-subway-platform", "r03-brooklyn-street", "r04-park-autumn", "r05-office", "r06-farmers-market",
  "r07-rooftop-golden-hour", "r08-beach-day", "r09-mirror-selfie-weekend", "r10-night-out", "r11-mirror-selfie-work", "r12-dumbo-walk",
  "r13-winter-street", "r14-sunday-errands", "r15-hudson-run", "r16-bookstore", "r17-brunch", "r18-office-lobby",
  "r19-fall-game-day", "r20-country-night", "r21-museum-steps", "r22-stoop", "r23-rainy-day", "r24-dinner",
  "r25-cafe-laptop", "r26-ferry", "r27-chelsea-market", "r28-couch-cozy", "r29-gym-mirror", "r30-walk-to-work",
].map((n) => `photo.emma.${n}.v1`);

/** The tile at (row, col): her roll, reshuffled every lap (seeded) so the repeats never line up; the ferry where it stops. */
const tileId = (row: number, col: number) => {
  if (row === FERRY_ROW && col === FERRY_COL) return FERRY.photo;
  const k = row * COLS + col;
  const lap = Math.floor(k / ROLL.length);
  const i = k % ROLL.length;
  const order = [...ROLL.keys()].sort((a, b) => ((a * 7919 + lap * 104729) % 31) - ((b * 7919 + lap * 104729) % 31));
  const id = ROLL[order[i]];
  return id === FERRY.photo ? ROLL[(order[i] + 3) % ROLL.length] : id;
};

const rig = depthRig({ photo: { w: 1792, h: 2400 }, near: 1.0, far: 14, overscan: 1.1, fov0: 30, align: { x: 0.5, y: 0.5 } });
const Z_TITLE = 4.2; // between her (≈1.1–1.3) and the skyline (far)
/** The peel: a slow, critically damped glide (≈3.2 s to settle): slow motion with weight, no bounce. */
const SLOWMO: Spring = { zeta: 1, response: 2.6 };

const Roll: React.FC<{ t: number }> = ({ t }) => {
  const { height: H } = useVideoConfig();
  const off = scrollAt(t);
  const dimA = expoOut(progress(t, T.dim, 0.3));
  const first = Math.max(0, Math.floor(off / ROW) - 1);
  const rows = Array.from({ length: Math.ceil(H / ROW) + 2 }, (_, i) => first + i);
  return (
    <AbsoluteFill style={{ background: mixHex(dimA) }}>
      {rows.flatMap((row) =>
        Array.from({ length: COLS }, (_, col) => {
          const id = tileId(row, col);
          const ferry = row === FERRY_ROW && col === FERRY_COL;
          return (
            <StableImg
              key={`${row}-${col}`}
              src={src(id)}
              fit={{ w: TILE, h: TILE }}
              style={{ position: "absolute", left: col * (TILE + GAP), top: row * ROW - off, width: TILE, height: TILE, opacity: ferry ? (t >= T.freeze ? 0 : 1) : 1 - 0.8 * dimA, filter: ferry ? undefined : `saturate(${1 - 0.5 * dimA})` }}
            />
          );
        }),
      )}
    </AbsoluteFill>
  );
};

/** The roll's ground: the Photos app's white, falling to near-black (#0E0E0F) as the other photos dim. */
const mixHex = (u: number) => {
  const c = Math.round(255 + (14 - 255) * u);
  return `rgb(${c},${c},${Math.round(255 + (15 - 255) * u)})`;
};

const peelP = (t: number) => spring(t - T.peel, SLOWMO);

const camAt = (t: number): { cam: DepthCam; s: number } => {
  // the zoom (T.freeze → T.zoomTo): the lens itself widens from tile size to the rest pose: an exact scale of
  // the photo about the frame's centre (no parallax yet), so the tile and the 2.5D scene are one picture
  const sTile = TILE / (2 * 1.1 * 960 * (1792 / 2400)); // the photo's rest width → the tile's width
  const zu = expoInOut(progress(t, T.zoomFrom, T.zoomTo - T.zoomFrom));
  const s = Math.exp(mix(Math.log(sTile), 0, zu));
  const fov = (2 * Math.atan(Math.tan((30 * Math.PI) / 360) / s) * 180) / Math.PI;
  if (t < T.zoomTo) return { cam: { fov }, s };
  // ALIVE: a slow push-in and a rise; on the peel a gentle drift back so the jacket has room to come forward
  const u = t - T.zoomTo;
  // (a small push with a pedestal up: she grows and sinks a touch against the title, so her hair only
  // ever kisses its baseline; the line stays readable through its hold)
  const dolly = track(u, 0, [{ t: 0, v: 0.08, spring: "camera" }, { t: T.peel - T.zoomTo + 0.2, v: -0.035, spring: "camera" }]);
  const y = track(u, 0, [{ t: 0, v: 0.022, spring: "camera" }]);
  const x = track(u, 0.012, [{ t: 0, v: -0.01, spring: "camera" }]);
  return { cam: { dolly, y, x }, s: 1 };
};

const Ferry: React.FC<{ t: number }> = ({ t }) => {
  const { width: W, height: H } = useVideoConfig();
  const { cam, s } = camAt(t);
  const css = rigCss(rig, cam, W, H);
  const zu = expoInOut(progress(t, T.zoomFrom, T.zoomTo - T.zoomFrom));
  // where the tile is, and the clip that grows with it (full frame at the end of the zoom)
  const tileCx = FERRY_COL * (TILE + GAP) + TILE / 2;
  const tileCy = STOP_Y + (scrollAt(t) - scrollAt(T.freeze + 2)); // rides the catch's overshoot
  const dx = mix(tileCx - W / 2, 0, zu);
  const dy = mix(tileCy - H / 2, 0, zu);
  const clip = { l: mix(tileCx - TILE / 2, 0, zu), t: mix(tileCy - TILE / 2, 0, zu), r: mix(tileCx + TILE / 2, W, zu), b: mix(tileCy + TILE / 2, H, zu) };
  const p = peelP(t);
  const g = { grade: EDITORIAL };
  // the rack focus: as the jacket comes forward, she and the city go soft and a little darker
  const focus = expoInOut(progress(t, T.peel + 0.3, 1.8));
  const back = focus * 5.5;
  // the peel: the jacket floats forward off her (toward the camera), lifted just enough to cancel the
  // perspective drop, so its collar stays under her chin and its hem (cut off by the photo's edge) stays
  // below the frame; a slow twist, the shoulders tipping back a little as if held up by them
  const drift = Math.max(0, t - T.peel); // it never comes to a dead stop: a slow float carries on under the glide
  const jacketMove = { pivot: [864, 1790] as [number, number], x: 0.024 * p, y: 0.026 * p + 0.002 * drift, z: 0.26 * p + 0.008 * drift, rx: -7 * p, ry: -13 * p - 0.6 * drift, rz: -4.5 * p - 0.3 * drift };
  const L = (key: string, id: string, extra: Partial<DepthLayer> = {}): DepthLayer => ({ key, image: { id }, depth: { id, role: "depth" }, ...g, ...extra });
  const blurStyle = (px: number): React.CSSProperties => (px > 0.05 ? { filter: `blur(${px.toFixed(2)}px)` } : {});
  return (
    <div style={{ position: "absolute", inset: 0, clipPath: `inset(${clip.t}px ${W - clip.r}px ${H - clip.b}px ${clip.l}px)` }}>
      <div style={{ position: "absolute", inset: 0, transform: `translate(${dx}px, ${dy}px)` }}>
        <DepthPhoto rig={rig} camera={cam} layers={[L("plate", FERRY.plate, { exposure: -0.25 * focus })]} style={blurStyle(back * 1.35)} />
        {t >= T.title - 0.05 ? (
          <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H, transformOrigin: "0 0", transform: css.plane(Z_TITLE), ...blurStyle(back * 0.6) }}>
            <KeyLine text={"Your camera roll\nis *secretly a closet.*"} at={T.title} size={92} stagger={0.075} align="center" exitAt={T.titleOut} style={{ left: 0, width: W, top: 164 }} />
          </div>
        ) : null}
        <DepthPhoto rig={rig} camera={cam} layers={[L("her", FERRY.under, { exposure: -0.3 * focus })]} style={blurStyle(back)} />
        {/* the jacket's shadow on her: dark, soft, spreading and fading as it lifts */}
        {p > 0.002 ? (
          <DepthPhoto
            rig={rig}
            camera={cam}
            layers={[L("shadow", FERRY.jacket, { move: { ...jacketMove, x: 0.002 * p, y: -0.004 * p, z: 0.015 * p, rx: 0, ry: -1 * p, rz: -1 * p, scale: 1 + 0.025 * p }, exposure: -12, opacity: 0.5 * (1 - 0.5 * p), grade: {} })]}
            style={{ ...blurStyle(6 + 26 * p), mixBlendMode: "multiply" }}
          />
        ) : null}
        {/* relief 0.5: enough to turn like cloth, not so much that its panel/sleeve steps smear as it twists */}
        <DepthPhoto rig={rig} camera={cam} layers={[L("jacket", FERRY.jacket, { move: jacketMove, exposure: 0.06 * p, relief: 0.5, flatAt: 0.89 })]} />
      </div>
      {s >= 0.999 ? (
        <>
          <Vignette strength={0.26 + 0.12 * focus} />
          <Grain seed={0xb11} amount={0.05} />
        </>
      ) : null}
    </div>
  );
};

export const HookCameraRoll: React.FC<z.infer<typeof schema>> = ({ music, volume, sfxVolume }) => {
  useBrandFonts();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {t < T.zoomTo + 0.05 ? (
        // sub-frame motion blur that follows the scroll's real speed (≤ 3 px between samples, 1 when still)
        <SubframeBlur samples={(f) => samplesFor(scrollSpeed(f / fps), 0.5, 3, 20)}>
          <RollAt />
        </SubframeBlur>
      ) : null}
      {t >= T.freeze ? <Ferry t={t} /> : null}
      {/* the music, outside the motion blur: the drive (cut dead on the freeze), then the build from the peel */}
      {music ? <Audio src={src(TRACK)} trimBefore={Math.round(FROM_SEC * fps)} volume={(fr) => volume * driveGain(fr / fps)} /> : null}
      {music ? (
        <Sequence from={Math.round(BUILD.at * fps)} layout="none">
          <Audio src={src(TRACK)} trimBefore={Math.round(BUILD.fromSec * fps)} volume={(fr) => volume * buildGain(BUILD.at + fr / fps)} />
        </Sequence>
      ) : null}
      {has(SFX) ? <Audio src={src(SFX)} volume={sfxVolume} /> : null}
    </AbsoluteFill>
  );
};

/** The roll at the (possibly sub-frame) time of its <Freeze> (SubframeBlur renders it at fractional frames). */
const RollAt: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return <Roll t={frame / fps} />;
};
