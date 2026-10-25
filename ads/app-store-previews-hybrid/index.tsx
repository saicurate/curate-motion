import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { FormatId, fpsFor } from "../../schemas/ad";
import { asset, ContactShadow, Device, deviceLayout, Footage, GEIST, Grain, KeyLine, pieceAspect, samplesFor, StableImg, src, SubframeBlur, useBrandFonts, Vignette } from "../../motion";
import { expoInOut, expoOut, mix, progress, spring, track } from "../../motion/springs";
import { Line } from "../app-store-header";
import { DAYS, rgba, shade, type Day, type Role } from "../app-store-header-week/palette";
import { cutStarts, filmOf, GLIDE_DUR, H, HERO_W, OPEN_W, OUT_DUR, W, type Film } from "./timeline";

// The App Store previews, hybrid (2026-10-24, the founder after the combined header film: "not screen
// recordings, I want them to be the header way"): three 886 × 1920 App Previews in the header's world
// (ads/app-store-header-all and its parts A, B3, C2 subtle) around the REAL build-284 recordings.
//
// Apple's rules hold every frame: App Review 2.3.4 (previews are screen captures of the app; text and
// video overlays allowed), so the real recording is on screen in the phone from frame 0 to the pan out,
// the centre of almost every frame; and Apple's bezel licence (decisions/0012): the iPhone straight on,
// whole, moved only by pan, zoom and fade, nothing over it and nothing that appears to enter or leave its
// screen. So a garment lifts from her photo and glides toward the phone, comes to rest beside it, and the
// camera pushes into the phone past it: it never crosses the screen.
//
//   1 closet          her DUMBO photo (cut-out over the street, a slow push): the camel coat lifts out and
//                     glides down beside the phone; in → the scan: the sort, the found photos, her rails
//   2 see-it-on-you   her walk-to-work photo and the black tee floating: the tee glides beside the phone;
//                     in → Studio's board, Try it on, she's in it, full screen
//   3 what-to-wear    a rail of day cards glides Thu → Fri → Today (the art fair look); in → Today with
//                     that look, then her question to Zee and the look he plans
//
// One palette (the founder, 2026-10-24: "Why did you change the color? Use the subtle blue only."): S-V3's
// blue, the linen ground, ink over slate navy, cool slate shadows; no warm, oat, cream or blush anywhere, and
// nothing changes colour on a reveal. Garments and the app keep their own colours. (The warm tonal sets are
// kept in versions/v3-warm.)
//
// One camera through the whole film: the push into the phone scales the set about one point, so the phone
// lands exactly at hero size (nearer layers move more: the garment, then the print, then the stage); at the
// end it pans right through a soft column of light to the lockup (the header's glide). Every value is a
// function of t = frame / fps.

export const schema = z.object({ format: FormatId, length: z.number(), film: z.number().int().min(1).max(3) });
export type Props = z.infer<typeof schema>;
export const defaults = { film: 1 };

const PHONE = { model: "iphone-17-pro-max", color: "silver" } as const;
const SHUTTER = 0.35;
/** The Curate mark (1152 px square; the mark spans 482 px of it). Never recoloured, rotated or stretched. */
const MARK = "brand.curate.splash-mark.v1";
const MARK_SPAN = 482 / 1152;

/** The phone at hero size: centred, its body ending 64 px above the bottom edge. */
const HERO = (() => {
  const l = deviceLayout({ ...PHONE, width: HERO_W, x: W / 2, y: 0 });
  return { x: W / 2, y: H - 64 - (l.body.y + l.body.h) };
})();
/** How much the push zooms the phone (opener → hero). */
const Z = HERO_W / OPEN_W;

const useT = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return frame / fps;
};

/** How far a camera move has got (0 → 1): the camera spring, normalised so it lands exactly at `dur`. */
const moveP = (t: number, at: number, dur: number) => (t <= at ? 0 : Math.min(1, spring(t - at, "camera") / spring(dur, "camera")));

