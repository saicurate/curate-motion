import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { FormatId } from "../../schemas/ad";
import { ContactShadow, Device, deviceLayout, GEIST, Grain, pieceAspect, StableImg, src, SubframeBlur, useBrandFonts, Vignette } from "../../motion";
import { expoInOut, expoOut, mix, progress, spring, track, type Spring } from "../../motion/springs";
import { ROOMS, ROW, WHEEL } from "./timeline";

// The iOS 27 App Store header (21:9, 3840 × 1646) and search card (3:2), direction D "Colour story":
// two 15 s muted loops in colour (the founder, 2026-10-24: "a bit more colorful"). Every value is a
// function of t = frame / fps. Layout is in units of the frame's height H around its centre, so one
// scene fills both crops: what matters stays inside ±0.72 H (the 3:2 card's width).
//
//   d1  "Colour rooms": a dolly through six lit rooms, one per colour of her clothes; the rooms become a
//       palette of six tiles beside her real Wardrobe (build 284)
//   d2  "Colour wheel": her clothes on a slow carousel; the light takes the colour of whatever comes to
//       the front; then they stand in six colour strips beside her real Wardrobe
//
// The garments are the v2 cut-outs (full resolution, made from the originals with the local matte), so
// they stay sharp at 3840 px.

export const FILMS = ["d1", "d2", "d1-bold", "d2-bold"] as const;
export const schema = z.object({ format: FormatId, length: z.number(), film: z.enum(FILMS) });
export const defaults = { film: "d1" as const };

const SCREEN = "screenshot.emma.b284-wardrobe-rails.v1";
const PHONE = { quiet: "silver", d1Bold: "deep-blue", d2Bold: "cosmic-orange" } as const;
const INK = "#181818";
const BODY = "#656565";

/** The dolly between rooms: critically damped, ≈0.8 s to land. */
const TRUCK: Spring = { zeta: 1, response: 0.85 };
/** The carousel's step: critically damped, ≈0.65 s. */
const STEP: Spring = { zeta: 1, response: 0.7 };

const g = (n: string) => `garment.emma.${n}.v2`;
type Item = { id: string; x: number; h: number; lift: number; depth: number };
type Family = { key: string; name: string; wall: string; spot: string; floor: string; shade: string; glow: string; light: boolean; items: Item[] };

/** Six colours of her own clothes, light to dark. Each room: the wall (edges), the spotlight (centre),
 *  the floor of the sweep, the shadow colour, the glow (d2), whether its words are white. Items: the hero
 *  in the middle, two beside it a step back (depth < 1 moves less in the dolly). x, h in H. */
const FAMILIES: Family[] = [
  {
    key: "cream", name: "Cream", wall: "#E3CFB1", spot: "#FBF3E4", floor: "#D2BC9A", shade: "96,72,40", glow: "#F0CC94", light: false,
    items: [
      { id: g("sweater-cable-knit-cream"), x: 0, h: 0.5, lift: 0.035, depth: 1.08 },
      { id: g("cardigan-oatmeal"), x: -0.47, h: 0.4, lift: 0.012, depth: 0.9 },
      { id: g("beanie-cream"), x: 0.46, h: 0.22, lift: 0.012, depth: 0.92 },
    ],
  },
  {
    key: "camel", name: "Camel", wall: "#B4723C", spot: "#E9B37E", floor: "#9C5F2E", shade: "70,36,10", glow: "#E0A066", light: false,
    items: [
      { id: g("coat-wool-camel"), x: 0, h: 0.62, lift: 0.03, depth: 1.08 },
      { id: g("skirt-midi-satin-camel"), x: -0.45, h: 0.44, lift: 0.012, depth: 0.9 },
      { id: g("boots-cowboy-tan"), x: 0.45, h: 0.26, lift: 0.01, depth: 0.92 },
    ],
  },
  {
    key: "sage", name: "Sage", wall: "#7D9C77", spot: "#C4DABB", floor: "#6B8966", shade: "30,52,30", glow: "#A9C7A1", light: false,
    items: [
      { id: g("shirt-flannel-plaid"), x: 0, h: 0.52, lift: 0.03, depth: 1.08 },
      { id: g("leggings-sage"), x: -0.44, h: 0.52, lift: 0.012, depth: 0.9 },
      { id: g("sports-bra-sage"), x: 0.45, h: 0.28, lift: 0.012, depth: 0.92 },
    ],
  },
  {
    key: "denim", name: "Denim", wall: "#2F5C9C", spot: "#7DA6DE", floor: "#284F88", shade: "10,24,52", glow: "#6E98D2", light: true,
    items: [
      { id: g("jacket-denim"), x: 0, h: 0.54, lift: 0.03, depth: 1.08 },
      { id: g("jeans-straight-light-wash"), x: -0.44, h: 0.58, lift: 0.012, depth: 0.9 },
      { id: g("shirt-oxford-blue"), x: 0.46, h: 0.44, lift: 0.012, depth: 0.92 },
    ],
  },
  {
    key: "navy", name: "Navy", wall: "#18244A", spot: "#46609F", floor: "#141E3D", shade: "4,8,20", glow: "#5C7BC8", light: true,
    items: [
      { id: g("sweater-crewneck-navy"), x: 0, h: 0.48, lift: 0.03, depth: 1.08 },
      { id: g("hoodie-navy"), x: -0.46, h: 0.46, lift: 0.012, depth: 0.9 },
      { id: g("cap-baseball-navy"), x: 0.46, h: 0.18, lift: 0.012, depth: 0.92 },
    ],
  },
  {
    key: "black", name: "Black", wall: "#141415", spot: "#55555B", floor: "#101011", shade: "0,0,0", glow: "#767C8E", light: true,
    items: [
      { id: g("blazer-black"), x: 0, h: 0.58, lift: 0.03, depth: 1.08 },
      { id: g("boots-ankle-black"), x: -0.45, h: 0.24, lift: 0.01, depth: 0.9 },
      { id: g("bag-mini-black"), x: 0.44, h: 0.4, lift: 0.012, depth: 0.92 },
    ],
  },
];

