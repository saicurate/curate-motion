import React from "react";
import { AbsoluteFill, Freeze, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { FormatId } from "../../schemas/ad";
import { GEIST, Grain, samplesFor, StableImg, src, SubframeBlur, useBrandFonts, Vignette } from "../../motion";
import { mix, spring } from "../../motion/springs";
import { Line, RollScene, Stage } from "../app-store-header";
import { AppStoreHeaderTryOn } from "../app-store-header-tryon";
import { AppStoreHeaderWeek } from "../app-store-header-week";
import { A, B0, C0, C_CLEAR, C_EASE, C_HOLD, GLIDE, GLIDE_DUR, LOCK, PAN } from "./timeline";

// The iOS 27 App Store header (21:9, 3840 × 1646) and search card (3:2, 2880 × 1920): the one film (the
// App Store takes one header video). A (her photos give up what she's wearing; her real Wardrobe) → B (the
// black tee flies onto her photo; Studio's real try-on) → C (a week of looks) → the Curate lockup → frame 0.
//
// One camera through one long studio: every beat arrives on the same slow glide to the right (the camera
// spring C's rail glides on), through a soft column of light, the next set's colour coming in with it.
// B and C are their own compositions, imported and retimed by a pure time map (a Freeze at the frame the
// map gives); A runs a faster cut of its own picture. Every value is a function of t = frame / fps.

export const schema = z.object({ format: FormatId, length: z.number() });
export const defaults = {};

const INK = "#181818";
const SHUTTER = 0.35;
/** The Curate mark (1152 px square; the mark spans 482 px of it). Never recoloured, rotated or stretched. */
const MARK = "brand.curate.splash-mark.v1";
const MARK_SPAN = 482 / 1152;

/** How far a glide has got (0 → 1): the camera spring, normalised so it lands exactly at GLIDE_DUR. */
const glideP = (t: number, at: number) => Math.min(1, spring(t - at, "camera") / spring(GLIDE_DUR, "camera"));

/** Each beat's own clock, from the film's. */
const bAt = (t: number) => t - GLIDE.ab + B0;
const cAt = (t: number) => {
  const u = t - GLIDE.bc + C0;
  // past C_EASE the clock eases out (its rate falls from 1 to 0, continuously) toward C_HOLD
  return u < C_EASE ? u : C_EASE + (C_HOLD - C_EASE) * (1 - Math.exp(-(u - C_EASE) / (C_HOLD - C_EASE)));
};

/** Where C2 draws its own small lockup, as a feathered mask (ads/app-store-header-week: its rowBox(0) and
 *  Lockup, centred under the row, 0.1 H tall, rising from 0.016 H lower), with a margin. Only the wide
 *  header has it: on the 3:2 card (W/H < 2, C's twoRows) the week is two rows and C draws no lockup. */
const weekLockupMask = (W: number, H: number): React.CSSProperties => {
  const g = 0.022 * H;
  const cw = Math.min((0.92 * W - 6 * g) / 7, (0.5 * H) / 1.48);
  const ch = cw * 1.48;
  const y = H / 2 - ch / 2 + 0.06 * H + ch + 0.045 * H;
  const h = 0.1 * H;
  const w = h * (670 / 742);
  const m = 0.03 * H;
  const e = 0.025 * H;
  const [l, r, top, bot] = [W / 2 - w / 2 - m, W / 2 + w / 2 + m, y - m, y + h + 0.016 * H + m];
  const band = (dir: string, a: number, b: number) =>
    `linear-gradient(${dir}, rgba(0,0,0,0) ${(a - e).toFixed(1)}px, #000 ${a.toFixed(1)}px, #000 ${b.toFixed(1)}px, rgba(0,0,0,0) ${(b + e).toFixed(1)}px)`;
  const mask = `${band("90deg", l, r)}, ${band("180deg", top, bot)}`;
  return { WebkitMaskImage: mask, maskImage: mask, WebkitMaskComposite: "source-in", maskComposite: "intersect" };
};

/** The lockup: the mark with "Curate" to its right (the brand book), the app's own line under it. */
const LockupScene: React.FC<{ W: number; H: number }> = ({ W, H }) => {
  const cx = W / 2;
  const cy = H / 2;
  const m = 0.2 * H;
  const img = m / MARK_SPAN;
  return (
    <>
      <Stage />
      <div style={{ position: "absolute", left: 0, right: 0, top: cy - 0.075 * H - m / 2, height: m, display: "flex", alignItems: "center", justifyContent: "center", gap: 0.34 * m }}>
        <div style={{ position: "relative", width: m, height: m, flex: "none" }}>
          <StableImg src={src(MARK)} style={{ position: "absolute", width: img, height: img, left: -(img - m) / 2, top: -(img - m) / 2 }} />
        </div>
        <div style={{ fontFamily: GEIST, fontWeight: 500, fontSize: 0.19 * H, lineHeight: 1, letterSpacing: "-0.04em", color: INK, paddingBottom: "0.04em" }}>Curate</div>
      </div>
      <Line text={"Try it. Style it. *Wear it.*"} at={LOCK.line} x={cx - 0.72 * H} y={cy + 0.13 * H} size={0.064 * H} width={1.44 * H} align="center" />
      <Grain amount={0.03} />
      <Vignette strength={0.12} />
    </>
  );
};

type Layer = { key: string; node: React.ReactNode; dx: number; mask?: string };

/** One beat's set, moved by the camera (dx) and, while it arrives, shown right of the light (mask, in
 *  frame coordinates: so it sits outside the move). Keyed, so a beat keeps its instance from arriving to leaving. */
const LayerView: React.FC<{ l: Layer }> = ({ l }) => (
  <AbsoluteFill style={l.mask ? { WebkitMaskImage: l.mask, maskImage: l.mask } : undefined}>
    <AbsoluteFill style={Math.abs(l.dx) > 0.01 ? { transform: `translateX(${l.dx.toFixed(2)}px)` } : undefined}>{l.node}</AbsoluteFill>
  </AbsoluteFill>
);

const Film: React.FC<{ W: number; H: number; format: z.infer<typeof FormatId> }> = ({ W, H, format }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const d = PAN * H;
  const f = 0.06 * H;

  const a = (at: number) => (
    <Freeze frame={at * fps}>
      <RollScene W={W} H={H} tm={A} />
    </Freeze>
  );
  const b = () => (
    <Freeze frame={bAt(t) * fps}>
      <AppStoreHeaderTryOn format={format} length={15} look="tonal" />
    </Freeze>
  );
  const week = (at: number) => (
    <Freeze frame={at * fps}>
      <AppStoreHeaderWeek format={format} length={15} variant="c2" tone="subtle" />
    </Freeze>
  );
  const c = () => (
    <>
      {week(cAt(t))}
      {/* C's own lockup (under the week, from C's 10.3 s) stays covered by C just after it has gone: the same
          stage, grain and shadow tails, feathered in, so the film's lockup is the only one */}
      {cAt(t) > 10.28 && W / H >= 2 ? <div style={{ position: "absolute", inset: 0, ...weekLockupMask(W, H) }}>{week(C_CLEAR)}</div> : null}
    </>
  );
  const lock = () => <LockupScene W={W} H={H} />;

  // the beats in order, each with the glide that brings it in; the last glide lands on frame 0 (A at rest)
  const beats: { key: string; node: () => React.ReactNode; from: number }[] = [
    { key: "a", node: () => a(t), from: -1 },
    { key: "b", node: b, from: GLIDE.ab },
    { key: "c", node: c, from: GLIDE.bc },
    { key: "lock", node: lock, from: GLIDE.cl },
    { key: "a0", node: () => a(0), from: GLIDE.la },
  ];
  const i = beats.reduce((k, x, n) => (t >= x.from ? n : k), 0);
  const layers: Layer[] = [];
  let p = 1;
  if (i > 0 && t < beats[i].from + GLIDE_DUR) {
    // a glide: the set we're leaving moves left, the next comes in from the right behind the light
    p = glideP(t, beats[i].from);
    const seam = mix(W + f, -f, p);
    layers.push({ key: beats[i - 1].key, node: beats[i - 1].node(), dx: -p * d });
    layers.push({
      key: beats[i].key,
      node: beats[i].node(),
      dx: (1 - p) * d,
      mask: `linear-gradient(90deg, rgba(0,0,0,0) ${(seam - f).toFixed(1)}px, #000 ${(seam + f).toFixed(1)}px)`,
    });
  } else {
    layers.push({ key: beats[i].key, node: beats[i].node(), dx: 0 });
  }
  const seam = mix(W + f, -f, p);
  const glow = p < 1 ? Math.sin(Math.PI * p) : 0;
  return (
    <>
      {/* under everything (a sliver of it may show at the frame's right edge as a glide starts) */}
      <Stage />
      {layers.map((l) => (
        <LayerView key={l.key} l={l} />
      ))}
      {glow > 0.004 ? (
        // the light the camera passes through: a soft warm column riding the seam
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: seam - 0.11 * H,
            width: 0.22 * H,
            opacity: 0.55 * glow,
            mixBlendMode: "screen",
            background: "linear-gradient(90deg, rgba(255,240,224,0) 0%, rgba(255,240,224,0.2) 40%, rgba(255,246,236,0.34) 50%, rgba(255,240,224,0.2) 60%, rgba(255,240,224,0) 100%)",
          }}
        />
      ) : null}
    </>
  );
};

