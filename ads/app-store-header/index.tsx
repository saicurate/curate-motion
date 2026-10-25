import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { FormatId } from "../../schemas/ad";
import { ContactShadow, Device, deviceLayout, frameCount, frameSrc, GEIST, Grain, noise1, pieceAspect, StableImg, src, SubframeBlur, useBrandFonts, Vignette, zeeId, type Emotion } from "../../motion";
import { expoInOut, expoOut, mix, progress, spring, track } from "../../motion/springs";
import { ROLL, TRYON, ZEE } from "./timeline";

// The iOS 27 App Store header (21:9, 3840 × 1646) and search card (3:2): three 15 s muted loops on one
// Mist stage. Every value is a function of t = frame / fps. Layout is in units of the frame's height H
// around its centre, so one scene fills both crops: what matters stays inside ±0.72 H (the 3:2 card's
// width), the header's extra width only shows more of the stage.
//
//   roll   her photos give up what she's wearing; it becomes her real wardrobe
//   tryon  the black tee flies onto her walk-to-work photo; the real try-on wipes over her
//   zee    Zee waves; his real chat plans Monday; the look rises beside him

export const FILMS = ["roll", "roll-colour", "roll-tonal", "tryon", "zee"] as const;
export const schema = z.object({ format: FormatId, length: z.number(), film: z.enum(FILMS) });
export const defaults = { film: "roll" as const };

const PHONE = { model: "iphone-17-pro-max", color: "silver" } as const;
const INK = "#181818"; // Primary Black
const BODY = "#656565"; // Winter Gray

/** The stage: a seamless studio sweep in Angora White (the wall curving into the floor) under a soft overhead
 *  light that falls off to the edges: a lit room, not a flat fill. */
export const Stage: React.FC = () => (
  <>
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #FAFAFA 0%, #F6F6F6 46%, #F0F0EF 64%, #E8E8E7 100%)" }} />
    <AbsoluteFill style={{ background: "radial-gradient(70% 95% at 50% 30%, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0) 70%)" }} />
    <AbsoluteFill style={{ background: "radial-gradient(140% 120% at 50% 40%, rgba(0,0,0,0) 55%, rgba(30,26,22,0.07) 100%)" }} />
  </>
);

/** A photo print: rounded, lit from above (an ambient and a key shadow), optionally a crop of the photo. */
const Print: React.FC<{
  id: string;
  cx: number;
  cy: number;
  h: number;
  aspect?: number;
  rot?: number;
  dim?: number;
  blur?: number;
  opacity?: number;
  crop?: { x: number; y: number; w: number; h: number; W: number; H: number };
  children?: React.ReactNode;
}> = ({ id, cx, cy, h, aspect = 0.75, rot = 0, dim = 0, blur = 0, opacity = 1, crop, children }) => {
  const w = h * aspect;
  const r = h * 0.028;
  const img = crop
    ? { left: (-crop.x * w) / crop.w, top: (-crop.y * h) / crop.h, width: (crop.W * w) / crop.w, height: (crop.H * h) / crop.h }
    : { left: 0, top: 0, width: w, height: h };
  return (
    <div
      style={{
        position: "absolute",
        left: cx - w / 2,
        top: cy - h / 2,
        width: w,
        height: h,
        borderRadius: r,
        overflow: "hidden",
        opacity,
        transform: rot ? `rotate(${rot}deg)` : undefined,
        boxShadow: `0 ${h * 0.006}px ${h * 0.018}px rgba(20,18,16,0.10), 0 ${h * 0.05}px ${h * 0.11}px rgba(20,18,16,0.16)`,
        filter: blur > 0.05 || dim > 0.005 ? `${blur > 0.05 ? `blur(${blur.toFixed(2)}px) ` : ""}brightness(${(1 - dim).toFixed(3)})` : undefined,
      }}
    >
      <StableImg src={src(id)} style={{ position: "absolute", ...img }} />
      {children}
    </div>
  );
};

