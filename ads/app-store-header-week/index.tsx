import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { FormatId } from "../../schemas/ad";
import { asset, GEIST, Grain, hash, pieceAspect, samplesFor, src, StableImg, SubframeBlur, useBrandFonts, Vignette } from "../../motion";

const SHUTTER = 0.35;
import { expoOut, mix, progress, spring, track } from "../../motion/springs";
import { BODY, DAYS, INK, MIST, mixHex, rgba, shade, type Day, type Role, type Tone } from "./palette";
import { FLIP, RAIL, TOTAL } from "./timeline";

// The iOS 27 App Store header (21:9, 3840 × 1646) and search card (3:2, 2880 × 1920), direction C
// "A week of looks": Monday to Sunday, a look from Emma's own wardrobe each day, each on its own
// colour set; the close is the whole week as seven cards and "A look for every day." Two variants:
//
//   c1  flip  each day is the whole frame; the next set pushes in from the right
//   c2  rail  the seven sets are cards on a rail; the camera glides a card a step
//
// Every value is a function of t = frame / fps. Layout is in units of the frame's height H around its
// centre; what matters stays inside ±0.72 H (the 3:2 card's half-width), the header shows more paper.

export const VARIANTS = ["c1", "c2"] as const;
export const TONES = ["subtle", "bold"] as const;
export const schema = z.object({ format: FormatId, length: z.number(), variant: z.enum(VARIANTS), tone: z.enum(TONES) });
export const defaults = { variant: "c1" as const, tone: "subtle" as const };

/** Per tone: the look's size and the name's (subtle has more air), the pieces' shadows, the vignette. */
const LOOKS: Record<Tone, { L: number; ns: number; sh: [number, number]; vig: number }> = {
  subtle: { L: 0.66, ns: 0.17, sh: [0.2, 0.15], vig: 0.05 },
  bold: { L: 0.74, ns: 0.2, sh: [0.28, 0.22], vig: 0.1 },
};

const LOCKUP = "brand.curate.logo-splash.v1";

type Box = { x: number; y: number; w: number; h: number; r: number };
const lerpBox = (a: Box, b: Box, k: number): Box => ({ x: mix(a.x, b.x, k), y: mix(a.y, b.y, k), w: mix(a.w, b.w, k), h: mix(a.h, b.h, k), r: mix(a.r, b.r, k) });

/** Seconds, from the (possibly sub-frame, inside SubframeBlur) current frame. */
const useT = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return frame / fps;
};

