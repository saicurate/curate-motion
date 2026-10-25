import React from "react";
import { AbsoluteFill } from "remotion";
import { asset, src } from "./assets";
import { ContactShadow } from "./Finish";
import { pieceAspect } from "./Piece";
import { StableImg } from "./StableImg";
import { GEIST } from "./theme";
import { expoInOut, mix, progress, spring, type MotionClass, type Spring } from "./springs";
import { rand01 } from "./noise";

// The designed kit (decisions/0014: ads redraw the app). The header film's world (ads/app-store-header-all)
// as parts any ad can use: the tonal ground, her photos as prints, garments that lift and rest, flat-lay
// looks, and Curate's own UI REDRAWN for an ad (white cards, black pills, chat bubbles, the weather chip),
// never a screen recording and never inside Apple's bezel. Every value is a function of t.
//
// Render rules learned on Pop out v4 (2026-10-24): every bitmap decodes once at about its drawn size
// (StableImg fit), and every print carries a filter so it is its own layer (an unfiltered print under a
// garment's drop-shadow layer repainted blank in video renders). Render these ads at --concurrency 1.

export type SpringSpec = Spring | MotionClass;
export const INK = "#181818";
export const BODY = "#656565";
export const GREY = "#8B8B8B";
export const MIST = "#F4F3F0";
/** The header's tones: each a photo's own colour pushed close to Mist. */
export const TONE = { mist: "#F4F3F0", blush: "#ECDFD7", blue: "#DDE5EC", oat: "#EFE5D3", sand: "#F3EDE3", slate: "#D9DEE4", night: "#2A2C31" } as const;
/** Every shadow: a warm neutral, never black. */
export const SHADE = "58,46,36";

/** A camera move's progress (0 → 1) on a spring, normalised so it lands exactly at `dur`. */
export const moveP = (t: number, at: number, dur: number, s: SpringSpec = "camera") => (t <= at ? 0 : Math.min(1, spring(t - at, s) / spring(dur, s)));

const hex = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
/** The ground's colour at t from timed keys [at, tone], each change over 0.7 s (exponential). */
export const toneAt = (t: number, start: string, keys: [number, string][]) => {
  let c = hex(start);
  for (const [at, to] of keys) {
    const u = expoInOut(progress(t, at, 0.7));
    c = c.map((v, i) => v + (hex(to)[i] - v) * u);
  }
  return `rgb(${c.map((v) => Math.round(v)).join(",")})`;
};
/** The tonal ground: one colour, lit from the top. */
export const Ground: React.FC<{ color: string }> = ({ color }) => (
  <AbsoluteFill style={{ background: `radial-gradient(95% 70% at 50% 24%, color-mix(in srgb, ${color} 55%, white) 0%, ${color} 58%, color-mix(in srgb, ${color} 92%, #5a4a3c) 100%)` }} />
);

// ── her photos and her pieces ─────────────────────────────────────────────────────────────────────────
/** A photo as a print: rounded, lit from the upper left, a soft shadow on the ground, a contact shadow.
 *  `aspect` = w / h (her photos are 0.7467). `decode` the size its bitmap is decoded at, once. */