/** A garment cut-out, floating: a soft shadow under it on the stage, its own drop shadow. */
const Floating: React.FC<{ id: string; cx: number; cy: number; h: number; aspect: number; lift?: number; opacity?: number; rot?: number; ground?: number }> = ({
  id,
  cx,
  cy,
  h,
  aspect,
  lift = 1,
  opacity = 1,
  rot = 0,
  ground,
}) => {
  const w = h * aspect;
  return (
    <>
      {ground !== undefined && opacity > 0.01 ? <ContactShadow x={cx} y={ground} w={w * 0.9} squash={0.16} opacity={0.32 * opacity} lift={Math.min(1, lift)} /> : null}
      <div
        style={{
          position: "absolute",
          left: cx - w / 2,
          top: cy - h / 2,
          width: w,
          height: h,
          opacity,
          transform: rot ? `rotate(${rot}deg)` : undefined,
          filter: `drop-shadow(0 ${h * (0.01 + 0.02 * lift)}px ${h * (0.016 + 0.03 * lift)}px rgba(20,18,16,${0.14 + 0.08 * lift}))`,
        }}
      >
        <StableImg src={src(id, "cutout")} style={{ position: "absolute", inset: 0, width: w, height: h }} />
      </div>
    </>
  );
};

/** Zee from his 30 fps clips at any frame rate: the intro, then the loop (or the outro back to rest). */
const zeeAt = (t: number, cues: { at: number; emo: Emotion; part?: "intro" | "outro" }[]) => {
  const c = [...cues].filter((x) => x.at <= t).pop() ?? cues[0];
  const n = Math.max(0, Math.floor((t - c.at) * 30));
  if (c.part === "outro") {
    const id = zeeId(c.emo, "outro");
    return frameSrc(id, Math.min(n, frameCount(id) - 1));
  }
  const intro = zeeId(c.emo, "intro");
  if (c.part === "intro" && n < frameCount(intro)) return frameSrc(intro, n);
  const loop = zeeId(c.emo, "loop");
  const k = c.part === "intro" ? n - frameCount(intro) : n;
  return frameSrc(loop, k % frameCount(loop));
};

/** The phone, by its visible height: a whole iPhone bezel, straight on (Apple's rules: x, y, scale, opacity only). */
const phoneW = (H: number, hFrac: number) => {
  const l = deviceLayout({ ...PHONE, width: 100 });
  return ((hFrac * H) / l.body.h) * 100;
};

/** The brand's two-tone line (motion/KeyLine's look and motion: Geist Medium, `*key*` in #181818 over
 *  #656565, words rising out of masks on the `headline` spring), without KeyLine's will-change: on these
 *  big frames (large blurred prints) a GPU layer per word made Chrome drop words now and then. */
export const Line: React.FC<{ text: string; at: number; exitAt?: number; x: number; y: number; size: number; align?: "left" | "center"; width?: number; keyColor?: string; bodyColor?: string }> = ({ text, at, exitAt, x, y, size, align = "left", width, keyColor = INK, bodyColor = BODY }) => {
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
                <span style={{ display: "inline-block", transform: Math.abs(yy) < 1e-4 ? undefined : `translateY(${(yy * 100).toFixed(3)}%)`, color: wd.key ? keyColor : bodyColor }}>{wd.w}</span>
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};

// ── A · roll ──────────────────────────────────────────────────────────────────────────────────────
// Three of her photos; from each, what she's wearing in it lifts off (centre first), the photos fall back
// and leave, the pieces gather into a row, her real wardrobe fades up on the phone. Then the reverse.
const ROLL_PRINTS = [
  { photo: "photo.emma.r12-dumbo-walk.v1", piece: "garment.emma.coat-wool-camel.v3", x: -0.02, h: 0.72, rot: -1.2, z: 0, at: { fx: 0.53, fy: 0.56, fh: 0.56 }, row: { x: -0.56, h: 0.52 } },
  { photo: "photo.emma.r26-ferry.v1", piece: "garment.emma.jacket-denim.v3", x: -0.6, h: 0.58, rot: 2.6, z: 1, at: { fx: 0.5, fy: 0.79, fh: 0.48 }, row: { x: -0.29, h: 0.42 } },
  { photo: "photo.emma.r04-park-autumn.v1", piece: "garment.emma.scarf-plaid-camel.v2", x: 0.58, h: 0.58, rot: -2.4, z: 1, at: { fx: 0.5, fy: 0.68, fh: 0.33 }, row: { x: -0.06, h: 0.34 } },
] as const;

