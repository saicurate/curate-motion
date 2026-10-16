import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { Footage, GEIST, Track, useBrandFonts, useFrameBox } from "../../../motion";
import { SORTED, shuffled } from "../data";
import { BeatLabels, Close, Cut, ease, Flash, Hook, lerp, MiniPhone, prog, sp, useT } from "../kit";
import { demoMetadata, demoSchema, DEMO_FPS, type DemoProps } from "../module";
import { BEATS, countAt, FALL, FROM, gameTime, landAt, LENGTH, musicGain, N, T, TRACK } from "./timeline";

// Demo 4 · "Speed run" (rough animatic, gate "explore").
export const schema = demoSchema;
export const defaults = { track: TRACK, fromSec: FROM };
export const metadata = demoMetadata(LENGTH);

const PIECES = shuffled(SORTED, 4).slice(0, N);
const GREEN = "#3CF08A";
const GOLD = "#FFC93C";

const clock = (s: number) => {
  const m = Math.floor(s / 60);
  const r = s - m * 60;
  return `${m}:${r.toFixed(1).padStart(4, "0")}`;
};

export const SpeedRun: React.FC<DemoProps> = ({ track, fromSec }) => {
  useBrandFonts();
  const t = useT();
  const fps = DEMO_FPS;
  const { w, h, u } = useFrameBox();
  const total = Math.round(LENGTH * fps);
  const done = t >= T.finish;
  const n = countAt(t);

  const cols = 7;
  const cell = (w * 0.74) / cols;
  const gx = (k: number) => w * 0.03 + cell * ((k % cols) + 0.5);
  const gy = (k: number) => h * 0.37 + cell * 1.04 * Math.floor(k / cols);
  const slam = done ? lerp(1.5, 1, sp(t, T.finish, "headline")) : 1;

  return (
    <AbsoluteFill style={{ background: "#0E0F10" }}>
      <Track id={track} fromSec={fromSec} total={total} fps={fps} duck={(f) => musicGain(f / fps)} />
      <AbsoluteFill style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.04) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />

      {/* HUD */}
      <div style={{ position: "absolute", left: 0, right: 0, top: h * 0.105, textAlign: "center", fontFamily: GEIST, color: "#fff", zIndex: 20 }}>
        <div style={{ fontSize: u * 3.4, letterSpacing: ".18em", fontWeight: 600, color: "#9aa0a8" }}>CLOSET SPEEDRUN · ANY%</div>
        <div style={{ fontSize: u * 21, fontWeight: 600, fontVariantNumeric: "tabular-nums", color: done ? GOLD : GREEN, letterSpacing: "-0.03em", transform: `scale(${slam})`, textShadow: `0 0 40px ${done ? GOLD : GREEN}55` }}>{clock(gameTime(t))}</div>
        <div style={{ fontSize: u * 7, fontWeight: 600, fontVariantNumeric: "tabular-nums", marginTop: -u * 1 }}>
          {n} <span style={{ color: "#777" }}>/ {N} pieces</span>
        </div>
      </div>

      {/* empty slots + falling pieces */}
      {PIECES.map((id, k) => {
        const at = landAt(k);
        const p = ease(t, at - FALL, FALL);
        return (
          <React.Fragment key={id}>
            <div style={{ position: "absolute", left: gx(k) - cell * 0.45, top: gy(k) - cell * 0.45, width: cell * 0.9, height: cell * 0.9, borderRadius: u * 1.6, background: t >= at ? "rgba(255,255,255,.92)" : "rgba(255,255,255,.06)", transform: `scale(${t >= at ? lerp(1.12, 1, sp(t, at, "ui")) : 1})` }} />
            {t >= at - FALL ? <Cut id={id} x={gx(k)} y={lerp(-h * 0.1, gy(k), p)} h={cell * 0.72} rot={(1 - p) * 40} filter="none" /> : null}
          </React.Fragment>
        );
      })}

      {/* the real app, sped up, in the corner */}
      {t >= 1.2 && t < T.finish ? (
        <>
          <MiniPhone x={w * 0.885} y={h * 0.62} width={u * 20} scale={ease(t, 1.2, 0.3)}>
            <Sequence from={Math.round(1.2 * fps)}>
              <Footage id="footage.emma.scan-roll.v1" rate={0.85} />
            </Sequence>
          </MiniPhone>
          <div style={{ position: "absolute", right: u * 1.5, top: h * 0.74, width: u * 22, textAlign: "center", fontFamily: GEIST, fontSize: u * 2.4, color: "#bbb", fontWeight: 600 }}>REAL APP</div>
        </>
      ) : null}

      <Hook text="0 → 49 pieces in 3 minutes" at={0.05} until={1.6} y={h * 0.6} size={u * 9.5} />
      {done && t < T.close ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: h * 0.53, textAlign: "center", fontFamily: GEIST, fontWeight: 700, fontSize: u * 13, color: GOLD, transform: `rotate(-8deg) scale(${lerp(2, 1, sp(t, T.finish + 0.1, "headline"))})`, opacity: prog(t, T.finish + 0.1, 0.1), WebkitTextStroke: `${u}px #0E0F10`, paintOrder: "stroke fill" }}>NEW RECORD</div>
      ) : null}
      <Flash at={T.finish} dur={0.3} color={GOLD} />
      {/* CHECK: the recorded scan took about 6 min to 40 pieces; the line must use the real time */}
      <div style={{ position: "absolute", left: u * 3, bottom: u * 3, fontFamily: GEIST, fontSize: u * 2.6, color: "#FF9F43", fontWeight: 600, maxWidth: w * 0.6 }}>CHECK BEFORE REAL: use the real scan time (the recorded take was about 6 min to 40 pieces)</div>

      <Close at={T.close} line="Your whole closet, in minutes." dark />
      <BeatLabels beats={BEATS} title="4 · Speed run" />
    </AbsoluteFill>
  );
};

