import React from "react";
import { AbsoluteFill, Img } from "remotion";
import { C, pieceAspect, rand01, randSigned, src, Track, useBrandFonts, useFrameBox } from "../../../motion";
import { SHUFFLE_PILE } from "./pile";
import { AiShot, BeatLabels, Close, ease, Hook, lerp, MiniPhone, prog, Shot, sp, useT } from "../kit";
import { demoMetadata, demoSchema, DEMO_FPS, type DemoProps } from "../module";
import { BEATS, FLIGHT, FLY, FROM, LENGTH, musicGain, T, TRACK } from "./timeline";

// Demo 1 · "Nothing to wear" (rough animatic, gate "explore"). See README.md for the concept.
export const schema = demoSchema;
export const defaults = { track: TRACK, fromSec: FROM };
export const metadata = demoMetadata(LENGTH);

const Cut: React.FC<{ id: string; x: number; y: number; h: number; rot?: number; scale?: number; origin?: string; children?: React.ReactNode }> = ({ id, x, y, h, rot = 0, scale = 1, origin = "50% 50%", children }) => {
  const w = h * pieceAspect(id);
  return (
    <div style={{ position: "absolute", left: x - w / 2, top: y - h / 2, width: w, height: h, transform: `rotate(${rot}deg) scale(${scale})`, transformOrigin: origin }}>
      {children}
      <Img src={src(id, "cutout")} style={{ width: w, height: h, filter: "drop-shadow(0 10px 14px rgba(0,0,0,.22))" }} />
    </div>
  );
};

const Hanger: React.FC<{ w: number }> = ({ w }) => (
  <svg width={w} height={70} viewBox="0 0 100 70" style={{ position: "absolute", left: 0, top: -62 }} preserveAspectRatio="none">
    <path d="M50 4 q8 0 8 8 q0 7 -8 10 L8 62 L92 62 L50 22" fill="none" stroke="#5a5f66" strokeWidth={3.5} strokeLinejoin="round" />
  </svg>
);

