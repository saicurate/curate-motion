import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { C, clamp, display, out, inOut } from "./theme";

// KineticType: the type moves. Ported from marketing/videos/remotion/src/lib/Kinetic.tsx and fx.tsx.
// Words = rise out of a mask word by word; Slam = one word slams in on a beat; TypeOn = letter by letter.
// Geist Medium only (titles are never bold). Put `at` on a beat: clock.frame(n).

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