// A2's colour blocking: each photo's own colour (sampled from it, deepened into a lit campaign field):
// the ferry's sky blue, DUMBO's brick, the park's autumn orange; and a warm cream for the phone.
const FIELD = { blue: "#4F7FC9", brick: "#9C4A36", orange: "#C2702A", cream: "#F2ECE3" } as const;
const lit = (c: string) =>
  `radial-gradient(120% 95% at 50% 16%, color-mix(in srgb, ${c} 74%, white) 0%, ${c} 52%, color-mix(in srgb, ${c} 78%, black) 100%)`;

/** The colour fields: three panels behind the three photos (blue | brick | orange), sliding as the photos
 *  leave so each piece ends on its own colour, and a cream panel arriving from the right for the phone.
 *  Boundaries in H around the centre: photos [−0.31, 0.29] → row [−0.47, −0.17, 0.13]. */
const Fields: React.FC<{ W: number; H: number; u: number; zoom: number }> = ({ W, H, u, zoom }) => {
  const cx = W / 2;
  const b1 = cx + mix(-0.31, -0.47, u) * H;
  const b2 = cx + mix(0.29, -0.17, u) * H;
  const b3 = cx + mix(1.3, 0.13, u) * H;
  const panel = (l: number, r: number, c: string) => (
    <div style={{ position: "absolute", top: 0, bottom: 0, left: l, width: Math.max(0, r - l), background: lit(c) }} />
  );
  return (
    <div style={{ position: "absolute", inset: 0, transformOrigin: `${cx}px ${H / 2}px`, transform: `scale(${zoom})` }}>
      {panel(-0.5 * W, b1, FIELD.blue)}
      {panel(b1, b2, FIELD.brick)}
      {panel(b2, b3, FIELD.orange)}
      {panel(b3, 1.5 * W, FIELD.cream)}
    </div>
  );
};

// A2 (founder 2026-10-24, "subtle colours"): one tonal ground at a time, each photo's own colour pushed close
// to Mist (Essembl's grammar: a warm off-white, colour only from the clothes): DUMBO's brick → blush stone,
// the ferry's sky → dusty blue, the park's autumn → oat; sand-cream under the phone. It warms to the tone of
// the photo whose piece is lifting, one hero at a time, and goes back to Mist for the loop.
const TONE = { mist: "#F4F3F0", blush: "#ECDFD7", blue: "#DDE5EC", oat: "#EFE5D3", sand: "#F3EDE3" } as const;
/** The lifts for A2: one hero at a time, ≈1.3 s apart (A1 keeps ROLL.lift). */
const TONAL_LIFT = [1.2, 2.5, 3.8] as const;

/** A's moments (s): A1 runs ROLL, A2 the same with TONAL_LIFT; the combined header film
 *  (ads/app-store-header-all) runs its own, faster cut through the same picture. */
export type RollTimes = { hook: number; lift: readonly number[]; gather: number; phone: number; line: number; back: number; settle: number };
const A2_TIMES: RollTimes = { ...ROLL, lift: TONAL_LIFT };

const hex = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
const mixHex = (a: string, b: string, u: number) => {
  const [x, y] = [hex(a), hex(b)];
  return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * u)).join(",")})`;
};

/** The tonal ground at t: Mist → blush (coat) → blue (jacket) → oat (scarf) → sand (the row and the phone) → Mist. */
const toneAt = (t: number, tm: RollTimes) => {
  const keys: [number, string][] = [
    [0, TONE.mist], [tm.lift[0], TONE.blush], [tm.lift[1], TONE.blue], [tm.lift[2], TONE.oat],
    [tm.gather, TONE.sand], [tm.back + 0.2, TONE.mist],
  ];
  let c = keys[0][1];
  for (let i = 1; i < keys.length; i++) c = mixHex(c.startsWith("#") ? c : rgbHex(c), keys[i][1], expoInOut(progress(t, keys[i][0], 0.7)));
  return c;
};
const rgbHex = (rgb: string) => "#" + rgb.replace(/[^\d,]/g, "").split(",").map((v) => Number(v).toString(16).padStart(2, "0")).join("");

const Tonal: React.FC<{ t: number; tm: RollTimes }> = ({ t, tm }) => {
  const c = rgbHex(toneAt(t, tm));
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(85% 120% at 50% 22%, color-mix(in srgb, ${c} 55%, white) 0%, ${c} 58%, color-mix(in srgb, ${c} 92%, #5a4a3c) 100%)`,
      }}
    />
  );
};

