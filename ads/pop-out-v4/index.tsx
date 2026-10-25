import React from "react";
import { Audio } from "@remotion/media";
import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { FormatId } from "../../schemas/ad";
import { ContactShadow, Device, deviceLayout, Footage, GEIST, Grain, KeyLine, pieceAspect, samplesFor, src, StableImg, SubframeBlur, useBrandFonts, Vignette } from "../../motion";
import { expoInOut, expoOut, mix, progress, spring, type MotionClass, type Spring } from "../../motion/springs";

type SpringSpec = Spring | MotionClass;
import { Line } from "../app-store-header";
import { BACK_DUR, CUTS, cutStarts, H, OUT_DUR, PULL_DUR, PUSH_DUR, T, W } from "./timeline";

// Pop out v4 (2026-10-24): Pop out re-cut the header way. The founder, after the header film ("perfect the
// header video is soo good") and the previews ("I want them to be the header way"): this is how the videos
// should be. So: the header's world (ads/app-store-header-all: her photos on a tonal ground giving up what
// she's wearing, garments that lift and glide with soft shadows, one camera, the light column, the lockup)
// in 9:16, around the REAL build-284 scan recorded today with her own photos (footage.emma.b284-scan-sort-fan-land).
//
//   HOOK      her three photos; on the drop the camel coat lifts out of DUMBO, the denim jacket out of the
//             ferry, the scarf out of the park, one a beat, the ground warming to each photo's tone
//   PROBLEM   the camera glides back: three of thirty photos in her camera roll
//   REVEAL    the roll recedes, the phone fades up with the real scan, the pieces glide to rest beside it
//   PROOF     the camera pushes into the phone: the landing, "Added 14 wardrobe items from 7 photos"
//   CLOSE     the pan through the light to the lockup and "On the App Store"; her photos glide back (the loop)
//
// Apple's bezel licence (decisions/0012) holds every frame: the iPhone straight on and whole, moved only by
// pan, zoom and fade, nothing over it and nothing entering or leaving its screen: the pieces rest BESIDE it
// and the camera pushes in past them. Every value is a function of t = frame / fps.

export const schema = z.object({
  format: FormatId,
  length: z.number(),
  track: z.string(),
  fromSec: z.number(),
  volume: z.number().min(0).max(1),
});
export type Props = z.infer<typeof schema>;
export const defaults = { track: "music.mixkit.cat-walk-arulo.v1", fromSec: 29.536, volume: 0.64 };

const PHONE = { model: "iphone-17-pro-max", color: "silver" } as const;
const SHUTTER = 0.5;
const MARK = "brand.curate.splash-mark.v1";
const MARK_SPAN = 482 / 1152;

// ── the ground: the header's tonal sets (ads/app-store-header › TONE, A2), one tone at a time ─────────────
const TONE = { mist: "#F4F3F0", blush: "#ECDFD7", blue: "#DDE5EC", oat: "#EFE5D3", sand: "#F3EDE3" } as const;
const INK = "#181818";
const BODY = "#656565";
/** The shadows' warm neutral (the header's stage). */
const SHADE = "58,46,36";

const hex = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
const mixHex = (a: number[], b: string, u: number) => a.map((v, i) => v + (hex(b)[i] - v) * u);
/** Mist → blush (the coat's DUMBO) → blue (the ferry) → oat (the park) → sand (the roll and the phone) → Mist
 *  (the lockup, and frame 0 again). */
const toneAt = (t: number) => {
  const keys: [number, string][] = [[T.lift[0], TONE.blush], [T.lift[1], TONE.blue], [T.lift[2], TONE.oat], [T.pull, TONE.sand], [T.out, TONE.mist]];
  let c = hex(TONE.mist);
  for (const [at, to] of keys) c = mixHex(c, to, expoInOut(progress(t, at, 0.7)));
  return `rgb(${c.map((v) => Math.round(v)).join(",")})`;
};
const Ground: React.FC<{ t: number }> = ({ t }) => {
  const c = toneAt(t);
  return <AbsoluteFill style={{ background: `radial-gradient(95% 70% at 50% 24%, color-mix(in srgb, ${c} 55%, white) 0%, ${c} 58%, color-mix(in srgb, ${c} 92%, #5a4a3c) 100%)` }} />;
};

