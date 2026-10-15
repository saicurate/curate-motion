import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { C, clamp, display, inOut, out } from "./theme";

// Round-2 effects. Several come from the founder's reference reel ("how to: Pop Off",
// references/whatsapp-2026-10-15-102224/): type-on words behind the subject, flash then a
// tilted print, scan dots + outline trace, a hand-drawn ellipse, a stroke drawn round the frame.

/** Where a point on a <Phone> screen lands on the canvas (mirrors Phone.tsx's CSS transform). */
export const projectOnPhone = (
  ph: { width: number; x: number; y: number; rx?: number; ry?: number; rz?: number; scale?: number },
  sx: number, // px from the screen's left edge
  sy: number, // px from the screen's top edge
) => {
  const h = ph.width * (2868 / 1320);
  const bezel = ph.width * 0.028;
  const s = ph.scale ?? 1;
  let x = (bezel + sx - ph.width / 2) * s;
  let y = (bezel + sy - h / 2) * s;
  let z = 0;
  const rz = ((ph.rz ?? 0) * Math.PI) / 180;
  const ry = ((ph.ry ?? 0) * Math.PI) / 180;
  const rx = ((ph.rx ?? 0) * Math.PI) / 180;
  [x, y] = [x * Math.cos(rz) - y * Math.sin(rz), x * Math.sin(rz) + y * Math.cos(rz)];
  [x, z] = [x * Math.cos(ry) + z * Math.sin(ry), -x * Math.sin(ry) + z * Math.cos(ry)];
  [y, z] = [y * Math.cos(rx) - z * Math.sin(rx), y * Math.sin(rx) + z * Math.cos(rx)];
  const P = 2600;
  const k = P / (P - z);
  return { x: ph.x + x * k, y: ph.y + y * k, k };
};

/** Words that type on letter by letter (picture first, words at ~1 s). */
export const TypeOn: React.FC<{
  text: string;
  at: number;
  size: number;
  perChar?: number;
  color?: string;
  style?: React.CSSProperties;
  until?: number;
}> = ({ text, at, size, perChar = 1.2, color = C.ink, style, until }) => {
  const frame = useCurrentFrame();
  if (frame < at || (until !== undefined && frame >= until)) return null;
  const n = Math.min(text.length, Math.floor((frame - at) / perChar) + 1);
  return (
    <div style={{ position: "absolute", ...display(size, color), whiteSpace: "pre-wrap", ...style }}>
      <span>{text.slice(0, n)}</span>
      <span style={{ opacity: 0 }}>{text.slice(n)}</span>
    </div>
  );
};

/** A white flash over everything (2 frames up, ~6 down). */
export const Flash: React.FC<{ at: number; strength?: number }> = ({ at, strength = 1 }) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [at - 1, at, at + 2, at + 8], [0, strength, strength * 0.85, 0], clamp);
  if (o <= 0) return null;
  return <div style={{ position: "absolute", inset: 0, background: "#FFFFFF", opacity: o }} />;
};

/** A print that lands tilted and sticks: from big + more tilt, overshoots, settles at `tilt`. */
export const printLand = (frame: number, at: number, tilt: number) => {
  const t = frame - at;
  const s = interpolate(t, [0, 7, 11, 15], [1.22, 0.97, 1.01, 1], { ...clamp, easing: out });
  const r = interpolate(t, [0, 7, 15], [tilt * 2.6, tilt * 0.8, tilt], { ...clamp, easing: out });
  const o = interpolate(t, [0, 2], [0, 1], clamp);
  return { s, r, o, on: t >= 0 };
};

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

/** A hand-drawn ellipse that draws itself on around (cx, cy). */
export const HandEllipse: React.FC<{ at: number; cx: number; cy: number; rx: number; ry: number; dur?: number; color?: string; width?: number; tilt?: number }> = ({
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

/** A stroke that draws all the way round a rounded rect (the frame, a phone, the selfie ring). */
export const DrawFrame: React.FC<{ at: number; x: number; y: number; w: number; h: number; r: number; dur?: number; width?: number; id: string }> = ({
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

/** A pop-out-and-return curve: 0 at rest, ~1.06 overshoot, 1 hold, back to 0. Times in frames. */
export const popCurve = (frame: number, at: number, hold = 16, rise = 6, back = 7) => {
  const t = frame - at;
  if (t < 0 || t > rise + hold + back) return 0;
  if (t <= rise) return interpolate(t, [0, rise * 0.7, rise], [0, 1.08, 1], { ...clamp, easing: out });
  if (t <= rise + hold) return 1;
  return interpolate(t, [rise + hold, rise + hold + back], [1, 0], { ...clamp, easing: inOut });
};
