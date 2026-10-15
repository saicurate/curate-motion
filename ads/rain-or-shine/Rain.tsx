import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, useFrameBox } from "../../motion";

// Rain on the glass (from motion test C9): fine streaks falling past the lens, beads sliding down
// the glass in front of everything, and soft out-of-focus lights behind. Pure drawing, no assets.

const rand = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/** Out-of-focus city lights behind the phone (monochrome, very soft). */
export const Bokeh: React.FC<{ opacity?: number }> = ({ opacity = 1 }) => {
  const frame = useCurrentFrame();
  const { w, h, u } = useFrameBox();
  return (
    <AbsoluteFill style={{ opacity }}>
      {Array.from({ length: 14 }).map((_, i) => {
        const r = u * (6 + rand(i + 40) * 12);
        const x = rand(i + 7) * w;
        const y = rand(i + 19) * h * 0.9 + Math.sin((frame + i * 30) / 70) * u;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x - r,
              top: y - r,
              width: r * 2,
              height: r * 2,
              borderRadius: "50%",
              background: "radial-gradient(closest-side, rgba(255,255,255,0.22), rgba(255,255,255,0.08) 60%, rgba(255,255,255,0))",
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/** Streaks + beads on the glass. `amount` 0..1 thins it out (drizzle → downpour). */
export const Rain: React.FC<{ amount?: number }> = ({ amount = 1 }) => {
  const frame = useCurrentFrame();
  const { w, h, u } = useFrameBox();
  const k = w / 1080;
  const streaks = Math.round(70 * amount);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {Array.from({ length: streaks }).map((_, i) => {
        const len = (70 + rand(i) * 120) * k;
        const speed = (60 + rand(i + 9) * 40) * k;
        const x0 = rand(i + 3) * (w + 240 * k) - 120 * k;
        const span = h + 600 * k;
        const y = ((frame * speed + rand(i + 5) * span) % span) - 300 * k;
        const near = rand(i + 77) > 0.8;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x0 - y * 0.12,
              top: y,
              width: (near ? 4 : 2.5) * k,
              height: len * (near ? 1.4 : 1),
              borderRadius: 3,
              background: `linear-gradient(rgba(255,255,255,0), rgba(255,255,255,${near ? 0.5 : 0.62}))`,
              transform: "rotate(7deg)",
              filter: near ? `blur(${1.5 * k}px)` : undefined,
            }}
          />
        );
      })}
      {/* beads on the glass, a few sliding */}
      {Array.from({ length: Math.round(40 * amount) }).map((_, i) => {
        const r = u * (0.6 + rand(i * 3) * 1.5);
        const x = rand(i * 7 + 1) * w;
        const slides = rand(i + 4) > 0.62;
        const y0 = rand(i * 11 + 2) * h;
        const y = (y0 + Math.max(0, frame - rand(i) * 50) * (slides ? 3.2 * k : 0.25 * k)) % (h + 60 * k);
        return (
          <div
            key={`d${i}`}
            style={{
              position: "absolute",
              left: x - r,
              top: y - r,
              width: r * 2,
              height: r * 2.3,
              borderRadius: "50% 50% 46% 46%",
              background: "radial-gradient(circle at 36% 30%, rgba(255,255,255,0.9), rgba(255,255,255,0.14) 46%, rgba(30,36,44,0.24) 100%)",
              boxShadow: `0 ${k}px ${2 * k}px rgba(16,20,26,0.28)`,
            }}
          />
        );
      })}
      <AbsoluteFill style={{ background: "rgba(225,231,237,0.10)" }} />
    </AbsoluteFill>
  );
};

/** A windshield-wiper blade sweeping from left to right about a pivot below the frame. `t` 0..1. */
export const Wiper: React.FC<{ t: number; pivot: { x: number; y: number }; length: number }> = ({ t, pivot, length }) => {
  const { u } = useFrameBox();
  if (t <= 0 || t >= 1) return null;
  const deg = -90 + t * 180;
  const bw = u * 2.6;
  return (
    <div
      style={{
        position: "absolute",
        left: pivot.x - bw / 2,
        top: pivot.y - length,
        width: bw,
        height: length,
        borderRadius: bw / 2,
        background: `linear-gradient(90deg, ${C.night}, ${C.strong} 45%, ${C.night})`,
        transformOrigin: "50% 100%",
        transform: `rotate(${deg}deg)`,
        boxShadow: `0 0 ${u * 3}px rgba(0,0,0,0.3)`,
      }}
    />
  );
};

/** The mask that reveals what the wiper has swept (pass to WebkitMaskImage). */
export const wipeMask = (t: number, pivot: { x: number; y: number }) => {
  const a = Math.max(0, Math.min(180, t * 180));
  return `conic-gradient(from 270deg at ${pivot.x}px ${pivot.y}px, #000 0deg, #000 ${a}deg, transparent ${a + 0.6}deg)`;
};