export const Print: React.FC<{ id: string; cx: number; cy: number; h: number; rot?: number; aspect?: number; dim?: number; opacity?: number; decode?: { w: number; h: number }; children?: React.ReactNode }> = ({
  id, cx, cy, h, rot = 0, aspect = 0.7467, dim = 0, opacity = 1, decode, children,
}) => {
  if (opacity < 0.004) return null;
  const w = h * aspect;
  const r = h * 0.024;
  const d = decode ?? { w: Math.round(1.15 * w), h: Math.round(1.15 * h) };
  return (
    <>
      <div style={{ position: "absolute", left: cx - w / 2 + 0.05 * h, top: cy - h / 2 + 0.045 * h, width: w, height: h, borderRadius: r * 1.2, background: `rgba(${SHADE},${(0.16 * opacity).toFixed(3)})`, filter: `blur(${(0.07 * h).toFixed(1)}px)`, transform: `rotate(${rot}deg)` }} />
      <ContactShadow x={cx} y={cy + h / 2 + 0.035 * h} w={w * 1.04} squash={0.09} opacity={0.22 * opacity} lift={0.8} color={SHADE} />
      <div
        style={{
          position: "absolute", left: cx - w / 2, top: cy - h / 2, width: w, height: h, borderRadius: r, overflow: "hidden", transform: `rotate(${rot}deg)`,
          opacity: opacity < 0.9995 ? opacity : undefined,
          boxShadow: `${h * 0.004}px ${h * 0.008}px ${h * 0.02}px rgba(${SHADE},0.12), ${h * 0.03}px ${h * 0.06}px ${h * 0.13}px rgba(${SHADE},0.14)`,
          filter: `brightness(${(1 - Math.max(0, dim)).toFixed(3)})`,
        }}
      >
        <StableImg src={src(id)} fit={d} style={{ position: "absolute", inset: 0, width: w, height: h }} />
        {children}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(118deg, rgba(255,255,255,0) 34%, rgba(255,255,255,0.08) 46%, rgba(255,255,255,0) 60%)" }} />
        <div style={{ position: "absolute", inset: 0, borderRadius: r, boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.18)" }} />
      </div>
    </>
  );
};

/** A light sweep down a print from one photo to another (a try-on, a change of clothes): `u` 0 → 1. Lay it as
 *  the Print's child, sized like the print. */
export const Wipe: React.FC<{ to: string; w: number; h: number; u: number }> = ({ to, w, h, u }) => {
  if (u <= 0.001) return null;
  const edge = u * (h + 0.3 * h) - 0.15 * h;
  const mask = `linear-gradient(180deg, #000 ${(edge - 0.08 * h).toFixed(1)}px, rgba(0,0,0,0) ${(edge + 0.08 * h).toFixed(1)}px)`;
  const glow = u < 1 ? Math.sin(Math.PI * u) : 0;
  return (
    <>
      <div style={{ position: "absolute", inset: 0, WebkitMaskImage: u < 0.999 ? mask : undefined, maskImage: u < 0.999 ? mask : undefined }}>
        <StableImg src={src(to)} fit={{ w: Math.round(1.15 * w), h: Math.round(1.15 * h) }} style={{ position: "absolute", inset: 0, width: w, height: h }} />
      </div>
      {glow > 0.004 ? <div style={{ position: "absolute", left: 0, right: 0, top: edge - 0.07 * h, height: 0.14 * h, opacity: 0.8 * glow, background: "linear-gradient(180deg, rgba(255,250,244,0) 0%, rgba(255,250,244,0.55) 50%, rgba(255,250,244,0) 100%)" }} /> : null}
    </>
  );
};

const DECODE_H = 760;
/** A garment cut-out, floating: its drop shadow (longer when lifted), a contact shadow once it rests. */
export const Garment: React.FC<{ id: string; cx: number; cy: number; h: number; rot?: number; opacity?: number; lift?: number; floorO?: number }> = ({ id, cx, cy, h, rot = 0, opacity = 1, lift = 0, floorO = 0 }) => {
  if (opacity < 0.004 || h < 2) return null;
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
        <StableImg src={src(id, "cutout")} fit={{ w: Math.round(DECODE_H * asp), h: DECODE_H }} style={{ position: "absolute", inset: 0, width: w, height: h }} />
      </div>
    </>
  );
};

// ── a look, laid flat (the app's own flat-lay grammar) ─────────────────────────────────────────────────
export type Role = "outer" | "top" | "bottom" | "dress" | "shoes" | "bag" | "acc";
/** Where each role sits, in units of the look's size L around its centre (light from the top left). */
export const SLOT: Record<Role, { x: number; y: number; h: number; rot: number; z: number }> = {
  outer: { x: -0.25, y: -0.06, h: 0.6, rot: -4, z: 0 },
  top: { x: 0.0, y: -0.17, h: 0.42, rot: 3, z: 1 },
  bottom: { x: 0.25, y: 0.08, h: 0.62, rot: 1.5, z: 1 },
  dress: { x: 0.02, y: 0.0, h: 0.82, rot: 2, z: 1 },
  shoes: { x: -0.08, y: 0.36, h: 0.19, rot: -8, z: 3 },
  bag: { x: 0.38, y: -0.26, h: 0.3, rot: 7, z: 2 },
  acc: { x: -0.36, y: -0.36, h: 0.12, rot: -7, z: 3 },
};
const nativeH = (id: string) => {
  const d = asset<{ cutoutDims?: { w: number; h: number } }>(id).asset.cutoutDims;
  return d ? d.h * 1.04 : Infinity;
};
/** Where a role's piece lands in a look of size L centred at (x, y). */
export const slotOf = (id: string, role: Role, x: number, y: number, L: number) => {
  const s = SLOT[role];
  return { cx: x + s.x * L, cy: y + s.y * L, h: Math.min(s.h * L, nativeH(id)), rot: s.rot, z: s.z };
};

