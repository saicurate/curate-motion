import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { C, clamp, inOut } from "./theme";

// Ellipse: a hand-drawn marker loop that draws itself on round a subject. Ported from fx.tsx.

/** A hand-drawn ellipse that draws itself on around (cx, cy). */
export const Ellipse: React.FC<{ at: number; cx: number; cy: number; rx: number; ry: number; dur?: number; color?: string; width?: number; tilt?: number }> = ({
  at,
  cx,
  cy,
  rx,
  ry,
  dur = 12,
  color = C.ink,
  width = 9,
  tilt = -6,
}) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [at, at + dur], [0, 1], { ...clamp, easing: inOut });
  if (frame < at) return null;
  // a slightly wobbly loop that overshoots its start, like a marker
  const pts: string[] = [];
  const N = 64;
  for (let i = 0; i <= N; i++) {
    const a = -Math.PI * 0.62 + (i / N) * Math.PI * 2.14;
    const wob = 1 + 0.035 * Math.sin(i * 0.9) + 0.06 * (i / N);
    pts.push(`${(cx + Math.cos(a) * rx * wob).toFixed(1)},${(cy + Math.sin(a) * ry * wob).toFixed(1)}`);
  }
  const len = Math.PI * (rx + ry) * 1.12;
  return (
    <svg style={{ position: "absolute", inset: 0, overflow: "visible", transform: `rotate(${tilt}deg)`, transformOrigin: `${cx}px ${cy}px` }} width="100%" height="100%">
      <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={len} strokeDashoffset={len * (1 - t)} />
    </svg>
  );
};
