import React from "react";
import { AbsoluteFill } from "remotion";
import { C, GEIST, rand01, randSigned, Track, useBrandFonts, useFrameBox } from "../../../motion";
import { FAMILIES, SORTED, shuffled } from "../data";
import { BeatLabels, Close, Cut, ease, Hook, lerp, prog, sp, useT } from "../kit";
import { demoMetadata, demoSchema, DEMO_FPS, type DemoProps } from "../module";
import { BEATS, FLIGHT, FROM, LENGTH, musicGain, snapAt, T, TRACK } from "./timeline";

// Demo 6 · "Satisfying sort" (rough animatic, gate "explore").
export const schema = demoSchema;
export const defaults = { track: TRACK, fromSec: FROM };
export const metadata = demoMetadata(LENGTH);

// the order pieces leave the pile: random, but each lands in its colour-sorted slot
// 49 pieces (a 7 × 7 closet): every piece but the belt
const PIECES = SORTED.filter((id) => id !== "garment.emma.belt-leather-brown.v1");
const ORDER = shuffled(PIECES.map((_, i) => i), 9);
const DOT: Record<string, string> = { white: "#F1EEE6", camel: "#B88A5A", green: "#8FA88A", blue: "#4C6E9E", grey: "#9A9EA4", black: "#1A1A1A" };

export const SatisfyingSort: React.FC<DemoProps> = ({ track, fromSec }) => {
  useBrandFonts();
  const t = useT();
  const fps = DEMO_FPS;
  const { w, h, u } = useFrameBox();
  const total = Math.round(LENGTH * fps);

  const cols = 7;
  const cw = (w * 0.9) / cols;
  const ch = cw * 1.08;
  const gx = (s: number) => w * 0.05 + cw * ((s % cols) + 0.5);
  const gy = (s: number) => h * 0.21 + ch * Math.floor(s / cols);
  const shake = t < T.first ? 8 * Math.sin(t * 70) * (0.4 + 0.6 * Math.exp(-t * 2)) : 0;

  const shineX = lerp(-0.4, 1.4, ease(t, T.shine, 0.7));

  return (
    <AbsoluteFill style={{ background: `radial-gradient(120% 70% at 50% 18%, #FFFFFF 0%, ${C.ground} 62%, #E4E7EA 100%)` }}>
      <Track id={track} fromSec={fromSec} total={total} fps={fps} duck={(f) => musicGain(f / fps)} />

      {/* the slots */}
      {PIECES.map((id, s) => (
        <div key={id} style={{ position: "absolute", left: gx(s) - cw * 0.46, top: gy(s) - ch * 0.46, width: cw * 0.92, height: ch * 0.92, borderRadius: u * 1.8, background: "rgba(0,0,0,.035)" }} />
      ))}

      {/* every piece: in the pile until its turn, then an arc into its slot */}
      {ORDER.map((s, k) => {
        const id = PIECES[s];
        const at = snapAt(k);
        const p = ease(t, at - FLIGHT, FLIGHT);
        const px = w * 0.5 + randSigned(31, s) * w * 0.3 + shake;
        const py = h * 0.62 + randSigned(32, s) * h * 0.13;
        const prot = randSigned(33, s) * 80;
        const ph = u * (20 + 10 * rand01(34, s));
        const x = lerp(px, gx(s), p);
        const y = lerp(py, gy(s), p) - Math.sin(Math.PI * p) * h * 0.08;
        const settle = t >= at ? lerp(1.15, 1, sp(t, at, "piece")) : 1;
        // pieces still in the pile sit lower in the stack (z-order), the ones flying go on top
        return (
          <div key={id} style={{ position: "absolute", inset: 0, zIndex: t >= at - FLIGHT ? 2 : 1 }}>
            <Cut id={id} x={x} y={y} h={lerp(ph, ch * 0.74, p)} rot={lerp(prot, 0, p)} scale={settle} filter={p > 0.99 ? "none" : undefined} />
          </div>
        );
      })}

      {/* colour key + shine */}
      {t >= T.shine ? (
        <>
          <div style={{ position: "absolute", left: 0, right: 0, top: h * 0.155, display: "flex", justifyContent: "center", gap: u * 3, opacity: prog(t, T.shine, 0.3), zIndex: 45 }}>
            {FAMILIES.map((f) => (
              <div key={f} style={{ display: "flex", alignItems: "center", gap: u * 1, fontFamily: GEIST, fontSize: u * 2.8, color: C.t2 }}>
                <div style={{ width: u * 2.4, height: u * 2.4, borderRadius: "50%", background: DOT[f], border: "1px solid rgba(0,0,0,.15)" }} />
                {f}
              </div>
            ))}
          </div>
          <AbsoluteFill style={{ zIndex: 46, background: `linear-gradient(100deg, transparent ${shineX * 100 - 12}%, rgba(255,255,255,.75) ${shineX * 100}%, transparent ${shineX * 100 + 12}%)` }} />
        </>
      ) : null}

      <Hook text="watch my closet sort itself 🔊" at={0.08} until={T.first + 0.6} y={h * 0.13} size={u * 8} color={C.ink} stroke="#fff" />
      <Close at={T.close} line="Your closet, sorted." />
      <BeatLabels beats={BEATS} title="6 · Satisfying sort" />
    </AbsoluteFill>
  );
};

