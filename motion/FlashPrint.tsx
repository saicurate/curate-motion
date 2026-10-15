import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { clamp, out } from "./theme";

// FlashPrint: a white flash, then a print that lands tilted, overshoots and sticks
// (from the founder's reference reel, references/ "how to: Pop Off"). Ported from fx.tsx.

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

/** Wrap anything (a look card, a photo) so it lands as a print on `at`, with a flash. */
export const FlashPrint: React.FC<{ at: number; tilt?: number; flash?: boolean; children: React.ReactNode; style?: React.CSSProperties }> = ({
  at,
  tilt = -4,
  flash = true,
  children,
  style,
}) => {
  const frame = useCurrentFrame();
  const p = printLand(frame, at, tilt);
  return (
    <>
      {p.on ? <div style={{ position: "absolute", transform: `scale(${p.s}) rotate(${p.r}deg)`, opacity: p.o, ...style }}>{children}</div> : null}
      {flash ? <Flash at={at} /> : null}
    </>
  );
};
