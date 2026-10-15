import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Ground, Track } from "../lib/Ground";
import { EndCard } from "../lib/Kinetic";
import { Phone } from "../lib/Phone";
import { GarmentShape, Garment, PhotoTile, rand } from "../lib/shapes";
import { beats, C, clamp, inOut, out, shadow } from "../lib/theme";
import { Zee } from "../lib/Zee";

// C1 "Your wardrobe is already in your photos" — motion test (Zee + abstract shapes only).
// Cut to "Cat Walk" (Arulo, Mixkit), from 0:28 so its drop lands at 1.5 s, on the lock-on.
export const C1_FRAMES = 330;
const b = beats(130, 1.5); // b(0) = the drop

const SCREEN_W = 640 - 2 * 640 * 0.028;
const COLS = 4;
const GAP = 6;
const TILE = (SCREEN_W - GAP * (COLS + 1)) / COLS;
const YOU_ROW = 18;
const YOU_COL = 1;
const RING_Y = 640;
const STOP = YOU_ROW * (TILE + GAP) + GAP + TILE / 2 - RING_Y;

const PIECES: { kind: Garment; color: string; x: number; y: number }[] = [
  { kind: "jacket", color: C.ink, x: 250, y: 560 },
  { kind: "trousers", color: "#C8C3BC", x: 830, y: 640 },
  { kind: "bag", color: C.strong, x: 230, y: 1330 },
  { kind: "sneaker", color: "#FFFFFF", x: 850, y: 1290 },
];
const MORE: { kind: Garment; color: string }[] = [
  { kind: "tee", color: "#FFFFFF" },
  { kind: "dress", color: C.strong },
  { kind: "knit", color: "#C8C3BC" },
  { kind: "skirt", color: C.ink },
  { kind: "tee", color: "#767A82" },
];

const PieceCard: React.FC<{ kind: Garment; color: string; size: number; style?: React.CSSProperties }> = ({ kind, color, size, style }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size * 0.16,
      background: C.card,
      boxShadow: shadow.card,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      ...style,
    }}
  >
    <GarmentShape kind={kind} size={size * 0.72} color={color} style={{ filter: color === "#FFFFFF" ? "drop-shadow(0 0 1.5px rgba(0,0,0,0.35))" : undefined }} />
  </div>
);

