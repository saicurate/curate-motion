// ads/_demos/kit.tsx: the shared pieces of the rough concept animatics (pre-G2 exploration, gate
// "explore"). These are NOT studio ads: they exist to judge an idea, a hook, a story and its
// transitions fast. Rough on purpose. Every frame is still a pure function of t (frame / fps).
//
//   <BeatLabels beats={BEATS} title="1 · Nothing to wear" />  corner labels: the beat + the transition
//   <AiShot label="…" still={id} />                            a placeholder for a later AI-video shot
//   <Hook text="…" at={0.2} />                                 TikTok-native caption text
//   <MiniPhone> … </MiniPhone>                                 a plain phone shell for screenshots/footage
import React from "react";
import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig } from "remotion";
import { C, GEIST, pieceAspect, src, spring, useFrameBox } from "../../motion";

export const useT = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return f / fps;
};

export const c01 = (x: number) => Math.max(0, Math.min(1, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** 0→1 over [a, a+d], linear. */
export const prog = (t: number, a: number, d: number) => c01((t - a) / d);
/** Smoothstep 0→1 over [a, a+d]. */
export const ease = (t: number, a: number, d: number) => {
  const x = prog(t, a, d);
  return x * x * (3 - 2 * x);
};
/** Spring from t0 with a motion class (0 before t0). */
export const sp = (t: number, t0: number, cls: Parameters<typeof spring>[1] = "ui") => (t < t0 ? 0 : spring(t - t0, cls));

export type Beat = { from: number; to: number; label: string; transition?: string };

const fmt = (s: number) => (Number.isInteger(s) ? `${s}` : s.toFixed(1));

/** The review labels: which beat we are in (big, top left), the transition idea (yellow), the clock (top right). */
export const BeatLabels: React.FC<{ beats: Beat[]; title: string }> = ({ beats, title }) => {
  const t = useT();
  const { u, w } = useFrameBox();
  const b = beats.find((x) => t >= x.from && t < x.to) ?? beats[beats.length - 1];
  const tr = beats.find((x) => x.transition && t >= x.from && t < x.to)?.transition;
  const box: React.CSSProperties = { fontFamily: GEIST, fontWeight: 600, borderRadius: u * 1.4, padding: `${u * 1}px ${u * 1.8}px`, display: "inline-block", lineHeight: 1.15 };
  return (
    <AbsoluteFill style={{ pointerEvents: "none", zIndex: 100 }}>
      <div style={{ position: "absolute", left: u * 3, top: u * 3, maxWidth: w - u * 22, display: "flex", flexDirection: "column", gap: u * 1.2, alignItems: "flex-start" }}>
        <div style={{ ...box, fontSize: u * 2.6, background: "rgba(0,0,0,.55)", color: "#fff", fontWeight: 500 }}>ROUGH DEMO · {title}</div>
        <div style={{ ...box, fontSize: u * 4.4, background: "#111", color: "#fff" }}>
          {b.label} <span style={{ opacity: 0.6, fontWeight: 500 }}>{fmt(b.from)}–{fmt(b.to)} s</span>
        </div>
        {tr ? <div style={{ ...box, fontSize: u * 3.4, background: "#FFE14D", color: "#111" }}>TRANSITION: {tr}</div> : null}
      </div>
      <div style={{ position: "absolute", right: u * 3, top: u * 3, ...box, fontSize: u * 3, background: "rgba(0,0,0,.55)", color: "#fff", fontVariantNumeric: "tabular-nums" }}>{t.toFixed(1)} s</div>
    </AbsoluteFill>
  );
};

/** A placeholder for a real-world shot that will be AI video later: grey stripes + a label (and an optional still under it). */
export const AiShot: React.FC<{ label: string; model?: string; still?: string; stillOpacity?: number; style?: React.CSSProperties; children?: React.ReactNode; labelY?: number }> = ({
  label,
  model = "Veo / Kling / Seedance",
  still,
  stillOpacity = 0.55,
  style,
  children,
  labelY = 0.78,
}) => {
  const { u, h } = useFrameBox();
  return (
    <AbsoluteFill style={{ background: "#9EA3A8", overflow: "hidden", ...style }}>
      <AbsoluteFill style={{ background: "repeating-linear-gradient(45deg, rgba(255,255,255,.10) 0 28px, rgba(0,0,0,.05) 28px 56px)" }} />
      {still ? <Img src={src(still)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: stillOpacity, filter: "grayscale(.35)" }} /> : null}
      {children}
      <div
        style={{
          position: "absolute",
          left: u * 6,
          right: u * 6,
          top: h * labelY,
          fontFamily: GEIST,
          textAlign: "center",
          color: "#fff",
          background: "rgba(20,22,25,.72)",
          borderRadius: u * 2,
          padding: `${u * 1.6}px ${u * 2}px`,
          border: "2px dashed rgba(255,255,255,.7)",
        }}
      >
        <div style={{ fontSize: u * 2.6, fontWeight: 600, letterSpacing: ".08em" }}>AI VIDEO SHOT LATER · {model}</div>
        <div style={{ fontSize: u * 3.4, fontWeight: 500, marginTop: u * 0.6, lineHeight: 1.2 }}>{label}</div>
      </div>
    </AbsoluteFill>
  );
};

/** TikTok-native caption: white, heavy outline, lands with the headline spring. */
export const Hook: React.FC<{ text: string; at: number; y: number; size?: number; until?: number; color?: string; stroke?: string; style?: React.CSSProperties }> = ({
  text,
  at,
  y,
  size,
  until = 1e9,
  color = "#fff",
  stroke = "#111",
  style,
}) => {
  const t = useT();
  const { u, w } = useFrameBox();
  if (t < at || t > until) return null;
  const s = sp(t, at, "headline");
  const fs = size ?? u * 8.5;
  return (
    <div
      style={{
        position: "absolute",
        left: u * 5,
        width: w - u * 10,
        top: y,
        textAlign: "center",
        fontFamily: GEIST,
        fontWeight: 600,
        fontSize: fs,
        lineHeight: 1.05,
        letterSpacing: "-0.02em",
        color,
        WebkitTextStroke: `${fs * 0.07}px ${stroke}`,
        paintOrder: "stroke fill",
        textShadow: `0 ${fs * 0.06}px ${fs * 0.15}px rgba(0,0,0,.35)`,
        transform: `scale(${lerp(1.35, 1, s)})`,
        opacity: c01(s * 2),
        ...style,
      }}
    >
      {text}
    </div>
  );
};

/** A plain phone shell (no 3D), centred at (x, y), `width` wide, children fill the screen. */
export const MiniPhone: React.FC<{ x: number; y: number; width: number; rot?: number; scale?: number; opacity?: number; children?: React.ReactNode }> = ({ x, y, width, rot = 0, scale = 1, opacity = 1, children }) => {
  const h = width * (2868 / 1320);
  const b = width * 0.03;
  return (
    <div
      style={{
        position: "absolute",
        left: x - width / 2,
        top: y - h / 2,
        width,
        height: h,
        borderRadius: width * 0.14,
        background: "#111",
        padding: b,
        opacity,
        transform: `rotate(${rot}deg) scale(${scale})`,
        boxShadow: "0 30px 80px rgba(0,0,0,.35)",
      }}
    >
      <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: width * 0.115, overflow: "hidden", background: C.appGround }}>{children}</div>
    </div>
  );
};