/** The quiet set (the founder, 2026-10-24, on the colourful cut: "feeling cheap… the colours please subtle
 *  colours"): six tonal rooms pushed toward Mist, one hero each, a lot of air. The hero stands right of
 *  centre (x 0.15 H), the words on the left. */
const QUIET: Family[] = [
  { key: "oat", name: "Oat", wall: "#E8E2D7", spot: "#F8F5EF", floor: "#DCD4C6", shade: "92,80,62", glow: "#EFE6D6", light: false, items: [{ id: g("sweater-cable-knit-cream"), x: 0.15, h: 0.5, lift: 0.03, depth: 1.06 }] },
  { key: "sand", name: "Sand", wall: "#E3D6C5", spot: "#F5EEE4", floor: "#D6C6B1", shade: "96,72,46", glow: "#EADBC6", light: false, items: [{ id: g("coat-wool-camel"), x: 0.15, h: 0.62, lift: 0.025, depth: 1.06 }] },
  { key: "blush", name: "Blush", wall: "#EADCD7", spot: "#F8F0ED", floor: "#DECBC4", shade: "100,70,64", glow: "#EFDDD7", light: false, items: [{ id: g("dress-slip-champagne"), x: 0.15, h: 0.64, lift: 0.025, depth: 1.06 }] },
  { key: "sage", name: "Sage", wall: "#DCE2D6", spot: "#F0F3EC", floor: "#CDD6C7", shade: "60,74,56", glow: "#DFE7D9", light: false, items: [{ id: g("shirt-flannel-plaid"), x: 0.15, h: 0.52, lift: 0.03, depth: 1.06 }] },
  { key: "blue", name: "Dusty blue", wall: "#D8DFE7", spot: "#EEF2F6", floor: "#CAD3DD", shade: "52,64,82", glow: "#DCE4EE", light: false, items: [{ id: g("jacket-denim"), x: 0.15, h: 0.54, lift: 0.03, depth: 1.06 }] },
  { key: "stone", name: "Stone", wall: "#DDDBD7", spot: "#F1F0ED", floor: "#D0CDC8", shade: "56,54,50", glow: "#E4E2DE", light: false, items: [{ id: g("blazer-black"), x: 0.15, h: 0.58, lift: 0.03, depth: 1.06 }] },
];

const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const rgba = (hex: string, a: number) => `rgba(${rgb(hex).join(",")},${a})`;
const mixHex = (a: string, b: string, u: number) => {
  const A = rgb(a);
  const B = rgb(b);
  return `rgb(${A.map((v, i) => Math.round(mix(v, B[i], u))).join(",")})`;
};
/** The idle float: one slow breath, periodic in 7.5 s, so the loop is exact. */
const breath = (t: number, phase: number) => Math.sin((2 * Math.PI * t) / 7.5 + phase);

/** Seconds, from the (possibly sub-frame, inside SubframeBlur) current frame. */
const useT = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return frame / fps;
};

/** The light Mist stage of the finale: a seamless sweep under a soft overhead light. */
const Stage: React.FC = () => (
  <>
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #FAFAFA 0%, #F6F6F6 46%, #F0F0EF 64%, #E8E8E7 100%)" }} />
    <AbsoluteFill style={{ background: "radial-gradient(70% 95% at 50% 30%, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0) 70%)" }} />
  </>
);

/** A garment cut-out standing on the sweep: its own drop shadow (in the room's shadow colour) and a soft
 *  contact shadow on the floor under it. (x, bottom) is where its hem is. */
const Garment: React.FC<{ id: string; x: number; bottom: number; h: number; opacity?: number; lift?: number; floorY?: number; shade?: string; dim?: number; z?: number; cast?: boolean }> = ({
  id,
  x,
  bottom,
  h,
  opacity = 1,
  lift = 0.5,
  floorY,
  shade = "22,16,12",
  dim = 0,
  z,
  cast = false,
}) => {
  const w = h * pieceAspect(id);
  if (opacity < 0.002) return null;
  return (
    <>
      {cast && floorY !== undefined ? (
        // the long soft shadow the light from the upper left throws across the floor
        <div style={{ position: "absolute", left: x - w * 0.2, top: floorY - h * 0.03, width: w * 1.35, height: h * 0.09, borderRadius: "50%", opacity: 0.55 * opacity, background: `radial-gradient(closest-side, rgba(${shade},0.22), rgba(${shade},0))`, filter: `blur(${(h * 0.02).toFixed(1)}px)` }} />
      ) : null}
      {floorY !== undefined ? <ContactShadow x={x} y={floorY} w={w * 0.86} squash={0.14} opacity={0.5 * opacity} lift={lift} color={shade} /> : null}
      <div
        style={{
          position: "absolute",
          left: x - w / 2,
          top: bottom - h,
          width: w,
          height: h,
          opacity,
          zIndex: z,
          filter: `drop-shadow(0 ${(h * 0.018).toFixed(2)}px ${(h * 0.03).toFixed(2)}px rgba(${shade},0.28))${dim > 0.004 ? ` brightness(${(1 - dim).toFixed(3)})` : ""}`,
        }}
      >
        <StableImg src={src(id, "cutout")} style={{ position: "absolute", inset: 0, width: w, height: h }} />
      </div>
    </>
  );
};