/** The push: p (0 → 1) and the one point it scales the set about, so the opener phone lands on HERO. */
type Cam = { p: number; F: { x: number; y: number } };
const camOf = (f: Film, t: number): Cam => ({
  p: moveP(t, f.glide, GLIDE_DUR),
  F: { x: (HERO.x - Z * f.open.x) / (1 - Z), y: (HERO.y - Z * f.open.y) / (1 - Z) },
});
/** The zoom at a depth: 1 = the phone's plane; nearer layers (> 1) move more, the stage (< 1) less. */
const zoomOf = (c: Cam, depth: number) => 1 + (Z - 1) * c.p * depth;
/** The opener's props leave as the camera goes in (they are out of frame by then; the fade is a safety). */
const leaving = (c: Cam) => 1 - expoInOut(progress(c.p, 0.3, 0.45));

/** A layer of the set at a depth, scaled about the push's point. */
const Depth: React.FC<{ c: Cam; depth: number; opacity?: number; children: React.ReactNode }> = ({ c, depth, opacity = 1, children }) => {
  if (opacity < 0.004) return null;
  const z = zoomOf(c, depth);
  return (
    <AbsoluteFill style={{ transformOrigin: `${c.F.x.toFixed(2)}px ${c.F.y.toFixed(2)}px`, transform: Math.abs(z - 1) > 1e-5 ? `scale(${z.toFixed(5)})` : undefined, opacity: opacity < 0.9995 ? opacity : undefined }}>
      {children}
    </AbsoluteFill>
  );
};

// ── the ground ──────────────────────────────────────────────────────────────────────────────────
/** S-V3's subtle blue (ads/app-store-shots-v3 › PALETTES.blue): the linen ground (≈#E8EFF8 at the top →
 *  #D7E0EB at the floor), ink, the headline's slate-navy second tone, and the shadows' cool slate. */
const BLUE = { ground: "stock.polyhaven.linen-blue-ground.v1", fill: "#E6EDF5", ink: "#171B21", deep: "#33475E", sub: "#5A6675", shade: "28,42,62", shade2: "20,30,46" } as const;

/** The blue linen, lit from the upper left (a cool white key), the floor falling off a touch toward the camera. */
const BlueGround: React.FC = () => (
  <>
    <AbsoluteFill style={{ background: BLUE.fill }} />
    <StableImg src={src(BLUE.ground)} style={{ position: "absolute", inset: 0, width: W, height: H, objectFit: "cover" }} />
    <AbsoluteFill style={{ background: "radial-gradient(90% 62% at 22% 12%, rgba(246,250,255,0.4) 0%, rgba(246,250,255,0) 66%)", mixBlendMode: "screen" }} />
    <AbsoluteFill style={{ background: `linear-gradient(180deg, rgba(0,0,0,0) 80%, rgba(${BLUE.shade2},0.05) 100%)`, mixBlendMode: "multiply" }} />
  </>
);

// ── her photo, with depth ───────────────────────────────────────────────────────────────────────
// The photo with her cut-out over it (tools/photo3d), as B3's PhotoLayers: on a push the photo grows about
// the lens axis and she grows a little more about her own middle, so the street moves behind her.
type Crop = { x: number; y: number; w: number; h: number; W: number; H: number };
type PhotoV = { photo: string; her: string; crop: Crop; mid: { x: number; y: number } };
const DUMBO: PhotoV = {
  photo: "photo.emma.r12-dumbo-walk.v1",
  her: "photo.emma.r12-dumbo-walk-cutout.v1",
  crop: { x: 0, y: 0, w: 1792, h: 2400, W: 1792, H: 2400 },
  mid: { x: 0.52, y: 0.55 },
};
const WALK: PhotoV = {
  photo: "photo.emma.r30-walk-to-work.v1",
  her: "photo.emma.r30-walk-to-work-cutout.v1",
  crop: { x: 64, y: 116, w: 1664, h: 2080, W: 1792, H: 2400 },
  mid: { x: 0.47, y: 0.56 },
};