// ── the app, redrawn ───────────────────────────────────────────────────────────────────────────────
/** A white card, the app's own: 28 round, its soft lift. */
export const Card: React.FC<{ x: number; y: number; w: number; h: number; r?: number; opacity?: number; style?: React.CSSProperties; children?: React.ReactNode }> = ({ x, y, w, h, r = 34, opacity = 1, style, children }) =>
  opacity < 0.004 ? null : (
    <div
      style={{
        position: "absolute", left: x, top: y, width: w, height: h, borderRadius: r, background: "#FFFFFF", overflow: "hidden",
        opacity: opacity < 0.9995 ? opacity : undefined,
        boxShadow: `0 ${h * 0.01}px ${h * 0.03}px rgba(${SHADE},0.08), 0 ${h * 0.05}px ${h * 0.12}px rgba(${SHADE},0.12)`,
        ...style,
      }}
    >
      {children}
    </div>
  );

/** The app's black pill (Try it on, Save): Geist Medium on ink; `press` 0 → 1 dips it as a finger would. */
export const Pill: React.FC<{ label: string; x: number; y: number; size?: number; dark?: boolean; press?: number; opacity?: number; icon?: React.ReactNode }> = ({ label, x, y, size = 34, dark = true, press = 0, opacity = 1, icon }) =>
  opacity < 0.004 ? null : (
    <div
      style={{
        position: "absolute", left: x, top: y, display: "flex", alignItems: "center", gap: size * 0.4, padding: `${size * 0.5}px ${size * 0.95}px`,
        borderRadius: 999, background: dark ? INK : "#FFFFFF", color: dark ? "#FFFFFF" : INK, fontFamily: GEIST, fontWeight: 500, fontSize: size,
        letterSpacing: "-0.01em", whiteSpace: "nowrap", transform: `scale(${(1 - 0.05 * Math.sin(Math.PI * Math.min(1, press))).toFixed(4)})`,
        opacity: opacity < 0.9995 ? opacity : undefined, boxShadow: dark ? `0 10px 30px rgba(${SHADE},0.22)` : `0 6px 20px rgba(${SHADE},0.12)`,
        border: dark ? undefined : "1.5px solid #E3E3E3",
      }}
    >
      {icon}
      {label}
    </div>
  );

/** A chat bubble: hers on Mist, right; Zee's in ink, left. `words` 0 → 1 reveals it word by word. */
export const Bubble: React.FC<{ text: string; who: "her" | "zee"; x: number; y: number; w: number; size?: number; words?: number; opacity?: number }> = ({ text, who, x, y, w, size = 52, words = 1, opacity = 1 }) => {
  if (opacity < 0.004) return null;
  const ws = text.split(" ");
  const n = Math.ceil(ws.length * Math.min(1, Math.max(0, words)));
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, display: "flex", justifyContent: who === "her" ? "flex-end" : "flex-start", opacity: opacity < 0.9995 ? opacity : undefined }}>
      <div
        style={{
          maxWidth: w, padding: `${size * 0.5}px ${size * 0.66}px`, borderRadius: size * 0.82, fontFamily: GEIST, fontWeight: 500, fontSize: size, lineHeight: 1.22,
          letterSpacing: "-0.02em", background: who === "her" ? "#E9EBEE" : INK, color: who === "her" ? INK : "#FFFFFF",
          borderBottomRightRadius: who === "her" ? size * 0.2 : undefined, borderBottomLeftRadius: who === "zee" ? size * 0.2 : undefined,
          boxShadow: `0 ${size * 0.25}px ${size * 0.8}px rgba(${SHADE},0.14)`,
        }}
      >
        {ws.map((wd, i) => (
          <span key={i} style={{ opacity: i < n ? 1 : 0 }}>
            {wd}
            {i < ws.length - 1 ? " " : ""}
          </span>
        ))}
      </div>
    </div>
  );
};

/** The app's weather line, as a chip: a glyph (drawn, Iconoir-like), the temperature, the words. `inline` lays it in
 *  the flow (no x/y), so a wrapper can centre it on a point. */