export const NothingToWear: React.FC<DemoProps> = ({ track, fromSec }) => {
  useBrandFonts();
  const t = useT();
  const { w, h, u } = useFrameBox();
  const total = Math.round(LENGTH * DEMO_FPS);

  // the phone: rises at 3.2, sits centre, then drops to the bottom as the pieces fly
  const rise = sp(t, T.phone, "panel");
  const away = sp(t, T.burst + 0.3, "panel");
  const phoneW = lerp(560, 330, away);
  const phoneX = w / 2;
  const phoneY = lerp(h + 700, h * 0.52, rise) + away * (h * 0.83 - h * 0.52);
  const phoneOn = t >= T.phone && t < T.close;

  // the reveal of the clean room: a circle from the phone
  const reveal = ease(t, T.burst, 0.7);
  const shake = t < 1.5 ? Math.exp(-((t - 0.15) % 0.6) * 9) * 14 : 0;

  // rail + shelf geometry
  const railY = h * 0.27;
  const shelfY = h * 0.62;
  const slotX = (s: number) => w * 0.11 + s * (w * 0.78) / 6;

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Track id={track} fromSec={fromSec} total={total} fps={DEMO_FPS} duck={(f) => musicGain(f / DEMO_FPS)} />

      {/* HOOK: the overflowing closet (AI video later); code mess of her real pieces stands in */}
      {t < T.sigh ? (
        <AiShot label="Overflowing closet: clothes spilling off the rail, she stares at it" style={{ transform: `translate(${randSigned(3, Math.floor(t * 30)) * shake}px, ${randSigned(4, Math.floor(t * 30)) * shake}px)` }}>
          <div style={{ position: "absolute", left: w * 0.06, right: w * 0.06, top: h * 0.2, height: h * 0.58, background: "#6b5a4a", borderRadius: u * 2, boxShadow: "inset 0 0 80px rgba(0,0,0,.5)" }} />
          {SHUFFLE_PILE.map((id, i) => (
            <Cut key={id} id={id} x={w * (0.12 + 0.76 * rand01(11, i))} y={h * (0.24 + 0.5 * rand01(12, i))} h={u * (22 + 14 * rand01(13, i))} rot={randSigned(14, i) * 70} />
          ))}
        </AiShot>
      ) : null}
      <Hook text="200 clothes." at={0.15} until={T.sigh} y={h * 0.36} size={u * 11} />
      <Hook text="Nothing to wear." at={0.75} until={T.sigh} y={h * 0.47} size={u * 11} />

      {/* PROBLEM: she sighs (AI video later) */}
      {t >= T.sigh && t < T.burst + 0.7 ? (
        <AiShot label="She sighs, flops back on the bed, grabs her phone" still="photo.emma.r28-couch-cozy.v1" stillOpacity={0.8} labelY={0.12} style={{ filter: `brightness(${lerp(1, 0.55, prog(t, T.phone, 0.6))})` }} />
      ) : null}
      <Hook text="*sigh*" at={T.sigh + 0.25} until={T.phone} y={h * 0.44} size={u * 10} />
      <Hook text="…fine. Curate." at={T.phone + 0.3} until={T.burst} y={h * 0.2} size={u * 8} />

      {/* the clean room, revealed from the phone */}
      {t >= T.burst ? (
        <AbsoluteFill style={{ background: `radial-gradient(120% 70% at 50% 18%, #FFFFFF 0%, ${C.ground} 62%, #E4E7EA 100%)`, clipPath: `circle(${reveal * 150}% at 50% ${(phoneY / h) * 100}%)` }}>
          {/* the rail and the shelf */}
          <div style={{ position: "absolute", left: w * 0.05, right: w * 0.05, top: railY - 6, height: 12, borderRadius: 6, background: "linear-gradient(#c9cdd2,#8d9298)", boxShadow: "0 4px 10px rgba(0,0,0,.15)" }} />
          <div style={{ position: "absolute", left: w * 0.05, right: w * 0.05, top: shelfY, height: 18, borderRadius: 4, background: "#d8dbdf", boxShadow: "0 10px 20px rgba(0,0,0,.12)" }} />
        </AbsoluteFill>
      ) : null}

      {phoneOn ? (
        <MiniPhone x={phoneX} y={phoneY} width={phoneW} rot={lerp(-6, 0, rise)}>
          <Shot id="screenshot.emma.wardrobe-top.v1" />
          {/* the tap */}
          {t > T.tap && t < T.tap + 0.5 ? (
            <div style={{ position: "absolute", left: "50%", top: "62%", width: 120, height: 120, marginLeft: -60, marginTop: -60, borderRadius: "50%", border: "8px solid rgba(0,0,0,.35)", transform: `scale(${0.4 + prog(t, T.tap, 0.5) * 1.4})`, opacity: 1 - prog(t, T.tap, 0.5) }} />
          ) : null}
          <AbsoluteFill style={{ background: "#fff", opacity: Math.max(0, 1 - Math.abs(t - T.burst) / 0.25) }} />
        </MiniPhone>
      ) : null}

      {/* THE MAGIC: pieces fly out of the phone and hang themselves */}
      {FLY.map((f) => {
        if (t < f.at) return null;
        const p = ease(t, f.at, FLIGHT);
        const ph = f.rail ? h * 0.15 : h * 0.1;
        const x1 = slotX(f.slot);
        const y1 = f.rail ? railY + 40 + ph / 2 : shelfY - ph / 2 + 8;
        const x0 = phoneX;
        const y0 = phoneY;
        const x = lerp(x0, x1, p);
        const y = lerp(y0, y1, p) - Math.sin(Math.PI * p) * h * 0.16;
        const landed = t - (f.at + FLIGHT);
        const swing = landed > 0 && f.rail ? 14 * Math.exp(-landed * 3.2) * Math.sin(landed * 11) : 0;
        const rot = (1 - p) * (f.i % 2 ? 300 : -300) + swing;
        const s = lerp(0.15, 1, sp(t, f.at, "piece"));
        return (
          <Cut key={f.id} id={f.id} x={x} y={y} h={ph} rot={rot} scale={s} origin={f.rail && p >= 1 ? "50% -40px" : "50% 50%"}>
            {f.rail && p > 0.85 ? <Hanger w={ph * pieceAspect(f.id)} /> : null}
          </Cut>
        );
      })}

      <Close at={T.close} line="Your closet, finally sorted." />
      <BeatLabels beats={BEATS} title="1 · Nothing to wear" />
    </AbsoluteFill>
  );
};
