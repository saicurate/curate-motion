import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Ground, Track } from "../lib/Ground";
import { EndCard, Slam } from "../lib/Kinetic";
import { Phone } from "../lib/Phone";
import { Garment, GarmentShape, PhotoTile } from "../lib/shapes";
import { beats, C, clamp, display, inOut, out } from "../lib/theme";
import { Zee } from "../lib/Zee";

// C4 "Two taps to a closet" — motion test. Tap, tap, a blur of photos, and the
// closet slams together on the drop.
// Cut to "Can't Get You Off My Mind" (Michael Ramir C., Mixkit) from 0:22: 150 bpm, drop at 3.55 s.
export const C4_FRAMES = 300;
const b = beats(150, 0.381); // b(8) = the drop

const GRID: { kind: Garment; color: string }[] = [
  { kind: "jacket", color: C.ink },
  { kind: "tee", color: "#FFFFFF" },
  { kind: "trousers", color: "#C8C3BC" },
  { kind: "bag", color: C.strong },
  { kind: "dress", color: C.ink },
  { kind: "sneaker", color: "#FFFFFF" },
  { kind: "knit", color: "#767A82" },
  { kind: "skirt", color: "#C8C3BC" },
  { kind: "tee", color: C.ink },
  { kind: "trousers", color: C.strong },
  { kind: "jacket", color: "#C8C3BC" },
  { kind: "bag", color: "#FFFFFF" },
];

const Ripple: React.FC<{ at: number; x: number; y: number }> = ({ at, x, y }) => {
  const frame = useCurrentFrame();
  const t = frame - at;
  if (t < 0 || t > 16) return null;
  const r = interpolate(t, [0, 16], [30, 170], { ...clamp, easing: out });
  return (
    <>
      <div style={{ position: "absolute", left: x - r, top: y - r, width: r * 2, height: r * 2, borderRadius: "50%", border: `6px solid ${C.ink}`, opacity: interpolate(t, [0, 16], [0.5, 0], clamp) }} />
      <div style={{ position: "absolute", left: x - 34, top: y - 34, width: 68, height: 68, borderRadius: "50%", background: "rgba(24,24,24,0.25)", opacity: interpolate(t, [0, 8], [1, 0], clamp) }} />
    </>
  );
};

