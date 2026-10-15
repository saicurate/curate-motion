import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Ground, Track } from "../lib/Ground";
import { Logo, Words } from "../lib/Kinetic";
import { Star } from "../lib/Star";
import { beats, C, clamp, inOut } from "../lib/theme";
import { Emotion, Zee, ZeeCue } from "../lib/Zee";

// C2 "Meet Zee" — motion test. Zee alone, flipping moods on every beat.
// Cut to "Gummies" (Michael Ramir C., Mixkit) from the top: 120 bpm, a beat every 15 frames.
export const C2_FRAMES = 300;
const b = beats(120, 0.25);

const FLIPS: Emotion[] = ["curious", "focused", "thinking", "idea", "love", "excited", "cheer", "happy"];

export const C2: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const pop = spring({ frame: frame - b(0), fps, config: { damping: 11, stiffness: 160 } });
  const shrink = interpolate(frame, [b(5), b(6)], [0, 1], { ...clamp, easing: inOut });
  const settle = interpolate(frame, [b(14), b(15)], [0, 1], { ...clamp, easing: inOut });

  const cues: ZeeCue[] = [
    { at: b(0), emo: "hello" },
    ...FLIPS.map((e, i) => ({ at: b(6 + i), emo: e, cut: true, loopStart: 10 + i * 7 })),
    { at: b(14), emo: "happy", cut: true, loopStart: 40 },
  ];

  // each flip: a snap zoom and a small alternating tilt
  const flipIdx = Math.floor((frame - b(6)) / 15);
  const inFlip = frame >= b(6) && frame < b(14);
  const sinceBeat = inFlip ? frame - b(6 + flipIdx) : 99;
  const snapScale = inFlip ? interpolate(sinceBeat, [0, 6], [1.08, 1], clamp) : 1;
  const tilt = inFlip ? (flipIdx % 2 ? 3 : -3) * interpolate(sinceBeat, [0, 8], [1, 0.4], clamp) : 0;

  const size = interpolate(shrink, [0, 1], [860, 700]) * interpolate(settle, [0, 1], [1, 0.62]);
  const cy = interpolate(shrink, [0, 1], [1130, 960]) + interpolate(settle, [0, 1], [0, 330]);
  const dark = inFlip && flipIdx % 4 === 3; // every fourth flip the room goes dark

  return (
    <Ground dark={dark}>
      <Track file="mixkit-gummies-michael-ramir-c.mp3" fromSec={0} total={C2_FRAMES} />
      {/* a soft disc behind Zee that breathes on the beat */}
      <div
        style={{
          position: "absolute",
          left: 540 - size * 0.55,
          top: cy - size * 0.55,
          width: size * 1.1,
          height: size * 1.1,
          borderRadius: "50%",
          background: C.card,
          // in the dark beats the disc becomes a spotlight, so black Zee still reads
          boxShadow: dark ? "0 0 160px 40px rgba(255,255,255,0.18)" : "0 30px 80px rgba(16,20,24,0.08)",
          transform: `scale(${interpolate(pop, [0, 1], [0.3, 1]) * snapScale})`,
        }}
      />
      {inFlip && (FLIPS[flipIdx] === "idea" || FLIPS[flipIdx] === "cheer") ? (
        <>
          <Star at={b(6 + flipIdx)} x={540 + size * 0.42} y={cy - size * 0.36} size={120} color={dark ? "#F6F7F7" : C.ink} />
          <Star at={b(6 + flipIdx) + 3} x={540 - size * 0.44} y={cy - size * 0.2} size={70} color={dark ? "#F6F7F7" : C.ink} />
        </>
      ) : null}
      <Zee
        cues={cues}
        size={size}
        style={{
          left: 540 - size / 2,
          top: cy - size / 2,
          transform: `scale(${interpolate(pop, [0, 1], [0.5, 1]) * snapScale}) rotate(${tilt}deg)`,
        }}
      />
      <Words text="Meet Zee." at={b(2)} size={170} exitAt={b(5)} style={{ left: 0, right: 0, top: 250 }} />
      <Words text="Your stylist." at={b(14)} size={120} style={{ left: 0, right: 0, top: 480 }} />
      <Logo at={b(15) + 6} y={1640} />
    </Ground>
  );
};
