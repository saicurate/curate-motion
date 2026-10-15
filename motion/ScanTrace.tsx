import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { clamp } from "./theme";

// ScanTrace: a band of dots sweeps a rect (the app "reading" a photo), then a white outline
// traces the found piece. Ported from fx.tsx (ScanDots) + Pieces.tsx (outline). The scan is a
// motion flourish, not the pipeline: never label it with model or step names (RULES.md).

/** Scan dots: a band of small dots sweeping across a w x h rect (no percentages). */
export const ScanDots: React.FC<{ at: number; dur: number; w: number; h: number; x: number; y: number; color?: string; gap?: number }> = ({
  at,
  dur,
  w,
  h,
  x,
  y,
  color = "#FFFFFF",
  gap = 18,
}) => {
  const frame = useCurrentFrame();
  const t = (frame - at) / dur;
  if (t < 0 || t > 1.15) return null;
  const band = interpolate(t, [0, 1], [-0.3, 1.3]);
  const cols = Math.floor(w / gap);
  const rows = Math.floor(h / gap);
  const dots: React.ReactNode[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const u = c / cols;
      const d = Math.abs(u - band);
      const o = Math.max(0, 1 - d * 5) * (t > 1 ? 1 - (t - 1) / 0.15 : 1);
      if (o < 0.04) continue;
      dots.push(
        <div
          key={`${r}-${c}`}
          style={{ position: "absolute", left: c * gap + gap / 2, top: r * gap + gap / 2, width: 5, height: 5, borderRadius: 3, background: color, opacity: o }}
        />,
      );
    }
  }
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: `rgba(14,14,15,${0.28 * Math.min(1, t * 4) * (t > 1 ? 0 : 1)})` }} />
      {dots}
    </div>
  );
};

/** The white "trace" outline for a cutout image, 0..1 (pass as a CSS filter). */
export const traceFilter = (t: number) =>
  t > 0 ? `drop-shadow(0 0 ${2 + 4 * t}px rgba(255,255,255,${t})) drop-shadow(0 0 1px rgba(255,255,255,${t}))` : "";

/** Outline strength over time: rises after the scan passes. */
export const traceAt = (frame: number, at: number, dur = 8) => interpolate(frame, [at, at + dur], [0, 1], clamp);