export const C4: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const W = 640;
  const PY = 1100;
  const SW = W - 2 * W * 0.028;
  const screen = frame < b(3) ? "ask" : frame < b(5) ? "shield" : frame < b(8) ? "scan" : "closet";
  const tiltIn = interpolate(frame, [b(5), b(6)], [0, 1], { ...clamp, easing: inOut });
  const tiltOut = interpolate(frame, [b(8), b(9)], [0, 1], { ...clamp, easing: out });
  const tilt = tiltIn * (1 - tiltOut);
  const scroll = interpolate(frame, [b(5), b(8)], [0, 9000], { ...clamp, easing: (t) => t * t });
  const count = Math.round(interpolate(frame, [b(5), b(8)], [0, 1500], { ...clamp, easing: (t) => t * t }));
  const settle = interpolate(frame, [b(14), b(18)], [0, 1], { ...clamp, easing: inOut });
  const leave = interpolate(frame, [b(20), b(21)], [0, 1], { ...clamp, easing: inOut });
  const punch = interpolate(frame, [b(8), b(8) + 2, b(8) + 8], [1, 1.06, 1], clamp);
  const cell = (SW - 4 * 16) / 3;

  return (
    <Ground>
      <Track file="mixkit-cant-get-you-off-my-mind-michael-ramir-c.mp3" fromSec={22} total={C4_FRAMES} />
      <div style={{ position: "absolute", inset: 0, transform: `scale(${punch})` }}>
        <Phone
          width={W}
          y={PY - leave * 260}
          rx={tilt * 30 + settle * 8 * Math.sin(frame / 30)}
          ry={tilt * -24 + settle * 10 * Math.sin(frame / 40)}
          rz={tilt * 8}
          scale={(1 - tilt * 0.08) * (1 - leave * 0.3)}
          opacity={1 - leave}
        >
          {screen === "ask" ? (
            <>
              <Zee cues={[{ at: 0, emo: "curious", cut: true, loopStart: 8 }]} size={380} style={{ left: SW / 2 - 190, top: 360 }} />
              <div style={{ position: "absolute", left: 70, right: 70, top: 830, height: 96, borderRadius: 48, background: C.ink, transform: `scale(${interpolate(frame, [b(1), b(1) + 3, b(1) + 9], [1, 0.94, 1], clamp)})` }} />
              <div style={{ position: "absolute", left: 70, right: 70, top: 950, height: 96, borderRadius: 48, background: C.card, boxShadow: "0 2px 8px rgba(16,20,24,0.08)" }} />
            </>
          ) : null}
          {screen === "shield" ? (
            <>
              <svg viewBox="0 0 100 100" width={340} height={340} style={{ position: "absolute", left: SW / 2 - 170, top: 340, transform: `scale(${spring({ frame: frame - b(3), fps, config: { damping: 12 } })})` }}>
                <path d="M50 6 L86 20 V48 Q86 78 50 94 Q14 78 14 48 V20 Z" fill={C.ink} />
              </svg>
              <Zee cues={[{ at: b(3), emo: "happy", cut: true }]} size={230} shadow={false} style={{ left: SW / 2 + 40, top: 250 }} />
              <div style={{ position: "absolute", left: 90, right: 90, top: 760, height: 34, borderRadius: 17, background: C.line }} />
              <div style={{ position: "absolute", left: 140, right: 140, top: 814, height: 34, borderRadius: 17, background: C.line }} />
              <div style={{ position: "absolute", left: 70, right: 70, top: 1080, height: 96, borderRadius: 48, background: C.ink, transform: `scale(${interpolate(frame, [b(4), b(4) + 3, b(4) + 9], [1, 0.94, 1], clamp)})` }} />
            </>
          ) : null}
          {screen === "scan" ? (
            <div style={{ position: "absolute", inset: 0, filter: `blur(${interpolate(frame, [b(5), b(8)], [0, 7], clamp)}px)` }}>
              {Array.from({ length: 70 }).map((_, r) =>
                Array.from({ length: 4 }).map((__, c) => {
                  const t = (SW - 30) / 4;
                  const top = 6 + r * (t + 6) - (scroll % (70 * (t + 6) - 1400));
                  if (top < -t || top > 1500) return null;
                  return <PhotoTile key={`${r}-${c}`} w={t} h={t} seed={r * 3 + c} you={(r * 4 + c) % 11 === 3} radius={4} style={{ position: "absolute", left: 6 + c * (t + 6), top }} />;
                }),
              )}
            </div>
          ) : null}
          {screen === "closet" ? (
            <>
              <div style={{ position: "absolute", left: 26, top: 150, width: 280, height: 42, borderRadius: 12, background: C.ink, opacity: 0.9 }} />
              {GRID.map((p, i) => {
                const at = b(8) + i * 6;
                const s = spring({ frame: frame - at, fps, config: { damping: 9, stiffness: 260 } });
                const x = 16 + (i % 3) * (cell + 16);
                const y = 240 + Math.floor(i / 3) * (cell + 16);
                const bob = settle * Math.sin((frame + i * 11) / 13) * 7;
                return (
                  <div key={i} style={{ position: "absolute", left: x, top: y, width: cell, height: cell, borderRadius: 22, background: C.you }}>
                    {frame >= at ? (
                      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", transform: `translateY(${bob - (1 - s) * 80}px) scale(${interpolate(s, [0, 1], [1.6, 1])})`, opacity: Math.min(1, s * 2) }}>
                        <GarmentShape kind={p.kind} size={cell * 0.78} color={p.color} style={{ filter: p.color === "#FFFFFF" ? "drop-shadow(0 0 1.5px rgba(0,0,0,0.35))" : "drop-shadow(0 8px 8px rgba(16,20,24,0.14))" }} />
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </>
          ) : null}
        </Phone>

        {/* the taps */}
        <Ripple at={b(1)} x={540} y={PY - (W * 2.173) / 2 + W * 0.028 + 830 + 48} />
        <Ripple at={b(4)} x={540} y={PY - (W * 2.173) / 2 + W * 0.028 + 1080 + 48} />

        {/* the photo counter during the rush */}
        {screen === "scan" ? (
          <div style={{ position: "absolute", left: 0, right: 0, top: 120, textAlign: "center", ...display(150), fontVariantNumeric: "tabular-nums" }}>
            {count.toLocaleString("en-US")}
          </div>
        ) : null}

        {frame >= b(15) && leave < 1 ? <Zee cues={[{ at: b(15), emo: "cheer" }]} size={400} style={{ left: 640, top: 1420, opacity: 1 - leave }} /> : null}
      </div>
      <Slam text="Tap." at={b(1)} until={b(3)} size={170} style={{ left: 0, right: 0, top: 90, textAlign: "center" }} />
      <Slam text="Tap." at={b(4)} until={b(5)} size={170} style={{ left: 0, right: 0, top: 90, textAlign: "center" }} />
      <Slam text="Closet." at={b(8)} until={b(13)} size={170} style={{ left: 0, right: 0, top: 90, textAlign: "center" }} />
      <EndCard at={b(21)} line="Two taps. Whole closet." />
    </Ground>
  );
};
