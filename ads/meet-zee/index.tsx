import React from "react";
import { interpolate, Sequence, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { FormatId } from "../../schemas/ad";
import { C, clamp, clockFor, Ground, inOut, Logo, planScenes, Star, Track, useBrandFonts, useFrameBox, Words, ZeeActor, type Emotion, type Scene, type ZeeCue } from "../../motion";
import AD from "./ad.json";

// Meet Zee: Zee alone, flipping moods on every beat. Ported from motion test c2.
// Everything is placed on the track's beat clock and laid out against useFrameBox(),
// so the same code renders 9:16, 4:5 and 1:1 at 6 s and 15 s.

export const schema = z.object({
  format: FormatId,
  length: z.number(),
  track: z.string(),
  /** Seconds into the track at frame 0. */
  fromSec: z.number().nonnegative(),
  title: z.string(),
  line: z.string(),
});
export type Props = z.infer<typeof schema>;

export const defaults: Omit<Props, "format" | "length"> = {
  track: AD.track,
  fromSec: 0,
  title: "Meet Zee.",
  line: "Your stylist.",
};

const FLIPS: Emotion[] = ["curious", "focused", "thinking", "idea", "love", "excited", "cheer", "happy"];

type Key = "hello" | "flips" | "settle";
const SCENES: Scene<Key>[] = [
  { key: "hello", in: [6, 15], beats: 6 },
  { key: "flips", in: [15], beats: 16 },
  { key: "settle", in: [6, 15], beats: 8 },
];

export const MeetZee: React.FC<Props> = ({ length, track, fromSec, title, line }) => {
  useBrandFonts();
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const box = useFrameBox();
  const clock = clockFor(track, fromSec, fps);
  const plan = planScenes(SCENES, length, clock.perBeat, fps);
  const at = (k: Key) => plan.find((p) => p.key === k);
  const hello = at("hello")!;
  const flips = at("flips");
  const settle = at("settle")!;
  const b = (n: number) => Math.round(n * clock.perBeat); // beat n, relative to a scene start
  const beat0 = clock.frame(0);

  const pop = spring({ frame: frame - beat0, fps, config: { damping: 11, stiffness: 160 } });
  const shrink = interpolate(frame, [hello.from + b(5), hello.from + b(6)], [0, 1], { ...clamp, easing: inOut });
  const settleT = interpolate(frame, [settle.from, settle.from + b(1)], [0, 1], { ...clamp, easing: inOut });

  const flipCues: ZeeCue[] = flips
    ? Array.from({ length: 16 }, (_, i) => ({ at: flips.from + b(i), emo: FLIPS[i % FLIPS.length], cut: true, loopStart: 10 + i * 7 }))
    : [];
  const cues: ZeeCue[] = [{ at: beat0, emo: "hello" }, ...flipCues, { at: settle.from, emo: "happy", cut: true, loopStart: 40 }];

  const inFlip = !!flips && frame >= flips.from && frame < flips.from + flips.durationInFrames;
  const flipIdx = inFlip ? Math.floor((frame - flips!.from) / clock.perBeat) : -1;
  const sinceBeat = inFlip ? frame - (flips!.from + b(flipIdx)) : 99;
  const snapScale = inFlip ? interpolate(sinceBeat, [0, 6], [1.08, 1], clamp) : 1;
  const tilt = inFlip ? (flipIdx % 2 ? 3 : -3) * interpolate(sinceBeat, [0, 8], [1, 0.4], clamp) : 0;
  const dark = inFlip && flipIdx % 4 === 3; // every fourth flip the room goes dark

  const { u, cx, h } = box;
  const size = interpolate(shrink, [0, 1], [u * 80, u * 65]) * interpolate(settleT, [0, 1], [1, 0.62]) * Math.min(1, h / (u * 178));
  const cy = interpolate(shrink, [0, 1], [h * 0.59, h * 0.5]) + interpolate(settleT, [0, 1], [0, h * (box.tall ? 0.08 : 0.17)]); // tall frames: clear the logo
  const emo = inFlip ? FLIPS[flipIdx % FLIPS.length] : null;
  const ink = dark ? C.ground : C.ink;

  return (
    <Ground dark={dark}>
      <Track id={track} fromSec={clock.fromSec} total={durationInFrames} fps={fps} />
      <div
        style={{
          position: "absolute",
          left: cx - size * 0.55,
          top: cy - size * 0.55,
          width: size * 1.1,
          height: size * 1.1,
          borderRadius: "50%",
          background: C.card,
          boxShadow: dark ? "0 0 160px 40px rgba(255,255,255,0.18)" : "0 30px 80px rgba(16,20,24,0.08)",
          transform: `scale(${interpolate(pop, [0, 1], [0.3, 1]) * snapScale})`,
        }}
      />
      {emo === "idea" || emo === "cheer" ? (
        <>
          <Star at={flips!.from + b(flipIdx)} x={cx + size * 0.42} y={cy - size * 0.36} size={u * 11} color={ink} />
          <Star at={flips!.from + b(flipIdx) + 3} x={cx - size * 0.44} y={cy - size * 0.2} size={u * 6.5} color={ink} />
        </>
      ) : null}
      <ZeeActor
        cues={cues}
        size={size}
        style={{ left: cx - size / 2, top: cy - size / 2, transform: `scale(${interpolate(pop, [0, 1], [0.5, 1]) * snapScale}) rotate(${tilt}deg)` }}
      />
      <Sequence from={0} durationInFrames={hello.durationInFrames} layout="none">
        <Words text={title} at={hello.from + b(2)} size={u * 15.7} exitAt={hello.from + b(5)} style={{ left: 0, right: 0, top: box.safe.top + u * 15 }} />
      </Sequence>
      <Words text={line} at={settle.from} size={u * 11} style={{ left: 0, right: 0, top: box.safe.top + u * 36 }} />
      <Logo at={settle.from + b(1) + 6} y={h - box.safe.bottom} width={u * 24} />
    </Ground>
  );
};
