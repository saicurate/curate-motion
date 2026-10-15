import React from "react";
import { C } from "./theme";

// Abstract stand-ins for the motion tests ONLY. Real pieces and photos come from the
// marketing account's footage later; these just carry the motion.

export type Garment = "tee" | "trousers" | "dress" | "bag" | "sneaker" | "jacket" | "skirt" | "knit";

const PATHS: Record<Garment, string> = {
  tee: "M31 14 L43 9 Q50 16 57 9 L69 14 L88 31 L78 43 L70 37 L70 90 L30 90 L30 37 L22 43 L12 31 Z",
  jacket: "M32 10 L44 7 L50 30 L56 7 L68 10 L86 26 L90 86 L78 88 L74 44 L72 92 L28 92 L26 44 L22 88 L10 86 L14 26 Z",
  knit: "M30 12 L42 8 Q50 14 58 8 L70 12 L90 60 L80 64 L70 40 L70 90 L30 90 L30 40 L20 64 L10 60 Z",
  trousers: "M30 7 H70 L77 93 H58 L50 34 L42 93 H23 Z",
  dress: "M40 6 H60 L58 24 L78 93 H22 L42 24 Z",
  skirt: "M33 16 H67 L82 86 H18 Z",
  bag: "M20 40 H80 L86 90 H14 Z M34 40 Q34 14 50 14 Q66 14 66 40 L60 40 Q60 21 50 21 Q40 21 40 40 Z",
  sneaker: "M8 66 Q9 46 24 44 L42 50 Q56 55 72 56 Q92 59 92 74 V80 H8 Z",
};

export const GarmentShape: React.FC<{ kind: Garment; size: number; color?: string; style?: React.CSSProperties }> = ({
  kind,
  size,
  color = C.ink,
  style,
}) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={style}>
    <path d={PATHS[kind]} fill={color} fillRule="evenodd" />
  </svg>
);

/** A "photo" tile: a soft tonal gradient, optionally with a person-shaped silhouette ("a photo of you"). */
export const PhotoTile: React.FC<{
  w: number;
  h: number;
  seed: number;
  you?: boolean;
  radius?: number;
  style?: React.CSSProperties;
}> = ({ w, h, seed, you = false, radius = 6, style }) => {
  const tones = [
    ["#E4E6E9", "#C9CDD2"],
    ["#D9DCE0", "#F1F2F3"],
    ["#C2C6CC", "#E9EBEE"],
    ["#ECEDEF", "#D3D6DA"],
    ["#B9BEC5", "#DDE0E3"],
    ["#E0DDD8", "#C8C3BC"], // a warm, sandy one now and then
    ["#CFD3D8", "#AEB3BA"],
  ];
  const [a, b] = tones[seed % tones.length];
  const ang = (seed * 47) % 180;
  return (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: radius,
        background: `linear-gradient(${ang}deg, ${a}, ${b})`,
        position: "relative",
        overflow: "hidden",
        ...style,
      }}
    >
      {you ? (
        <>
          <div
            style={{
              position: "absolute",
              left: w * 0.38,
              top: h * 0.16,
              width: w * 0.24,
              height: w * 0.24,
              borderRadius: "50%",
              background: C.strong,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: w * 0.27,
              top: h * 0.16 + w * 0.27,
              width: w * 0.46,
              height: h,
              borderRadius: `${w * 0.2}px ${w * 0.2}px 0 0`,
              background: C.ink,
            }}
          />
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
