import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Ground, Track } from "../lib/Ground";
import { EndCard } from "../lib/Kinetic";
import { Garment, GarmentShape } from "../lib/shapes";
import { beats, C, clamp, display, inOut, out, shadow } from "../lib/theme";
import { Zee } from "../lib/Zee";

// C3 "What do I wear today?" — motion test. A question typed huge, it drops into the
// composer, Zee thinks, a look lands and opens into a flat-lay, then a close-up note.
// Cut to "Lo-Fi 01" (Lily J, Mixkit) from 0:12, 75 bpm: a beat every 24 frames.
export const C3_FRAMES = 360;
const b = beats(75, 0.025);
const Q = "What do I wear today?";

const LOOK: { kind: Garment; color: string; x: number; y: number; s: number; r: number }[] = [
  { kind: "jacket", color: C.ink, x: 330, y: 760, s: 420, r: -8 },
  { kind: "knit", color: "#FFFFFF", x: 740, y: 700, s: 330, r: 6 },
  { kind: "trousers", color: "#C8C3BC", x: 520, y: 1180, s: 440, r: 3 },
  { kind: "sneaker", color: "#FFFFFF", x: 820, y: 1300, s: 280, r: -10 },
];

export const C3: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ── the question, typed big ──
  const typed = Math.floor(interpolate(frame, [4, 40], [0, Q.length], clamp));
  const caret = Math.floor(frame / 8) % 2 === 0;
  const drop = interpolate(frame, [b(2), b(3)], [0, 1], { ...clamp, easing: inOut });

  // ── the composer pill, then the question as her bubble ──
  const pillIn = interpolate(frame, [b(2), b(3)], [0, 1], { ...clamp, easing: out });
  const sent = interpolate(frame, [b(3) + 4, b(4)], [0, 1], { ...clamp, easing: inOut });

  // ── Zee thinks, lines arrive one per beat ──
  const thinkOn = frame >= b(4) && frame < b(7) + 10;

  // ── the look card lands ──
  const land = spring({ frame: frame - b(7), fps, config: { damping: 15, stiffness: 110 } });
  const fan = interpolate(frame, [b(9), b(10)], [0, 1], { ...clamp, easing: inOut });
  const note = interpolate(frame, [b(11), b(11) + 16], [0, 1], { ...clamp, easing: out });
  const leave = interpolate(frame, [b(12) + 6, b(12) + 20], [0, 1], { ...clamp, easing: inOut });

  return (
    <Ground>
      <Track file="mixkit-lo-fi-01-lily-j.mp3" fromSec={12} total={C3_FRAMES} />

      {/* the big question */}
      {drop < 1 ? (
        <div
          style={{
            position: "absolute",
            left: 90,
            top: 360,
            width: 900,
            ...display(170),
            transformOrigin: "0% 0%",
            transform: `translate(${drop * 60}px, ${drop * 1220}px) scale(${1 - drop * 0.78})`,
            opacity: 1 - drop,
          }}
        >
          {Q.slice(0, typed)}
          <span style={{ opacity: caret && typed < Q.length + 1 ? 1 : 0, fontWeight: 400, color: C.t3 }}>|</span>
        </div>
      ) : null}
      {frame < b(2) + 6 ? <Zee cues={[{ at: 10, emo: "listening" }]} size={330} style={{ left: 660, top: 1380, opacity: 1 - drop }} /> : null}

      {/* the composer */}
      {pillIn > 0 && sent < 1 ? (
        <div
          style={{
            position: "absolute",
            left: 70,
            top: 1640 + (1 - pillIn) * 200,
            width: 940,
            height: 128,
            borderRadius: 64,
            background: C.card,
            boxShadow: shadow.card,
            display: "flex",
            alignItems: "center",
            paddingLeft: 48,
            opacity: pillIn * (1 - sent),
            ...display(46),
            fontWeight: 400,
            letterSpacing: "-0.02em",
          }}
        >
          {Q}
          <div
            style={{
              position: "absolute",
              right: 14,
              top: 14,
              width: 100,
              height: 100,
              borderRadius: 50,
              background: C.ink,
              transform: `scale(${interpolate(frame, [b(3), b(3) + 4, b(3) + 10], [1, 0.84, 1], clamp)})`,
            }}
          >
            <svg viewBox="0 0 24 24" width={100} height={100}>
              <path d="M12 17V7M12 7l-4.5 4.5M12 7l4.5 4.5" stroke="#fff" strokeWidth={1.6} fill="none" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      ) : null}

      {/* her bubble at the top of the chat */}
      {sent > 0 && leave < 1 ? (
        <div
          style={{
            position: "absolute",
            right: 80,
            top: interpolate(sent, [0, 1], [1660, 260]) - interpolate(land, [0, 1], [0, 0]),
            padding: "30px 44px",
            borderRadius: 48,
            background: C.you,
            ...display(46),
            fontWeight: 400,
            letterSpacing: "-0.02em",
            opacity: interpolate(fan, [0, 1], [1, 0]),
          }}
        >
          {Q}
        </div>
      ) : null}

      {/* Zee thinking, with the lines coming in */}
      {thinkOn ? (
        <>
          <Zee cues={[{ at: b(4), emo: "thinking" }]} size={420} style={{ left: 40, top: 720 }} />
          {[0, 1, 2].map((i) => {
            const at = b(4.5 + i);
            if (frame < at) return null;
            const o = interpolate(frame, [at, at + 10], [0, 1], { ...clamp, easing: out });
            const w = [500, 400, 460][i];
            const sweep = ((frame - at) * 18) % 900;
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: 470,
                  top: 850 + i * 96,
                  width: w,
                  height: 44,
                  borderRadius: 22,
                  opacity: o * (i === 2 || frame < b(7) ? 1 : 0.5),
                  transform: `translateY(${(1 - o) * 20}px)`,
                  background: `linear-gradient(90deg, #C9CDD2 ${sweep - 300}px, #F2F3F5 ${sweep - 150}px, #C9CDD2 ${sweep}px)`,
                }}
              />
            );
          })}
        </>
      ) : null}

      {/* the look card */}
      {frame >= b(7) && leave < 1 ? (
        <div
          style={{
            position: "absolute",
            left: 110,
            top: 470,
            width: 860,
            height: 1060,
            borderRadius: 56,
            background: C.card,
            boxShadow: shadow.float,
            transform: `perspective(2400px) translateY(${(1 - land) * 900}px) rotateX(${(1 - land) * 28}deg)`,
            opacity: 1 - fan,
          }}
        />
      ) : null}
      {frame >= b(7) && leave < 1
        ? LOOK.map((p, i) => {
            // inside the card: a tidy 2 x 2; fanned: a loose flat-lay over the whole frame
            const cx = 110 + 215 + (i % 2) * 430;
            const cy = 470 + 270 + Math.floor(i / 2) * 520;
            const x = interpolate(fan, [0, 1], [cx, p.x]);
            const y = interpolate(fan, [0, 1], [cy, p.y]) + (1 - land) * 900;
            const s = interpolate(fan, [0, 1], [330, p.s]);
            const r = interpolate(fan, [0, 1], [0, p.r]);
            const lift = fan * Math.sin((frame + i * 20) / 16) * 8;
            const focus = i === 0 ? 1 : 1 - note * 0.6;
            return (
              <GarmentShape
                key={i}
                kind={p.kind}
                size={s}
                color={p.color}
                style={{
                  position: "absolute",
                  left: x - s / 2,
                  top: y - s / 2 + lift,
                  transform: `rotate(${r}deg)`,
                  opacity: focus * (1 - leave),
                  filter:
                    p.color === "#FFFFFF"
                      ? `drop-shadow(0 0 2px rgba(0,0,0,0.3)) drop-shadow(0 ${20 * fan}px ${24 * fan}px rgba(16,20,24,0.16))`
                      : `drop-shadow(0 ${20 * fan}px ${24 * fan}px rgba(16,20,24,0.18))`,
                }}
              />
            );
          })
        : null}
      {frame >= b(7) && frame < b(9) ? <Zee cues={[{ at: b(7), emo: "idea" }]} size={260} style={{ left: 780, top: 1450 }} /> : null}

      {/* a Style note: a close-up on the jacket's collar */}
      {note > 0 && leave < 1 ? (
        <>
          <div
            style={{
              position: "absolute",
              left: 330 - 40 + 120,
              top: 760 - 170 - 260,
              width: 380,
              height: 380,
              borderRadius: "50%",
              overflow: "hidden",
              background: C.you,
              border: "8px solid #FFFFFF",
              boxShadow: shadow.float,
              transform: `scale(${note})`,
              opacity: 1 - leave,
            }}
          >
            <GarmentShape kind="jacket" size={1300} color={C.ink} style={{ position: "absolute", left: -470, top: -60, transform: "rotate(-8deg)" }} />
          </div>
          <div style={{ position: "absolute", left: 120, top: 1520, width: 840, opacity: note * (1 - leave) }}>
            <div style={{ height: 30, width: 560, borderRadius: 15, background: C.ink, opacity: 0.85 }} />
            <div style={{ height: 24, width: 760, borderRadius: 12, background: C.line, marginTop: 22 }} />
            <div style={{ height: 24, width: 640, borderRadius: 12, background: C.line, marginTop: 14 }} />
          </div>
        </>
      ) : null}

      <EndCard at={b(12) + 16} line="From your own closet." />
    </Ground>
  );
};
