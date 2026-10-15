import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { C, clamp, out } from "./theme";

// The four-point star from the Curate mark, as a motion accent.
export const Star: React.FC<{ at: number; x: number; y: number; size: number; color?: string; life?: number; spin?: number }> = ({
  at,
  x,
  y,
  size,
  color = C.ink,
  life = 18,
  spin = 45,
}) => {
  const frame = useCurrentFrame();
  const t = frame - at;
  if (t < 0 || t > life) return null;
  const s = interpolate(t, [0, life * 0.35, life], [0, 1, 0], { ...clamp, easing: out });
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      style={{ position: "absolute", left: x - size / 2, top: y - size / 2, transform: `scale(${s}) rotate(${interpolate(t, [0, life], [0, spin])}deg)` }}
    >
      <path d="M50 0 C54 34 66 46 100 50 C66 54 54 66 50 100 C46 66 34 54 0 50 C34 46 46 34 50 0 Z" fill={color} />
    </svg>
  );
};