/** A screenshot asset filling its parent. */
export const Shot: React.FC<{ id: string; style?: React.CSSProperties }> = ({ id, style }) => (
  <Img src={src(id)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", ...style }} />
);

/** The closing card: one line + the Curate logo (no badges, no prices: RULES.md). */
export const Close: React.FC<{ at: number; line: string; sub?: string; dark?: boolean }> = ({ at, line, sub, dark = false }) => {
  const t = useT();
  const { u, w, h } = useFrameBox();
  if (t < at) return null;
  const s = sp(t, at, "panel");
  const ink = dark ? "#fff" : C.ink;
  return (
    <AbsoluteFill style={{ background: dark ? `rgba(14,14,15,${0.92 * s})` : `rgba(246,247,247,${0.94 * s})`, zIndex: 50 }}>
      <div style={{ position: "absolute", left: u * 8, width: w - u * 16, top: h * 0.4 + (1 - s) * u * 6, opacity: s, textAlign: "center", fontFamily: GEIST, fontWeight: 500, fontSize: u * 7.6, letterSpacing: "-0.035em", lineHeight: 1.05, color: ink }}>
        {line}
        {sub ? <div style={{ fontSize: u * 3.6, color: dark ? "#bbb" : C.t2, marginTop: u * 2.4, letterSpacing: "-0.01em" }}>{sub}</div> : null}
      </div>
      <Img src={src("brand.curate.logo-splash.v1")} style={{ position: "absolute", left: (w - u * 24) / 2, top: h * 0.62, width: u * 24, opacity: c01((t - at - 0.3) * 3), filter: dark ? "invert(1)" : undefined }} />
    </AbsoluteFill>
  );
};

/** A white flash, peaking at `at`. */
export const Flash: React.FC<{ at: number; dur?: number; color?: string }> = ({ at, dur = 0.25, color = "#fff" }) => {
  const t = useT();
  const x = (t - at) / dur;
  if (x < -0.15 || x > 1) return null;
  const o = x < 0 ? 1 + x / 0.15 : 1 - x;
  return <AbsoluteFill style={{ background: color, opacity: c01(o), zIndex: 60 }} />;
};

/** Every demo's music: the track, and gain per frame (for hard music stops on a freeze). */
export const SFX_NOTE = "sfx muxed after render: ads/_demos/sound.ts writes out/<slug>.wav, ads/_demos/render.ts mixes it in";

/** Just the "AI VIDEO SHOT LATER" tag (no grey box), for a code-faked moment that becomes AI video later. */
export const AiTag: React.FC<{ label: string; model?: string; y: number }> = ({ label, model = "Veo / Kling / Seedance", y }) => {
  const { u } = useFrameBox();
  return (
    <div style={{ position: "absolute", left: u * 6, right: u * 6, top: y, fontFamily: GEIST, textAlign: "center", color: "#fff", background: "rgba(20,22,25,.72)", borderRadius: u * 2, padding: `${u * 1.4}px ${u * 2}px`, border: "2px dashed rgba(255,255,255,.7)", zIndex: 40 }}>
      <div style={{ fontSize: u * 2.6, fontWeight: 600, letterSpacing: ".08em" }}>AI VIDEO SHOT LATER · {model}</div>
      <div style={{ fontSize: u * 3.2, fontWeight: 500, marginTop: u * 0.5, lineHeight: 1.2 }}>{label}</div>
    </div>
  );
};

/** A garment cut-out centred at (x, y), `h` tall. */
export const Cut: React.FC<{ id: string; x: number; y: number; h: number; rot?: number; scale?: number; opacity?: number; filter?: string; origin?: string; transform?: string; children?: React.ReactNode }> = ({
  id,
  x,
  y,
  h,
  rot = 0,
  scale = 1,
  opacity = 1,
  filter = "drop-shadow(0 10px 14px rgba(0,0,0,.22))",
  origin = "50% 50%",
  transform = "",
  children,
}) => {
  const w = h * pieceAspect(id);
  return (
    <div style={{ position: "absolute", left: x - w / 2, top: y - h / 2, width: w, height: h, opacity, transform: `${transform} rotate(${rot}deg) scale(${scale})`, transformOrigin: origin }}>
      {children}
      <Img src={src(id, "cutout")} style={{ width: w, height: h, filter }} />
    </div>
  );
};