const PhotoLayers: React.FC<{ v: PhotoV; w: number; h: number; u: number }> = ({ v, w, h, u }) => {
  const k = v.crop;
  const box = { left: (-k.x * w) / k.w, top: (-k.y * h) / k.h, width: (k.W * w) / k.w, height: (k.H * h) / k.h };
  const img: React.CSSProperties = { position: "absolute", ...box };
  const ox = v.mid.x * k.w * (w / k.w) + k.x * (w / k.w);
  const oy = v.mid.y * k.h * (h / k.h) + k.y * (h / k.h);
  return (
    <div style={{ position: "absolute", inset: 0, transformOrigin: `${w / 2}px ${h / 2}px`, transform: `scale(${(1 + 0.03 * u).toFixed(5)})` }}>
      <StableImg src={src(v.photo)} style={img} />
      <StableImg src={src(v.her)} style={{ ...img, transformOrigin: `${ox}px ${oy}px`, transform: `scale(${(1 + 0.034 * u).toFixed(5)})` }} />
    </div>
  );
};

/** The print: rounded, lit from the upper left (a sheen, two shadows), its soft shadow on the wall and a
 *  contact shadow under it (B3's finish). */
const Print: React.FC<{ v: PhotoV; cx: number; cy: number; h: number; rot: number; u: number; dim: number; tone: string }> = ({ v, cx, cy, h, rot, u, dim, tone }) => {
  const w = h * (v.crop.w / v.crop.h);
  const r = h * 0.024;
  return (
    <>
      <div style={{ position: "absolute", left: cx - w / 2 + 0.06 * h, top: cy - h / 2 + 0.048 * h, width: w, height: h, borderRadius: r * 1.2, background: `rgba(${tone},0.16)`, filter: `blur(${(0.075 * h).toFixed(1)}px)`, mixBlendMode: "multiply", transform: `rotate(${rot}deg)` }} />
      <ContactShadow x={cx} y={cy + h / 2 + 0.04 * h} w={w * 1.05} squash={0.09} opacity={0.24} lift={0.8} color={tone} />
      <div
        style={{
          position: "absolute",
          left: cx - w / 2,
          top: cy - h / 2,
          width: w,
          height: h,
          borderRadius: r,
          overflow: "hidden",
          transform: `rotate(${rot}deg)`,
          boxShadow: `${h * 0.004}px ${h * 0.008}px ${h * 0.02}px rgba(${tone},0.12), ${h * 0.03}px ${h * 0.06}px ${h * 0.13}px rgba(${tone},0.15)`,
          filter: dim > 0.004 ? `brightness(${(1 - dim).toFixed(3)})` : undefined,
        }}
      >
        <PhotoLayers v={v} w={w} h={h} u={u} />
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(118deg, rgba(255,255,255,0) ${30 + 6 * u}%, rgba(255,255,255,0.085) ${42 + 6 * u}%, rgba(255,255,255,0) ${56 + 6 * u}%)` }} />
        <div style={{ position: "absolute", inset: 0, borderRadius: r, boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.18)" }} />
      </div>
    </>
  );
};

/** A garment cut-out, floating: its own soft drop shadow (longer when lifted), a contact shadow on the
 *  floor once it rests. */
const Garment: React.FC<{ id: string; cx: number; cy: number; h: number; rot: number; opacity: number; lift: number; floorY: number; floorO: number; tone: string }> = ({ id, cx, cy, h, rot, opacity, lift, floorY, floorO, tone }) => {
  if (opacity < 0.004) return null;
  const w = h * pieceAspect(id);
  return (
    <>
      {floorO > 0.01 ? <ContactShadow x={cx} y={floorY} w={w * 0.86} squash={0.14} opacity={0.3 * floorO * opacity} lift={0.5} color={tone} /> : null}
      <div
        style={{
          position: "absolute",
          left: cx - w / 2,
          top: cy - h / 2,
          width: w,
          height: h,
          opacity: opacity < 0.9995 ? opacity : undefined,
          transform: Math.abs(rot) > 1e-3 ? `rotate(${rot.toFixed(3)}deg)` : undefined,
          filter: `drop-shadow(${h * 0.012}px ${h * (0.018 + 0.02 * lift)}px ${h * (0.022 + 0.03 * lift)}px rgba(${tone},${(0.15 + 0.08 * lift).toFixed(3)}))`,
        }}
      >
        <StableImg src={src(id, "cutout")} style={{ position: "absolute", inset: 0, width: w, height: h }} />
      </div>
    </>
  );
};

// ── 1 · closet ──────────────────────────────────────────────────────────────────────────────────
const COAT = "garment.emma.coat-wool-camel.v3";
const C1 = {
  print: { cx: 282, cy: 676, h: 600, rot: -1.5 },
  /** Where she wears it in the photo (ads/app-store-header's measure), × the print's box. */
  on: { fx: 0.53, fy: 0.56, fh: 0.56 },
  rest: { x: 205, y: 1430, h: 560, rot: 1.8 },
  lift: 0.55,
  fly: 1.2,
};

const ClosetOpener: React.FC<{ c: Cam; t: number }> = ({ c, t }) => {
  const P = C1.print;
  const pw = P.h * 0.75;
  const lifted = spring(t - C1.lift, "piece");
  const fly = spring(t - C1.fly, { zeta: 0.94, response: 0.62 });
  const inX = P.cx + (C1.on.fx - 0.5) * pw;
  const inY = P.cy + (C1.on.fy - 0.5) * P.h;
  const inH = C1.on.fh * P.h;
  const x = mix(inX, C1.rest.x, fly);
  const y = mix(inY - 34 * lifted, C1.rest.y, fly) - 110 * Math.sin(Math.PI * Math.min(1, fly));
  const h = mix(inH * (1 + 0.16 * lifted), C1.rest.h, fly);
  const show = expoOut(progress(t, C1.lift, 0.22));
  const o = leaving(c);
  return (
    <>
      <Depth c={c} depth={1.35} opacity={o}>
        <Print v={DUMBO} cx={P.cx} cy={P.cy} h={P.h} rot={P.rot} u={0.9 * spring(t, "camera")} dim={0.12 * expoInOut(progress(t, C1.lift, 0.9))} tone={BLUE.shade} />
      </Depth>
      <Depth c={c} depth={1.6} opacity={o}>
        <Garment id={COAT} cx={x} cy={y} h={h} rot={mix(0, C1.rest.rot, fly)} opacity={show} lift={lifted * (1 - 0.6 * fly)} floorY={C1.rest.y + C1.rest.h / 2 + 10} floorO={expoOut(progress(fly, 0.7, 0.3))} tone={BLUE.shade} />
      </Depth>
    </>
  );
};

// ── 2 · see it on you ───────────────────────────────────────────────────────────────────────────
const TEE = "garment.emma.tee-black.v1";
const C2 = {
  print: { cx: 280, cy: 690, h: 560, rot: 1.2 },
  hover: { x: 690, y: 600, h: 250 },
  rest: { x: 215, y: 1360, h: 300, rot: -2.5 },
  gather: 0.45,
  fly: 1.0,
};
/** Periodic, so the hover never stops. */
const wave = (t: number, period: number, phase = 0) => Math.sin((2 * Math.PI * t) / period + phase);

const TryOnOpener: React.FC<{ c: Cam; t: number }> = ({ c, t }) => {
  const P = C2.print;
  const gather = spring(t - C2.gather, "ui");
  const fly = spring(t - C2.fly, { zeta: 0.94, response: 0.6 });
  const hx = C2.hover.x + 4 * wave(t, 5);
  const hy = C2.hover.y + 7 * wave(t, 7.5) - 18 * gather;
  const x = mix(hx, C2.rest.x, fly);
  const y = mix(hy, C2.rest.y, fly) - 140 * Math.sin(Math.PI * Math.min(1, fly));
  const h = mix(C2.hover.h, C2.rest.h, fly);
  const rot = mix(3 + 1.1 * wave(t, 5, 1.2), C2.rest.rot, fly);
  const o = leaving(c);
  return (
    <>
      <Depth c={c} depth={1.35} opacity={o}>
        <Print v={WALK} cx={P.cx} cy={P.cy} h={P.h} rot={P.rot} u={0.9 * spring(t, "camera")} dim={0} tone={BLUE.shade} />
      </Depth>
      <Depth c={c} depth={1.6} opacity={o}>
        <Garment id={TEE} cx={x} cy={y} h={h} rot={rot} opacity={1} lift={1 - 0.6 * fly} floorY={mix(C2.hover.y + C2.hover.h * 0.62, C2.rest.y + C2.rest.h / 2 + 10, fly)} floorO={1} tone={BLUE.shade} />
      </Depth>
    </>
  );
};

// ── 3 · what to wear ────────────────────────────────────────────────────────────────────────────
// C2's rail, upright: day cards on a rail, one hero at a time; the camera glides a card a step and stops on
// Today, the very look the phone's Today shows (the art fair: blazer, cami, satin skirt, bag, boots).
const TODAY_CARD: Day = {
  day: "Today",
  occ: "Art fair",
  tones: DAYS[3].tones,
  look: [
    { id: "garment.emma.blazer-black.v1", role: "outer" },
    { id: "garment.emma.camisole-satin-black.v1", role: "top" },
    { id: "garment.emma.skirt-midi-satin-camel.v1", role: "bottom" },
    { id: "garment.emma.boots-ankle-black.v1", role: "shoes" },
    { id: "garment.emma.bag-mini-black.v1", role: "bag" },
  ],
};
/** A day on pale blue-grey paper, within the ground's own blue (never C2's cream, oat or blush). */
const blueDay = (d: Day, paper: string, deep: string): Day => {
  const c = { paper, deep, text: BLUE.ink, sub: BLUE.sub };
  return { ...d, tones: { subtle: c, bold: c } };
};
const RAIL = [blueDay(DAYS[3], "#E9EFF6", "#D2DCE7"), blueDay(DAYS[4], "#E4EBF3", "#CED8E4"), blueDay(TODAY_CARD, "#EEF3F9", "#D5DFEA")];
const C3 = { cw: 300, ch: 444, cy: 652, pitch: 338, steps: [0.35, 1.2] };

/** C2's flat-lay slots, in units of the look's height L around its centre (light from the top left). */
const SLOT: Record<Role, { x: number; y: number; h: number; rot: number; z: number }> = {
  outer: { x: -0.26, y: -0.05, h: 0.6, rot: -4, z: 0 },
  top: { x: -0.01, y: -0.17, h: 0.44, rot: 3, z: 1 },
  bottom: { x: 0.24, y: 0.08, h: 0.64, rot: 1.5, z: 1 },
  short: { x: 0.22, y: 0.14, h: 0.32, rot: 2.5, z: 1 },
  dress: { x: 0.06, y: 0.0, h: 0.84, rot: 2, z: 1 },
  shoes: { x: -0.08, y: 0.36, h: 0.19, rot: -8, z: 3 },
  bag: { x: 0.4, y: -0.25, h: 0.32, rot: 7, z: 2 },
  acc: { x: 0.2, y: -0.41, h: 0.12, rot: -7, z: 3 },
  acc2: { x: -0.36, y: 0.37, h: 0.1, rot: 9, z: 3 },
};
const TOP_ALONE = { x: -0.18, y: -0.12, h: 0.5, rot: -2, z: 1 };
const nativeH = (id: string) => {
  const d = asset<{ cutoutDims?: { w: number; h: number } }>(id).asset.cutoutDims;
  return d ? d.h * 1.04 : Infinity;
};

const FlatLay: React.FC<{ day: Day; lx: number; ly: number; L: number; lift: number }> = ({ day, lx, ly, L, lift }) => {
  const outer = day.look.some((p) => p.role === "outer");
  const pieces = day.look.map((p) => ({ ...p, s: p.role === "top" && !outer ? TOP_ALONE : SLOT[p.role] })).sort((a, b) => a.s.z - b.s.z);
  return (
    <>
      {pieces.map((p, i) => {
        const h = Math.min(p.s.h * L, nativeH(p.id));
        const w = h * pieceAspect(p.id);
        const up = lift * (0.012 + 0.004 * i);
        const d1 = (0.004 + 0.01 * lift) * L;
        const d2 = (0.014 + 0.03 * lift) * L;
        return (
          <div
            key={p.id + i}
            style={{
              position: "absolute",
              left: lx + p.s.x * L - w / 2,
              top: ly + p.s.y * L - up * L - h / 2,
              width: w,
              height: h,
              transform: `rotate(${p.s.rot}deg)`,
              filter: `drop-shadow(${d1 * 0.6}px ${d1}px ${0.007 * L}px rgba(${BLUE.shade},0.2)) drop-shadow(${d2 * 0.6}px ${d2}px ${(0.035 + 0.03 * lift) * L}px rgba(${BLUE.shade},0.15))`,
            }}
          >
            <StableImg src={src(p.id, "cutout")} style={{ position: "absolute", inset: 0, width: w, height: h, filter: "url(#pv-defringe)" }} />
          </div>
        );
      })}
    </>
  );
};

/** One day as a card (C2's DaySet, card layout): its paper lit from the top left, the name top left, the
 *  occasion under it, the look below. */
const DayCard: React.FC<{ day: Day; x: number; y: number; w: number; h: number; lift: number; dim: number; opacity: number; t: number }> = ({ day, x, y, w, h, lift, dim, opacity, t }) => {
  if (opacity < 0.004) return null;
  const c = day.tones.subtle;
  const drift = Math.sin((2 * Math.PI * t) / 15 + day.day.length) * 0.03;
  const r = 0.05 * w;
  const ns = 0.12 * h;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: h,
        borderRadius: r,
        overflow: "hidden",
        opacity: opacity < 0.9995 ? opacity : undefined,
        filter: dim > 0.004 ? `brightness(${(1 - dim).toFixed(3)})` : undefined,
        boxShadow: `0 ${h * 0.012}px ${h * 0.03}px rgba(${BLUE.shade},0.08), 0 ${h * 0.06}px ${h * 0.14}px rgba(${BLUE.shade},0.14)`,
        background: `linear-gradient(158deg, ${shade(c.paper, 0.35)} 0%, ${c.paper} 46%, ${shade(c.paper, -0.035)} 100%)`,
      }}
    >
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(75% 85% at 26% 18%, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 62%)" }} />
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(140% 120% at 30% 25%, rgba(0,0,0,0) 55%, ${rgba(c.deep, 0.45)} 100%)` }} />
      <div style={{ position: "absolute", inset: 0, background: `linear-gradient(112deg, rgba(255,255,255,0) ${(22 + 100 * drift).toFixed(2)}%, rgba(255,255,255,0.3) ${(36 + 100 * drift).toFixed(2)}%, rgba(255,255,255,0) ${(52 + 100 * drift).toFixed(2)}%, ${rgba(c.deep, 0)} ${(60 + 100 * drift).toFixed(2)}%, ${rgba(c.deep, 0.5)} ${(80 + 100 * drift).toFixed(2)}%)` }} />
      <FlatLay day={day} lx={w / 2} ly={0.6 * h} L={0.6 * h} lift={lift} />
      <div style={{ position: "absolute", left: 0.085 * w, top: 0.06 * h, fontFamily: GEIST, fontWeight: 500, color: c.text, whiteSpace: "nowrap" }}>
        <div style={{ fontSize: ns, lineHeight: 0.92, letterSpacing: "-0.045em" }}>{day.day}</div>
        <div style={{ fontSize: ns * 0.34, letterSpacing: "0.005em", marginTop: ns * 0.12, color: c.sub }}>{day.occ}</div>
      </div>
    </div>
  );
};