// ── her photos and her pieces ───────────────────────────────────────────────────────────────────────
type PrintPose = { cx: number; cy: number; h: number; rot: number };
/** A print: rounded, lit from the upper left, its soft shadow on the ground and a contact shadow under it.
 *  Its photo always carries a filter (brightness 1 when not dimmed), so it is its own layer from frame 0: in a
 *  video render an unfiltered print with a garment's drop-shadow layer over it repainted blank (every still was
 *  right; the frames after the first were not). `decode`: the size its bitmap is decoded at, once (StableImg fit). */
const Print: React.FC<PrintPose & { id: string; dim?: number; opacity?: number; decode?: { w: number; h: number } }> = ({ id, cx, cy, h, rot, dim = 0, opacity = 1, decode }) => {
  if (opacity < 0.004) return null;
  const w = h * 0.7467;
  const r = h * 0.024;
  const o = opacity < 0.9995 ? opacity : undefined;
  return (
    <>
      <div style={{ position: "absolute", left: cx - w / 2 + 0.05 * h, top: cy - h / 2 + 0.045 * h, width: w, height: h, borderRadius: r * 1.2, background: `rgba(${SHADE},${(0.16 * opacity).toFixed(3)})`, filter: `blur(${(0.07 * h).toFixed(1)}px)`, transform: `rotate(${rot}deg)` }} />
      <ContactShadow x={cx} y={cy + h / 2 + 0.035 * h} w={w * 1.04} squash={0.09} opacity={0.22 * opacity} lift={0.8} color={SHADE} />
      <div
        style={{
          position: "absolute", left: cx - w / 2, top: cy - h / 2, width: w, height: h, borderRadius: r, overflow: "hidden", transform: `rotate(${rot}deg)`, opacity: o,
          boxShadow: `${h * 0.004}px ${h * 0.008}px ${h * 0.02}px rgba(${SHADE},0.12), ${h * 0.03}px ${h * 0.06}px ${h * 0.13}px rgba(${SHADE},0.14)`,
          filter: `brightness(${(1 - Math.max(0, dim)).toFixed(3)})`,
        }}
      >
        <StableImg src={src(id)} fit={decode} style={{ position: "absolute", inset: 0, width: w, height: h }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(118deg, rgba(255,255,255,0) 34%, rgba(255,255,255,0.08) 46%, rgba(255,255,255,0) 60%)" }} />
        <div style={{ position: "absolute", inset: 0, borderRadius: r, boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.18)" }} />
      </div>
    </>
  );
};

/** A garment cut-out, floating: its own drop shadow (longer when lifted), a contact shadow once it rests. */
/** Every bitmap is decoded once at about its largest drawn size (StableImg fit), never at the file's full
 *  size: four full-size canvases (≈17 MB each) at once made Chrome drop the older ones mid-render (blank prints). */
const GARMENT_DECODE_H = 760;
const Garment: React.FC<{ id: string; cx: number; cy: number; h: number; rot: number; opacity: number; lift: number; floorO: number }> = ({ id, cx, cy, h, rot, opacity, lift, floorO }) => {
  if (opacity < 0.004) return null;
  const asp = pieceAspect(id);
  const w = h * asp;
  return (
    <>
      {floorO > 0.01 ? <ContactShadow x={cx} y={cy + h / 2 + 8} w={w * 0.86} squash={0.14} opacity={0.3 * floorO * opacity} lift={0.5} color={SHADE} /> : null}
      <div
        style={{
          position: "absolute", left: cx - w / 2, top: cy - h / 2, width: w, height: h, opacity: opacity < 0.9995 ? opacity : undefined,
          transform: Math.abs(rot) > 1e-3 ? `rotate(${rot.toFixed(3)}deg)` : undefined,
          filter: `drop-shadow(${h * 0.012}px ${h * (0.018 + 0.02 * lift)}px ${h * (0.022 + 0.03 * lift)}px rgba(${SHADE},${(0.15 + 0.08 * lift).toFixed(3)}))`,
        }}
      >
        <StableImg src={src(id, "cutout")} fit={{ w: Math.round(GARMENT_DECODE_H * asp), h: GARMENT_DECODE_H }} style={{ position: "absolute", inset: 0, width: w, height: h }} />
      </div>
    </>
  );
};

/** The hook's three photos, what she wears in each (where it sits in the photo, as the header measured it),
 *  their cell in her camera roll, and where each piece comes to rest beside the phone. */
/** A hook print's decode: 1.15 × its pose height (the hook's breath and lift never draw it bigger). */
const heroDecode = (h: number) => ({ w: Math.round(1.15 * h * 0.7467), h: Math.round(1.15 * h) });
const HERO = [
  { photo: "photo.emma.r26-ferry.v1", piece: "garment.emma.jacket-denim.v3", pose: { cx: 262, cy: 700, h: 600, rot: 2.6 }, at: { fx: 0.5, fy: 0.79, fh: 0.48 }, cell: [1, 2], rest: { cx: 238, cy: 1545, h: 330, rot: -3 } },
  { photo: "photo.emma.r04-park-autumn.v1", piece: "garment.emma.scarf-plaid-camel.v2", pose: { cx: 826, cy: 1330, h: 600, rot: -2.4 }, at: { fx: 0.5, fy: 0.68, fh: 0.33 }, cell: [3, 3], rest: { cx: 372, cy: 1745, h: 200, rot: 6 } },
  { photo: "photo.emma.r12-dumbo-walk.v1", piece: "garment.emma.coat-wool-camel.v3", pose: { cx: 548, cy: 1040, h: 880, rot: -1.2 }, at: { fx: 0.53, fy: 0.56, fh: 0.56 }, cell: [2, 2], rest: { cx: 268, cy: 1110, h: 590, rot: 1.8 } },
] as const;
/** Which piece lifts on which beat: the coat on the drop, then the jacket, then the scarf. */
const LIFT_AT = [T.lift[1], T.lift[2], T.lift[0]] as const;

/** Her camera roll: all thirty photos, 5 across, the hook's three in their cells. World units = the hook's
 *  pixels; the pull zooms the world to ROLL_Z about ROLL_C. */
const ROLL = [
  "coffee-shop", "subway-platform", "brooklyn-street", "park-autumn", "office", "farmers-market", "rooftop-golden-hour", "beach-day",
  "mirror-selfie-weekend", "night-out", "mirror-selfie-work", "dumbo-walk", "winter-street", "sunday-errands", "hudson-run", "bookstore",
  "brunch", "office-lobby", "fall-game-day", "country-night", "museum-steps", "stoop", "rainy-day", "dinner", "cafe-laptop", "ferry",
  "chelsea-market", "couch-cozy", "gym-mirror", "walk-to-work",
].map((name, i) => `photo.emma.r${String(i + 1).padStart(2, "0")}-${name}.v1`);
/** Zoomed out, the roll sits under the line (its top row clear of it). */
const ROLL_Z = 0.38;
const ROLL_C = { x: 540, y: 1080 };
const CELL = { pitchX: 540, pitchY: 700, h: 640 };
/** Twice a roll photo's size at the end of the pull: sharp there, decoded once. */
/** Clear above the line's band (the line ends ≈ 280 px down). */
const ROLL_MASK = "linear-gradient(180deg, rgba(0,0,0,0) 0px, rgba(0,0,0,0) 300px, #000 400px)";
const ROLL_DECODE = { w: Math.round(2 * CELL.h * ROLL_Z * 0.7467), h: Math.round(2 * CELL.h * ROLL_Z) };
const cellPose = (c: number, r: number): PrintPose => ({ cx: ROLL_C.x + (c - 2) * CELL.pitchX, cy: ROLL_C.y + (r - 2.5) * CELL.pitchY, h: CELL.h, rot: 0 });

/** A camera move's progress (0 → 1) on a spring, normalised so it lands exactly at `dur`. */
const moveP = (t: number, at: number, dur: number, s: SpringSpec = "camera") => (t <= at ? 0 : Math.min(1, spring(t - at, s) / spring(dur, s)));

/** The phone: in the reveal at OPEN_W, lower right, its body 64 px above the bottom edge; the push lands it
 *  at HERO_W, centred (the hybrid previews' framing: the line has the top of the frame). */
const OPEN_W = 410;
const HERO_W = 712;
const atBottom = (width: number, x: number) => {
  const l = deviceLayout({ ...PHONE, width, x, y: 0 });
  return { x, y: H - 64 - (l.body.y + l.body.h) };
};
const OPEN = atBottom(OPEN_W, 790);
const HEROP = atBottom(HERO_W, W / 2);
const Z = HERO_W / OPEN_W;
/** The one point the push scales the set about, so the phone lands exactly on HEROP. */
const F = { x: (HEROP.x - Z * OPEN.x) / (1 - Z), y: (HEROP.y - Z * OPEN.y) / (1 - Z) };

// ── the scene ───────────────────────────────────────────────────────────────────────────────────────
const Cuts: React.FC = () => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const starts = cutStarts();
  return (
    <>
      {CUTS.map((c, i) => {
        const from = Math.round(starts[i] * fps);
        const dur = Math.round((c.to - c.from) * fps);
        const local = (frame - from) / fps;
        const o = i === 0 || !c.xf ? 1 : Math.min(1, Math.max(0, local / c.xf));
        return (
          <Sequence key={i} from={from} durationInFrames={dur} layout="none">
            <div style={{ position: "absolute", inset: 0, opacity: o < 0.9995 ? o : undefined }}>
              <Footage id={c.id} from={c.from} />
            </div>
          </Sequence>
        );
      })}
    </>
  );
};

/** The hook set alone, as at frame 0 (the loop's return): her three photos, nothing lifted. */
const HookAtRest: React.FC = () => (
  <>
    {[...HERO].map((p) => (
      <Print key={p.photo} id={p.photo} {...p.pose} decode={heroDecode(p.pose.h)} />
    ))}
  </>
);

const Scene: React.FC<{ t: number }> = ({ t }) => {
  // the pull back to her camera roll, then the roll receding as the phone comes up
  const pull = moveP(t, T.pull, PULL_DUR);
  // the roll is on its way out just before the bar, so the phone fades up onto a clear ground
  const recede = expoInOut(progress(t, T.phone - 0.3, 0.7));
  const zoom = mix(mix(1, ROLL_Z, pull), 0.3, recede) * (1 + 0.03 * spring(t, "camera") * (1 - pull));
  const worldUp = -140 * recede;
  const toScreen = (x: number, y: number, z = zoom) => ({ x: ROLL_C.x + (x - ROLL_C.x) * z, y: ROLL_C.y + (y - ROLL_C.y) * z + worldUp });
  // the push into the phone: nearer layers move more (the pieces 1.6), the phone's plane 1
  const push = moveP(t, T.push, PUSH_DUR);
  const zAt = (depth: number) => 1 + (Z - 1) * push * depth;
  const pushed = (x: number, y: number, depth: number) => ({ x: F.x + (x - F.x) * zAt(depth), y: F.y + (y - F.y) * zAt(depth), s: zAt(depth) });
  // the phone fades up once the pieces are clear of its place (nothing ever over it: the bezel licence)
  const phoneO = expoOut(progress(t, T.phone + 0.25, 0.5));
  const p1 = pushed(OPEN.x, OPEN.y, 1);
  const breath = 1 + 0.02 * expoInOut(progress(t, T.push + PUSH_DUR, T.out - T.push - PUSH_DUR));
  const heroOf = (i: number) => {
    const c = HERO[i].cell;
    return cellPose(c[0], c[1]);
  };
  return (
    <>
      {/* her camera roll: the other twenty-seven fade in around the three as the camera pulls back, never
          into the band the line sits in */}
      <div style={{ position: "absolute", inset: 0, WebkitMaskImage: ROLL_MASK, maskImage: ROLL_MASK }}>
      {recede < 0.999
        ? ROLL.map((id, i) => {
            const c = i % 5;
            const r = Math.floor(i / 5);
            const hi = HERO.findIndex((h) => h.cell[0] === c && h.cell[1] === r);
            if (hi >= 0) return null;
            const pose = cellPose(c, r);
            const s = toScreen(pose.cx, pose.cy);
            // late in the pull, once the photos are small and below the line (never crowding the words)
            const o = expoOut(progress(pull, 0.45, 0.4)) * (1 - recede);
            return <Print key={id} id={id} cx={s.x} cy={s.y} h={pose.h * zoom} rot={0} dim={0.04} opacity={o} decode={ROLL_DECODE} />;
          })
        : null}
      </div>
      {/* the hook's three: from the collage into their cells, then back with the roll */}
      {recede < 0.999
        ? HERO.map((p, i) => {
            const cell = heroOf(i);
            const lifted = spring(t - LIFT_AT[i], "piece");
            const x = mix(p.pose.cx, cell.cx, pull);
            const y = mix(p.pose.cy, cell.cy, pull);
            const s = toScreen(x, y);
            const h = mix(p.pose.h, cell.h, pull) * zoom * (1 - 0.035 * lifted * (1 - pull));
            return <Print key={p.photo} id={p.photo} cx={s.x} cy={s.y} h={h} rot={mix(p.pose.rot, 0, pull)} dim={0.14 * expoInOut(progress(t, LIFT_AT[i], 0.9)) * (1 - pull)} opacity={1 - recede} decode={heroDecode(p.pose.h)} />;
          })
        : null}
      {/* the phone: fades up whole and straight, the real scan playing; pushed to hero size */}
      {phoneO > 0.004 ? (
        <Device {...PHONE} width={HERO_W} x={p1.x} y={p1.y} scale={(zAt(1) / Z) * breath} opacity={phoneO} screenBackground="#FFFFFF">
          <Cuts />
        </Device>
      ) : null}
      {/* the pieces: lifted out of their photos, held over the roll, then gliding to rest beside the phone */}
      {HERO.map((p, i) => {
        const a = LIFT_AT[i];
        const lifted = spring(t - a, "piece");
        const show = expoOut(progress(t, a, 0.22));
        const fly = spring(t - (T.rest + 0.07 * i), { zeta: 0.94, response: 0.62 });
        const ph = p.pose.h;
        const pw = ph * 0.7467;
        // in the photo (the hook's pose) → with the pull, over its cell at a nearer depth (it shrinks less)
        const inX = p.pose.cx + (p.at.fx - 0.5) * pw;
        const inY = p.pose.cy + (p.at.fy - 0.5) * ph - 0.05 * H * lifted;
        const cell = heroOf(i);
        const cx0 = mix(inX, cell.cx + (p.at.fx - 0.5) * CELL.h * 0.7467, pull);
        const cy0 = mix(inY, cell.cy + (p.at.fy - 0.5) * CELL.h - 40, pull);
        const zg = mix(1, 0.62, pull);
        const s0 = toScreen(cx0, cy0, zg * mix(1, 0.9, recede));
        const h0 = p.at.fh * ph * (1 + 0.16 * lifted) * zg;
        // → to rest beside the phone, an arc on the way
        const x = mix(s0.x, p.rest.cx, fly);
        const y = mix(s0.y, p.rest.cy, fly) - 120 * Math.sin(Math.PI * Math.min(1, fly));
        const h = mix(h0, p.rest.h, fly);
        const q = pushed(x, y, 1.6);
        const leave = 1 - expoInOut(progress(push, 0.3, 0.45));
        return <Garment key={p.piece} id={p.piece} cx={q.x} cy={q.y} h={h * q.s} rot={mix(0, p.rest.rot, fly)} opacity={show * leave} lift={lifted * (1 - 0.6 * fly)} floorO={expoOut(progress(fly, 0.7, 0.3)) * leave} />;
      })}
      <KeyLine text={"Your closet is already\n*in your camera roll.*"} at={T.line1} exitAt={T.phone - 0.1} size={80} lineHeight={1.04} bodyColor={BODY} keyColor={INK} style={{ left: 64, top: 110 }} />
      <KeyLine text={"Curate finds\n*every photo of you.*"} at={T.line2} exitAt={T.push - 0.1} size={80} lineHeight={1.04} bodyColor={BODY} keyColor={INK} style={{ left: 64, top: 110 }} />
      <KeyLine text={"Every item,\n*found and sorted.*"} at={T.line3} size={80} lineHeight={1.04} bodyColor={BODY} keyColor={INK} style={{ left: 64, top: 110 }} />
    </>
  );
};

/** The lockup (the header's): the mark with "Curate" to its right, the app's own line, then where to get it. */
const Lockup: React.FC = () => {
  const m = 168;
  const img = m / MARK_SPAN;
  const cy = 0.44 * H;
  return (
    <>
      <div style={{ position: "absolute", left: 0, right: 0, top: cy - m / 2, height: m, display: "flex", alignItems: "center", justifyContent: "center", gap: 0.34 * m }}>
        <div style={{ position: "relative", width: m, height: m, flex: "none" }}>
          <StableImg src={src(MARK)} style={{ position: "absolute", width: img, height: img, left: -(img - m) / 2, top: -(img - m) / 2 }} />
        </div>
        <div style={{ fontFamily: GEIST, fontWeight: 500, fontSize: 0.95 * m, lineHeight: 1, letterSpacing: "-0.04em", color: INK, paddingBottom: "0.04em" }}>Curate</div>
      </div>
      <Line text={"Try it. Style it. *Wear it.*"} at={T.lockLine} x={48} y={cy + 0.72 * m} size={64} width={W - 96} align="center" keyColor={INK} bodyColor={BODY} />
      <Line text={"On the App Store"} at={T.cta} x={48} y={cy + 1.5 * m} size={46} width={W - 96} align="center" keyColor={INK} bodyColor={BODY} />
    </>
  );
};

/** A pan between two sets through a soft column of light (the header's glide): `a` leaves left, `b` arrives. */
const Pan: React.FC<{ q: number; a: React.ReactNode; b: React.ReactNode }> = ({ q, a, b }) => {
  const d = 0.98 * W;
  const fe = 60;
  const seam = mix(W + fe, -fe, q);
  const glow = q > 0 && q < 1 ? Math.sin(Math.PI * q) : 0;
  const mask = `linear-gradient(90deg, rgba(0,0,0,0) ${(seam - fe).toFixed(1)}px, #000 ${(seam + fe).toFixed(1)}px)`;
  return (
    <>
      {q < 0.9995 ? <AbsoluteFill style={q > 0.0005 ? { transform: `translateX(${(-q * d).toFixed(2)}px)` } : undefined}>{a}</AbsoluteFill> : null}
      {q > 0.0005 ? (
        <AbsoluteFill style={q < 0.9995 ? { WebkitMaskImage: mask, maskImage: mask } : undefined}>
          <AbsoluteFill style={q < 0.9995 ? { transform: `translateX(${((1 - q) * d).toFixed(2)}px)` } : undefined}>{b}</AbsoluteFill>
        </AbsoluteFill>
      ) : null}
      {glow > 0.004 ? (
        <div style={{ position: "absolute", top: 0, bottom: 0, left: seam - 0.11 * W, width: 0.22 * W, opacity: 0.55 * glow, mixBlendMode: "screen", background: "linear-gradient(90deg, rgba(255,248,240,0) 0%, rgba(255,248,240,0.22) 40%, rgba(255,251,246,0.36) 50%, rgba(255,248,240,0.22) 60%, rgba(255,248,240,0) 100%)" }} />
      ) : null}
    </>
  );
};

const Film: React.FC<{ t: number }> = ({ t }) => {
  const qOut = moveP(t, T.out, OUT_DUR);
  const qBack = moveP(t, T.back, BACK_DUR, { zeta: 1, response: 0.34 });
  return (
    <>
      <Ground t={t} />
      {qBack < 0.0005 ? <Pan q={qOut} a={<Scene t={t} />} b={<Lockup />} /> : <Pan q={qBack} a={<Lockup />} b={<HookAtRest />} />}
      <Grain amount={0.03} />
      <Vignette strength={0.12} />
    </>
  );
};

/** The fastest thing on screen, in px a frame: the pieces' flight, the pull, the push, the two pans. */
const speedAt = (t: number, fps: number) => {
  const dt = 1 / fps;
  const dp = (at: number, dur: number, s?: SpringSpec) => Math.abs(moveP(t + dt / 2, at, dur, s) - moveP(t - dt / 2, at, dur, s));
  const fly = Math.abs(spring(t + dt / 2 - T.rest, { zeta: 0.94, response: 0.62 }) - spring(t - dt / 2 - T.rest, { zeta: 0.94, response: 0.62 })) * 900;
  return Math.max(fly, dp(T.pull, PULL_DUR) * 1300, dp(T.push, PUSH_DUR) * 1400, dp(T.out, OUT_DUR) * W, dp(T.back, BACK_DUR, { zeta: 1, response: 0.34 }) * W);
};

export const PopOutV4: React.FC<Props> = ({ track, fromSec, volume }) => {
  useBrandFonts();
  const { fps, durationInFrames } = useVideoConfig();
  const tail = (fr: number) => Math.min(1, (durationInFrames - fr) / 4); // no click at the loop point
  const samples = (fr: number) => {
    const v = speedAt(fr / fps, fps);
    return v > 2 ? samplesFor(v, SHUTTER, 2) + 1 : 1;
  };
  return (
    <AbsoluteFill style={{ background: TONE.mist, color: INK, overflow: "hidden" }}>
      <Audio src={src(track)} trimBefore={Math.round(fromSec * fps)} volume={(fr) => volume * tail(fr)} />
      {/* every sub-frame sample is opaque (the ground is inside), so averaging them is exact */}
      <SubframeBlur samples={samples} shutter={SHUTTER}>
        <SampleT>{(st) => <Film t={st} />}</SampleT>
      </SubframeBlur>
    </AbsoluteFill>
  );
};

/** Reads the (sub-)frame's time inside SubframeBlur, which re-renders its children at each sample. */
const SampleT: React.FC<{ children: (t: number) => React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return <>{children(frame / fps)}</>;
};

