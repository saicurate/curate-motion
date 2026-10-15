import React from "react";
import { AbsoluteFill, Img, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { src } from "./assets";
import { useFrameBox } from "./formats";
import { Words } from "./KineticType";
import { C, clamp, GEIST, out } from "./theme";
import { ZeeActor, type Emotion } from "./ZeeActor";

// StoreEndCard: the real-ads end card. On white: an optional line, the Curate mark, "Curate",
// "On the App Store" (plain words, never Apple's badge), and Zee peeking up over a ledge.
// Everything sits inside the platform safe area (out of the bottom 20% and the right 15% of a
// 9:16 feed, where TikTok/Reels draw their captions and buttons). The mark is never rotated,
// recoloured or stretched (brand book): it only scales up from 92% and fades in.

const MARK = "brand.curate.splash-mark.v1"; // 1152 px square; the mark spans 482 px of it
const MARK_SPAN = 482 / 1152;

export const StoreEndCard: React.FC<{
  at: number;
  line?: string;
  /** Zee's mood as she peeks (null: no Zee). */
  zee?: Emotion | null;
  /** Frames after `at` before Zee peeks. */
  zeeDelay?: number;
  /** Fades the card's contents out from this frame (for loops). */
  outAt?: number;
  /** Zee leaves from this frame (e.g. she becomes a leap at the lens). */
  zeeUntil?: number;
  background?: string;
}> = ({ at, line, zee = "curious", zeeDelay = 10, outAt, zeeUntil, background = C.card }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { w, h, u, tall, safe } = useFrameBox();
  const t = frame - at;
  if (t < 0) return null;
  const gone = outAt === undefined ? 0 : interpolate(frame, [outAt, outAt + 8], [0, 1], clamp);
  const k = spring({ frame: t - 2, fps, config: { damping: 14, stiffness: 140 } });
  const pill = interpolate(t, [10, 20], [0, 1], { ...clamp, easing: out });
  // vertical rhythm, as fractions of the frame; 4:5 and 1:1 are shorter, so the block is tighter
  const top = tall ? 0.2 : 0.12;
  const markW = u * (tall ? 27 : 22);
  const yMark = h * (tall ? 0.37 : 0.33);
  const yName = yMark + markW * 0.62;
  const yPill = yName + u * (tall ? 13 : 11.5);
  const ledge = Math.min(h - safe.bottom - u * 1, yPill + u * (tall ? 52 : 38));
  const zSize = u * (tall ? 50 : 40);
  const peek = zee ? spring({ frame: t - zeeDelay, fps, config: { damping: 12, stiffness: 110 } }) : 0;
  const zTop = ledge - zSize * 0.62 * peek + zSize * 0.06;
  return (
    <AbsoluteFill style={{ background }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - gone }}>
        {line ? <Words text={line} at={at} size={u * (tall ? 7.6 : 6.8)} stagger={3} style={{ left: safe.side, right: safe.side, top: h * top }} /> : null}
        <div
          style={{
            position: "absolute",
            left: w / 2 - markW / 2,
            top: yMark - markW / 2,
            width: markW,
            height: markW,
            opacity: Math.min(1, k * 1.4),
            transform: `scale(${0.92 + 0.08 * k})`,
          }}
        >
          <Img src={src(MARK)} style={{ position: "absolute", width: markW / MARK_SPAN, height: markW / MARK_SPAN, left: -(markW / MARK_SPAN - markW) / 2, top: -(markW / MARK_SPAN - markW) / 2 }} />
        </div>
        <Words text="Curate" at={at + 5} size={u * (tall ? 10.5 : 9)} style={{ left: 0, right: 0, top: yName }} />
        <div style={{ position: "absolute", left: 0, right: 0, top: yPill, display: "flex", justifyContent: "center", opacity: pill, transform: `translateY(${(1 - pill) * u * 2}px)` }}>
          <div
            style={{
              fontFamily: GEIST,
              fontWeight: 500,
              fontSize: u * (tall ? 4.4 : 3.9),
              letterSpacing: "-0.01em",
              color: C.strong,
              padding: `${u * 1.6}px ${u * 4.2}px`,
              borderRadius: 999,
              border: `${Math.max(2, u * 0.28)}px solid ${C.line}`,
              background: C.card,
            }}
          >
            On the App Store
          </div>
        </div>
        {zee && (zeeUntil === undefined || frame < zeeUntil) ? (
          <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: ledge, overflow: "hidden" }}>
            <ZeeActor cues={[{ at: at + zeeDelay, emo: zee }]} size={zSize} shadow={false} style={{ left: w / 2 - zSize / 2, top: zTop }} />
          </div>
        ) : null}
        {zee ? <div style={{ position: "absolute", left: w * 0.3, right: w * 0.3, top: ledge, height: Math.max(2, u * 0.25), borderRadius: 2, background: C.line, opacity: peek }} /> : null}
      </div>
    </AbsoluteFill>
  );
};