const RailOpener: React.FC<{ c: Cam; t: number }> = ({ c, t }) => {
  const pos = track(t, 0, C3.steps.map((s, i) => ({ t: s, v: i + 1, spring: "camera" as const })));
  const land = [-10, ...C3.steps.map((s) => s + 0.6)];
  return (
    <Depth c={c} depth={1.3} opacity={leaving(c)}>
      {RAIL.map((day, i) => {
        const d = i - pos;
        const near = Math.min(1, Math.abs(d));
        const s = 1 - 0.2 * near;
        const w = C3.cw * s;
        const h = C3.ch * s;
        const x = W / 2 + d * C3.pitch - w / 2;
        if (x > W * 1.05 || x + w < -W * 0.05) return null;
        const lift = (1 - spring(t - land[i], "piece")) * Math.max(0, 1 - Math.abs(d));
        return <DayCard key={day.day} day={day} x={x} y={C3.cy - h / 2} w={w} h={h} lift={lift} dim={0.04 * near} opacity={1 - 0.38 * near} t={t} />;
      })}
    </Depth>
  );
};

/** The cut-outs were cut off white: a 1 px erode drops the light rim they leave on colour (C2's Defringe). */
const Defringe: React.FC = () => (
  <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden>
    <filter id="pv-defringe" colorInterpolationFilters="sRGB">
      <feMorphology operator="erode" radius={1} />
    </filter>
  </svg>
);

