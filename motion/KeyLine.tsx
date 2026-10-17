import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { spring } from "./springs";
import { GEIST } from "./theme";

// KeyLine: the brand's on-screen line (BRAND.md › Type): Geist Medium, the key phrase in Primary Black over
// Winter Gray body text, words rising out of a mask on the `headline` spring (lands hard, no bounce).
//
//   <KeyLine text={"POV: your cat has\n*opinions* about\nyour outfit."} at={0.35} size={104} />
//
// `*…*` marks the key phrase; "\n" breaks a line. Times are seconds (frame-pure: from the frame and fps).

const INK = "#181818"; // Primary Black (brand ramp)
const BODY = "#656565"; // Winter Gray (brand ramp)

type Word = { w: string; key: boolean };
const parse = (text: string): Word[][] => {
  let key = false;
  return text.split("\n").map((line) =>
    line
      .split(" ")
      .filter(Boolean)
      .map((raw) => {
        const starts = raw.startsWith("*");
        if (starts) key = true;
        const w = raw.replace(/\*/g, "");
        const word = { w, key };
        if (raw.endsWith("*") || (raw.includes("*") && !starts)) key = false;
        return word;
      }),
  );
};

export const KeyLine: React.FC<{
  text: string;
  /** Seconds: the first word starts rising. */
  at: number;
  size: number;
  /** Seconds between words. */
  stagger?: number;
  align?: "left" | "center" | "right";
  keyColor?: string;
  bodyColor?: string;
  /** Seconds: the words drop back into their masks (reverse order), or undefined to stay. */
  exitAt?: number;
  lineHeight?: number;
  letterSpacing?: string;
  weight?: number;
  style?: React.CSSProperties;
}> = ({ text, at, size, stagger = 0.07, align = "left", keyColor = INK, bodyColor = BODY, exitAt, lineHeight = 1.0, letterSpacing = "-0.04em", weight = 500, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const lines = parse(text);
  const total = lines.reduce((n, l) => n + l.length, 0);
  let i = 0;
  return (
    <div style={{ position: "absolute", fontFamily: GEIST, fontWeight: weight, fontSize: size, lineHeight, letterSpacing, textAlign: align, ...style }}>
      {lines.map((line, li) => (
        <div key={li} style={{ display: "flex", justifyContent: align === "center" ? "center" : align === "right" ? "flex-end" : "flex-start", gap: `0 ${size * 0.25}px` }}>
          {line.map((wd, wi) => {
            const n = i++;
            const up = spring(t - (at + n * stagger), "headline");
            const down = exitAt === undefined ? 0 : spring(t - (exitAt + (total - 1 - n) * stagger * 0.6), "headline");
            const y = (1 - up + down) * 1.08;
            return (
              <span key={wi} style={{ display: "inline-block", overflow: "hidden", padding: `0.06em 0.02em 0.16em`, margin: `-0.06em -0.02em -0.16em` }}>
                <span style={{ display: "inline-block", transform: `translateY(${(y * 100).toFixed(3)}%)`, color: wd.key ? keyColor : bodyColor, willChange: "transform" }}>{wd.w}</span>
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};