/** The brand's two-tone line (KeyLine's look and motion: Geist Medium, `*key*` darker, words rising out of
 *  masks on the `headline` spring), in either ink, without a GPU layer per word. */
const Line: React.FC<{ text: string; at: number; exitAt?: number; x: number; y: number; size: number; align?: "left" | "center"; width?: number; light?: number }> = ({
  text,
  at,
  exitAt,
  x,
  y,
  size,
  align = "left",
  width,
  light = 0,
}) => {
  const t = useT();
  let key = false;
  const lines = text.split("\n").map((l) =>
    l.split(" ").filter(Boolean).map((raw) => {
      if (raw.startsWith("*")) key = true;
      const w = { w: raw.replace(/\*/g, ""), key };
      if (raw.endsWith("*") || (raw.includes("*") && !raw.startsWith("*"))) key = false;
      return w;
    }),
  );
  const total = lines.reduce((n, l) => n + l.length, 0);
  const stagger = 0.07;
  let i = 0;
  if (t < at - 0.05 || (exitAt !== undefined && t > exitAt + total * stagger + 0.4)) return null;
  const keyC = mixHex(INK, "#FFFFFF", light);
  const bodyC = mixHex(BODY, "#E9ECF2", light);
  return (
    <div style={{ position: "absolute", left: x, top: y, width, fontFamily: GEIST, fontWeight: 500, fontSize: size, lineHeight: 1.04, letterSpacing: "-0.04em", textAlign: align }}>
      {lines.map((line, li) => (
        <div key={li} style={{ display: "flex", justifyContent: align === "center" ? "center" : "flex-start", gap: `0 ${size * 0.25}px` }}>
          {line.map((wd, wi) => {
            const n = i++;
            const up = spring(t - (at + n * stagger), "headline");
            const down = exitAt === undefined ? 0 : spring(t - (exitAt + (total - 1 - n) * stagger * 0.6), "headline");
            const yy = (1 - up + down) * 1.08;
            return (
              <span key={wi} style={{ display: "inline-block", overflow: "hidden", padding: "0.06em 0.02em 0.16em", margin: "-0.06em -0.02em -0.16em" }}>
                <span style={{ display: "inline-block", transform: Math.abs(yy) < 1e-4 ? undefined : `translateY(${(yy * 100).toFixed(3)}%)`, color: wd.key ? keyC : bodyC }}>{wd.w}</span>
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};

/** The phone, by its visible height: Apple's bezel, straight on (x, y, scale, opacity only). */
const phoneW = (H: number, hFrac: number, color: string) => {
  const l = deviceLayout({ model: "iphone-17-pro-max", color, width: 100 });
  return ((hFrac * H) / l.body.h) * 100;
};

// ── D1 · Colour rooms ─────────────────────────────────────────────────────────────────────────────

/** The six rooms seen from camera position `cam` (0 = cream … 5 = black): each a lit wall curving into its
 *  floor, its three pieces, its name. Neighbouring rooms overlap by a feather, so the dolly passes
 *  through colour, never across a seam. `only` draws just rooms within ±1 of it (a tile's room). */
/** A room's light: the spot on the wall, the wall curving into its floor. */
const roomBg = (f: Family, H: number) =>
  `radial-gradient(${0.62 * H}px ${0.55 * H}px at 50% 44%, ${rgba(f.spot, 0.95)} 0%, ${rgba(f.spot, 0)} 100%), linear-gradient(180deg, ${f.wall} 0%, ${mixHex(f.wall, f.spot, 0.35)} 52%, ${mixHex(f.wall, f.floor, 0.4)} 68%, ${f.floor} 84%, ${mixHex(f.floor, "#000000", 0.18)} 100%)`;

const World: React.FC<{ W: number; H: number; cam: number; fams: Family[]; quiet?: boolean; sides?: number; label?: number; centre?: number; labelFrom?: number }> = ({
  W,
  H,
  cam,
  fams,
  quiet = false,
  sides = 1,
  label = 1,
  centre = 0,
  labelFrom = -1,
}) => {
  const t = useT();
  const cx = W / 2;
  const cy = H / 2;
  const floorY = cy + 0.31 * H;
  // rooms sit at least 2.3 H apart, so in the narrow 3:2 card no neighbour shows at rest either
  const RW = Math.max(W, 2.3 * H);
  const feather = 0.4 * H;
  // the light: the room you're in, and the next one coming in from the right edge of the room, a soft
  // band that travels with the dolly (at rest only one room's light, never a seam or a bleed)
  const kA = Math.max(0, Math.min(5, Math.floor(cam + 1e-9)));
  const kB = Math.min(5, kA + 1);
  const frac = Math.max(0, Math.min(1, cam - kA));
  const b = cx + (0.5 - frac) * RW;
  const m0 = b - feather * frac;
  const m1 = b + feather * (1 - frac);
  return (
    <>
      <AbsoluteFill style={{ background: roomBg(fams[kA], H) }} />
      {frac > 1e-4 && kB !== kA ? (
        <AbsoluteFill
          style={{
            background: roomBg(fams[kB], H),
            WebkitMaskImage: `linear-gradient(90deg, transparent ${m0.toFixed(2)}px, #000 ${m1.toFixed(2)}px)`,
            maskImage: `linear-gradient(90deg, transparent ${m0.toFixed(2)}px, #000 ${m1.toFixed(2)}px)`,
          }}
        />
      ) : null}
      {fams.map((f, k) => {
        const off = k - cam;
        if (Math.abs(off) > 1.25) return null;
        return (
          <React.Fragment key={f.key}>
            {f.items.map((it, j) => {
              const x = cx + off * RW * it.depth + it.x * H * (1 - centre);
              const lift = it.lift + 0.006 * breath(t, k * 1.7 + j * 2.3);
              const bottom = floorY - lift * H;
              const o = j === 0 ? 1 : sides;
              return <Garment key={it.id} id={it.id} x={x} bottom={bottom} h={it.h * H} lift={lift * 6} floorY={floorY} shade={f.shade} opacity={o} cast={quiet} />;
            })}
          </React.Fragment>
        );
      })}
      {quiet
        ? fams.map((f, k) => {
            // the quiet room's name: an editorial label in the left column, the hero to the right (the oat
            // room's words are the hook line, so its name never shows)
            if (k === 0) return null;
            const off = k - cam;
            const o = label * Math.max(0, 1 - Math.abs(off) * 2.2) * expoOut(progress(t, labelFrom, 0.4));
            if (o < 0.01) return null;
            return (
              <div key={`qlabel-${f.key}`} style={{ position: "absolute", left: cx + off * RW - 0.66 * H, top: cy - 0.1 * H, opacity: o, fontFamily: GEIST, fontWeight: 500 }}>
                <div style={{ fontSize: 0.019 * H, letterSpacing: "0.16em", color: "#8A8A86", textTransform: "uppercase" }}>{`${String(k + 1).padStart(2, "0")} / 06`}</div>
                <div style={{ fontSize: 0.068 * H, letterSpacing: "-0.04em", lineHeight: 1.04, color: INK, marginTop: 0.012 * H }}>{f.name}</div>
              </div>
            );
          })
        : null}
      {(quiet ? [] : fams).map((f, k) => {
        const off = k - cam;
        const o = label * Math.max(0, 1 - Math.abs(off) * 2.2);
        if (o < 0.01) return null;
        return (
          <div
            key={`label-${f.key}`}
            style={{
              position: "absolute",
              left: cx + off * RW - 0.66 * H,
              top: cy + 0.385 * H,
              opacity: o,
              display: "flex",
              alignItems: "baseline",
              gap: 0.018 * H,
              fontFamily: GEIST,
              fontWeight: 500,
              color: f.light ? "rgba(255,255,255,0.92)" : "rgba(24,24,24,0.86)",
            }}
          >
            <span style={{ fontSize: 0.02 * H, letterSpacing: "0.12em", opacity: 0.7 }}>{String(k + 1).padStart(2, "0")}</span>
            <span style={{ fontSize: 0.034 * H, letterSpacing: "-0.02em" }}>{f.name}</span>
          </div>
        );
      })}
    </>
  );
};

/** Where tile k (0 = cream, top left … 5 = black, bottom right) sits in the finale, in px. */
const tileRect = (k: number, W: number, H: number) => {
  const cx = W / 2;
  const cy = H / 2;
  const w = 0.21 * H;
  const h = 0.25 * H;
  const gap = 0.025 * H;
  const col = k % 3;
  const row = Math.floor(k / 3);
  const x = cx - 0.63 * H + col * (w + gap);
  const y = cy - 0.235 * H + row * (h + gap);
  return { x, y, w, h, r: 0.028 * H };
};

/** Room k drawn as tile k: the whole frame at camera k, scaled into the tile and clipped to it. u = 0 is
 *  the full frame, 1 the tile; dx slides it (the fly in and out). */
const RoomTile: React.FC<{ W: number; H: number; k: number; u: number; fams: Family[]; quiet?: boolean; dx?: number; opacity?: number }> = ({ W, H, k, u, fams, quiet = false, dx = 0, opacity = 1 }) => {
  const r = tileRect(k, W, H);
  const s = mix(1, r.h / H, u);
  const tx = mix(0, r.x + r.w / 2 - (r.h / H) * (W / 2), u) + dx;
  const ty = mix(0, r.y + r.h / 2 - (r.h / H) * (H / 2), u);
  // the clip, in the layer's own px (before the scale): the tile's width at the tile's scale
  const insetX = u * Math.max(0, (W - r.w / (r.h / H)) / 2);
  const radius = (u * r.r) / s;
  if (opacity < 0.002) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: W,
        height: H,
        transformOrigin: "0 0",
        transform: u === 0 && dx === 0 ? undefined : `translate(${tx.toFixed(3)}px, ${ty.toFixed(3)}px) scale(${s.toFixed(5)})`,
        clipPath: u === 0 ? undefined : `inset(0px ${insetX.toFixed(2)}px round ${radius.toFixed(2)}px)`,
        opacity,
        boxShadow: u > 0.5 ? `0 ${0.02 * H}px ${0.05 * H}px rgba(20,18,16,${(quiet ? 0.09 : 0.16) * u})` : undefined,
      }}
    >
      {/* a tile never carries its room's name (the quiet room's name waits for its hook, so the loop stays exact) */}
      <World W={W} H={H} cam={k} fams={fams} quiet={quiet} sides={1 - expoOut(Math.min(1, u * 1.6))} label={1 - Math.min(1, u * 2)} centre={u} labelFrom={quiet ? 1e9 : -1} />
    </div>
  );
};

const Rooms: React.FC<{ W: number; H: number; quiet: boolean }> = ({ W, H, quiet }) => {
  const fams = quiet ? QUIET : FAMILIES;
  const t = useT();
  const cx = W / 2;
  const cy = H / 2;
  const R = ROOMS;
  const cam = track(t, 0, R.moves.map((m, i) => ({ t: m, v: i + 1, spring: TRUCK })), TRUCK);
  // the black room shrinking into tile 6; tiles 1–5 flying in beside it
  const shrink = expoInOut(progress(t, R.gather, 0.8));
  // back: tiles 2–6 leave (right to left), the cream tile opens into the room
  const open = expoInOut(progress(t, R.open, R.openDur));
  const inFinale = t >= R.gather;
  const phoneO = expoOut(progress(t, R.phone, 0.7)) * (1 - expoOut(progress(t, R.back, 0.45)));
  const color = quiet ? PHONE.quiet : PHONE.d1Bold;
  const pw = phoneW(H, 0.84, color);
  const lightInk = mix(fams[Math.floor(cam)].light ? 1 : 0, fams[Math.min(5, Math.ceil(cam))].light ? 1 : 0, cam - Math.floor(cam));
  return (
    <>
      {!inFinale ? (
        <World W={W} H={H} cam={cam} fams={fams} quiet={quiet} labelFrom={quiet ? R.hookOut + 0.25 : -1} />
      ) : (
        <>
          {[0, 1, 2, 3, 4, 5].map((k) => {
            if (k === 5) {
              // the room itself, shrinking into its tile; later it leaves first
              const out = spring(t - R.back, "panel");
              const o = 1 - expoOut(progress(t, R.back + 0.1, 0.35));
              return <RoomTile key={k} W={W} H={H} k={5} fams={fams} quiet={quiet} u={shrink} dx={-out * 1.6 * H} opacity={o} />;
            }
            if (k === 0) {
              const inn = spring(t - (R.gather + 0.12), "piece");
              const o = expoOut(progress(t, R.gather + 0.12, 0.3));
              const fly = (1 - inn) * -1.1 * H;
              return <RoomTile key={k} W={W} H={H} k={0} fams={fams} quiet={quiet} u={t < R.open ? 1 : 1 - open} dx={t < R.open ? fly : 0} opacity={o} />;
            }
            const inn = spring(t - (R.gather + 0.12 + 0.07 * (5 - k)), "piece");
            const out = spring(t - (R.back + 0.06 * (5 - k)), "panel");
            const o = expoOut(progress(t, R.gather + 0.12 + 0.07 * (5 - k), 0.3)) * (1 - expoOut(progress(t, R.back + 0.1 + 0.06 * (5 - k), 0.35)));
            return <RoomTile key={k} W={W} H={H} k={k} fams={fams} quiet={quiet} u={1} dx={(1 - inn) * -1.1 * H - out * 1.6 * H} opacity={o} />;
          })}
        </>
      )}
      {quiet ? (
        <Line text={"Your wardrobe,\n*in every colour.*"} at={R.hook} exitAt={R.hookOut} x={cx - 0.66 * H} y={cy - 0.13 * H} size={0.068 * H} />
      ) : (
        <Line text={"Your wardrobe,\n*in every colour.*"} at={R.hook} exitAt={R.hookOut} x={cx - 0.66 * H} y={cy - 0.43 * H} size={0.062 * H} light={lightInk} />
      )}
      <Line text={"Every colour you own,\n*in one place.*"} at={R.line} exitAt={R.back} x={cx - 0.63 * H} y={cy - 0.445 * H} size={0.056 * H} />
      <Device model="iphone-17-pro-max" color={color} width={pw} x={cx + 0.44 * H} y={cy} opacity={phoneO} screen={{ id: SCREEN }} />
    </>
  );
};

// ── D2 · Colour wheel ─────────────────────────────────────────────────────────────────────────────

/** Two pieces per colour on the carousel: the room's hero and one more. */
const WHEEL_ITEMS = FAMILIES.flatMap((f, j) => [
  { id: f.items[0].id, fam: j, side: -1, h: f.items[0].h * 0.78 },
  { id: f.items[2].id, fam: j, side: 1, h: f.items[2].h * 0.9 },
]);

/** The strip (column) each wheel item stands in at the finale, in px. */
const stripRect = (j: number, W: number, H: number) => {
  const cx = W / 2;
  const cy = H / 2;
  const w = 0.104 * H;
  const gap = 0.009 * H;
  return { x: cx - 0.63 * H + j * (w + gap), y: cy - 0.235 * H, w, h: 0.56 * H, r: 0.022 * H };
};

const Wheel: React.FC<{ W: number; H: number }> = ({ W, H }) => {
  const t = useT();
  const cx = W / 2;
  const cy = H / 2;
  const Wh = WHEEL;
  // ring angle in steps of one colour (60°): springs forward at each step, then the last step at the end
  const stepV = track(t, 0, Wh.steps.map((s, i) => ({ t: s, v: i + 1, spring: STEP })), STEP) + expoInOut(progress(t, Wh.ring, Wh.ringDur));
  const rho = (stepV * Math.PI) / 3;
  const front = ((stepV % 6) + 6) % 6;
  const fa = Math.floor(front) % 6;
  const fb = (fa + 1) % 6;
  const glow = mixHex(FAMILIES[fa].glow, FAMILIES[fb].glow, front - Math.floor(front));
  // into the strips and back out, one piece after another (each lands exactly: fixed eased windows)
  const STAG = 0.035;
  const toGridOf = (i: number) => expoInOut(progress(t, Wh.gather + 0.03 * i, 0.9));
  const toRingOf = (i: number) => expoInOut(progress(t, Wh.ring + STAG * i, Wh.ringDur - STAG * (WHEEL_ITEMS.length - 1)));
  const grid = expoInOut(progress(t, Wh.gather, 0.9)) * (1 - expoInOut(progress(t, Wh.ring, Wh.ringDur)));
  const phoneO = expoOut(progress(t, Wh.phone, 0.7)) * (1 - expoOut(progress(t, Wh.back, 0.45)));
  const color = PHONE.d2Bold;
  const pw = phoneW(H, 0.84, color);
  const Rx = 0.64 * H;
  const floorY = cy + 0.34 * H;
  const glowO = 1 - 0.65 * grid;
  return (
    <>
      {/* the coloured light the carousel stands in, and its pool on the floor */}
      <div style={{ position: "absolute", left: cx - 1.05 * H, top: cy - 0.62 * H, width: 2.1 * H, height: 1.15 * H, borderRadius: "50%", opacity: glowO, background: `radial-gradient(closest-side, ${glow} 0%, ${glow.replace("rgb", "rgba").replace(")", ",0.78)")} 48%, rgba(255,255,255,0) 100%)` }} />
      <div style={{ position: "absolute", left: cx - 0.8 * H, top: floorY - 0.09 * H, width: 1.6 * H, height: 0.2 * H, borderRadius: "50%", opacity: 0.55 * glowO, background: `radial-gradient(closest-side, ${glow} 0%, rgba(255,255,255,0) 100%)` }} />
      {/* the colour strips of the finale, rising out of the floor */}
      {FAMILIES.map((f, j) => {
        const r = stripRect(j, W, H);
        const up = expoInOut(progress(t, Wh.gather + 0.05 * j, 0.7)) * (1 - expoInOut(progress(t, Wh.back + 0.04 * (5 - j), 0.6)));
        if (up < 0.002) return null;
        return (
          <div
            key={f.key}
            style={{
              position: "absolute",
              left: r.x,
              top: r.y + r.h * (1 - up),
              width: r.w,
              height: r.h * up,
              borderRadius: r.r,
              background: `linear-gradient(180deg, ${f.spot} 0%, ${f.wall} 100%)`,
              boxShadow: `0 ${0.012 * H}px ${0.03 * H}px rgba(${f.shade},0.22)`,
            }}
          />
        );
      })}
      {WHEEL_ITEMS.map((it, i) => {
        // the colour's main piece comes to the front, its partner a step behind it to the right
        const a = (it.fam * Math.PI) / 3 + (it.side > 0 ? (26 * Math.PI) / 180 : 0);
        const th = a - rho;
        const c = Math.cos(th);
        const depth = (1 + c) / 2;
        const near = Math.pow(depth, 1.4);
        const ringX = cx + Rx * Math.sin(th);
        const ringBottom = floorY - (0.02 + 0.22 * (1 - depth)) * H - 0.006 * H * breath(t, i * 1.3);
        const ringH = it.h * H * (0.4 + 0.6 * near);
        // the far side of the carousel fades out: only the front half is really there
        const ringO = Math.max(0, Math.min(1, (depth - 0.14) / 0.36));
        const r = stripRect(it.fam, W, H);
        const gx = r.x + r.w / 2;
        const gh = Math.min(0.2 * H, r.w * 0.86 / pieceAspect(it.id));
        const gBottom = it.side < 0 ? r.y + 0.29 * H : r.y + r.h - 0.035 * H;
        const gi = toGridOf(i) * (1 - toRingOf(i));
        // a small arc while flying, so the pieces read as thrown, not slid
        const arc = Math.sin(Math.PI * gi) * 0.06 * H;
        const x = mix(ringX, gx, gi);
        const bottom = mix(ringBottom, gBottom, gi) - arc;
        const h = mix(ringH, gh, gi);
        const dim = 0.42 * (1 - depth) * (1 - gi);
        const z = Math.round(100 * c * (1 - gi)) + 200 + (gi > 0.02 && gi < 0.98 ? 200 : 0);
        const o = mix(ringO, 1, gi);
        return <Garment key={it.id} id={it.id} x={x} bottom={bottom} h={h} lift={0.4 + 0.6 * (1 - depth)} floorY={gi < 0.5 ? floorY - 0.22 * H * (1 - depth) : undefined} shade={FAMILIES[it.fam].shade} dim={dim} z={z} opacity={o} />;
      })}
      {/* the front colour's name */}
      {FAMILIES.map((f, j) => {
        const d = Math.min(Math.abs(front - j), Math.abs(front - j - 6), Math.abs(front - j + 6));
        const o = Math.max(0, 1 - d * 2.2) * (1 - grid);
        if (o < 0.01) return null;
        return (
          <div key={`n-${f.key}`} style={{ position: "absolute", left: cx - 0.3 * H, width: 0.6 * H, top: cy + 0.385 * H, textAlign: "center", opacity: o, fontFamily: GEIST, fontWeight: 500, fontSize: 0.034 * H, letterSpacing: "-0.02em", color: "rgba(24,24,24,0.86)" }}>
            {f.name}
          </div>
        );
      })}
      <Line text={"Your wardrobe,\n*in every colour.*"} at={Wh.hook} exitAt={Wh.hookOut} x={cx - 0.66 * H} y={cy - 0.43 * H} size={0.062 * H} />
      <Line text={"Every colour you own,\n*in one place.*"} at={Wh.line} exitAt={Wh.back} x={cx - 0.63 * H} y={cy - 0.445 * H} size={0.056 * H} />
      <Device model="iphone-17-pro-max" color={color} width={pw} x={cx + 0.44 * H} y={cy} opacity={phoneO} screen={{ id: SCREEN }} />
    </>
  );
};


// ── D2 (quiet) · Tonal row ────────────────────────────────────────────────────────────────────────

/** A hero's arrival and its step into the row: critically damped-ish, ≈0.8 s. */
const ENTER: Spring = { zeta: 0.95, response: 0.8 };

const Row: React.FC<{ W: number; H: number }> = ({ W, H }) => {
  const t = useT();
  const cx = W / 2;
  const cy = H / 2;
  const Rw = ROW;
  const fams = QUIET;
  const floorY = cy + 0.31 * H;
  const heroX = cx + 0.2 * H;
  const slotX = (i: number) => cx - 0.62 * H + i * 0.12 * H;
  const enterX = cx + 1.6 * H;
  // the ground: the hero's room, cross-fading at each arrival; Mist in the finale
  let gIdx = 0;
  Rw.changes.forEach((c) => (gIdx += expoInOut(progress(t, c, 0.7))));
  if (t >= Rw.back) gIdx = 0; // under the Mist, it is the oat room again for the return
  const gA = Math.min(5, Math.floor(gIdx + 1e-9));
  const gB = Math.min(5, gA + 1);
  const gf = gIdx - gA;
  const mist = expoInOut(progress(t, Rw.gather, 0.8)) * (1 - expoInOut(progress(t, Rw.open, Rw.openDur)));
  const ret = expoInOut(progress(t, Rw.open, Rw.openDur));
  const phoneO = expoOut(progress(t, Rw.phone, 0.7)) * (1 - expoOut(progress(t, Rw.back, 0.45)));
  const pw = phoneW(H, 0.84, PHONE.quiet);
  const leaveAt = (i: number) => (i < 5 ? Rw.changes[i] : Rw.gather);
  return (
    <>
      <AbsoluteFill style={{ background: roomBg(fams[gA], H) }} />
      {gf > 1e-4 ? <AbsoluteFill style={{ background: roomBg(fams[gB], H), opacity: gf }} /> : null}
      {mist > 1e-4 ? (
        <AbsoluteFill style={{ opacity: mist }}>
          <Stage />
        </AbsoluteFill>
      ) : null}
      {/* the colour chips of the finale, rising behind the row */}
      {fams.map((f, i) => {
        const up = expoInOut(progress(t, Rw.gather + 0.25 + 0.05 * i, 0.6)) * (1 - expoInOut(progress(t, Rw.back + 0.04 * (5 - i), 0.5)));
        if (up < 0.002) return null;
        const w = 0.108 * H;
        const h = 0.27 * H;
        return (
          <div
            key={`chip-${f.key}`}
            style={{
              position: "absolute",
              left: slotX(i) - w / 2,
              top: floorY + 0.035 * H - h * up,
              width: w,
              height: h * up,
              borderRadius: 0.02 * H,
              // a tone deeper than the room's light, so each chip reads as its colour on the Mist stage
              background: `linear-gradient(180deg, ${f.wall} 0%, ${f.floor} 100%)`,
              boxShadow: `0 ${0.01 * H}px ${0.03 * H}px rgba(${f.shade},0.14)`,
            }}
          />
        );
      })}
      {fams.map((f, i) => {
        const it = f.items[0];
        const enter = i === 0 ? 1 : spring(t - Rw.changes[i - 1], ENTER);
        if (i > 0 && t < Rw.changes[i - 1]) return null;
        const leave = spring(t - leaveAt(i), ENTER);
        const toSlot = i === 0 ? leave * (1 - ret) : leave;
        const out = i === 0 ? 0 : expoInOut(progress(t, Rw.back + 0.05 * (5 - i), 0.5));
        const o = 1 - out;
        if (o < 0.002) return null;
        const hHero = it.h * H;
        // in the row a third of its size; on its chip (the finale) it fits the chip's width
        const chip = expoInOut(progress(t, Rw.gather + 0.25 + 0.05 * i, 0.6)) * (1 - expoInOut(progress(t, Rw.back + 0.04 * (5 - i), 0.5)));
        const hFit = Math.min(it.h * 0.3 * H, (0.108 * H * 0.8) / pieceAspect(it.id), 0.2 * H);
        const hSlot = mix(Math.min(it.h * 0.3 * H, (0.12 * H * 0.86) / pieceAspect(it.id)), hFit, chip);
        const x = mix(mix(enterX, heroX, enter), slotX(i), toSlot) - out * 0.25 * H;
        const h = mix(hHero, hSlot, toSlot);
        const lift = mix(it.lift, 0.012, toSlot) + 0.006 * breath(t, i * 1.9) * (1 - toSlot);
        // on its chip it stands a little above the chip's foot
        const bottom = floorY - lift * H - chip * toSlot * 0.04 * H;
        // standing on its chip it casts nothing on the floor (the chip is its ground)
        const onChip = chip * toSlot > 0.35;
        return <Garment key={it.id} id={it.id} x={x} bottom={bottom} h={h} lift={lift * 6} floorY={onChip ? undefined : floorY} shade={f.shade} opacity={o} cast={!onChip} z={10 + i} />;
      })}
      {/* the hero's colour, in the left column */}
      {fams.map((f, k) => {
        if (k === 0) return null; // the oat knit's words are the hook line
        const d = Math.abs(gIdx - k);
        const o = Math.max(0, 1 - d * 2.2) * expoOut(progress(t, Rw.labelFrom, 0.4)) * (1 - expoOut(progress(t, Rw.gather - 0.2, 0.35)));
        if (o < 0.01 || t >= Rw.back) return null;
        return (
          <div key={`rl-${f.key}`} style={{ position: "absolute", left: cx - 0.66 * H, top: cy - 0.22 * H, opacity: o, fontFamily: GEIST, fontWeight: 500 }}>
            <div style={{ fontSize: 0.019 * H, letterSpacing: "0.16em", color: "#8A8A86", textTransform: "uppercase" }}>{`${String(k + 1).padStart(2, "0")} / 06`}</div>
            <div style={{ fontSize: 0.068 * H, letterSpacing: "-0.04em", lineHeight: 1.04, color: INK, marginTop: 0.012 * H }}>{f.name}</div>
          </div>
        );
      })}
      <Line text={"Your wardrobe,\n*in every colour.*"} at={Rw.hook} exitAt={Rw.hookOut} x={cx - 0.66 * H} y={cy - 0.22 * H} size={0.068 * H} />
      <Line text={"Every colour you own,\n*in one place.*"} at={Rw.line} exitAt={Rw.back} x={cx - 0.63 * H} y={cy - 0.445 * H} size={0.056 * H} />
      <Device model="iphone-17-pro-max" color={PHONE.quiet} width={pw} x={cx + 0.44 * H} y={cy} opacity={phoneO} screen={{ id: SCREEN }} />
    </>
  );
};

/** The fast moves, per film (seconds): the dolly, the shrink into tiles, the tiles flying, the carousel's
 *  steps, the ring opening and closing. Sub-frame samples there, one elsewhere. */
const ROOMS_FAST: [number, number][] = [...ROOMS.moves.map((m) => [m, m + 0.75] as [number, number]), [ROOMS.gather, ROOMS.gather + 1.0], [ROOMS.back, ROOMS.open + ROOMS.openDur]];
const FAST: Record<(typeof FILMS)[number], [number, number][]> = {
  d1: ROOMS_FAST,
  "d1-bold": ROOMS_FAST,
  d2: [...ROW.changes.map((c) => [c, c + 0.9] as [number, number]), [ROW.gather, ROW.gather + 1.0], [ROW.back, ROW.open + ROW.openDur]],
  "d2-bold": [...WHEEL.steps.map((s) => [s, s + 0.65] as [number, number]), [WHEEL.gather, WHEEL.gather + 1.0], [WHEEL.back, WHEEL.ring + WHEEL.ringDur]],
};

export const AppStoreHeaderColour: React.FC<z.infer<typeof schema>> = ({ film }) => {
  useBrandFonts();
  const { fps, width: W, height: H } = useVideoConfig();
  const fast = (f: number) => FAST[film].some(([a, b]) => f / fps >= a && f / fps <= b);
  return (
    <AbsoluteFill style={{ background: "#F6F6F6", color: INK, overflow: "hidden" }}>
      {/* every sample is opaque (the stage is inside it), so averaging them is exact */}
      <SubframeBlur samples={(f) => (fast(f) ? Math.round(6 * (H / 1646)) + 2 : 1)} shutter={0.35}>
        <Stage />
        {film === "d1" ? <Rooms W={W} H={H} quiet /> : film === "d1-bold" ? <Rooms W={W} H={H} quiet={false} /> : film === "d2" ? <Row W={W} H={H} /> : <Wheel W={W} H={H} />}
        <Grain amount={0.022} />
        <Vignette strength={film === "d1-bold" ? 0.2 : film === "d2-bold" ? 0.12 : 0.08} />
      </SubframeBlur>
    </AbsoluteFill>
  );
};
