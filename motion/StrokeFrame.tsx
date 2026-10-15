import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { clamp, inOut } from "./theme";

// StrokeFrame: a gradient stroke that draws all the way round a rounded rect (the frame,
// a phone, the selfie ring). Ported from fx.tsx (DrawFrame).

/** A stroke that draws all the way round a rounded rect (the frame, a phone, the selfie ring). */
export const StrokeFrame: React.FC<{ at: number; x: number; y: number; w: number; h: number; r: number; dur?: number; width?: number; id: string }> = ({
  at,
  x,
  y,
  w,
  h,
  r,
  dur = 20,
  width = 10,
  id,
}) => {
  const frame = useCurrentFrame();
  if (frame < at) return null;
  const t = interpolate(frame, [at, at + dur], [0, 1], { ...clamp, easing: inOut });
  const len = 2 * (w + h - 4 * r) + 2 * Math.PI * r;
  return (
    <svg style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }} width={x + w + width} height={y + h + width}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#181818" />
          <stop offset="55%" stopColor="#656565" />
          <stop offset="100%" stopColor="#B3B3B3" />
        </linearGradient>
      </defs>
      <rect x={x} y={y} width={w} height={h} rx={r} fill="none" stroke={`url(#${id})`} strokeWidth={width} strokeDasharray={len} strokeDashoffset={len * (1 - t)} strokeLinecap="round" />
    </svg>
  );
};