// ── the phone, the recordings ───────────────────────────────────────────────────────────────────
/** The cuts, end to end on the film's clock, each fading in over the one before it. */
const Cuts: React.FC<{ f: Film }> = ({ f }) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const starts = cutStarts(f);
  return (
    <>
      {f.cuts.map((c, i) => {
        const from = Math.round(starts[i] * fps);
        const dur = Math.round((c.to - c.from) * fps);
        const xf = c.xf ?? 0;
        const local = (frame - from) / fps;
        const opacity = i === 0 || xf <= 0 ? 1 : Math.min(1, Math.max(0, local / xf));
        return (
          <Sequence key={i} from={from} durationInFrames={dur} layout="none">
            <div style={{ position: "absolute", inset: 0, opacity: opacity < 0.9995 ? opacity : undefined }}>
              <Footage id={c.id} from={c.from} />
            </div>
          </Sequence>
        );
      })}
    </>
  );
};

const Scene: React.FC<{ f: Film }> = ({ f }) => {
  const t = useT();
  const c = camOf(f, t);
  const z = zoomOf(c, 1);
  const px = c.F.x + z * (f.open.x - c.F.x);
  const py = c.F.y + z * (f.open.y - c.F.y);
  // once it has landed, the camera keeps breathing in on the phone (2.5% by the pan): the app's holds stay alive
  const settled = f.glide + GLIDE_DUR;
  const breath = 1 + 0.025 * expoInOut(progress(t, settled, f.out - settled));
  return (
    <>
      <Depth c={c} depth={0.25}>
        <BlueGround />
      </Depth>
      <Grain amount={0.03} />
      <Vignette strength={0.09} color={BLUE.shade2} />
      {f.n === 1 ? <ClosetOpener c={c} t={t} /> : f.n === 2 ? <TryOnOpener c={c} t={t} /> : <RailOpener c={c} t={t} />}
      <Device {...PHONE} width={HERO_W} x={px} y={py} scale={(z / Z) * breath} screenBackground="#FFFFFF">
        <Cuts f={f} />
      </Device>
      <KeyLine text={f.line1} at={0.05} exitAt={f.glide - 0.1} size={84} lineHeight={1.04} bodyColor={BLUE.ink} keyColor={BLUE.deep} style={{ left: 64, top: 104 }} />
      <KeyLine text={f.line2} at={f.glide + 0.95} size={84} lineHeight={1.04} bodyColor={BLUE.ink} keyColor={BLUE.deep} style={{ left: 64, top: 104 }} />
    </>
  );
};