export const C1: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ── S1: the photo wall racing, then stopping on a photo of you ──────────────
  const scroll = interpolate(frame, [0, b(0) - 6], [0, STOP], { ...clamp, easing: (t) => 1 - Math.pow(1 - t, 3.2) });
  const speed = Math.abs(
    interpolate(frame + 1, [0, b(0) - 6], [0, STOP], { ...clamp, easing: (t) => 1 - Math.pow(1 - t, 3.2) }) - scroll,
  );
  const phoneOut = interpolate(frame, [b(0), b(0) + 22], [0, 1], { ...clamp, easing: inOut });
  const ringX = interpolate(frame, [0, 14, 28, b(0) - 6], [430, 150, 380, GAP + YOU_COL * (TILE + GAP) + TILE / 2], { ...clamp, easing: inOut });
  const lock = spring({ frame: frame - (b(0) - 6), fps, config: { damping: 9, stiffness: 220 } });
  const dim = interpolate(frame, [b(0) - 6, b(0)], [0, 0.55], clamp);

  // ── S2: that photo flies out of the phone, up big ──────────────────────────
  const fly = spring({ frame: frame - b(0), fps, config: { damping: 18, stiffness: 120 } });
  const heroW = interpolate(fly, [0, 1], [150, 600]);
  const heroX = interpolate(fly, [0, 1], [420, 540]);
  const heroY = interpolate(fly, [0, 1], [930, 930]);
  const heroRot = interpolate(fly, [0, 1], [-8, 0]);
  const heroLeave = interpolate(frame, [b(7), b(8.5)], [1, 0], { ...clamp, easing: inOut });

  // ── S4: the wardrobe phone rises; pieces land in its grid ──────────────────
  const rise = interpolate(frame, [b(7), b(9.5)], [2700, 1000], { ...clamp, easing: out });
  const endUp = interpolate(frame, [b(15), b(16.5)], [0, 1], { ...clamp, easing: inOut });
  const cell = (SCREEN_W - 4 * 18) / 3;

  // a tiny camera punch on the drop
  const punch = interpolate(frame, [b(0), b(0) + 2, b(0) + 8], [1, 1.035, 1], clamp);

  return (
    <Ground>
      <Track file="mixkit-cat-walk-arulo.mp3" fromSec={28} total={C1_FRAMES} />
      <div style={{ position: "absolute", inset: 0, transform: `scale(${punch})` }}>
        {/* S1 phone */}
        {frame < b(0) + 24 ? (
          <Phone
            width={640}
            x={interpolate(phoneOut, [0, 1], [560, 600])}
            y={interpolate(phoneOut, [0, 1], [1010, 1500])}
            rx={interpolate(phoneOut, [0, 1], [16, 40])}
            ry={-18}
            rz={interpolate(phoneOut, [0, 1], [5, 12])}
            scale={interpolate(phoneOut, [0, 1], [1, 0.7])}
            opacity={1 - phoneOut}
          >
            <div style={{ position: "absolute", inset: 0, filter: `blur(${Math.min(speed * 0.06, 4)}px)` }}>
              {Array.from({ length: 24 }).map((_, r) =>
                Array.from({ length: COLS }).map((__, c) => {
                  const top = GAP + r * (TILE + GAP) - scroll + 110;
                  if (top < -TILE || top > 1400) return null;
                  const isYou = r === YOU_ROW && c === YOU_COL;
                  const youish = !isYou && rand(r * 7 + c) > 0.95;
                  if (isYou && frame >= b(0)) return null;
                  return (
                    <PhotoTile
                      key={`${r}-${c}`}
                      w={TILE}
                      h={TILE}
                      seed={r * 5 + c * 3}
                      you={isYou || youish}
                      radius={4}
                      style={{ position: "absolute", left: GAP + c * (TILE + GAP), top }}
                    />
                  );
                }),
              )}
            </div>
            <div style={{ position: "absolute", inset: 0, background: `rgba(246,247,247,${dim})` }} />
            {/* the magnifier */}
            <div
              style={{
                position: "absolute",
                left: ringX - 95,
                top: RING_Y + 110 - 95,
                width: 190,
                height: 190,
                borderRadius: "50%",
                border: "8px solid #FFFFFF",
                boxShadow: "0 10px 30px rgba(16,20,24,0.25), inset 0 0 0 2px rgba(16,20,24,0.08)",
                transform: `scale(${frame >= b(0) - 6 ? 1 + 0.16 * (1 - lock) + 0.04 : 1})`,
              }}
            />
            <Zee cues={[{ at: 0, emo: "focused", cut: true, loopStart: 20 }]} size={230} shadow={false} style={{ left: ringX + 40, top: RING_Y + 110 - 30 }} />
          </Phone>
        ) : null}

        {/* S2/S3 hero photo */}
        {frame >= b(0) && heroLeave > 0 ? (
          <div
            style={{
              position: "absolute",
              left: heroX - heroW / 2,
              top: heroY - (heroW * 1.33) / 2,
              transform: `rotate(${heroRot}deg) scale(${interpolate(heroLeave, [0, 1], [0.6, 1])})`,
              opacity: heroLeave,
              boxShadow: shadow.float,
              borderRadius: 28,
            }}
          >
            <PhotoTile w={heroW} h={heroW * 1.33} seed={YOU_ROW * 5 + YOU_COL * 3} you radius={28} />
          </div>
        ) : null}

        {frame >= b(1.5) && frame < b(8) ? (
          <Zee
            cues={[
              { at: b(1.5), emo: "excited" },
              { at: b(6), emo: "happy", cut: true },
            ]}
            size={300}
            style={{ left: 390, top: 1460 }}
          />
        ) : null}

        {/* S4 the wardrobe phone */}
        {frame >= b(7) ? (
          <Phone
            width={640}
            y={rise - endUp * 300}
            rx={interpolate(frame, [b(7), b(11), b(15)], [22, 6, 2], clamp)}
            ry={interpolate(frame, [b(7), b(15)], [12, -6], clamp)}
            scale={1 - endUp * 0.25}
            opacity={1 - endUp}
          >
            {Array.from({ length: 9 }).map((_, i) => {
              const p = i < 4 ? PIECES[i] : MORE[i - 4];
              const landAt = i < 4 ? b(9) + i * 3 : b(10) + (i - 4) * 5;
              const pop = spring({ frame: frame - landAt, fps, config: { damping: 10, stiffness: 200 } });
              const bob = Math.sin((frame + i * 13) / 14) * 6;
              const x = 18 + (i % 3) * (cell + 18);
              const y = 300 + Math.floor(i / 3) * (cell + 18) - (640 * 2.173) / 2 + (640 * 2.173) / 2 - 0;
              return (
                <div key={i} style={{ position: "absolute", left: x, top: y, width: cell, height: cell, borderRadius: 22, background: C.you }}>
                  {frame >= landAt ? (
                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", transform: `translateY(${bob}px) scale(${pop})` }}>
                      <GarmentShape kind={p.kind} size={cell * 0.78} color={p.color} style={{ filter: p.color === "#FFFFFF" ? "drop-shadow(0 0 1.5px rgba(0,0,0,0.35))" : "drop-shadow(0 10px 10px rgba(16,20,24,0.14))" }} />
                    </div>
                  ) : null}
                </div>
              );
            })}
            {/* a title bar block standing in for the Wardrobe header */}
            <div style={{ position: "absolute", left: 24, top: 150, width: 260, height: 40, borderRadius: 12, background: C.ink, opacity: 0.9 }} />
            <div style={{ position: "absolute", left: 24, top: 206, width: 180, height: 22, borderRadius: 8, background: C.line }} />
          </Phone>
        ) : null}
        {/* S3 pieces lift out, one per two beats */}
        {PIECES.map((p, i) => {
          const at = b(1.5 + i * 1.5);
          if (frame < at) return null;
          const s = spring({ frame: frame - at, fps, config: { damping: 12, stiffness: 140 } });
          // S4: fly into the grid cell i of the rising phone
          const go = interpolate(frame, [b(7.5) + i * 3, b(9) + i * 3], [0, 1], { ...clamp, easing: inOut });
          const gx = 540 - SCREEN_W / 2 + 18 + (i % 3) * (cell + 18) + cell / 2;
          const gy = rise - (640 * 2.173) / 2 + 300 + Math.floor(i / 3) * (cell + 18) + cell / 2;
          const x = interpolate(go, [0, 1], [interpolate(s, [0, 1], [540, p.x]), gx]);
          const y = interpolate(go, [0, 1], [interpolate(s, [0, 1], [930, p.y]) + Math.sin((frame + i * 17) / 11) * 10 * s, gy]);
          const size = interpolate(go, [0, 1], [interpolate(s, [0, 1], [120, 280]), cell]);
          if (go >= 1) return null;
          return (
            <PieceCard
              key={i}
              kind={p.kind}
              color={p.color}
              size={size}
              style={{ position: "absolute", left: x - size / 2, top: y - size / 2, transform: `rotate(${interpolate(s, [0, 1], [-14, (i % 2 ? 4 : -4)]) * (1 - go)}deg)` }}
            />
          );
        })}
        {frame >= b(12) && endUp < 1 ? (
          <Zee cues={[{ at: b(12), emo: "cheer" }]} size={420} style={{ left: 600, top: 1360, opacity: 1 - endUp }} />
        ) : null}
      </div>
      <EndCard at={b(16.5)} line="Already in your photos." />
    </Ground>
  );
};
