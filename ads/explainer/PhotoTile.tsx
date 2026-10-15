import React from "react";
import { C } from "../../motion";

// A stand-in camera-roll tile: a soft tonal gradient, optionally a person-shaped silhouette
// ("a photo of you"). Only for the explainer's opening until Emma's real roll footage replaces it.
// Ported from the legacy motion tests' shapes.tsx, with theme tokens instead of hex.

const TONES: [string, string][] = [
  [C.you, C.line],
  [C.line, C.ground],
  [C.line, C.you],
  [C.ground, C.line],
  [C.you, C.card],
  [C.card, C.line],
];

export const PhotoTile: React.FC<{ w: number; h: number; seed: number; you?: boolean; radius?: number; style?: React.CSSProperties }> = ({
  w,
  h,
  seed,
  you = false,
  radius = 6,
  style,
}) => {
  const [a, b] = TONES[seed % TONES.length];
  const ang = (seed * 47) % 180;
  return (
    <div style={{ width: w, height: h, borderRadius: radius, background: `linear-gradient(${ang}deg, ${a}, ${b})`, position: "relative", overflow: "hidden", ...style }}>
      {you ? (
        <>
          <div style={{ position: "absolute", left: w * 0.38, top: h * 0.16, width: w * 0.24, height: w * 0.24, borderRadius: "50%", background: C.strong }} />
          <div style={{ position: "absolute", left: w * 0.27, top: h * 0.16 + w * 0.27, width: w * 0.46, height: h, borderRadius: `${w * 0.2}px ${w * 0.2}px 0 0`, background: C.ink }} />
        </>
      ) : null}
    </div>
  );
};

/** Deterministic pseudo-random in [0,1). */
export const rand = (n: number) => {
  const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};