/** The lockup (the header's): the mark with "Curate" to its right, the app's own line under it, on the
 *  blue linen (ink, then slate navy). */
const LockupSet: React.FC<{ lineAt: number }> = ({ lineAt }) => {
  const m = 150;
  const img = m / MARK_SPAN;
  const cy = 0.44 * H;
  return (
    <>
      <BlueGround />
      <div style={{ position: "absolute", left: 0, right: 0, top: cy - m / 2, height: m, display: "flex", alignItems: "center", justifyContent: "center", gap: 0.34 * m }}>
        <div style={{ position: "relative", width: m, height: m, flex: "none" }}>
          <StableImg src={src(MARK)} style={{ position: "absolute", width: img, height: img, left: -(img - m) / 2, top: -(img - m) / 2 }} />
        </div>
        <div style={{ fontFamily: GEIST, fontWeight: 500, fontSize: 0.95 * m, lineHeight: 1, letterSpacing: "-0.04em", color: BLUE.ink, paddingBottom: "0.04em" }}>Curate</div>
      </div>
      <Line text={"Try it. Style it. *Wear it.*"} at={lineAt} x={48} y={cy + 0.7 * m} size={58} width={W - 96} align="center" keyColor={BLUE.deep} bodyColor={BLUE.ink} />
      <Grain amount={0.03} />
      <Vignette strength={0.1} color={BLUE.shade2} />
    </>
  );
};

