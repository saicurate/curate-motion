import React from "react";
import { Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { C, clamp, display, out, inOut } from "./theme";

/** Words that rise out of a mask one after another, then (optionally) leave. */
export const Words: React.FC<{
  text: string;
  at: number;
  size: number;
  stagger?: number;
  dur?: number;
  exitAt?: number;
  color?: string;
  align?: "left" | "center";
  style?: React.CSSProperties;
}> = ({ text, at, size, stagger = 3, dur = 16, exitAt, color = C.ink, align = "center", style }) => {
  const frame = useCurrentFrame();
  const words = text.split(" ");
  return (
    <div
      style={{
        position: "absolute",
        display: "flex",
        flexWrap: "wrap",
        justifyContent: align === "center" ? "center" : "flex-start",
        gap: `0 ${size * 0.24}px`,
        ...display(size, color),
        ...style,
      }}
    >
      {words.map((w, i) => {
        const s = at + i * stagger;
        const inY = interpolate(frame, [s, s + dur], [110, 0], { ...clamp, easing: out });
        const outY = exitAt === undefined ? 0 : interpolate(frame, [exitAt + i * 2, exitAt + i * 2 + 10], [0, -110], { ...clamp, easing: inOut });
        return (
          <span key={i} style={{ display: "inline-block", overflow: "hidden", paddingBottom: size * 0.12, marginBottom: -size * 0.12 }}>
            <span style={{ display: "inline-block", transform: `translateY(${inY + outY}%)` }}>{w}</span>
          </span>
        );
      })}
    </div>
  );
};

/** One big word that slams in on a beat (scale from large + blur), for "Tap." moments. */
export const Slam: React.FC<{ text: string; at: number; size: number; until?: number; color?: string; style?: React.CSSProperties }> = ({
  text,
  at,
  size,
  until,
  color = C.ink,
  style,
}) => {
  const frame = useCurrentFrame();
  if (frame < at || (until !== undefined && frame >= until)) return null;
  const t = frame - at;
  const scale = interpolate(t, [0, 5], [1.9, 1], { ...clamp, easing: out });
  const blur = interpolate(t, [0, 4], [14, 0], clamp);
  const opacity = interpolate(t, [0, 2], [0, 1], clamp);
  return (
    <div
      style={{
        position: "absolute",
        ...display(size, color),
        transform: `scale(${scale})`,
        filter: `blur(${blur}px)`,
        opacity,
        ...style,
      }}
    >
      {text}
    </div>
  );
};

/** The end card: the Curate logo and one line. */
export const EndCard: React.FC<{ at: number; line?: string; dark?: boolean }> = ({ at, line, dark = false }) => {
  const frame = useCurrentFrame();
  const t = frame - at;
  if (t < 0) return null;
  const o = interpolate(t, [0, 12], [0, 1], { ...clamp, easing: out });
  const y = interpolate(t, [0, 18], [40, 0], { ...clamp, easing: out });
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 70 }}>
      {line ? <Words text={line} at={at} size={86} stagger={3} color={dark ? "#F6F7F7" : C.ink} style={{ position: "relative", width: 1000 }} /> : null}
      <Img
        src={staticFile("brand/splash_logo.png")}
        style={{ width: 300, opacity: o, transform: `translateY(${y}px)`, filter: dark ? "invert(1)" : undefined }}
      />
    </div>
  );
};

/** The Curate logo alone, fading up at `y` (its centre). */
export const Logo: React.FC<{ at: number; y: number; width?: number; dark?: boolean }> = ({ at, y, width = 260, dark = false }) => {
  const frame = useCurrentFrame();
  const t = frame - at;
  if (t < 0) return null;
  const o = interpolate(t, [0, 12], [0, 1], { ...clamp, easing: out });
  const dy = interpolate(t, [0, 18], [30, 0], { ...clamp, easing: out });
  const h = width * (742 / 670);
  return (
    <Img
      src={staticFile("brand/splash_logo.png")}
      style={{ position: "absolute", left: 540 - width / 2, top: y - h / 2 + dy, width, opacity: o, filter: dark ? "invert(1)" : undefined }}
    />
  );
};
