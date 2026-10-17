import { Audio } from "@remotion/media";
import React from "react";
import { AbsoluteFill, Img, Sequence, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { FormatId } from "../../schemas/ad";
import { ContactShadow, Device, DepthPhoto, EDITORIAL, Grain, KeyLine, LightWrap, Vignette, depthRig, has, rigCss, src, useBrandFonts, zeeFrame, type DepthCam, type ZeeCue } from "../../motion";
import { expoInOut, progress, spring, springVel, track } from "../../motion/springs";
import { noise1 } from "../../motion/noise";
import { FADE, FROM_SEC, musicGain, T, TRACK } from "./timeline";

// Hook A, "Zee the critic" (8 s, 9:16, 60 fps): the first seconds of the ad, made to stop the scroll for $0.
// S1 her couch photo comes alive in 2.5D (DepthPhoto: real parallax from a local depth model), the POV line
// sits BEHIND her (an HTML layer at a true depth between the room and her cut-out), Zee jumps up onto the
// couch and stares, the room looms (a reverse dolly-zoom) and "girl… no." lands on the drop. S2 a fade to
// the real iPhone (Apple's bezel, as is) with the real look card landing. S3 her night-out photo comes alive,
// "SLAY." behind her, Zee cheers. Every value is a function of t = frame / fps.

export const schema = z.object({ format: FormatId, length: z.number(), music: z.boolean(), volume: z.number().min(0).max(1), sfxVolume: z.number().min(0).max(1) });
export const defaults = { music: true, volume: 0.78, sfxVolume: 0.52 }; // −14 LUFS, true peak ≤ −1 dBTP (measured)
const SFX = "sfx.curate.hook-zee-critic-sound.v1";
export const metadata = () => ({ durationInFrames: 8 * 60 });

const COUCH = { plate: "photo.emma.r28-couch-cozy-plate.v1", her: "photo.emma.r28-couch-cozy-cutout.v1" };
const NIGHT = { plate: "photo.emma.r10-night-out-plate.v1", her: "photo.emma.r10-night-out-cutout.v1" };
const FOOTAGE = "footage.emma.look-card-landing.v1";
const ANGORA = "#F6F6F6"; // Angora White (brand ramp): the ground round the phone

const couchRig = depthRig({ photo: { w: 1792, h: 2400 }, near: 1.0, far: 3.6, overscan: 1.1, fov0: 30, align: { x: 0.42, y: 0.5 } });
const nightRig = depthRig({ photo: { w: 1792, h: 2400 }, near: 1.0, far: 9, overscan: 1.1, fov0: 30, align: { x: 0.04, y: 0.5 } }); // her on the right third, the street on the left

const fadeIn = (t: number, at: number, d = FADE) => expoInOut(progress(t, at, d));

// ── S1 · the couch ───────────────────────────────────────────────────────────────────────────────────────
// Depth order, back to front: the wall (plate) · the words (Z_TITLE) · Zee peeking over her knee (Z_ZEE) · her.
// Her cut-out hides Zee's body, so Zee is IN the room, not on the picture; the lamp behind Zee rims it.
const Z_TITLE = 2.3; // between the wall (≈2.6–3.6) and Zee
const Z_ZEE = 1.75; // behind her knee (≈1.3), in front of the lamp

const couchCam = (t: number): DepthCam => {
  // a slow push-in with a drift right → left from frame 0; then a reverse dolly-zoom into the drop:
  // the camera pulls back while the lens narrows, so Zee's plane holds still, the room looms and she recedes
  const push = track(t, 0, [{ t: 0, v: 0.11, spring: "camera" }]);
  const x = track(t, 0.028, [{ t: 0, v: -0.02, spring: "camera" }]);
  const vz = expoInOut(progress(t, T.vertigoFrom, T.drop - T.vertigoFrom)); // 0 → 1, lands ON the drop
  const dolly = push - 0.5 * vz;
  const s0 = Z_ZEE / (Z_ZEE - push);
  const fOverF0 = (s0 * (Z_ZEE - dolly)) / Z_ZEE;
  const fov = (2 * Math.atan(Math.tan((30 * Math.PI) / 360) / fOverF0) * 180) / Math.PI;
  // a dead stop on the drop: a short, damped shake (seeded), then still
  const k = Math.max(0, t - T.drop);
  const shake = t >= T.drop ? Math.exp(-k / 0.07) * 0.006 : 0;
  return { dolly, x: x + shake * noise1(11, t * 40), y: shake * noise1(12, t * 40) * 0.7, fov };
};

const zeeCues: ZeeCue[] = [
  { at: 0, emo: "curious", cut: true },
  { at: Math.round(T.stare * 30), emo: "focused" },
];

const Couch: React.FC<{ t: number }> = ({ t }) => {
  const { width: W, height: H } = useVideoConfig();
  const cam = couchCam(t);
  const css = rigCss(couchRig, cam, W, H);
  const layers = { grade: EDITORIAL };
  // Zee: hops up from behind her knee (mascot spring: it bounces), stretched on the way up, squashed on landing
  const up = spring(t - T.zeeJump, "mascot");
  const vy = springVel(t - T.zeeJump, "mascot");
  const zx = 822;
  const zSize = 600;
  const zTop = 404; // the frame's top edge at rest, landed: its chin just above her knee
  const yOff = (1 - up) * 430;
  const stretch = 1 + Math.max(-0.07, Math.min(0.09, vy * 0.0016));
  const land = t > T.zeeLand ? Math.exp(-(t - T.zeeLand) / 0.09) * Math.sin((t - T.zeeLand) * 38) * 0.04 : 0;
  const zf = zeeFrame(zeeCues, Math.floor(t * 30));
  const zeeOn = t >= T.zeeJump;
  const plane = (Z: number, children: React.ReactNode) => (
    <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H, transformOrigin: "0 0", transform: css.plane(Z) }}>{children}</div>
  );
  return (
    <AbsoluteFill style={{ background: "#2a2622" }}>
      <DepthPhoto rig={couchRig} camera={cam} layers={[{ key: "plate", image: { id: COUCH.plate }, depth: { id: COUCH.plate, role: "depth" }, ...layers }]} />
      {plane(
        Z_TITLE,
        <>
          <KeyLine text={"POV: your cat\nhas *opinions*\nabout your\noutfit."} at={T.title} size={88} align="right" exitAt={T.titleOut} style={{ right: 158, top: 124 }} />
          <KeyLine text={"girl…\n*no.*"} at={T.drop} size={168} stagger={0.2} align="right" style={{ right: 150, top: 92 }} />
        </>,
      )}
      {zeeOn && zf
        ? plane(
            Z_ZEE,
            <div style={{ position: "absolute", left: zx - zSize / 2, top: zTop + yOff, width: zSize, height: zSize, transformOrigin: "50% 90%", transform: `scale(${(1 / stretch) * (1 + land)}, ${stretch * (1 - land)})` }}>
              <LightWrap id="zee-couch" light="255,204,146" dir={250} width={10} strength={0.85}>
                <Img src={zf} style={{ position: "absolute", inset: 0, width: zSize, height: zSize, filter: "sepia(0.16) saturate(0.92) brightness(0.86) contrast(0.95) blur(0.3px)" }} />
              </LightWrap>
            </div>,
          )
        : null}
      <DepthPhoto rig={couchRig} camera={cam} layers={[{ key: "her", image: { id: COUCH.her }, depth: { id: COUCH.her, role: "depth" }, ...layers }]} />
      <Vignette strength={0.3} />
      <Grain seed={0xa11} amount={0.055} />
    </AbsoluteFill>
  );
};

