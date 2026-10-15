import React from "react";
import { AbsoluteFill, Img, interpolate, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { src } from "./assets";
import { Words } from "./KineticType";
import { useFrameBox } from "./formats";
import { C, clamp, out } from "./theme";

// The stage every ad stands on: Ground (the Mist background), Track (the music, by id),
// Star (the four-point accent from the mark), EndCard and Logo (the brand, by id).
// Ported from Ground.tsx, Star.tsx and Kinetic.tsx; the 540-px centre is now the frame's.

export const Ground: React.FC<{ dark?: boolean; children?: React.ReactNode }> = ({ dark = false, children }) => (
  <AbsoluteFill
    style={{
      background: dark
        ? `radial-gradient(120% 70% at 50% 18%, #1c1d20 0%, ${C.night} 70%)`
        : `radial-gradient(120% 70% at 50% 18%, #FFFFFF 0%, ${C.ground} 62%, #ECEEEF 100%)`,
      overflow: "hidden",
    }}
  >
    {children}
  </AbsoluteFill>
);

/**
 * A music asset, started `fromSec` into the file (use clock.fromSec), faded in and out.
 * `duck` (optional) is a gain per frame, e.g. `(f) => duckGain(plan, f)` to dip under the voice.
 */
export const Track: React.FC<{ id: string; fromSec: number; total: number; fps?: number; fadeOut?: number; volume?: number; duck?: (frame: number) => number }> = ({
  id,
  fromSec,
  total,
  fps = 30,
  fadeOut = 24,
  volume = 0.9,
  duck,
}) => (
  <Audio
    src={src(id)}
    trimBefore={Math.round(fromSec * fps)}
    volume={(f) => volume * interpolate(f, [0, 4, total - fadeOut, total], [0, 1, 1, 0], clamp) * (duck ? duck(f) : 1)}
  />
);

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

const LOGO = "brand.curate.logo-splash.v1";

/** The Curate logo alone, fading up, centred at (cx, y). */
export const Logo: React.FC<{ at: number; y: number; width?: number; dark?: boolean }> = ({ at, y, width = 260, dark = false }) => {
  const frame = useCurrentFrame();
  const { cx } = useFrameBox();
  const t = frame - at;
  if (t < 0) return null;
  const o = interpolate(t, [0, 12], [0, 1], { ...clamp, easing: out });
  const dy = interpolate(t, [0, 18], [30, 0], { ...clamp, easing: out });
  const h = width * (742 / 670);
  return <Img src={src(LOGO)} style={{ position: "absolute", left: cx - width / 2, top: y - h / 2 + dy, width, opacity: o, filter: dark ? "invert(1)" : undefined }} />;
};

/** The end card: one line and the Curate logo. No store badges, no prices (RULES.md). */
export const EndCard: React.FC<{ at: number; line?: string; dark?: boolean }> = ({ at, line, dark = false }) => {
  const frame = useCurrentFrame();
  const { u } = useFrameBox();
  const t = frame - at;
  if (t < 0) return null;
  const o = interpolate(t, [0, 12], [0, 1], { ...clamp, easing: out });
  const y = interpolate(t, [0, 18], [40, 0], { ...clamp, easing: out });
  return (
    <AbsoluteFill style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: u * 6.5 }}>
      {line ? <Words text={line} at={at} size={u * 8} stagger={3} color={dark ? C.ground : C.ink} style={{ position: "relative", width: u * 92 }} /> : null}
      <Img src={src(LOGO)} style={{ width: u * 28, opacity: o, transform: `translateY(${y}px)`, filter: dark ? "invert(1)" : undefined }} />
    </AbsoluteFill>
  );
};
