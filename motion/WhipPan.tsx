import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { clamp, inOut } from "./theme";

// WhipPan: a fast sideways camera whip from scene A to scene B, with horizontal motion blur
// at the peak. Put `at` (the middle of the whip) on a beat. Zee's sideways leap (C7) is the
// character version of this; use ZeeActor + WhipPan together for it.

export const WhipPan: React.FC<{
  at: number;
  /** Frames for the whole whip (half out, half in). */
  dur?: number;
  dir?: 1 | -1;
  a: React.ReactNode;
  b: React.ReactNode;
  /** Max blur, px at the peak. */
  blur?: number;
}> = ({ at, dur = 10, dir = 1, a, b, blur = 60 }) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [at - dur / 2, at + dur / 2], [0, 1], { ...clamp, easing: inOut });
  const showB = frame >= at;
  // A leaves to one side, B arrives from the other.
  const x = showB ? (1 - t) * 100 * dir : -t * 100 * dir;
  const peak = 1 - Math.abs(t - 0.5) * 2; // 0 → 1 → 0
  const filter = peak > 0.02 ? `blur(${(blur * peak).toFixed(1)}px)` : undefined;
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `translateX(${x}%) scaleX(${1 + peak * 0.08})`, filter }}>{showB ? b : a}</AbsoluteFill>
    </AbsoluteFill>
  );
};
