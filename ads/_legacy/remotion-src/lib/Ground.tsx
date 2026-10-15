import React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import { Audio } from "@remotion/media";
import { staticFile } from "remotion";
import { C } from "./theme";

/** The Mist ground with a soft top light, like the app's chat. */
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

/** A track, started `fromSec` into the file, faded in and out. */
export const Track: React.FC<{ file: string; fromSec: number; total: number; fadeOut?: number; volume?: number }> = ({
  file,
  fromSec,
  total,
  fadeOut = 24,
  volume = 0.9,
}) => (
  <Audio
    src={staticFile(`music/${file}`)}
    trimBefore={Math.round(fromSec * 30)}
    volume={(f) =>
      volume *
      interpolate(f, [0, 4, total - fadeOut, total], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
    }
  />
);