const Roll: React.FC<{ W: number; H: number; colour?: boolean; tonal?: boolean; tm?: RollTimes }> = ({ W, H, colour = false, tonal = false, tm = tonal ? A2_TIMES : ROLL }) => {
  const t = useT();
  const cx = W / 2;
  const cy = H / 2;
  // the camera: a slow push in, eased back out before the loop point
  const zoom = Math.exp(track(t, 0, [{ t: 0.05, v: Math.log(1.035), spring: "camera" }, { t: tm.gather, v: 0, spring: "camera" }]));
  const gone = expoInOut(progress(t, tm.gather, 0.55)) * (1 - expoInOut(progress(t, tm.back - 0.05, 0.6)));
  const rack = expoInOut(progress(t, tm.lift[0], 0.9)) * (1 - expoInOut(progress(t, tm.settle - 0.9, 0.6)));
  const phoneO = expoOut(progress(t, tm.phone, 0.7)) * (1 - expoOut(progress(t, tm.back, 0.45)));
  const ph = 0.86;
  const pw = phoneW(H, ph);
  // the prints sit a little low, so the hook line has the top of the frame
  const PY = 0.075 * H;
  // A2 puts each piece on its own colour: blue (jacket), brick (coat), orange (scarf), left to right
  const rowAt = (i: number) => (colour ? [-0.32, -0.62, -0.02][i] : ROLL_PRINTS[i].row.x);
  const onColour = colour ? { keyColor: "#FFFFFF", bodyColor: "rgba(255,255,255,0.74)" } : {};
  // A2: the photo whose piece lifted last is the hero; the others step further back
  const hero = tm.lift.reduce((h, at, i) => (t >= at ? i : h), -1);
  return (
    <>
      {colour ? <Fields W={W} H={H} u={gone} zoom={zoom} /> : null}
      {tonal ? <Tonal t={t} tm={tm} /> : null}
      <div style={{ position: "absolute", inset: 0, transformOrigin: `${cx}px ${cy}px`, transform: `scale(${zoom})` }}>
        {ROLL_PRINTS.map((p, i) => {
          const side = p.x < -0.1 ? -1 : p.x > 0.1 ? 1 : 0;
          const ox = side * 0.42 * H * gone;
          const oy = side === 0 ? 0.05 * H * gone : 0;
          const pcx = cx + p.x * H + ox;
          const pcy = cy + PY + oy;
          return (
            // sharp photos: the lifted pieces read in front by dimming and a small step back, never by blur
            <Print key={p.photo} id={p.photo} cx={pcx} cy={pcy} h={p.h * H * (1 - 0.06 * gone) * (1 - 0.035 * rack)} rot={p.rot} dim={tonal ? (0.12 + (i === hero ? 0 : 0.2)) * rack : 0.32 * rack + 0.03 * p.z} opacity={1 - gone} />
          );
        })}
        {ROLL_PRINTS.map((p, i) => {
          const a = tm.lift[i];
          // in the photo → lifted toward the camera → (gather) into the row → (back) into the photo again
          const lifted = spring(t - a, "piece");
          const toRow = spring(t - (tm.gather + 0.08 * i), "piece");
          const fromRow = spring(t - (tm.back + 0.3 + 0.06 * i), "piece");
          const u = toRow - fromRow; // 0 at the photo, 1 in the row
          const ph0 = p.h * H;
          const pw0 = ph0 * 0.75;
          const inX = cx + p.x * H + (p.at.fx - 0.5) * pw0;
          const inY = cy + PY + (p.at.fy - 0.5) * ph0;
          const inH = p.at.fh * ph0;
          const rowX = cx + rowAt(i) * H;
          const rowY = cy + 0.14 * H;
          const rowH = p.row.h * H;
          const liftY = -0.05 * H * lifted * (1 - u);
          const x = mix(inX, rowX, u);
          const y = mix(inY + liftY, rowY, u);
          const h = mix(inH * (1 + 0.16 * lifted), rowH, u);
          // melts back into its photo (a slow exponential, never a pop), done ≈0.6 s before the loop point
          const show = Math.min(expoOut(progress(t, a, 0.22)), 1 - expoInOut(progress(t, tm.settle + 0.08 * i, 0.55)));
          const asp = pieceAspect(p.piece);
          return <Floating key={p.piece} id={p.piece} cx={x} cy={y} h={h} aspect={asp} lift={lifted * (1 - 0.5 * u)} opacity={show} ground={u > 0.02 ? rowY + rowH * 0.53 : undefined} />;
        })}
      </div>
      <Grain amount={0.03} />
      <Vignette strength={0.14} />
      <Line text={"Your closet is *already in your photos.*"} at={tm.hook} exitAt={tm.gather - 0.25} x={cx - 0.72 * H} y={cy - 0.445 * H} size={0.06 * H} width={1.44 * H} align="center" {...onColour} />
      <Line text={"Every item you own,\n*from your photos.*"} at={tm.line} exitAt={tm.back} x={cx - 0.72 * H} y={cy - 0.4 * H} size={0.066 * H} {...onColour} />
      <Device {...PHONE} width={pw} x={cx + 0.42 * H} y={cy} opacity={phoneO} screen={{ id: "screenshot.emma.b284-wardrobe-rails.v1" }} />
    </>
  );
};

