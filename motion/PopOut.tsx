import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { clamp, inOut, out } from "./theme";

// PopOut: a piece scales out of its source (a photo tile on the phone) with an overshoot,
// holds, and sinks back (15% → 100% in ~0.2 s). From C14 "Pop out" and the reference reel.

/** A pop-out-and-return curve: 0 at rest, ~1.06 overshoot, 1 hold, back to 0. Times in frames. */
export const popCurve = (frame: number, at: number, hold = 16, rise = 6, back = 7) => {
  const t = frame - at;
  if (t < 0 || t > rise + hold + back) return 0;
  if (t <= rise) return interpolate(t, [0, rise * 0.7, rise], [0, 1.08, 1], { ...clamp, easing: out });
  if (t <= rise + hold) return 1;
  return interpolate(t, [rise + hold, rise + hold + back], [1, 0], { ...clamp, easing: inOut });
};

/**
 * Moves `children` from a source point (where it sits in a photo) to a target point,
 * scaling from `fromScale` with popCurve's overshoot, then back. Positions are canvas px.
 */
export const PopOut: React.FC<{
  at: number;
  from: { x: number; y: number };
  to: { x: number; y: number };
  fromScale?: number;
  hold?: number;
  rise?: number;
  back?: number;
  sway?: number;
  children: React.ReactNode;
}> = ({ at, from, to, fromScale = 0.15, hold = 16, rise = 6, back = 7, sway = 1, children }) => {
  const frame = useCurrentFrame();
  const p = popCurve(frame, at, hold, rise, back);
  if (p <= 0) return null;
  const k = Math.min(1, p);
  const x = from.x + (to.x - from.x) * k;
  const y = from.y + (to.y - from.y) * k;
  const s = fromScale + (1 - fromScale) * p;
  const r = sway * 4 * Math.sin((frame - at) / 9) * k;
  return <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%, -50%) scale(${s}) rotate(${r}deg)` }}>{children}</div>;
};