/** The film: the scene, then the pan through a soft column of light to the lockup (the header's glide). */
const FilmView: React.FC<{ f: Film }> = ({ f }) => {
  const t = useT();
  const q = moveP(t, f.out, OUT_DUR);
  const d = 0.98 * W;
  const fe = 60;
  const seam = mix(W + fe, -fe, q);
  const glow = q > 0 && q < 1 ? Math.sin(Math.PI * q) : 0;
  return (
    <>
      <BlueGround />
      {q < 0.9995 ? (
        <AbsoluteFill style={q > 0.0005 ? { transform: `translateX(${(-q * d).toFixed(2)}px)` } : undefined}>
          <Scene f={f} />
        </AbsoluteFill>
      ) : null}
      {q > 0.0005 ? (
        <AbsoluteFill style={q < 0.9995 ? { WebkitMaskImage: `linear-gradient(90deg, rgba(0,0,0,0) ${(seam - fe).toFixed(1)}px, #000 ${(seam + fe).toFixed(1)}px)`, maskImage: `linear-gradient(90deg, rgba(0,0,0,0) ${(seam - fe).toFixed(1)}px, #000 ${(seam + fe).toFixed(1)}px)` } : undefined}>
          <AbsoluteFill style={q < 0.9995 ? { transform: `translateX(${((1 - q) * d).toFixed(2)}px)` } : undefined}>
            <LockupSet lineAt={f.out + 1.0} />
          </AbsoluteFill>
        </AbsoluteFill>
      ) : null}
      {glow > 0.004 ? (
        <div style={{ position: "absolute", top: 0, bottom: 0, left: seam - 0.11 * W, width: 0.22 * W, opacity: 0.55 * glow, mixBlendMode: "screen", background: "linear-gradient(90deg, rgba(236,244,255,0) 0%, rgba(236,244,255,0.2) 40%, rgba(244,249,255,0.34) 50%, rgba(236,244,255,0.2) 60%, rgba(236,244,255,0) 100%)" }} />
      ) : null}
    </>
  );
};