export const WeatherChip: React.FC<{ glyph: "sun" | "cloud" | "rain"; temp: string; words: string; x?: number; y?: number; size?: number; opacity?: number; dark?: boolean; inline?: boolean }> = ({ glyph, temp, words, x = 0, y = 0, size = 46, opacity = 1, dark = false, inline = false }) => {
  if (opacity < 0.004) return null;
  const c = dark ? "#FFFFFF" : INK;
  const g = size * 1.3;
  const svg =
    glyph === "sun" ? (
      <svg width={g} height={g} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.6} strokeLinecap="round">
        <circle cx="12" cy="12" r="4.2" />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
          <line key={a} x1={12 + 7 * Math.cos((a * Math.PI) / 180)} y1={12 + 7 * Math.sin((a * Math.PI) / 180)} x2={12 + 9.4 * Math.cos((a * Math.PI) / 180)} y2={12 + 9.4 * Math.sin((a * Math.PI) / 180)} />
        ))}
      </svg>
    ) : (
      <svg width={g} height={g} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 15.5h10a3.6 3.6 0 0 0 .4-7.2A5.4 5.4 0 0 0 7 9.2 3.2 3.2 0 0 0 7 15.5z" />
        {glyph === "rain" ? [8, 12, 16].map((xx) => <line key={xx} x1={xx} y1={18} x2={xx - 1.2} y2={21.2} />) : null}
      </svg>
    );
  return (
    <div
      style={{
        ...(inline ? { position: "relative" as const } : { position: "absolute" as const, left: x, top: y }), display: "flex", alignItems: "center", gap: size * 0.34, padding: `${size * 0.32}px ${size * 0.62}px ${size * 0.32}px ${size * 0.42}px`,
        borderRadius: 999, background: dark ? "rgba(24,24,24,0.82)" : "rgba(255,255,255,0.92)", fontFamily: GEIST, fontWeight: 500, fontSize: size, color: c,
        letterSpacing: "-0.02em", whiteSpace: "nowrap", opacity: opacity < 0.9995 ? opacity : undefined, boxShadow: `0 10px 34px rgba(${SHADE},0.16)`,
      }}
    >
      {svg}
      <span>{temp}</span>
      <span style={{ color: dark ? "rgba(255,255,255,0.72)" : BODY, fontWeight: 400 }}>{words}</span>
    </div>
  );
};

/** Rain across the frame: seeded streaks falling, a pure function of t. `amount` 0 → 1 fades it. */
export const Rain: React.FC<{ t: number; W: number; H: number; amount: number; n?: number }> = ({ t, W, H, amount, n = 90 }) => {
  if (amount < 0.004) return null;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {Array.from({ length: n }, (_, i) => {
        const speed = 1500 + 900 * rand01(7, i);
        const len = 60 + 80 * rand01(11, i);
        const x0 = W * rand01(3, i) * 1.2 - 0.1 * W;
        const y = ((rand01(5, i) * (H + len) + speed * t) % (H + len)) - len;
        const x = x0 - 0.18 * (y + len);
        const o = (0.22 + 0.3 * rand01(13, i)) * amount;
        return <div key={i} style={{ position: "absolute", left: x, top: y, width: 2.2, height: len, borderRadius: 2, background: `linear-gradient(180deg, rgba(255,255,255,0), rgba(255,255,255,${o.toFixed(3)}))`, transform: "rotate(10deg)" }} />;
      })}
    </AbsoluteFill>
  );
};

/** A pan between two sets through a soft column of light (the header's glide): `a` leaves left, `b` arrives. */
export const Pan: React.FC<{ q: number; W: number; a: React.ReactNode; b: React.ReactNode }> = ({ q, W, a, b }) => {
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

/** The mark (1152 px square; the mark spans 482 px of it), never recoloured. */
export const MARK = "brand.curate.splash-mark.v1";
export const MARK_SPAN = 482 / 1152;
/** The mark with "Curate" beside it (the header's lockup), centred at y. */
export const MarkWord: React.FC<{ y: number; m?: number; color?: string }> = ({ y, m = 168, color = INK }) => {
  const img = m / MARK_SPAN;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: y - m / 2, height: m, display: "flex", alignItems: "center", justifyContent: "center", gap: 0.34 * m }}>
      <div style={{ position: "relative", width: m, height: m, flex: "none" }}>
        <StableImg src={src(MARK)} style={{ position: "absolute", width: img, height: img, left: -(img - m) / 2, top: -(img - m) / 2 }} />
      </div>
      <div style={{ fontFamily: GEIST, fontWeight: 500, fontSize: 0.95 * m, lineHeight: 1, letterSpacing: "-0.04em", color, paddingBottom: "0.04em" }}>Curate</div>
    </div>
  );
};

/** A seeded wobble, for things that float (never stops, never repeats visibly in 15 s). */
export const wave = (t: number, period: number, phase = 0) => Math.sin((2 * Math.PI * t) / period + phase);