// ── B · tryon ─────────────────────────────────────────────────────────────────────────────────────
// Her walk-to-work photo, the black tee floating beside it; the tee flies into the photo and Studio's
// real try-on wipes down over her (same street, same bag, the striped tee now black); the photo glides
// left and the phone shows Studio with that try-on. Then back.
const R30 = "photo.emma.r30-walk-to-work.v1";
const R30_TRYON = "tryon.emma.r30-tee-black.v1";
const R30_CROP = { x: 64, y: 116, w: 1664, h: 2080, W: 1792, H: 2400 }; // measured: the try-on is exactly this crop of her photo
const TEE = "garment.emma.tee-black.v1";

const TryOn: React.FC<{ W: number; H: number }> = ({ W, H }) => {
  const t = useT();
  const cx = W / 2;
  const cy = H / 2;
  const T = TRYON;
  // the photo: beside the tee → centre stage for the reveal → left of the phone → centre → back beside the tee
  const photoX =
    cx +
    track(t, -0.3, [
      { t: T.fly + 0.3, v: 0, spring: "camera" },
      { t: T.slide, v: -0.5, spring: "panel" },
      { t: T.back, v: 0, spring: "panel" },
      { t: T.teeBack - 0.5, v: -0.3, spring: "camera" },
    ]) *
      H;
  const photoH = 0.86 * H;
  const photoW = photoH * 0.8;
  const zoom = Math.exp(track(t, 0, [{ t: T.fly - 0.3, v: Math.log(1.03), spring: "camera" }, { t: T.slide, v: 0, spring: "camera" }]));
  // the sweep: 0 = before, 1 = after
  const s = expoInOut(progress(t, T.sweep, T.sweepDur)) * (1 - expoInOut(progress(t, T.unsweep, 1.0)));
  const sweeping = (t > T.sweep && t < T.sweep + T.sweepDur) || (t > T.unsweep && t < T.unsweep + 1.0);
  // the tee: hovering beside the photo → flies to her torso and goes in → floats back in for the loop
  const fly = spring(t - T.fly, { zeta: 1, response: 0.55 });
  const teeIn = 1 - expoOut(progress(t, T.fly + 0.5, 0.16));
  const teeBack = expoOut(progress(t, T.teeBack, 0.6));
  const hover = noise1(7, t * 0.35) * 0.008 * H;
  const restX = cx + 0.36 * H;
  const restY = cy + 0.1 * H + hover;
  // her chest in the photo (measured on the crop: 0.47 across, 0.43 down)
  const torsoX = photoX + (0.47 - 0.5) * photoW;
  const torsoY = cy + (0.43 - 0.5) * photoH;
  const teeX = mix(restX, torsoX, fly * (1 - teeBack));
  const teeY = mix(restY, torsoY, fly * (1 - teeBack));
  const teeH = mix(0.42 * H, 0.17 * H, fly * (1 - teeBack));
  const teeO = t < T.teeBack ? teeIn : teeBack;
  const phoneO = expoOut(progress(t, T.slide + 0.15, 0.7)) * (1 - expoOut(progress(t, T.back, 0.45)));
  const pw = phoneW(H, 0.86);
  return (
    <>
      <div style={{ position: "absolute", inset: 0, transformOrigin: `${cx}px ${cy}px`, transform: `scale(${zoom})` }}>
        <Print id={R30} cx={photoX} cy={cy} h={photoH} aspect={0.8} crop={R30_CROP}>
          <div style={{ position: "absolute", inset: 0, clipPath: `inset(0 0 ${((1 - s) * 100).toFixed(3)}% 0)` }}>
            <StableImg src={src(R30_TRYON)} style={{ position: "absolute", inset: 0, width: photoW, height: photoH }} />
          </div>
          {sweeping ? (
            <div
              style={{
                position: "absolute",
                left: 0,
                width: photoW,
                top: s * photoH - 0.07 * photoH,
                height: 0.14 * photoH,
                background: "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.35) 38%, rgba(255,255,255,0.85) 50%, rgba(255,255,255,0.35) 62%, rgba(255,255,255,0) 100%)",
                mixBlendMode: "screen",
              }}
            />
          ) : null}
        </Print>
        <Floating id={TEE} cx={teeX} cy={teeY} h={teeH} aspect={pieceAspect(TEE)} lift={1 - fly * 0.6} opacity={teeO} ground={fly < 0.3 ? cy + 0.34 * H : undefined} />
      </div>
      <Grain amount={0.03} />
      <Vignette strength={0.14} />
      <Line text={"See it\n*on you.*"} at={T.line1} exitAt={T.fly - 0.2} x={cx + 0.12 * H} y={cy - 0.4 * H} size={0.075 * H} />
      <Line text={"Before you\n*wear it.*"} at={T.line2} exitAt={T.back} x={cx - 0.15 * H} y={cy - 0.1 * H} size={0.058 * H} width={0.34 * H} align="center" />
      <Device {...PHONE} width={pw} x={cx + 0.42 * H} y={cy} opacity={phoneO} screen={{ id: "screenshot.emma.nl-studio-tryon.v1" }} />
    </>
  );
};

