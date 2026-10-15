import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Ground, Track } from "../lib/Ground";
import { EndCard, Slam, Words } from "../lib/Kinetic";
import { Piece, Slug } from "../lib/Pieces";
import { rand } from "../lib/shapes";
import { beats, C, clamp, display, inOut, out, shadow } from "../lib/theme";
import { Zee } from "../lib/Zee";

// C9 "Rain or shine" — motion test. Rain on the glass over a rain look; a windshield-wiper
// sweep clears it on the beat and the look swaps piece by piece for the sun; at dusk the
// temperature drops and the denim jacket lands on top. Cut to "Better Times are Coming"
// (Alejandro Magaña, Mixkit, 120 bpm) from 0:35: the rain plays over its breakdown and the
// song comes back (3.35 s) exactly on the wiper.
export const C9_FRAMES = 400;
const b = beats(120.25, 3.35);

// fixed spots for the flat-lay (centre of the look at 540, 1010)
const SPOT = {
  outer: { x: 540, y: 760, h: 640 },
  top: { x: 540, y: 740, h: 560 },
  bottom: { x: 540, y: 1270, h: 720 },
  short: { x: 540, y: 1150, h: 430 },
  shoes: { x: 830, y: 1500, h: 190 },
  acc: { x: 250, y: 560, h: 120 },
};

const Rain: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {Array.from({ length: 80 }).map((_, i) => {
        const len = 70 + rand(i) * 110;
        const speed = 55 + rand(i + 9) * 35;
        const x0 = rand(i + 3) * 1300 - 110;
        const y = ((frame * speed + rand(i + 5) * 2400) % 2400) - 300;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x0 - y * 0.14,
              top: y,
              width: 3,
              height: len,
              borderRadius: 2,
              background: "linear-gradient(rgba(255,255,255,0), rgba(255,255,255,0.65))",
              transform: "rotate(8deg)",
            }}
          />
        );
      })}
      {/* drops on the glass, sliding slowly */}
      {Array.from({ length: 34 }).map((_, i) => {
        const r = 7 + rand(i * 3) * 16;
        const x = rand(i * 7 + 1) * 1080;
        const y = rand(i * 11 + 2) * 1920 + Math.max(0, frame - rand(i) * 60) * (rand(i + 4) > 0.6 ? 3 : 0.4);
        return (
          <div
            key={`d${i}`}
            style={{
              position: "absolute",
              left: x - r,
              top: (y % 1980) - r,
              width: r * 2,
              height: r * 2.3,
              borderRadius: "50% 50% 48% 48%",
              background: "radial-gradient(circle at 35% 30%, rgba(255,255,255,0.85), rgba(255,255,255,0.12) 45%, rgba(40,48,58,0.22) 100%)",
              boxShadow: "0 1px 2px rgba(20,24,30,0.25)",
            }}
          />
        );
      })}
      <AbsoluteFill style={{ background: "rgba(232,236,240,0.16)" }} />
    </AbsoluteFill>
  );
};

/** The forecast chip, flipping (rotateX) to a new value at each `at`. */
const Chip: React.FC<{ items: { at: number; text: string }[]; y: number; dark?: boolean }> = ({ items, y, dark = false }) => {
  const frame = useCurrentFrame();
  const cur = [...items].filter((i) => i.at <= frame).pop();
  if (!cur) return null;
  const t = frame - cur.at;
  const flip = interpolate(t, [0, 8], [-90, 0], { ...clamp, easing: out });
  return (
    <div style={{ position: "absolute", top: y, left: 0, right: 0, display: "flex", justifyContent: "center", perspective: 800 }}>
      <div
        style={{
          ...display(50),
          letterSpacing: "-0.01em",
          padding: "18px 36px",
          borderRadius: 99,
          background: dark ? "rgba(255,255,255,0.14)" : C.card,
          color: dark ? "#F6F7F7" : C.ink,
          boxShadow: dark ? "none" : shadow.card,
          transform: `rotateX(${flip}deg)`,
        }}
      >
        {cur.text}
      </div>
    </div>
  );
};