// ── S2 · the real app in the real iPhone ─────────────────────────────────────────────────────────────────
// Apple's rules: the whole phone first (during the fade), then a push-in on the look card; words beside it, never on it.
/** Rendered inside a Sequence that starts at T.toPhone: the footage and the line run on its clock (u = t − T.toPhone). */
const Phone: React.FC<{ t: number }> = ({ t }) => {
  const { width: W } = useVideoConfig();
  const u = t - T.toPhone;
  // the whole phone, big, the whole time (Apple: straight on, words beside it); only a slow 3% glide in
  const zoom = track(u, 1, [{ t: 0.3, v: 1.03, spring: "camera" }]);
  return (
    <AbsoluteFill style={{ background: ANGORA }}>
      <KeyLine text={"Zee restyles you\nfrom *your own closet.*"} at={0.12} size={62} stagger={0.06} align="center" style={{ left: 0, width: W, top: 96 }} />
      <Device model="iphone-17-pro-max" color="silver" width={700} x={W / 2} y={1010} scale={zoom} screen={{ id: FOOTAGE, from: T.footageFrom }} />
    </AbsoluteFill>
  );
};

// ── S3 · SLAY ────────────────────────────────────────────────────────────────────────────────────────────
const Z_SLAY = 2.8;
const Z_ZEE_NIGHT = 1.32; // on the pavement beside her, a step nearer the camera
const nightCam = (t: number): DepthCam => {
  const u = t - T.toSlay;
  return { dolly: track(u, 0, [{ t: 0, v: 0.17, spring: "camera" }]), y: track(u, -0.012, [{ t: 0, v: 0.01, spring: "camera" }]) };
};
const cheerCues: ZeeCue[] = [{ at: 0, emo: "cheer" }];
const Slay: React.FC<{ t: number }> = ({ t }) => {
  const { width: W, height: H } = useVideoConfig();
  const cam = nightCam(t);
  const css = rigCss(nightRig, cam, W, H);
  const g = { grade: { ...EDITORIAL, warmth: 0.18 } };
  const plane = (Z: number, children: React.ReactNode) => (
    <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H, transformOrigin: "0 0", transform: css.plane(Z) }}>{children}</div>
  );
  // Zee pops up beside her, cheering (the critic approves)
  const up = spring(t - T.zeeCheer, "mascot");
  const zSize = 560;
  const zx = 300;
  const zBase = 1690; // rest-pose px: lands at ≈1800 after the push-in (plane scale ≈1.15)
  const yOff = (1 - up) * 560;
  const zf = zeeFrame(cheerCues, Math.floor((t - T.zeeCheer) * 30));
  return (
    <AbsoluteFill style={{ background: "#0e0d0c" }}>
      <DepthPhoto rig={nightRig} camera={cam} layers={[{ key: "plate", image: { id: NIGHT.plate }, depth: { id: NIGHT.plate, role: "depth" }, ...g, exposure: -0.18 }]} />
      {plane(Z_SLAY, <KeyLine text={"*SLAY.*"} at={T.slay} size={262} keyColor="#FFFFFF" align="left" letterSpacing="-0.05em" style={{ left: 70, top: 318 }} />)}
      <DepthPhoto rig={nightRig} camera={cam} layers={[{ key: "her", image: { id: NIGHT.her }, depth: { id: NIGHT.her, role: "depth" }, ...g }]} />
      {t >= T.zeeCheer && zf
        ? plane(
            Z_ZEE_NIGHT,
            <>
              <ContactShadow x={zx} y={zBase - 4} w={210} squash={0.18} opacity={0.7} lift={Math.min(1, yOff / 200)} />
              <div style={{ position: "absolute", left: zx - zSize / 2, top: zBase - zSize * 0.9 + yOff, width: zSize, height: zSize }}>
                <LightWrap id="zee-night" light="255,196,140" dir={200} width={8} strength={0.7}>
                  <Img src={zf} style={{ position: "absolute", inset: 0, width: zSize, height: zSize, filter: "brightness(0.78) contrast(1.02) saturate(0.9) sepia(0.08) blur(0.3px)" }} />
                </LightWrap>
              </div>
            </>,
          )
        : null}
      <Vignette strength={0.36} />
      <Grain seed={0xa12} amount={0.06} />
    </AbsoluteFill>
  );
};

export const HookZeeCritic: React.FC<z.infer<typeof schema>> = ({ music, volume, sfxVolume }) => {
  useBrandFonts();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const phoneA = fadeIn(t, T.toPhone);
  const slayA = fadeIn(t, T.toSlay);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {t < T.toPhone + FADE ? <Couch t={t} /> : null}
      <Sequence from={Math.round(T.toPhone * fps)} durationInFrames={Math.round((T.toSlay + FADE - T.toPhone) * fps)} layout="none">
        <AbsoluteFill style={{ opacity: phoneA }}>
          <Phone t={t} />
        </AbsoluteFill>
      </Sequence>
      {t >= T.toSlay ? (
        <AbsoluteFill style={{ opacity: slayA }}>
          <Slay t={t} />
        </AbsoluteFill>
      ) : null}
      {music ? <Audio src={src(TRACK)} trimBefore={Math.round(FROM_SEC * fps)} volume={(fr) => volume * musicGain(fr / fps)} /> : null}
      {has(SFX) ? <Audio src={src(SFX)} volume={sfxVolume} /> : null}
    </AbsoluteFill>
  );
};