// ── C · zee ───────────────────────────────────────────────────────────────────────────────────────
// Zee in a pool of light waves hello; his real chat plans her Monday on the phone; the look he named
// (her camel coat, black tee, black trousers) rises between them. Then he waves again, ending at rest.
const LOOK = [
  { id: "garment.emma.coat-wool-camel.v1", dx: -0.03, dy: -0.01, h: 0.52, rot: -3 },
  { id: "garment.emma.tee-black.v1", dx: 0.1, dy: -0.15, h: 0.24, rot: 4 },
  { id: "garment.emma.trousers-black.v1", dx: 0.11, dy: 0.13, h: 0.37, rot: 2 },
] as const;

const Zee: React.FC<{ W: number; H: number }> = ({ W, H }) => {
  const t = useT();
  const cx = W / 2;
  const cy = H / 2;
  const T = ZEE;
  const size = 0.74 * H;
  const zx = cx - 0.44 * H;
  const floor = cy + 0.36 * H;
  const frame = zeeAt(t, [
    { at: 0, emo: "hello", part: "intro" },
    { at: T.listen, emo: "listening" },
    { at: T.happy, emo: "happy" },
    { at: T.hello2, emo: "hello", part: "intro" },
    { at: 15 - frameCount(zeeId("hello", "outro")) / 30, emo: "hello", part: "outro" },
  ]);
  const phoneO = expoOut(progress(t, T.phone, 0.7)) * (1 - expoOut(progress(t, T.back, 0.45)));
  const pw = phoneW(H, 0.86);
  const zoom = Math.exp(track(t, 0, [{ t: 0.05, v: Math.log(1.03), spring: "camera" }, { t: T.back, v: 0, spring: "camera" }]));
  return (
    <>
      <div style={{ position: "absolute", inset: 0, transformOrigin: `${cx}px ${cy}px`, transform: `scale(${zoom})` }}>
        {/* the pool of light he stands in */}
        <div style={{ position: "absolute", left: zx - 0.55 * H, top: floor - 0.16 * H, width: 1.1 * H, height: 0.32 * H, borderRadius: "50%", background: "radial-gradient(closest-side, rgba(255,255,255,0.9), rgba(255,255,255,0))" }} />
        <ContactShadow x={zx} y={floor} w={size * 0.42} squash={0.2} opacity={0.42} />
        <StableImg src={frame} style={{ position: "absolute", left: zx - size / 2, top: floor - size * 0.9, width: size, height: size }} />
        {LOOK.map((p, i) => {
          const up = spring(t - (T.look + 0.18 * i), "piece") - spring(t - (T.back + 0.1 * i), "piece");
          const o = expoOut(progress(t, T.look + 0.18 * i, 0.3)) * (1 - expoOut(progress(t, T.back + 0.1 * i, 0.35)));
          const x = cx + (0.0 + p.dx) * H;
          const y = cy + (p.dy + 0.06 * (1 - up)) * H;
          return <Floating key={p.id} id={p.id} cx={x} cy={y} h={p.h * H} aspect={pieceAspect(p.id)} rot={p.rot} lift={0.6} opacity={o} />;
        })}
      </div>
      <Grain amount={0.03} />
      <Vignette strength={0.14} />
      <Line text={"Your stylist\n*knows your closet.*"} at={T.line1} exitAt={T.phone - 0.3} x={cx - 0.1 * H} y={cy - 0.3 * H} size={0.074 * H} />
      <Device {...PHONE} width={pw} x={cx + 0.44 * H} y={cy} opacity={phoneO} screen={{ id: "screenshot.emma.nl-chat-monday.v1" }} />
    </>
  );
};

