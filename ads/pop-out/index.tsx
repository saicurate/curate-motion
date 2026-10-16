import React from "react";
import { AbsoluteFill, Img, interpolate, Sequence, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { FormatId } from "../../schemas/ad";
import {
  C,
  clamp,
  clockFor,
  display,
  Flash,
  Footage,
  GEIST,
  inOut,
  MotionBlur,
  out,
  PhoneFrame,
  PHONE_RATIO,
  Piece,
  planScenes,
  popCurve,
  projectOnPhone,
  ScanDots,
  src,
  StoreEndCard,
  Track,
  useBrandFonts,
  useFrameBox,
  ZeeActor,
  type PhonePose,
  type Scene,
} from "../../motion";
import AD from "./ad.json";
import { APP, Roll, ROLL_TOP, SCAN_TOP, tile } from "./Roll";

// Pop out (concept c14, from the founder's reference reel). Emma's phone lies on a desk showing
// her real camera roll; on the beat her real pieces burst out of her own photos with an overshoot,
// hold, and sink back home, while the line types on BEHIND them. Then the phone turns face-on and
// the roll match-cuts into the app's real scan of that same roll, her pieces arrive, the Wardrobe
// floats in depth, and the end card. 6 s is a loop (it ends exactly where it starts).
// Every cut sits on Cat Walk's beat clock; layout is useFrameBox(), so 9:16 and 4:5 share the code.

export const schema = z.object({
  format: FormatId,
  length: z.number(),
  track: z.string(),
  /** Seconds into the track at frame 0: one beat before the drop (29.5 s), so the first pop lands on it. */
  fromSec: z.number().nonnegative(),
  /** Music gain: Cat Walk is mastered near −10 LUFS; 0.62 brings the mix to about −14 LUFS. */
  volume: z.number().min(0).max(1),
});
export type Props = z.infer<typeof schema>;

export const defaults: Omit<Props, "format" | "length"> = { track: AD.track, fromSec: 29.038, volume: 0.62 };

type Key = "loop" | "pops" | "dive" | "scan" | "picked" | "found" | "pieces" | "piecesLong" | "cheer" | "float" | "floatLong" | "look" | "loved" | "tryon" | "end";
const SCENES: Scene<Key>[] = [
  { key: "loop", in: [6], beats: 13 },
  { key: "pops", in: [15, 30], beats: 11 },
  { key: "dive", in: [15, 30], beats: 2 },
  { key: "scan", in: [15, 30], beats: 3 },
  { key: "picked", in: [15, 30], beats: 2 },
  { key: "found", in: [30], beats: 4 },
  { key: "pieces", in: [15], beats: 3 },
  { key: "piecesLong", in: [30], beats: 9 },
  { key: "cheer", in: [30], beats: 6 }, // sits on Cat Walk's two-second break (track 43.9–46.0 s)
  { key: "float", in: [15], beats: 5 },
  { key: "floatLong", in: [30], beats: 8 }, // the music comes back on its first frame
  // °F: the landing is 3 beats (4.1–5.5 s of the clip, before Zee's reply says "14° tonight", which the
  // brain writes in °C), then 5 beats of her real "Love it" tap on that look and "Me too."
  { key: "look", in: [30], beats: 3 },
  { key: "loved", in: [30], beats: 5 },
  { key: "tryon", in: [30], beats: 4 },
  { key: "end", in: [15, 30], beats: 8 },
];

/** Real app footage per scene: clip, seconds into it, speed, and how the scene comes in. */
type In = "match" | "punch" | "whip" | "drop";
const FOOT: Partial<Record<Key, { id: string; from: number; rate: number; enter: In }>> = {
  scan: { id: "footage.emma.scan-roll.v1", from: 1.4, rate: 1.5, enter: "match" },
  picked: { id: "footage.emma.scan-roll.v1", from: 5.55, rate: 1, enter: "punch" },
  found: { id: "footage.emma.scan-found-end.v1", from: 1.05, rate: 1, enter: "punch" },
  pieces: { id: "footage.emma.pieces-up-and-tuck.v1", from: 4.0, rate: 1.3, enter: "whip" },
  piecesLong: { id: "footage.emma.pieces-up-and-tuck.v1", from: 0.0, rate: 1.38, enter: "whip" },
  cheer: { id: "footage.emma.wardrobe-ready-cheer.v1", from: 0.9, rate: 1, enter: "punch" },
  float: { id: "footage.emma.wardrobe-scroll-float.v1", from: 1.8, rate: 1.5, enter: "whip" },
  floatLong: { id: "footage.emma.wardrobe-scroll-float.v1", from: 1.8, rate: 1.6, enter: "drop" },
  look: { id: "footage.emma.look-card-landing.v1", from: 4.1, rate: 1, enter: "whip" },
  loved: { id: "footage.emma.look-love-it.v1", from: 9.5, rate: 1, enter: "punch" },
  tryon: { id: "footage.emma.tryon-curtain-reveal.v1", from: 6.15, rate: 1, enter: "punch" },
};

const g = (n: string) => `garment.emma.${n}.v1`;

// The pops: which photo (index in ROLL) each piece comes out of, on which beat, and where it flies.
type PopSpec = { id: string; tile: number; beat: number; to: [number, number]; h: number; hold: number; sway?: number };
const POPS: PopSpec[] = [
  { id: g("jacket-leather-black"), tile: 12, beat: 1, to: [0.42, 0.37], h: 50, hold: 17 },
  { id: g("tee-long-sleeve-striped"), tile: 3, beat: 3, to: [0.6, 0.4], h: 44, hold: 16, sway: -1 },
  { id: g("coat-trench-khaki"), tile: 21, beat: 5, to: [0.44, 0.36], h: 62, hold: 16 },
  { id: g("jacket-denim"), tile: 15, beat: 7, to: [0.58, 0.38], h: 48, hold: 14, sway: -1 },
];
// beat 9: everything bursts up at once, in depth (z: 0 far … 1 near), then sinks home on beat 11
type BurstSpec = { id: string; tile: number; to: [number, number]; h: number; z: number };
const BURST: BurstSpec[] = [
  { id: g("blazer-black"), tile: 32, to: [0.12, 0.34], h: 24, z: 0.1 },
  { id: g("shirt-oxford-blue"), tile: 17, to: [0.88, 0.32], h: 22, z: 0.05 },
  { id: g("sports-bra-sage"), tile: 6, to: [0.63, 0.3], h: 17, z: 0.15 },
  { id: g("sweater-cable-knit-cream"), tile: 9, to: [0.19, 0.49], h: 30, z: 0.35 },
  { id: g("jacket-varsity-navy-cream"), tile: 30, to: [0.82, 0.48], h: 31, z: 0.4 },
  { id: g("skirt-midi-satin-camel"), tile: 25, to: [0.69, 0.64], h: 38, z: 0.55 },
  { id: g("camisole-satin-black"), tile: 19, to: [0.3, 0.65], h: 30, z: 0.5 },
  { id: g("jacket-leather-black"), tile: 12, to: [0.48, 0.45], h: 44, z: 0.75 },
  { id: g("sneakers-leather-white"), tile: 12, to: [0.17, 0.78], h: 15, z: 0.9 },
  { id: g("bag-tote-leather-black"), tile: 3, to: [0.86, 0.78], h: 24, z: 0.95 },
];
// the 6 s loop's payoff: the whole look out of one photo (r27, Chelsea Market)
const LOOK27: { id: string; dx: number; dy: number; h: number; rot: number }[] = [
  { id: g("jeans-straight-dark-wash"), dx: 0.02, dy: 0.1, h: 52, rot: 1 },
  { id: g("tee-white"), dx: 0.07, dy: -0.06, h: 32, rot: 3 },
  { id: g("jacket-leather-black"), dx: -0.12, dy: -0.07, h: 40, rot: -5 },
  { id: g("sneakers-leather-white"), dx: 0.25, dy: 0.21, h: 13, rot: -4 },
];
// the Wardrobe in depth: pieces float round the phone (z < 0.5 behind it, ≥ 0.5 in front)
const CLOUD: { id: string; at: [number, number]; h: number; z: number }[] = [
  { id: g("blazer-black"), at: [0.13, 0.22], h: 24, z: 0.2 },
  { id: g("sweater-cable-knit-cream"), at: [0.87, 0.27], h: 22, z: 0.25 },
  { id: g("jeans-straight-light-wash"), at: [0.1, 0.6], h: 36, z: 0.3 },
  { id: g("skirt-midi-satin-camel"), at: [0.9, 0.62], h: 32, z: 0.3 },
  { id: g("coat-trench-khaki"), at: [0.06, 0.4], h: 36, z: 0.8 },
  { id: g("jacket-leather-black"), at: [0.9, 0.44], h: 30, z: 0.85 },
  { id: g("sneakers-leather-white"), at: [0.18, 0.8], h: 13, z: 0.9 },
  { id: g("bag-crossbody-tan"), at: [0.85, 0.8], h: 12, z: 0.9 },
];

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerpPose = (a: PhonePose, b: PhonePose, t: number): PhonePose => ({
  width: lerp(a.width, b.width, t),
  x: lerp(a.x, b.x, t),
  y: lerp(a.y, b.y, t),
  rx: lerp(a.rx ?? 0, b.rx ?? 0, t),
  ry: lerp(a.ry ?? 0, b.ry ?? 0, t),
  rz: lerp(a.rz ?? 0, b.rz ?? 0, t),
  scale: lerp(a.scale ?? 1, b.scale ?? 1, t),
});

/** Letter-by-letter type in two colours (the brand's signature: key phrase in near-black). */
const TypeOnRich: React.FC<{ parts: { text: string; color: string }[]; at: number; size: number; perChar?: number; style?: React.CSSProperties; opacity?: number }> = ({ parts, at, size, perChar = 1.1, style, opacity = 1 }) => {
  const frame = useCurrentFrame();
  if (frame < at) return null;
  let n = Math.floor((frame - at) / perChar) + 1;
  return (
    <div style={{ position: "absolute", ...display(size), whiteSpace: "pre-wrap", opacity, ...style }}>
      {parts.map((p, i) => {
        const shown = Math.max(0, Math.min(p.text.length, n));
        n -= p.text.length;
        return (
          <span key={i} style={{ color: p.color }}>
            {p.text.slice(0, shown)}
            <span style={{ opacity: 0 }}>{p.text.slice(shown)}</span>
          </span>
        );
      })}
    </div>
  );
};

export const PopOut: React.FC<Props> = ({ length, track, fromSec, volume }) => {
  useBrandFonts();
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const box = useFrameBox();
  const { w, h, u, cx, tall } = box;
  const clock = clockFor(track, fromSec, fps);
  const B = clock.frame;
  // keep/drop scenes per length, then pin every boundary to the beat grid
  let beatAt = 0;
  const plan = planScenes(SCENES, length, clock.perBeat, fps).map((p) => {
    const s = SCENES.find((x) => x.key === p.key)!;
    const from = B(beatAt);
    beatAt += s.beats;
    return { ...p, from, end: p.key === "end" || p.key === "loop" ? durationInFrames : B(beatAt) };
  });
  const sc = (k: Key) => plan.find((p) => p.key === k);
  const loop = sc("loop");
  const pops = sc("pops");
  const dive = sc("dive");
  const end = sc("end");

  // ── the desk and the phone lying on it ──
  const P0: PhonePose = tall
    ? { width: u * 64, x: cx + u * 2, y: h * 0.665, rx: 28, rz: -8 }
    : { width: u * 43, x: cx + u * 12, y: h * 0.7, rx: 28, rz: -8 };
  const P1: PhonePose = { width: Math.min(w * 0.64, (h * (tall ? 0.83 : 0.86)) / PHONE_RATIO), x: cx, y: h * (tall ? 0.495 : 0.5), rx: 0, ry: 0, rz: 0 };
  const sway = (f: number) => ({ ry: Math.sin(f / 38) * 7, rx: 3 + Math.sin(f / 51) * 2.5, rz: Math.sin(f / 61) * 1.2 });
  const diveT = dive ? interpolate(frame, [dive.from + 4, dive.end - 1], [0, 1], { ...clamp, easing: inOut }) : 0;
  // the dive ends exactly on the first footage frame's pose, so the cut is a true match
  const deskPose = dive ? lerpPose(P0, { ...P1, ...sway(dive.end) }, diveT) : P0;
  const kOf = (p: PhonePose) => (p.width * (1 - 0.056)) / APP.w;
  const tileCentre = (ph: PhonePose, i: number, top: number) => {
    const t = tile(i, top);
    const k = kOf(ph);
    return projectOnPhone(ph, (t.x + t.w / 2) * k, (t.y + t.h / 2) * k);
  };
  const rollTop = lerp(ROLL_TOP, SCAN_TOP, diveT);
  const loopPhase = loop ? (2 * Math.PI * frame) / durationInFrames : 0;
  const camPush = pops ? interpolate(frame, [0, pops.end], [1, 1.045], { ...clamp, easing: inOut }) * (1 - diveT) + diveT : loop ? 1.025 - 0.025 * Math.cos(loopPhase) : 1;
  const onDesk = !!loop || (!!pops && frame < (dive?.end ?? 0));
  const deskFade = dive ? diveT : 0;

  const lineSize = u * (tall ? 10 : 8.2);
  const lineTop = tall ? h * 0.09 : h * 0.07;
  const lineOut = pops ? interpolate(frame, [B(10.6), B(11.2)], [1, 0], clamp) : 1;

  // a pop out of a photo and back home (15% → 100% with an overshoot, hold, sink)
  const Pop = (p: PopSpec, ph: PhonePose, key: string) => {
    const v = popCurve(frame, B(p.beat), p.hold, 6, 7);
    if (v <= 0) return null;
    const home = tileCentre(ph, p.tile, ROLL_TOP);
    const k = Math.min(1, v);
    const x = lerp(home.x, p.to[0] * w, k);
    const y = lerp(home.y, p.to[1] * h, k);
    const rot = Math.sin((frame - B(p.beat)) / 5) * 3 * (p.sway ?? 1) * k;
    const outline = interpolate(frame - B(p.beat), [0, 3, 14], [1, 1, 0], clamp);
    return <Piece key={key} id={p.id} x={x} y={y} h={u * p.h * (tall ? 1 : 0.78)} scale={0.15 + 0.85 * v} rot={rot} outline={outline} shadow={k} />;
  };

  const scanDot = (ph: PhonePose, i: number, at: number, key: string) => {
    const t = tile(i, ROLL_TOP);
    const k = kOf(ph);
    return <ScanDots key={key} at={at} dur={9} x={t.x * k} y={t.y * k} w={t.w * k} h={t.h * k} gap={Math.max(10, 34 * k)} />;
  };

  // ── the burst (beat 9 → home on beat 11) ──
  const burst = (ph: PhonePose) => {
    if (!pops) return null;
    const at = B(9);
    const back = B(11);
    if (frame < at - 1 || frame > back + 9) return null;
    const drift = interpolate(frame, [at, back], [0, 1], clamp);
    return [...BURST]
      .sort((a, b) => a.z - b.z)
      .map((p, i) => {
        const s = spring({ frame: frame - at - Math.round((1 - p.z) * 3), fps, config: { damping: 12, stiffness: 160 } });
        const home = tileCentre(ph, p.tile, ROLL_TOP);
        const ret = interpolate(frame, [back, back + 9], [0, 1], { ...clamp, easing: inOut });
        const k = Math.max(0, s * (1 - ret));
        if (k <= 0.01) return null;
        const par = (p.z - 0.5) * u * 9 * drift; // near pieces drift further: parallax
        const x = lerp(home.x, p.to[0] * w + par, k);
        const y = lerp(home.y, p.to[1] * h - drift * u * (2 + p.z * 4), k);
        const blur = p.z > 0.85 ? 2.5 : p.z < 0.12 ? 1.4 : 0;
        return (
          <Piece
            key={`b${i}`}
            id={p.id}
            x={x}
            y={y}
            h={u * p.h * (tall ? 1 : 0.8)}
            scale={0.15 + 0.85 * k}
            rot={Math.sin((frame + i * 17) / 11) * 4 * k}
            opacity={0.75 + 0.25 * Math.min(1, p.z * 2)}
            shadow={k}
            style={blur ? { filter: `blur(${blur}px)` } : undefined}
          />
        );
      });
  };

  // ── the real app footage, in a clean phone, cut on the beat ──
  const footScenes = plan.filter((p) => FOOT[p.key]);
  const WH = 5; // half a whip, frames
  const footScene = (i: number) => {
    const p = footScenes[i];
    const spec = FOOT[p.key]!;
    const next = footScenes[i + 1] ?? (end ? { key: "end" as Key, from: end.from } : null);
    const nextEnter: In | "end" | null = next ? (next.key === "end" ? "end" : FOOT[next.key]!.enter) : null;
    const f = frame;
    let dx = 0;
    let dy = 0;
    let blurX = 0;
    let blurY = 0;
    let s = 1;
    if (spec.enter === "whip" || spec.enter === "drop") {
      // a whip pan: the two phones cross under the blur (never an empty frame)
      const t = interpolate(f, [p.from, p.from + WH], [1, 0], { ...clamp, easing: out });
      dx = t * w * 0.6;
      blurX = t * 80;
    }
    if (spec.enter === "punch") s *= interpolate(f, [p.from, p.from + 8], [1.045, 1], { ...clamp, easing: out });
    if (spec.enter === "drop") s *= interpolate(f, [p.from, p.from + 10], [1.08, 1], { ...clamp, easing: out });
    if (nextEnter === "whip" || nextEnter === "drop") {
      const t = interpolate(f, [p.end - WH, p.end], [0, 1], { ...clamp, easing: inOut });
      dx -= t * w * 0.6;
      blurX += t * 80;
    }
    if (nextEnter === "end") {
      const t = interpolate(f, [p.end - 6, p.end + 2], [0, 1], { ...clamp, easing: inOut });
      dy = -t * h * 1.1;
      blurY = t * 60;
    }
    const ph = { ...P1, ...sway(f), scale: s };
    return (
      <MotionBlur id={`fw${i}`} x={blurX} y={blurY} style={{ transform: `translate(${dx}px, ${dy}px)` }}>
        {p.key === "float" || p.key === "floatLong" ? cloud(p.from, "back") : null}
        <PhoneFrame {...ph} island={false} screen={C.appGround}>
          <Footage id={spec.id} from={spec.from} rate={spec.rate} />
        </PhoneFrame>
        {p.key === "float" || p.key === "floatLong" ? cloud(p.from, "front") : null}
      </MotionBlur>
    );
  };

  // ── the Wardrobe in depth: her pieces fly out of the phone and float round it ──
  const cloud = (start: number, layer: "back" | "front") => {
    const f = frame;
    return (
      <>
        {CLOUD.filter((c) => (layer === "back" ? c.z < 0.5 : c.z >= 0.5)).map((c, i) => {
          const s = spring({ frame: f - start - 2 - i * 2, fps, config: { damping: 13, stiffness: 120 } });
          if (s <= 0.01) return null;
          // the feed (4:5, 1:1) is wider than the phone needs: pull the cloud in so no piece is cut at the edge
          const ax = (tall ? c.at[0] : 0.5 + (c.at[0] - 0.5) * 0.86) * w;
          const ay = c.at[1] * h;
          const par = (c.z - 0.5) * u * 6 * Math.sin((f - start) / 40); // parallax against the phone's sway
          const x = lerp(cx, ax + par, s);
          const y = lerp(h * 0.5, ay - (f - start) * u * 0.05 * (0.5 + c.z), s);
          return (
            <Piece
              key={c.id + layer}
              id={c.id}
              x={x}
              y={y}
              h={u * c.h * (tall ? 1 : 0.8) * (0.4 + 0.6 * s)}
              rot={Math.sin((f + i * 23) / 19) * 5}
              opacity={layer === "back" ? 0.92 : 1}
              shadow={s}
              style={c.z > 0.85 ? { filter: "blur(1.6px)" } : undefined}
            />
          );
        })}
      </>
    );
  };

  // ── the 6 s loop: three pops, the whole look + the lockup, and home again ──
  const loopBody = () => {
    if (!loop) return null;
    const ph = P0;
    const lookAt = B(7);
    const lookBack = B(11);
    const lk = spring({ frame: frame - lookAt, fps, config: { damping: 12, stiffness: 150 } });
    const ret = interpolate(frame, [lookBack, lookBack + 10], [0, 1], { ...clamp, easing: inOut });
    const kk = Math.max(0, lk * (1 - ret));
    const home = tileCentre(ph, 12, ROLL_TOP);
    const lock = interpolate(frame, [lookAt + 4, lookAt + 14, lookBack - 6, lookBack + 2], [0, 1, 1, 0], { ...clamp, easing: out });
    const markW = u * (tall ? 13 : 11);
    const LX = tall ? w * 0.07 : w * 0.06;
    const LY = lineTop + u * 1;
    return (
      <>
        {lock > 0 ? (
          <div style={{ position: "absolute", left: LX, top: LY, opacity: lock, transform: `translateY(${(1 - lock) * u * 3}px)`, display: "flex", alignItems: "center", gap: u * 3 }}>
            <div style={{ position: "relative", width: markW, height: markW }}>
              <Img src={src("brand.curate.splash-mark.v1")} style={{ position: "absolute", width: markW / 0.4184, height: markW / 0.4184, left: -(markW / 0.4184 - markW) / 2, top: -(markW / 0.4184 - markW) / 2 }} />
            </div>
            <div>
              <div style={{ ...display(u * (tall ? 9.5 : 8)) }}>Curate</div>
              <div style={{ fontFamily: GEIST, fontWeight: 500, fontSize: u * (tall ? 4.2 : 3.6), color: C.winterGrey, marginTop: u * 1.2, letterSpacing: "-0.01em" }}>On the App Store</div>
            </div>
          </div>
        ) : null}
        {kk > 0.01
          ? LOOK27.map((p, i) => (
              <Piece
                key={`l${i}`}
                id={p.id}
                x={lerp(home.x, (tall ? cx : w * 0.4) + p.dx * w, kk)}
                y={lerp(home.y, h * (tall ? 0.43 : 0.52) + p.dy * h * (tall ? 1 : 0.8), kk)}
                h={u * p.h * (tall ? 1 : 0.86)}
                scale={0.15 + 0.85 * kk}
                rot={p.rot * kk + Math.sin((frame + i * 13) / 14) * 1.5 * kk}
                outline={interpolate(frame - lookAt, [0, 3, 14], [1, 1, 0], clamp)}
                shadow={kk}
              />
            ))
          : null}
      </>
    );
  };

  const deskPhone = (ph: PhonePose) => (
    <PhoneFrame {...ph} island screen={C.card}>
      <Roll k={kOf(ph)} top={rollTop} fade={diveT} bg={diveT > 0 ? C.appGround : C.card} />
      {loop || pops
        ? [...(loop ? POPS.slice(0, 3) : POPS)].map((p, i) => scanDot(ph, p.tile, B(p.beat) - 9, `s${i}`))
        : null}
      {loop ? scanDot(ph, 12, B(7) - 9, "sl") : null}
      {pops ? BURST.filter((_, i) => i % 3 === 0).map((p, i) => scanDot(ph, p.tile, B(9) - 8, `sb${i}`)) : null}
    </PhoneFrame>
  );

  const endAt = end?.from ?? durationInFrames;
  const zeePeekAt = loop ? B(8) : null;

  return (
    <AbsoluteFill style={{ background: C.ground }}>
      <Track id={track} fromSec={clock.fromSec} total={durationInFrames} fps={fps} volume={volume} fadeOut={loop ? 10 : 8} />
      {/* the Mist stage the footage stands on, under the desk */}
      <AbsoluteFill style={{ background: `radial-gradient(120% 70% at 50% 18%, ${C.card} 0%, ${C.ground} 62%, ${C.deskMid} 100%)` }} />
      {onDesk ? (
        <AbsoluteFill style={{ background: `radial-gradient(110% 80% at 50% 30%, ${C.desk} 0%, ${C.deskMid} 60%, ${C.deskEdge} 100%)`, opacity: 1 - deskFade }} />
      ) : null}

      {/* the line, typed at ~1 s, sitting BEHIND the pieces */}
      {pops ? (
        <TypeOnRich
          parts={[
            { text: "Your closet\nis already in\n", color: C.winterGrey },
            { text: "your photos.", color: C.ink },
          ]}
          at={28}
          size={lineSize}
          perChar={1.05}
          opacity={lineOut}
          style={{ left: tall ? w * 0.07 : w * 0.06, top: lineTop, width: w * 0.78 }}
        />
      ) : null}
      {loop ? (
        <TypeOnRich
          parts={[
            { text: "Already in\n", color: C.winterGrey },
            { text: "your photos.", color: C.ink },
          ]}
          at={16}
          size={lineSize * 1.05}
          perChar={1}
          opacity={interpolate(frame, [B(6.4), B(7)], [1, 0], clamp)}
          style={{ left: tall ? w * 0.07 : w * 0.06, top: lineTop, width: w * 0.78 }}
        />
      ) : null}

      {onDesk ? (
        <div style={{ position: "absolute", inset: 0, transform: `scale(${camPush}) rotate(${loop ? Math.sin(loopPhase) * 1.2 : 0}deg)`, transformOrigin: `${cx}px ${h * 0.5}px` }}>
          {/* Zee peeks over the phone's top edge in the loop's payoff */}
          {zeePeekAt !== null && frame >= zeePeekAt && frame < B(11.5)
            ? (() => {
                const top = tileCentre(P0, 1, ROLL_TOP - 200);
                const up = interpolate(frame, [zeePeekAt, zeePeekAt + 9, B(10.6), B(11.4)], [0, 1, 1, 0], { ...clamp, easing: out });
                const zs = u * (tall ? 34 : 26);
                return (
                  <div style={{ position: "absolute", left: 0, top: 0, width: w, height: top.y - u * 2, overflow: "hidden" }}>
                    <ZeeActor cues={[{ at: zeePeekAt, emo: "curious" }]} size={zs} shadow={false} style={{ left: top.x - zs / 2 + u * (tall ? 6 : 15), top: top.y - u * 2 - zs * 0.62 * up + zs * 0.08, transform: "rotate(-8deg)" }} />
                  </div>
                );
              })()
            : null}
          {deskPhone(deskPose)}
          {pops ? POPS.map((p, i) => Pop(p, P0, `p${i}`)) : null}
          {loop ? POPS.slice(0, 3).map((p, i) => Pop({ ...p, hold: p.hold + 2 }, P0, `lp${i}`)) : null}
          {burst(P0)}
          {loopBody()}
        </div>
      ) : null}

      {/* the real footage, scene by scene */}
      {footScenes.map((p, i) => (
        <Sequence key={p.key} from={p.from} durationInFrames={p.end - p.from} layout="none">
          {footScene(i)}
        </Sequence>
      ))}
      {plan.some((p) => p.key === "floatLong") ? <Flash at={sc("floatLong")!.from} strength={0.55} /> : null}

      {/* the end card rises in like a vertical whip */}
      {end && frame >= endAt - 6 ? (
        <MotionBlur id="endwhip" y={interpolate(frame, [endAt - 6, endAt + 2], [60, 0], clamp)} style={{ transform: `translateY(${interpolate(frame, [endAt - 6, endAt + 2], [h * 1.05, 0], { ...clamp, easing: inOut })}px)` }}>
          <StoreEndCard at={endAt - 5} zee="curious" zeeDelay={16} />
        </MotionBlur>
      ) : null}
    </AbsoluteFill>
  );
};
