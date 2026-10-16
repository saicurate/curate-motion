import React from "react";
import { AbsoluteFill } from "remotion";
import { C, place, Star, Track, useBrandFonts, useFrameBox, ZeeActor, type Role } from "../../../motion";
import { LOOKS } from "../data";
import { BeatLabels, Close, Cut, ease, Hook, lerp, MiniPhone, prog, Shot, sp, useT } from "../kit";
import { demoMetadata, demoSchema, DEMO_FPS, type DemoProps } from "../module";
import { BEATS, FROM, LENGTH, musicGain, T, TRACK } from "./timeline";

// Demo 3 · "Zee the critic" (rough animatic, gate "explore").
export const schema = demoSchema;
export const defaults = { track: TRACK, fromSec: FROM };
export const metadata = demoMetadata(LENGTH);

type P = { id: string; role: Role };
const BEFORE = LOOKS.lazy.pieces as readonly P[];
const AFTER = LOOKS.dateNight.pieces as readonly P[];
// which tap swaps which pieces: tap 0 → the top (hoodie → blazer + cami), 1 → bottom, 2 → shoes, 3 → the bag appears
const OUT_AT: Record<string, number> = { "garment.emma.hoodie-navy.v1": 0, "garment.emma.sweatpants-grey.v1": 1, "garment.emma.sneakers-retro-runner-grey-navy.v1": 2 };
const IN_AT: Record<string, number> = { "garment.emma.blazer-black.v1": 0, "garment.emma.camisole-satin-black.v1": 0, "garment.emma.skirt-midi-satin-camel.v1": 1, "garment.emma.boots-ankle-black.v1": 2, "garment.emma.bag-mini-black.v1": 3 };

const Paw: React.FC<{ x: number; y: number; s: number }> = ({ x, y, s }) => (
  <svg width={140} height={140} viewBox="0 0 100 100" style={{ position: "absolute", left: x - 70, top: y - 70, transform: `scale(${s})`, opacity: Math.min(1, s * 2), zIndex: 30 }}>
    <ellipse cx="50" cy="64" rx="22" ry="18" fill="#141414" />
    {[[24, 38], [40, 26], [60, 26], [76, 38]].map(([cx, cy], i) => <ellipse key={i} cx={cx} cy={cy} rx="9" ry="11" fill="#141414" />)}
  </svg>
);

