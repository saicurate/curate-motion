import React from "react";
import { Img, staticFile, useCurrentFrame } from "remotion";

// Zee, from the zee-sharp-v1 pack's own 720 px renders (30 fps, transparent).
// Each emotion has an intro (from rest into the pose), a loop, and an outro (back to rest).
export const ZEE_META = {
  cheer: { intro: 15, loop: 86, outro: 18 },
  curious: { intro: 15, loop: 64, outro: 16 },
  excited: { intro: 13, loop: 77, outro: 16 },
  focused: { intro: 17, loop: 86, outro: 18 },
  happy: { intro: 17, loop: 103, outro: 18 },
  hello: { intro: 17, loop: 86, outro: 16 },
  idea: { intro: 19, loop: 86, outro: 16 },
  idle: { intro: 17, loop: 86, outro: 18 },
  listening: { intro: 17, loop: 64, outro: 18 },
  love: { intro: 19, loop: 64, outro: 20 },
  sleepy: { intro: 21, loop: 86, outro: 22 },
  thinking: { intro: 17, loop: 64, outro: 18 },
} as const;
export type Emotion = keyof typeof ZEE_META;

export type ZeeCue = {
  /** Frame (in the parent's time) where this cue starts. */
  at: number;
  emo: Emotion;
  /** Skip the intro and jump straight into the loop (a hard, on-beat cut). */
  cut?: boolean;
  /** Start the loop at this frame of it (so beat cuts don't all start on frame 1). */
  loopStart?: number;
  /** Play this emotion's outro back to rest (then hold its last frame). */
  outro?: boolean;
};

const pad = (n: number) => String(n).padStart(4, "0");

export const zeeFrame = (cues: ZeeCue[], frame: number): string | null => {
  const active = [...cues].filter((c) => c.at <= frame).pop();
  if (!active) return null;
  const m = ZEE_META[active.emo];
  const t = frame - active.at;
  if (active.outro) {
    return `zee/${active.emo}/outro/${pad(Math.min(t, m.outro - 1) + 1)}.webp`;
  }
  if (!active.cut && t < m.intro) return `zee/${active.emo}/intro/${pad(t + 1)}.webp`;
  const lt = (active.cut ? t : t - m.intro) + (active.loopStart ?? 0);
  return `zee/${active.emo}/loop/${pad((lt % m.loop) + 1)}.webp`;
};

export const Zee: React.FC<{
  cues: ZeeCue[];
  size: number;
  style?: React.CSSProperties;
  shadow?: boolean;
}> = ({ cues, size, style, shadow = true }) => {
  const frame = useCurrentFrame();
  const src = zeeFrame(cues, frame);
  if (!src) return null;
  return (
    <div style={{ position: "absolute", width: size, height: size, ...style }}>
      {shadow ? (
        <div
          style={{
            position: "absolute",
            left: size * 0.26,
            width: size * 0.5,
            top: size * 0.865,
            height: size * 0.06,
            borderRadius: "50%",
            background: "radial-gradient(closest-side, rgba(16,20,24,0.22), rgba(16,20,24,0))",
          }}
        />
      ) : null}
      <Img src={staticFile(src)} style={{ position: "absolute", inset: 0, width: size, height: size }} />
    </div>
  );
};