/** Seconds, from the (possibly sub-frame, inside SubframeBlur) current frame. */
/** A's picture for other compositions (the combined header film): the stage and the roll at the given
 *  moments, on the frame the caller sets (wrap it in a Freeze to place it in time). */
export const RollScene: React.FC<{ W: number; H: number; tm: RollTimes }> = ({ W, H, tm }) => (
  <>
    <Stage />
    <Roll W={W} H={H} tonal tm={tm} />
  </>
);

const useT = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return frame / fps;
};

/** The fast moves, per film (seconds): pieces gathering and returning, the tee flying in, the photo sliding
 *  for the phone. Sub-frame samples there (≈ the speed × shutter / 3 px at the header's size), one elsewhere. */
const FAST: Record<(typeof FILMS)[number], [number, number][]> = {
  roll: [[ROLL.gather, ROLL.gather + 1.0], [ROLL.back + 0.4, ROLL.back + 1.4]],
  "roll-colour": [[ROLL.gather, ROLL.gather + 1.0], [ROLL.back + 0.4, ROLL.back + 1.4]],
  "roll-tonal": [[ROLL.gather, ROLL.gather + 1.0], [ROLL.back + 0.4, ROLL.back + 1.4]],
  tryon: [[TRYON.fly, TRYON.fly + 0.7], [TRYON.slide, TRYON.slide + 0.7], [TRYON.back, TRYON.back + 0.7]],
  zee: [[ZEE.look, ZEE.look + 0.9], [ZEE.back, ZEE.back + 0.7]],
};

export const AppStoreHeader: React.FC<z.infer<typeof schema>> = ({ film }) => {
  useBrandFonts();
  const { fps, width: W, height: H } = useVideoConfig();
  const fast = (f: number) => FAST[film].some(([a, b]) => f / fps >= a && f / fps <= b);
  return (
    <AbsoluteFill style={{ background: "#F6F6F6", color: INK, overflow: "hidden" }}>
      {/* the stage is inside every sample: each sub-frame is opaque, so averaging them is exact (a
          transparent sample would stack the vignette and grain once per sample and grey the room) */}
      <SubframeBlur samples={(f) => (fast(f) ? Math.round(6 * (H / 1646)) + 2 : 1)} shutter={0.35}>
        <Stage />
        {film === "roll" || film === "roll-colour" || film === "roll-tonal" ? <Roll W={W} H={H} colour={film === "roll-colour"} tonal={film === "roll-tonal"} /> : film === "tryon" ? <TryOn W={W} H={H} /> : <Zee W={W} H={H} />}
      </SubframeBlur>
    </AbsoluteFill>
  );
};
