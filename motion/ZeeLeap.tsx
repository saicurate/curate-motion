import React from "react";
import { AbsoluteFill, Img, interpolate, useCurrentFrame } from "remotion";
import { frameSrc } from "./assets";
import { useFrameBox } from "./formats";
import { clamp } from "./theme";
import { zeeFrame, type Emotion } from "./ZeeActor";

// Zee as a transition (motion test C7, "Zee wipe"). She is a black plush kitten, so her fur is a
// natural wipe: ZeeLeap flies her at the lens (or away from it) until her chest fills the frame,
// Fur guarantees full black at the peak, and ZeeWindow opens a Zee-shaped window onto the next
// scene that grows until it swallows the frame. Put the peak / the window's end on a beat.

/** Zee's chest in her 720 px frame: the point the leap zooms into. */
export const ZEE_CHEST = { x: 0.5, y: 0.69 };

/** Zee leaping at the lens (dir 1: from small at `from` to filling the frame) or away from it (dir -1). */
export const ZeeLeap: React.FC<{
  at: number;
  dur: number;
  dir: 1 | -1;
  /** Where her chest is when she is small (canvas px). */
  from: { x: number; y: number };
  /** Where the leap ends up at full size (default: the frame's centre). */
  to?: { x: number; y: number };
  size: number;
  emo?: Emotion;
  loopStart?: number;
}> = ({ at, dur, dir, from, to, size, emo = "excited", loopStart = 10 }) => {
  const frame = useCurrentFrame();
  const { cx: fx, cy: fy } = useFrameBox();
  const t = (frame - at) / dur;
  if (t < 0 || t > 1) return null;
  const k = dir === 1 ? Math.pow(t, 2.6) : Math.pow(1 - t, 2.6);
  const end = to ?? { x: fx, y: fy };
  const cx = interpolate(k, [0, 1], [from.x, end.x]);
  const cy = interpolate(k, [0, 1], [from.y, end.y]);
  const s = zeeFrame([{ at, emo, cut: true, loopStart }], frame) ?? "";
  return (
    <Img
      src={s}
      style={{
        position: "absolute",
        left: cx - size * ZEE_CHEST.x,
        top: cy - size * ZEE_CHEST.y,
        width: size,
        height: size,
        transformOrigin: `${ZEE_CHEST.x * 100}% ${ZEE_CHEST.y * 100}%`,
        transform: `scale(${1 + k * 24})`,
        filter: `blur(${(k * 7).toFixed(1)}px)`,
      }}
    />
  );
};

/** Fur black over everything: up over `up` frames to `at`, holds `hold`, then down over `down` (0 = stays). */
export const Fur: React.FC<{ at: number; up?: number; hold?: number; down?: number }> = ({ at, up = 4, hold = 0, down = 4 }) => {
  const frame = useCurrentFrame();
  let o = 0;
  if (frame < at) o = interpolate(frame, [at - up, at], [0, 1], clamp);
  else if (frame <= at + hold) o = 1;
  else o = down > 0 ? interpolate(frame, [at + hold, at + hold + down], [1, 0], clamp) : 1;
  if (o <= 0) return null;
  return <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 45%, #232020, #0d0d0d 70%)", opacity: o }} />;
};

/** The held frame whose silhouette is the window (Zee happy, mid-loop: ears up, round body). */
export const ZEE_WINDOW_FRAME = { id: "zee.happy.loop.v1", n: 39 };

/** Mount this from frame 0 so the window's mask image is decoded before it is used. */
export const ZeeWindowPreload: React.FC = () => (
  <Img src={frameSrc(ZEE_WINDOW_FRAME.id, ZEE_WINDOW_FRAME.n)} style={{ position: "absolute", left: 0, top: 0, width: 2, height: 2, opacity: 0 }} />
);

/**
 * A Zee-shaped window onto `children` that grows from `size` at `from` (her chest) until it fills
 * the frame, over [at, at + dur]. A dark rim of her silhouette leads it. Draw it over scene A;
 * after at + dur, show scene B plainly.
 */
export const ZeeWindow: React.FC<{ at: number; dur: number; from: { x: number; y: number }; size: number; w: number; h: number; children: React.ReactNode }> = ({ at, dur, from, size, w, h, children }) => {
  const frame = useCurrentFrame();
  if (frame < at || frame >= at + dur) return null;
  const mt = interpolate(frame, [at, at + dur], [0, 1], clamp);
  const mk = Math.pow(mt, 2.3);
  const grow = (Math.max(w, h) / size) * 4.2; // big enough that the window covers every corner
  const s = size * (1 + mk * grow);
  const cx = interpolate(mk, [0, 1], [from.x, w / 2]);
  const cy = interpolate(mk, [0, 1], [from.y, h / 2]);
  const url = frameSrc(ZEE_WINDOW_FRAME.id, ZEE_WINDOW_FRAME.n);
  const rim = s * 1.12;
  return (
    <>
      <Img
        src={url}
        style={{ position: "absolute", left: cx - rim * ZEE_CHEST.x, top: cy - rim * ZEE_CHEST.y, width: rim, height: rim, filter: "brightness(0)", opacity: 0.9 }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          WebkitMaskImage: `url(${url})`,
          WebkitMaskRepeat: "no-repeat",
          WebkitMaskSize: `${s}px ${s}px`,
          WebkitMaskPosition: `${cx - s * ZEE_CHEST.x}px ${cy - s * ZEE_CHEST.y}px`,
        }}
      >
        {children}
      </div>
    </>
  );
};