/** The house stage: a seamless Angora White sweep under a soft overhead light (the close sits on it). */
const Stage: React.FC = () => (
  <>
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${MIST.top} 0%, ${MIST.mid} 46%, ${MIST.low} 64%, ${MIST.floor} 100%)` }} />
    <AbsoluteFill style={{ background: "radial-gradient(70% 95% at 50% 30%, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0) 70%)" }} />
  </>
);

// ── the flat-lay ──────────────────────────────────────────────────────────────────────────────────
// Where each role lies on the paper, in units of the look's height L around its centre (light from the
// top left, so every piece's shadow falls down and to the right).
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
/** Without an outer layer the top takes its place. */
const TOP_ALONE = { x: -0.18, y: -0.12, h: 0.5, rot: -2, z: 1 };

/** A cut-out never drawn bigger than it is (the founder: "why is it so blurry"): its native height, +4%. */
const nativeH = (id: string) => {
  const c = asset<{ cutoutDims?: { w: number; h: number } }>(id).asset.cutoutDims;
  return c ? c.h * 1.04 : Infinity;
};

/** One day's look, laid flat: centre (lx, ly), look height L px; `lift` 0 = lying on the paper, 1 = just lifted. */
const Look: React.FC<{ day: Day; lx: number; ly: number; L: number; lift: number; dx?: number; sh: [number, number] }> = ({ day, lx, ly, L, lift, dx = 0, sh }) => {
  const outer = day.look.some((p) => p.role === "outer");
  const pieces = day.look
    .map((p) => ({ ...p, s: p.role === "top" && !outer ? TOP_ALONE : SLOT[p.role] }))
    .sort((a, b) => a.s.z - b.s.z);
  return (
    <>
      {pieces.map((p, i) => {
        const h = Math.min(p.s.h * L, nativeH(p.id));
        const w = h * pieceAspect(p.id);
        const up = lift * (0.012 + 0.004 * i);
        // parallax: on a push the upper pieces trail the paper a little more than the lower ones
        const cx = lx + p.s.x * L + dx * (1 + 0.12 * p.s.z);
        const cy = ly + p.s.y * L - up * L;
        // two shadows: a tight contact one and a soft, wide one, both down-right; longer when lifted
        const d1 = (0.004 + 0.01 * lift) * L;
        const d2 = (0.014 + 0.03 * lift) * L;
        return (
          <div
            key={p.id + i}
            style={{
              position: "absolute",
              left: cx - w / 2,
              top: cy - h / 2,
              width: w,
              height: h,
              transform: `rotate(${p.s.rot}deg)`,
              filter: `drop-shadow(${d1 * 0.6}px ${d1}px ${0.007 * L}px rgba(40,30,22,${sh[0]})) drop-shadow(${d2 * 0.6}px ${d2}px ${(0.035 + 0.03 * lift) * L}px rgba(40,30,22,${sh[1]}))`,
            }}
          >
            <StableImg src={src(p.id, "cutout")} style={{ position: "absolute", inset: 0, width: w, height: h, filter: "url(#wk-defringe)" }} />
          </div>
        );
      })}
    </>
  );
};

/** The cut-outs were cut off white: their outermost pixel is a light rim on colour. A 1 px erode (on the
 *  premultiplied pixels) drops it and darkens what is left of the edge towards the garment. */
const Defringe: React.FC = () => (
  <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden>
    <filter id="wk-defringe" colorInterpolationFilters="sRGB">
      <feMorphology operator="erode" radius={1} />
    </filter>
  </svg>
);

// ── the paper's tooth ─────────────────────────────────────────────────────────────────────────────
// One seeded tile, made once in the browser (as motion/Finish's grain), tiled under the light: a fine tooth
// plus a soft mottle. Pure: the same seed always draws the same pixels. (An SVG feTurbulence did the same
// per set and per motion-blur sample, and timed Lambda out on the full 4K frame.)
const TOOTH = 512;
let toothCache: string | null = null;
const toothTile = (): string => {
  if (toothCache) return toothCache;
  const N = TOOTH;
  const c = document.createElement("canvas");
  c.width = N;
  c.height = N;
  const g = c.getContext("2d")!;
  const img = g.createImageData(N, N);
  const raw = new Float32Array(N * N);
  for (let i = 0; i < raw.length; i++) raw[i] = hash(0x7a9e, i) / 4294967296 - 0.5;
  const blur = (src: Float32Array, r: number) => {
    const out = new Float32Array(N * N);
    for (let y = 0; y < N; y++)
      for (let x = 0; x < N; x++) {
        let sum = 0;
        for (let d = -r; d <= r; d++) sum += src[y * N + ((x + d + N) % N)];
        out[y * N + x] = sum / (2 * r + 1);
      }
    const out2 = new Float32Array(N * N);
    for (let y = 0; y < N; y++)
      for (let x = 0; x < N; x++) {
        let sum = 0;
        for (let d = -r; d <= r; d++) sum += out[((y + d + N) % N) * N + x];
        out2[y * N + x] = sum / (2 * r + 1);
      }
    return out2;
  };
  const fine = blur(raw, 1);
  const mottle = blur(raw, 9);
  for (let i = 0; i < raw.length; i++) {
    const v = Math.max(0, Math.min(255, Math.round(128 + fine[i] * 150 + mottle[i] * 480)));
    img.data[i * 4] = v;
    img.data[i * 4 + 1] = v;
    img.data[i * 4 + 2] = v;
    img.data[i * 4 + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  toothCache = c.toDataURL("image/png");
  return toothCache;
};

// ── a day's set ───────────────────────────────────────────────────────────────────────────────────
/**
 * One day: its paper in `box`, lit from the top left, with the look and the day's name. `m` is the
 * layout: 0 = the whole frame (name on the left, look on the right), 1 = a card (name top left, look
 * below). `lift` lifts the pieces (a set arriving), `name` 0..1 the name's rise, `card` the card's own
 * shadow (on the stage).
 */
const DaySet: React.FC<{ day: Day; tone: Tone; box: Box; m: number; lift?: number; name?: number; card?: number; opacity?: number; dim?: number; dx?: number; t: number }> = ({ day, tone, box, m, lift = 0, name = 1, card = 0, opacity = 1, dim = 0, dx = 0, t }) => {
  const c = day.tones[tone];
  const cfg = LOOKS[tone];
  if (opacity < 0.004 || box.w < 1) return null;
  // the window light drifts a little and comes back every 15 s (the loop)
  const drift = Math.sin((2 * Math.PI * t) / 15 + day.day.length) * 0.03;
  const { x, y, w, h, r } = box;
  const bx = x + w / 2;
  const by = y + h / 2;
  // the look: whole frame → right of centre; card → centred, low
  const lx = mix(bx + 0.2 * h, bx, m);
  const ly = mix(by + 0.03 * h, y + 0.6 * h, m);
  const L = mix(cfg.L * h, 0.62 * h, m);
  // the name: whole frame → left column; card → top left
  const nx = mix(bx - 0.68 * h, x + 0.085 * w, m);
  const ny = mix(by - 0.17 * h, y + 0.06 * h, m);
  const ns = mix(cfg.ns * h, 0.145 * h, m);
  const rise = 1 - name;
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
        opacity,
        filter: dim > 0.004 ? `brightness(${(1 - dim).toFixed(3)})` : undefined,
        boxShadow: card > 0.002 ? `0 ${h * 0.012}px ${h * 0.03}px rgba(40,30,22,${0.08 * card}), 0 ${h * 0.06}px ${h * 0.14}px rgba(40,30,22,${0.14 * card})` : undefined,
        background: `linear-gradient(158deg, ${shade(c.paper, tone === "subtle" ? 0.35 : 0.1)} 0%, ${c.paper} 46%, ${shade(c.paper, tone === "subtle" ? -0.035 : -0.12)} 100%)`,
      }}
    >
      {/* the key light, top left, and the fall-off into the paper's deep tone at the far edge */}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(75% 85% at 26% 18%, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 62%)" }} />
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(140% 120% at 30% 25%, rgba(0,0,0,0) 55%, ${rgba(c.deep, tone === "subtle" ? 0.45 : 0.38)} 100%)` }} />
      {/* the paper's tooth: a still, seeded fibre tile (never moves, so it reads as the paper), soft-light */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${toothTile()})`, backgroundSize: `${TOOTH}px ${TOOTH}px`, mixBlendMode: "soft-light", opacity: tone === "subtle" ? 0.45 : 0.35 }} />
      {/* a soft diagonal of window light across the paper, and the shade beside it */}
      <div style={{ position: "absolute", inset: 0, background: `linear-gradient(112deg, rgba(255,255,255,0) ${(22 + 100 * drift).toFixed(2)}%, rgba(255,255,255,${tone === "subtle" ? 0.3 : 0.11}) ${(36 + 100 * drift).toFixed(2)}%, rgba(255,255,255,0) ${(52 + 100 * drift).toFixed(2)}%, ${rgba(c.deep, 0)} ${(60 + 100 * drift).toFixed(2)}%, ${rgba(c.deep, tone === "subtle" ? 0.5 : 0.16)} ${(80 + 100 * drift).toFixed(2)}%)` }} />
      <div style={{ position: "absolute", left: -x, top: -y }}>
        <Look day={day} lx={lx} ly={ly} L={L} lift={lift} dx={dx} sh={cfg.sh} />
      </div>
      <div style={{ position: "absolute", left: nx - x, top: ny - y, fontFamily: GEIST, fontWeight: 500, color: c.text, whiteSpace: "nowrap" }}>
        <div style={{ overflow: "hidden", padding: "0.04em 0.02em 0.1em", margin: "-0.04em -0.02em -0.1em" }}>
          <div style={{ fontSize: ns, lineHeight: 0.92, letterSpacing: "-0.045em", transform: rise > 1e-4 ? `translateY(${(rise * 108).toFixed(3)}%)` : undefined }}>{day.day}</div>
        </div>
        <div style={{ fontSize: ns * 0.3, letterSpacing: "0.005em", marginTop: ns * 0.1, color: c.sub, opacity: (tone === "subtle" ? 1 : 0.82) * name * (1 - expoOut(progress(m, 0.15, 0.4))) }}>{day.occ}</div>
      </div>
    </div>
  );
};

// ── words and the lockup ──────────────────────────────────────────────────────────────────────────
/** "A look for *every day.*": two tones, the words rising out of masks on the `headline` spring. */
const Line: React.FC<{ at: number; exitAt: number; x: number; y: number; size: number; align: number; key0: string; body0: string; bodyA0: number; key1: string; body1: string; k: number }> = ({
  at,
  exitAt,
  x,
  y,
  size,
  align,
  key0,
  body0,
  bodyA0,
  key1,
  body1,
  k,
}) => {
  const t = useT();
  const words = [
    { w: "A", key: false },
    { w: "look", key: false },
    { w: "for", key: false },
    { w: "every", key: true },
    { w: "day.", key: true },
  ];
  const stagger = 0.07;
  if (t < at - 0.05 || t > exitAt + words.length * stagger + 0.4) return null;
  const keyC = mixHex(key0, key1, k);
  const bodyC = rgba(mixHex(body0, body1, k), mix(bodyA0, 1, k));
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: align > 1e-4 ? `translateX(${(-50 * align).toFixed(3)}%)` : undefined, fontFamily: GEIST, fontWeight: 500, fontSize: size, lineHeight: 1.04, letterSpacing: "-0.04em", whiteSpace: "nowrap", display: "flex", gap: `0 ${size * 0.25}px` }}>
      {words.map((wd, n) => {
        const up = spring(t - (at + n * stagger), "headline");
        const down = spring(t - (exitAt + (words.length - 1 - n) * stagger * 0.6), "headline");
        // 1.3, not 1.08: the mask is padded 0.16 em below, so a word must travel past it to leave no sliver
        const yy = (1 - up + down) * 1.3;
        return (
          <span key={n} style={{ display: "inline-block", overflow: "hidden", padding: "0.06em 0.02em 0.16em", margin: "-0.06em -0.02em -0.16em" }}>
            <span style={{ display: "inline-block", transform: Math.abs(yy) < 1e-4 ? undefined : `translateY(${(yy * 100).toFixed(3)}%)`, color: wd.key ? keyC : bodyC }}>{wd.w}</span>
          </span>
        );
      })}
    </div>
  );
};

/** The Curate lockup, small, under the week: rises on the `ui` spring, fades back before the loop. */
const Lockup: React.FC<{ at: number; exitAt: number; cx: number; y: number; h: number }> = ({ at, exitAt, cx, y, h }) => {
  const t = useT();
  const o = expoOut(progress(t, at, 0.5)) * (1 - expoOut(progress(t, exitAt, 0.3)));
  if (o < 0.004) return null;
  const up = spring(t - at, "ui");
  const w = h * (670 / 742);
  return <StableImg src={src(LOCKUP)} style={{ position: "absolute", left: cx - w / 2, top: y + (1 - up) * 0.04 * h * 4, width: w, height: h, opacity: o }} />;
};

// ── the week, as a row of seven cards ─────────────────────────────────────────────────────────────
/** The 3:2 search card is too narrow for seven cards in a row: there the week sits in two rows (4 + 3). */
const twoRows = (W: number, H: number) => W / H < 2;
const rowBox = (i: number, W: number, H: number): Box => {
  if (twoRows(W, H)) {
    const g = 0.026 * H;
    const ch = 0.34 * H;
    const cw = ch / 1.48;
    const r = i < 4 ? 0 : 1;
    const n = r === 0 ? 4 : 3;
    const j = r === 0 ? i : i - 4;
    const x0 = W / 2 - (n * cw + (n - 1) * g) / 2;
    return { x: x0 + j * (cw + g), y: H / 2 - 0.27 * H + r * (ch + g), w: cw, h: ch, r: 0.07 * cw };
  }
  const g = 0.022 * H;
  const cw = Math.min((0.92 * W - 6 * g) / 7, (0.5 * H) / 1.48);
  const ch = cw * 1.48;
  const x0 = W / 2 - (7 * cw + 6 * g) / 2;
  return { x: x0 + i * (cw + g), y: H / 2 - ch / 2 + 0.06 * H, w: cw, h: ch, r: 0.07 * cw };
};
/** Where the line sits over the week: higher over the two rows. */
const weekLineY = (W: number, H: number) => H / 2 - (twoRows(W, H) ? 0.41 : 0.37) * H;

/** When every day's pieces land and its name rises (s), once its set has glided in: Monday is already down at 0. */
const arrivals = (moves: readonly number[], settle: number) => [-10, ...moves.map((m) => m + settle)];

// ── the moves, as pure functions of t (the pictures and the blur's sample count both read them) ──────
const flipPos = (t: number) => track(t, 0, FLIP.push.map((p, i) => ({ t: p, v: i + 1, spring: "camera" as const })));
const flipK = (t: number) => spring(t - FLIP.week, "camera");
/** Arrives exactly at the loop point: the spring divided by its own value at 15 s (a spring never quite
 *  lands; this one does, so the last frame is the first to the pixel). */
const landsAtLoop = (t: number, at: number) => Math.min(1, spring(t - at, "camera") / spring(TOTAL - at, "camera"));
const flipKb = (t: number) => landsAtLoop(t, FLIP.back);
const railPos = (t: number) => track(t, 0, [...RAIL.step.map((s, i) => ({ t: s, v: i + 1, spring: "camera" as const })), { t: RAIL.back, v: 0, spring: "panel" as const }]);
const railK = (t: number) => spring(t - RAIL.week, "camera") * (1 - landsAtLoop(t, RAIL.back));

/** The fastest thing on screen at t, in px a frame (finite differences of the tracks above), so the
 *  sub-frame samples follow it: neighbouring samples never more than 3 px apart (no echo). */
const speedAt = (variant: (typeof VARIANTS)[number], t: number, W: number, H: number, fps: number) => {
  const dt = 1 / fps;
  const d = (f: (x: number) => number) => Math.abs(f(t + dt / 2) - f(t - dt / 2));
  if (variant === "c1") return Math.max(d(flipPos) * W, d(flipK) * W, d(flipKb) * W);
  const pitch = 0.78 * H * 0.7 + 0.16 * H;
  return Math.max(d(railPos) * pitch * (1 - railK(t)), d(railK) * W);
};

// ── C1 · flip ─────────────────────────────────────────────────────────────────────────────────────
const Flip: React.FC<{ W: number; H: number; tone: Tone }> = ({ W, H, tone }) => {
  const t = useT();
  const T = FLIP;
  const cx = W / 2;
  const full: Box = { x: 0, y: 0, w: W, h: H, r: 0 };
  // the strip glides a set a step on the camera spring (long and critically damped: a calm push, little smear)
  const pos = flipPos(t);
  const land = arrivals(T.push, 0.72);
  // the week holds until the others start to fall, just before Monday grows back
  const backFrom = T.back - 0.2;
  const k = flipK(t); // Sunday → its card
  const kb = flipKb(t); // Monday's card → the whole frame (a calm camera zoom)
  const under: React.ReactNode[] = [];
  const over: React.ReactNode[] = [];
  DAYS.forEach((day, i) => {
    if (t < T.week) {
      // the montage: the sets in a strip, pushed one set a step
      const off = (i - pos) * W;
      if (Math.abs(off) > W * 1.02) return;
      const lift = 1 - spring(t - land[i], "piece");
      const name = spring(t - (land[i] + 0.05), "headline");
      under.push(<DaySet key={i} t={t} tone={tone} day={day} box={{ ...full, x: off }} m={0} lift={lift} name={name} dx={off * 0.06} />);
      // the arriving sheet's edge casts a soft shadow onto the one it covers
      if (off > 1 && off < W) {
        under.push(<div key={`s${i}`} style={{ position: "absolute", left: off - 0.05 * W, top: 0, width: 0.05 * W, height: H, background: `linear-gradient(90deg, rgba(40,30,22,0) 0%, rgba(40,30,22,${tone === "subtle" ? 0.12 : 0.22}) 100%)`, opacity: Math.min(1, (W - off) / (0.1 * W)) }} />);
      }
      return;
    }
    if (t < backFrom) {
      // the week: Sunday shrinks into its slot (on top, so the week is revealed behind it), the others
      // rise into theirs
      // Saturday's last sliver (the glide may still be settling) fades as Sunday shrinks, never cut
      if (i === 5 && (6 - pos) * W > 0.5) {
        under.push(<DaySet key="sat-rest" t={t} tone={tone} day={day} box={{ ...full, x: (5 - pos) * W }} m={0} opacity={1 - k} dx={(5 - pos) * W * 0.06} />);
      }
      if (i === 6) {
        // from wherever the glide has left it (it may still be settling), so the hand-off is seamless
        over.push(<DaySet key={i} t={t} tone={tone} day={day} box={lerpBox({ ...full, x: (6 - pos) * W }, rowBox(6, W, H), k)} m={k} card={k} dx={(6 - pos) * W * 0.06 * (1 - k)} />);
        return;
      }
      const at = T.week + 0.28 + 0.055 * i;
      const up = spring(t - at, "piece");
      const b = rowBox(i, W, H);
      under.push(<DaySet key={i} t={t} tone={tone} day={day} box={{ ...b, y: b.y + (1 - up) * 0.55 * H }} m={1} card={1} opacity={expoOut(progress(t, at, 0.35))} />);
      return;
    }
    // back: the others fall away; Monday grows into the whole frame (on top)
    if (i === 0) {
      over.push(<DaySet key={i} t={t} tone={tone} day={day} box={lerpBox(rowBox(0, W, H), full, kb)} m={1 - kb} card={1 - kb} />);
      return;
    }
    // they leave as Monday grows (not before it), so the frame is never empty
    const at = T.back + 0.05 + 0.025 * (6 - i);
    const dn = spring(t - at, "panel");
    const b = rowBox(i, W, H);
    under.push(<DaySet key={i} t={t} tone={tone} day={day} box={{ ...b, y: b.y + dn * 0.12 * H }} m={1} card={1} opacity={1 - expoOut(progress(t, at, 0.3))} />);
  });
  // the line: top left on the sets (light), top centre over the week (house tones)
  const kl = t < backFrom ? k : 1;
  const row0 = rowBox(0, W, H);
  return (
    <>
      {under}
      {over}
      <Line
        at={T.line}
        exitAt={T.back - 0.32}
        x={mix(cx - 0.68 * H, cx, kl)}
        y={mix(H / 2 - 0.41 * H, weekLineY(W, H), kl)}
        size={mix(0.07 * H, 0.072 * H, kl)}
        align={kl}
        key0={tone === "subtle" ? INK : "#FFFFFF"}
        body0={tone === "subtle" ? BODY : "#FFFFFF"}
        bodyA0={tone === "subtle" ? 1 : 0.72}
        key1={INK}
        body1={BODY}
        k={kl}
      />
      {twoRows(W, H) ? null : <Lockup at={T.mark} exitAt={T.back - 0.25} cx={cx} y={row0.y + row0.h + 0.045 * H} h={0.1 * H} />}
    </>
  );
};

// ── C2 · rail ─────────────────────────────────────────────────────────────────────────────────────
const Rail: React.FC<{ W: number; H: number; tone: Tone }> = ({ W, H, tone }) => {
  const t = useT();
  const T = RAIL;
  const cx = W / 2;
  const cy = H / 2;
  const pos = railPos(t);
  const k = railK(t);
  const chB = 0.78 * H;
  const cwB = chB * 0.7;
  const hero = tone === "subtle";
  const pitch = cwB + (hero ? 0.16 : 0.07) * H;
  const anchor = 0.34 * H;
  const land = arrivals(T.step, 0.72);
  // the colour field behind the rail: the centred card's deep tone, blending as the camera glides; the
  // house Mist over the week
  const a = Math.max(0, Math.min(6, Math.floor(pos)));
  const b = Math.min(6, a + 1);
  const deepA = DAYS[a].tones[tone].deep;
  const deepB = DAYS[b].tones[tone].deep;
  const field = hero ? mixHex(MIST.mid, mixHex(deepA, deepB, pos - a), 0.55) : mixHex(deepA, deepB, pos - a);
  const cards = DAYS.map((day, i) => {
    const d = i - pos;
    const near = Math.min(1, Math.abs(d));
    const s = 1 - (hero ? 0.2 : 0.13) * near;
    // the active card sits left of centre, so the week runs ahead to the right (and the wide header is never
    // half empty); it stays inside the 3:2 card's width
    const rail: Box = { x: cx - anchor + d * pitch - (cwB * s) / 2, y: cy - (chB * s) / 2 + 0.05 * H, w: cwB * s, h: chB * s, r: 0.05 * cwB * s };
    const box = lerpBox(rail, rowBox(i, W, H), k);
    if (box.x > W * 1.05 || box.x + box.w < -W * 0.05) return null;
    // the pieces drop onto a card as it reaches the centre
    const lift = (1 - spring(t - land[i], "piece")) * Math.max(0, 1 - Math.abs(d)) * (1 - k);
    const dim = (1 - k) * (hero ? 0.04 : 0.22) * near;
    // subtle: the neighbours step back (smaller, fainter) so there is one hero at a time
    const o = 1 - (1 - k) * (hero ? 0.38 : 0) * near;
    return <DaySet key={i} t={t} tone={tone} day={day} box={box} m={1} lift={lift} card={1} dim={dim} opacity={o} />;
  });
  const row0 = rowBox(0, W, H);
  return (
    <>
      <AbsoluteFill style={{ background: `radial-gradient(120% 110% at 50% 38%, ${shade(field, hero ? 0.4 : 0.12)} 0%, ${field} 70%)`, opacity: 1 - k }} />
      {cards}
      <Line at={T.line} exitAt={T.back - 0.32} x={cx} y={mix(cy - 0.455 * H, weekLineY(W, H), k)} size={mix(0.064 * H, 0.072 * H, k)} align={1} key0={hero ? INK : "#FFFFFF"} body0={hero ? BODY : "#FFFFFF"} bodyA0={hero ? 1 : 0.72} key1={INK} body1={BODY} k={k} />
      {twoRows(W, H) ? null : <Lockup at={T.mark} exitAt={T.back - 0.25} cx={cx} y={row0.y + row0.h + 0.045 * H} h={0.1 * H} />}
    </>
  );
};

export const AppStoreHeaderWeek: React.FC<z.infer<typeof schema>> = ({ variant, tone = "subtle" }) => {
  useBrandFonts();
  const { fps, width: W, height: H } = useVideoConfig();
  const samples = (f: number) => samplesFor(speedAt(variant, f / fps, W, H, fps), SHUTTER) + 1;
  return (
    <AbsoluteFill style={{ background: MIST.mid, color: INK, overflow: "hidden" }}>
      {/* the stage is inside every sample: each sub-frame is opaque, so averaging them is exact */}
      <SubframeBlur samples={samples} shutter={SHUTTER}>
        <Stage />
        <Defringe />
        {variant === "c1" ? <Flip W={W} H={H} tone={tone} /> : <Rail W={W} H={H} tone={tone} />}
      </SubframeBlur>
      <Grain amount={0.03} />
      <Vignette strength={LOOKS[tone].vig} />
    </AbsoluteFill>
  );
};