export const AppStoreHeaderAll: React.FC<z.infer<typeof schema>> = ({ format }) => {
  useBrandFonts();
  const { fps, width: W, height: H } = useVideoConfig();
  // sub-frame samples on the fast moves only: A's gather (A alone on screen) and the glides' fast part.
  // B and C blur their own moves; none of them falls in a glide's fast part, so the blurs never nest.
  const samples = (fr: number) => {
    const t = fr / fps;
    if (t >= A.gather && t <= A.gather + 1.0) return Math.round(6 * (H / 1646)) + 2;
    for (const g of Object.values(GLIDE)) {
      if (t >= g && t < g + GLIDE_DUR) {
        if (t - g > 1.3) return 1;
        const dt = 1 / fps;
        const v = Math.abs(glideP(t + dt / 2, g) - glideP(t - dt / 2, g)) * PAN * H;
        return samplesFor(v, SHUTTER) + (v > 3 ? 1 : 0);
      }
    }
    return 1;
  };
  return (
    <AbsoluteFill style={{ background: "#F6F6F6", color: INK, overflow: "hidden" }}>
      {/* the stage is inside every sample: each sub-frame is opaque, so averaging them is exact */}
      <SubframeBlur samples={samples} shutter={SHUTTER}>
        <Film W={W} H={H} format={format} />
      </SubframeBlur>
    </AbsoluteFill>
  );
};