export const ZeeCritic: React.FC<DemoProps> = ({ track, fromSec }) => {
  useBrandFonts();
  const t = useT();
  const fps = DEMO_FPS;
  const { w, h, u } = useFrameBox();
  const total = Math.round(LENGTH * fps);

  // the outfit, a flat-lay at centre-left
  const W = w * 0.62;
  const H = h * 0.5;
  const ox = w * 0.4;
  const lift = ease(t, T.slay + 0.4, 0.5);
  const oy = h * 0.5 - lift * h * 0.1;
  const oscale = lerp(1, 0.82, lift);

  // the meme punch-in on Zee
  const punch = t >= T.react && t < T.swap ? 1 - 0.0 * prog(t, T.react, 1) : 0;
  const pz = punch ? lerp(1, 1.75, sp(t, T.react, "camera")) : lerp(1.75, 1, sp(t, T.swap, "camera"));
  const zoom = t < T.react ? 1 : pz;
  const shake = t >= T.react && t < T.react + 0.6 ? Math.exp(-(t - T.react) * 6) * 18 * Math.sin(t * 90) : 0;

  // Zee walks in from the right, then sits at the right
  const zx = lerp(w + 250, w * 0.8, ease(t, T.walk, 0.95));
  const hop = t < 1.0 ? Math.abs(Math.sin(t * Math.PI * 3.3)) * u * 3 : 0;
  const zSize = u * 36;
  const zy = h * 0.6;
  const f = (s: number) => Math.round(s * fps);
  const cues = [
    { at: 0, emo: "curious" as const, cut: true },
    { at: f(T.scan), emo: "thinking" as const },
    { at: f(T.react), emo: "sleepy" as const, cut: true, loopStart: 30 },
    { at: f(T.swap), emo: "curious" as const, cut: true },
    { at: f(T.slay), emo: "cheer" as const, cut: true },
  ];

  const tapI = (i: number) => T.taps[i];
  const pieces: React.ReactNode[] = [];
  const show = (p: P, list: readonly P[], key: string, vis: number) => {
    const pl = place(p.role, W, H, list.some((x) => x.role === "outer"));
    if (vis <= 0.001) return;
    pieces.push(<Cut key={key} id={p.id} x={pl.x} y={pl.y} h={pl.h} rot={pl.rot} transform={`perspective(1200px) rotateY(${(1 - vis) * 90}deg)`} opacity={Math.min(1, vis * 3)} />);
  };
  for (const p of BEFORE) {
    const at = tapI(OUT_AT[p.id]);
    show(p, BEFORE, "b" + p.id, t < at ? 1 : 1 - ease(t, at, 0.15));
  }
  for (const p of AFTER) {
    const at = tapI(IN_AT[p.id]) + 0.15;
    show(p, AFTER, "a" + p.id, t < at ? 0 : sp(t, at, "piece"));
  }
  const tapPos = [
    { x: ox, y: oy - H * 0.22 },
    { x: ox, y: oy + H * 0.24 },
    { x: ox + W * 0.34, y: oy + H * 0.43 },
    { x: ox + W * 0.4, y: oy + H * 0.08 },
  ];

  const scanY = oy - H * 0.45 + H * 0.9 * (0.5 - 0.5 * Math.cos(prog(t, T.scan + 0.1, 1.8) * Math.PI * 2));

  return (
    <AbsoluteFill style={{ background: `radial-gradient(120% 70% at 50% 18%, #FFFFFF 0%, ${C.ground} 62%, #E4E7EA 100%)` }}>
      <Track id={track} fromSec={fromSec} total={total} fps={fps} duck={(fr) => musicGain(fr / fps)} />
      <AbsoluteFill style={{ transform: `translate(${shake}px, ${shake * 0.6}px) scale(${zoom})`, transformOrigin: `${(w * 0.8 / w) * 100}% ${(zy / h) * 100}%`, filter: t >= T.react && t < T.swap ? "saturate(.4) contrast(1.1)" : undefined }}>
        <div style={{ position: "absolute", left: ox, top: oy, transform: `scale(${oscale})` }}>{pieces}</div>
        {t >= T.scan && t < T.react ? <div style={{ position: "absolute", left: ox - W * 0.5, width: W, top: scanY, height: 4, background: "repeating-linear-gradient(90deg,#181818 0 18px,transparent 18px 30px)", opacity: 0.6 }} /> : null}
        <ZeeActor cues={cues} size={zSize} style={{ left: zx - zSize / 2, top: zy - zSize / 2 - hop, transform: t < T.scan ? "scaleX(-1)" : undefined }} />
        {T.taps.map((tt, i) => (t >= tt - 0.08 && t < tt + 0.45 ? <Paw key={i} x={tapPos[i].x} y={tapPos[i].y} s={sp(t, tt - 0.08, "mascot") * (1 - prog(t, tt + 0.25, 0.2))} /> : null))}
        {T.taps.map((tt, i) => <Star key={i} at={Math.round((tt + 0.3) * fps)} x={tapPos[i].x + u * 8} y={tapPos[i].y - u * 6} size={u * 9} />)}
      </AbsoluteFill>
      {t >= T.react && t < T.swap ? <AbsoluteFill style={{ background: "radial-gradient(closest-side, transparent 55%, rgba(0,0,0,.55))" }} /> : null}

      <Hook text="POV: your cat has opinions about your outfit" at={0.1} until={T.react} y={h * 0.19} size={u * 7.4} color={C.ink} stroke="#fff" />
      <Hook text="girl… no." at={T.react + 0.12} until={T.swap} y={h * 0.74} size={u * 13} />
      <Hook text="ok. let me fix this." at={T.swap + 0.05} until={T.slay} y={h * 0.19} size={u * 7.4} color={C.ink} stroke="#fff" />
      <Hook text="SLAY." at={T.slay} until={T.close} y={h * 0.16} size={u * 15} color={C.ink} stroke="#fff" />
      {Array.from({ length: 6 }, (_, i) => <Star key={i} at={Math.round((T.slay + i * 0.12) * fps)} x={w * (0.15 + 0.14 * i)} y={h * (0.1 + 0.05 * (i % 2))} size={u * 8} life={24} />)}

      {/* PROOF: the real look card from the app */}
      {t >= T.proof ? (
        <MiniPhone x={w * 0.28} y={lerp(h * 1.3, h * 0.74, sp(t, T.proof, "panel"))} width={u * 30} rot={-4}>
          <Shot id="screenshot.emma.look-card.v1" />
        </MiniPhone>
      ) : null}
      {t >= T.proof + 0.3 ? <Hook text="(the real look in the app)" at={T.proof + 0.3} until={T.close} y={h * 0.93} size={u * 4.2} /> : null}

      <Close at={T.close} line="A stylist with opinions." sub="Zee picks from your own closet." />
      <BeatLabels beats={BEATS} title="3 · Zee the critic" />
    </AbsoluteFill>
  );
};
