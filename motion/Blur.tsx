import React, { createContext, useContext } from "react";
import { AbsoluteFill, Freeze, useCurrentFrame } from "remotion";

// motion/Blur.tsx: motion blur that doesn't echo (decisions/0011, proposed).
//
// Two layers, used together on fast moves:
// 1. <SubframeBlur>: real sub-frame accumulation. The scene is rendered `samples` times, each a
//    <Freeze> a fraction of a frame earlier across the shutter, and averaged exactly (layer i at
//    opacity 1/(i+1)). It gets rotation, scale, occlusion and curved paths right. Too few samples
//    on a fast move ECHO: you see N sharp copies. So `samples` can follow the speed (a function of
//    the frame): 1 when still (cheap), 8–16 on fast moves.
// 2. <DirectionalBlur>: a Gaussian along the analytic velocity (from motion/springs trackVel),
//    sized to the gap between two sub-frame samples, so the copies join into one smear.
//
// Rule of thumb (tools/critic's strip test checks it): the gap between samples, speed × shutter /
// samples, stays ≤ 3 px; DirectionalBlur covers that gap. samplesFor() picks the count.

const SampleCtx = createContext<{ i: number; n: number }>({ i: 0, n: 1 });

/** Which sub-frame sample this subtree is rendering (for unique SVG filter ids). */
export const useSample = () => useContext(SampleCtx);
/** A filter id that is unique per sub-frame sample. */
export const useBlurId = (name: string) => `${name}-s${useContext(SampleCtx).i}`;

/**
 * How many sub-frame samples a move needs so neighbouring samples sit ≤ maxGap px apart.
 * speed: px per frame (composition frames). shutter: fraction of a frame the shutter is open.
 */
export const samplesFor = (speed: number, shutter = 0.5, maxGap = 3, max = 16) => Math.max(1, Math.min(max, Math.ceil((Math.abs(speed) * shutter) / maxGap)));

export const SubframeBlur: React.FC<{
  /** A fixed count, or a function of the frame (follow the fastest move on screen). */
  samples: number | ((frame: number) => number);
  /** Fraction of a frame the shutter is open: 0.5 = a 180° shutter (film's default). */
  shutter?: number;
  children: React.ReactNode;
}> = ({ samples, shutter = 0.5, children }) => {
  const frame = useCurrentFrame();
  const n = Math.max(1, Math.round(typeof samples === "function" ? samples(frame) : samples));
  if (n === 1) return <AbsoluteFill>{children}</AbsoluteFill>;
  return (
    <AbsoluteFill>
      {Array.from({ length: n }, (_, i) => {
        // samples spread evenly over the open shutter, ending at the frame itself
        const t = frame - (shutter * (n - 1 - i)) / (n - 1);
        return (
          <AbsoluteFill key={i} style={{ opacity: 1 / (i + 1) }}>
            <SampleCtx.Provider value={{ i, n }}>
              <Freeze frame={Math.max(0, t)}>{children}</Freeze>
            </SampleCtx.Provider>
          </AbsoluteFill>
        );
      })}
    </AbsoluteFill>
  );
};

/**
 * A Gaussian blur along the direction of (vx, vy) only, sized by the speed.
 * vx, vy: velocity in px per frame. shutter: as SubframeBlur. Inside a SubframeBlur, the blur is
 * divided by the sample count (each sample only has to cover the gap to the next one).
 * Implemented by rotating into the velocity's frame, blurring along x, and rotating back. Wrap the
 * moving element only (size the box with `style`), not the whole frame: the filter costs per pixel.
 */
export const DirectionalBlur: React.FC<{
  name: string;
  vx: number;
  vy: number;
  shutter?: number;
  /** Cap on the blur's standard deviation, px. */
  max?: number;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ name, vx, vy, shutter = 0.5, max = 60, style, children }) => {
  const { n } = useSample();
  const id = useBlurId(name);
  const speed = Math.hypot(vx, vy);
  // a box of length L has σ = L/√12; the smear length is speed × shutter (÷ samples inside SubframeBlur)
  const sigma = Math.min(max, (speed * shutter) / Math.max(1, n) / Math.sqrt(12));
  if (sigma < 0.35) return <div style={{ position: "absolute", inset: 0, ...style }}>{children}</div>;
  const deg = (Math.atan2(vy, vx) * 180) / Math.PI;
  return (
    <div style={{ position: "absolute", inset: 0, transform: `rotate(${deg}deg)`, filter: `url(#${id})`, ...style }}>
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <filter id={id} x="-60%" y="-60%" width="220%" height="220%" colorInterpolationFilters="sRGB">
          <feGaussianBlur stdDeviation={`${sigma.toFixed(2)} 0`} edgeMode="none" />
        </filter>
      </svg>
      <div style={{ position: "absolute", inset: 0, transform: `rotate(${-deg}deg)` }}>{children}</div>
    </div>
  );
};
