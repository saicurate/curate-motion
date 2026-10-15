import React from "react";
import { Img, useCurrentFrame } from "remotion";
import { frameCount, frameSrc } from "./assets";

// Zee, the black plush kitten, from the zee-sharp-v1 pack's 720 px renders (30 fps, transparent).
// Each emotion has three clip assets: zee.<emotion>.intro.vN (rest → pose), .loop.vN, .outro.vN
// (pose → rest). Ported from marketing/videos/remotion/src/lib/Zee.tsx; frame counts now come
// from the catalog instead of a hard-coded table.

export const EMOTIONS = ["cheer", "curious", "excited", "focused", "happy", "hello", "idea", "idle", "listening", "love", "sleepy", "thinking"] as const;
export type Emotion = (typeof EMOTIONS)[number];

export type ZeeCue = {
  /** Frame (in the parent's time) where this cue starts. Put it on a beat: clock.frame(n). */
  at: number;
  emo: Emotion;
  /** Skip the intro and jump straight into the loop (a hard, on-beat cut). */
  cut?: boolean;
  /** Start the loop at this frame of it (so beat cuts don't all start on frame 1). */
  loopStart?: number;
  /** Play this emotion's outro back to rest (then hold its last frame). */
  outro?: boolean;
};

export const zeeId = (emo: Emotion, part: "intro" | "loop" | "outro", v = 1) => `zee.${emo}.${part}.v${v}`;

export const zeeFrame = (cues: ZeeCue[], frame: number, v = 1): string | null => {
  const active = [...cues].filter((c) => c.at <= frame).pop();
  if (!active) return null;
  const t = frame - active.at;
  if (active.outro) {
    const id = zeeId(active.emo, "outro", v);
    return frameSrc(id, Math.min(t, frameCount(id) - 1));
  }
  const intro = zeeId(active.emo, "intro", v);
  if (!active.cut && t < frameCount(intro)) return frameSrc(intro, t);
  const lt = (active.cut ? t : t - frameCount(intro)) + (active.loopStart ?? 0);
  return frameSrc(zeeId(active.emo, "loop", v), lt);
};

export const ZeeActor: React.FC<{
  cues: ZeeCue[];
  size: number;
  /** Pack version (the N in zee.<emotion>.<part>.vN). */
  v?: number;
  style?: React.CSSProperties;
  shadow?: boolean;
}> = ({ cues, size, v = 1, style, shadow = true }) => {
  const frame = useCurrentFrame();
  const s = zeeFrame(cues, frame, v);
  if (!s) return null;
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
      <Img src={s} style={{ position: "absolute", inset: 0, width: size, height: size }} />
    </div>
  );
};