export const C9: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const WIPE = b(0) - 13;
  const wipe = interpolate(frame, [WIPE, b(0)], [0, 180], { ...clamp, easing: inOut });
  const NIGHT = b(9);
  const dusk = interpolate(frame, [NIGHT - 6, NIGHT + 10], [0, 1], { ...clamp, easing: inOut });
  const END = b(15);
  const endUp = interpolate(frame, [END - 8, END + 6], [1920, 0], { ...clamp, easing: inOut });

  // piece swaps: out (fly up), in (drop with a spring)
  const outAt = (at: number) => interpolate(frame, [at, at + 9], [0, 1], { ...clamp, easing: inOut });
  const inAt = (at: number) => spring({ frame: frame - at, fps, config: { damping: 11, stiffness: 170 } });

  const swap = (slug: Slug, spot: keyof typeof SPOT, leave: number | null, enter: number | null, rot = 0) => {
    const s = SPOT[spot];
    const bob = Math.sin((frame + s.y) / 16) * 8;
    if (enter !== null) {
      if (frame < enter) return null;
      const k = inAt(enter);
      return <Piece key={slug} slug={slug} x={s.x} y={interpolate(k, [0, 1], [s.y - 500, s.y]) + bob} h={s.h} rot={rot} opacity={Math.min(1, k * 2)} scale={interpolate(k, [0, 1], [1.15, 1])} />;
    }
    const k = leave === null ? 0 : outAt(leave);
    if (k >= 1) return null;
    return <Piece key={slug} slug={slug} x={s.x + k * 120} y={s.y - k * 1400 + bob} h={s.h} rot={rot + k * 25} opacity={1 - k * 0.3} />;
  };

  const rainLook = (leaving: boolean) => (
    <>
      {swap("dark-wash-straight-jeans", "bottom", leaving ? b(2) : null, null)}
      {swap("black-turtleneck", "top", leaving ? b(1) + 3 : null, null)}
      {swap("khaki-trench-coat", "outer", leaving ? b(1) : null, null, -3)}
      {swap("black-ankle-boots", "shoes", leaving ? b(3) : null, null)}
    </>
  );

  return (
    <AbsoluteFill style={{ background: C.night, overflow: "hidden" }}>
      <Track file="mixkit-better-times-are-coming-alejandro-magana.mp3" fromSec={35} total={C9_FRAMES} />

      {/* RAIN */}
      {frame < b(0) + 2 ? (
        <AbsoluteFill style={{ background: "linear-gradient(#C9CFD6, #9AA3AE)" }}>
          <div style={{ position: "absolute", inset: 0, filter: "blur(1.2px)" }}>{rainLook(false)}</div>
          <Rain />
          <Words text="Rain at 4." at={6} size={150} style={{ top: 200, left: 0, width: 1080 }} />
          <Chip items={[{ at: 20, text: "☁︎  58°F · Rain at 4" }]} y={400} />
          <Zee cues={[{ at: 0, emo: "listening" }]} size={340} style={{ left: 700, top: 1520 }} />
          {frame >= 44 ? (
            <div
              style={{
                position: "absolute",
                left: 300,
                top: 1590,
                ...display(40),
                letterSpacing: "-0.01em",
                background: C.card,
                padding: "18px 26px",
                borderRadius: "28px 28px 6px 28px",
                boxShadow: shadow.card,
                opacity: interpolate(frame, [44, 50], [0, 1], clamp),
                transform: `translateY(${interpolate(frame, [44, 52], [20, 0], { ...clamp, easing: out })}px)`,
              }}
            >
              Rain at 4. Trench it is.
            </div>
          ) : null}
        </AbsoluteFill>
      ) : null}

      {/* SUN, revealed by the wiper, then DUSK */}
      {frame >= WIPE ? (
        <AbsoluteFill
          style={{
            WebkitMaskImage: frame < b(0) ? `conic-gradient(from 270deg at 540px 2010px, #000 0deg, #000 ${wipe}deg, transparent ${wipe + 0.5}deg)` : undefined,
          }}
        >
          <AbsoluteFill style={{ background: "radial-gradient(70% 45% at 85% 6%, #FFE9C4 0%, #FBF4E8 45%, #F6F7F7 100%)" }} />
          <AbsoluteFill style={{ background: "linear-gradient(#3C4048, #24272C)", opacity: dusk }} />
          {/* a soft window light so Zee and the pieces read at dusk */}
          <AbsoluteFill style={{ background: "radial-gradient(60% 40% at 50% 62%, rgba(255,255,255,0.22), rgba(255,255,255,0))", opacity: dusk }} />

          {rainLook(true)}
          {swap("white-tee", "top", null, b(1) + 4)}
          {swap("denim-cutoff-shorts", "short", null, b(2) + 3)}
          {swap("tan-sandals", "shoes", null, b(3) + 3)}
          {swap("black-sunglasses", "acc", null, b(4))}
          {/* tonight: the denim jacket lands on top */}
          {frame >= b(10) ? (() => {
            const k = inAt(b(10));
            return <Piece slug="denim-jacket" x={540} y={interpolate(k, [0, 1], [-600, 790])} h={700} scale={interpolate(k, [0, 1], [1.2, 1])} />;
          })() : null}

          <Slam text="Sunny." at={b(1)} until={NIGHT - 4} size={150} style={{ top: 200, left: 0, width: 1080, textAlign: "center" }} />
          <Slam text="Tonight." at={NIGHT + 4} size={150} color="#F6F7F7" style={{ top: 200, left: 0, width: 1080, textAlign: "center" }} />
          <Chip items={[{ at: b(1), text: "☀︎  78°F · Sunny" }, { at: NIGHT + 4, text: "☾  61°F · Tonight" }]} y={400} dark={frame >= NIGHT + 4} />
          <div style={{ position: "absolute", left: 20, top: 1500, width: 460, height: 420, borderRadius: "50%", background: "radial-gradient(closest-side, rgba(220,224,230,0.55), rgba(220,224,230,0))", opacity: dusk }} />
          {frame >= b(1) ? (
            <Zee
              cues={[
                { at: b(1), emo: "cheer" },
                { at: b(6), emo: "happy", cut: true },
                { at: b(10) + 4, emo: "love" },
              ]}
              size={340}
              style={{ left: 80, top: 1520 }}
            />
          ) : null}
        </AbsoluteFill>
      ) : null}

      {/* the wiper blade */}
      {frame >= WIPE && frame < b(0) + 3 ? (
        <div
          style={{
            position: "absolute",
            left: 540 - 13,
            top: 2010 - 2500,
            width: 26,
            height: 2500,
            borderRadius: 13,
            background: "linear-gradient(90deg, #0f0f10, #3a3b3e 50%, #0f0f10)",
            transformOrigin: "50% 100%",
            transform: `rotate(${wipe - 90}deg)`,
            boxShadow: "0 0 30px rgba(0,0,0,0.25)",
          }}
        />
      ) : null}

      {/* the end card slides up */}
      {frame >= END - 8 ? (
        <div style={{ position: "absolute", left: 0, top: endUp, width: 1080, height: 1920 }}>
          <Ground>
            <EndCard at={END + 2} line="Dressed for the weather." />
            <Zee cues={[{ at: END + 8, emo: "hello" }]} size={380} style={{ left: 350, top: 1360 }} />
          </Ground>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