/** The fast moves, as the fastest thing on screen in px a frame: the garment's flight, the push (the
 *  props leave fastest, about 1400 px over the move), the pan (≈ W). */
const speedAt = (f: Film, t: number, fps: number) => {
  const dt = 1 / fps;
  const dp = (at: number, dur: number) => Math.abs(moveP(t + dt / 2, at, dur) - moveP(t - dt / 2, at, dur));
  const fly = f.n === 1 ? { at: C1.fly, s: { zeta: 0.94, response: 0.62 }, d: 760 } : f.n === 2 ? { at: C2.fly, s: { zeta: 0.94, response: 0.6 }, d: 820 } : null;
  const fv = fly ? Math.abs(spring(t + dt / 2 - fly.at, fly.s) - spring(t - dt / 2 - fly.at, fly.s)) * fly.d : 0;
  const rail = f.n === 3 ? Math.abs(track(t + dt / 2, 0, C3.steps.map((s, i) => ({ t: s, v: i + 1, spring: "camera" as const }))) - track(t - dt / 2, 0, C3.steps.map((s, i) => ({ t: s, v: i + 1, spring: "camera" as const })))) * C3.pitch : 0;
  return Math.max(fv, rail, dp(f.glide, GLIDE_DUR) * 1400, dp(f.out, OUT_DUR) * W);
};

export const AppStorePreviewsHybrid: React.FC<Props> = ({ film }) => {
  useBrandFonts();
  const { fps } = useVideoConfig();
  const f = filmOf(film);
  const samples = (fr: number) => {
    const v = speedAt(f, fr / fps, fps);
    // gaps of 1.5 px at most: the chat's dense text combed at 3 px (round 6)
    return v > 2 ? samplesFor(v, SHUTTER, 1.5) + 1 : 1;
  };
  return (
    <AbsoluteFill style={{ background: BLUE.fill, color: BLUE.ink, overflow: "hidden" }}>
      <Defringe />
      {/* the stage is inside every sample: each sub-frame is opaque, so averaging them is exact */}
      <SubframeBlur samples={samples} shutter={SHUTTER}>
        <FilmView f={f} />
      </SubframeBlur>
    </AbsoluteFill>
  );
};

/** Each film's real length (timeline.ts › total). */
export const metadata = (props: Props) => ({ durationInFrames: Math.round(filmOf(props.film).total * fpsFor(60, props.format)) });
