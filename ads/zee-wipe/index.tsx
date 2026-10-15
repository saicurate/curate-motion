import React from "react";
import { AbsoluteFill, interpolate, Sequence, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { FormatId } from "../../schemas/ad";
import {
  C,
  clamp,
  clockFor,
  Footage,
  Fur,
  Ground,
  MotionBlur,
  out,
  PhoneFrame,
  PHONE_RATIO,
  Slam,
  StoreEndCard,
  Track,
  useBrandFonts,
  useFrameBox,
  ZEE_CHEST,
  ZeeActor,
  ZeeLeap,
  ZeeWindow,
  ZeeWindowPreload,
  type Emotion,
  type PhonePose,
} from "../../motion";
import AD from "./ad.json";

// Zee wipe (concept c7). Zee is a black plush kitten, so she is the wipe: she leaps at the lens
// and her fur blacks out the frame, her silhouette opens a window onto the next moment, she
// whips across the screen. Behind her, Emma's real app: a look landing, the Wardrobe, the
// carousel, two try-ons, a trip look, "Me too." Every wipe lands on a bar of Can't Get You Off
// My Mind (the hits come every 1.6 s; the track drops out for half a second before every fourth,
// and that silence is where she leaps at the lens).
// 15 s = the compilation. 6 s = one of three loopable bumpers (prop `bumper`): it opens on her fur
// pulling away from the lens and ends with her leaping back into it, so it loops seamlessly.

export const BUMPERS = ["looks", "wardrobe", "tryons"] as const;
export const schema = z.object({
  format: FormatId,
  length: z.number(),
  track: z.string(),
  fromSec: z.number().nonnegative(),
  volume: z.number().min(0).max(1),
  /** Which 6 s bumper (ignored by the 15 s compilation). */
  bumper: z.enum(BUMPERS),
});
export type Props = z.infer<typeof schema>;
export const defaults: Omit<Props, "format" | "length"> = { track: AD.track, fromSec: 24.95, volume: 0.84, bumper: "looks" };

type Enter = "cut" | "fur" | "window" | "swipe";
type Moment = { id: string; from: number; rate?: number; start: number; end: number; enter: Enter; dur?: number; zoom?: number; oy?: number };

const F = {
  starters: "footage.emma.chat-open-starters.v1",
  look: "footage.emma.look-card-landing.v1",
  wardrobe: "footage.emma.wardrobe-scroll-float.v1",
  swipe: "footage.emma.multiple-looks-swipe.v1",
  tryon1: "footage.emma.tryon-curtain-reveal.v1",
  tryon2: "footage.emma.tryon-curtain-reveal.v2",
  trip: "footage.emma.look-card-landing.v3",
  love: "footage.emma.look-love-it.v1",
};

const BUMPER: Record<(typeof BUMPERS)[number], { id: string; from: number; rate?: number; line: string }> = {
  looks: { id: F.look, from: 3.95, line: "Styled by Zee." },
  wardrobe: { id: F.wardrobe, from: 2.0, rate: 1.3, line: "Your closet, sorted." },
  tryons: { id: F.tryon1, from: 6.2, line: "See it on you." },
};

export const ZeeWipe: React.FC<Props> = ({ length, track, fromSec, volume, bumper }) => {
  useBrandFonts();
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const { w, h, u, cx, tall, safe } = useFrameBox();
  const clock = clockFor(track, fromSec, fps);
  const hit = (n: number) => clock.frame(1 + 4 * n); // bar downbeats: the track's big hits
  const compilation = length >= 15;

  const pw = Math.min(w * 0.58, (h * (tall ? 0.74 : 0.78)) / PHONE_RATIO);
  const phone = (f: number): PhonePose => ({ width: pw, x: cx, y: h * (tall ? 0.535 : 0.555), rx: 4 + Math.sin(f / 47) * 3, ry: Math.sin(f / 37) * 9, rz: Math.sin(f / 59) * 1.5 });
  const zs = u * (tall ? 30 : 24);
  const L = { x: w * 0.25, y: h * (tall ? 0.76 : 0.8) };
  const R = { x: w * 0.73, y: h * (tall ? 0.76 : 0.8) };
  const M = { x: cx, y: h * (tall ? 0.8 : 0.84) };
  const wordStyle: React.CSSProperties = { left: safe.side + u, top: h * (tall ? 0.055 : 0.035), width: w * 0.8 };
  const wordSize = u * (tall ? 10 : 8.5);

  // ── the timeline ──
  let moments: Moment[];
  let words: { text: string; at: number; until: number }[];
  let zees: { emo: Emotion; at: number; until: number; p: { x: number; y: number }; loopStart?: number }[];
  let leaps: { at: number; dur: number; dir: 1 | -1; p: { x: number; y: number }; emo?: Emotion }[];
  let furs: { at: number; up: number; hold: number; down: number }[];
  let windowFx: { at: number; dur: number; p: { x: number; y: number } } | null = null;
  let swipeFx: { at: number; dur: number } | null = null;
  let endAt: number;
  let endLine: string | undefined;
  let zeeUntil: number | undefined;

  if (compilation) {
    moments = [
      { id: F.starters, from: 0.3, start: 0, end: hit(0) + 1, enter: "cut" },
      { id: F.look, from: 4.0, start: hit(0), end: hit(1) + 1, enter: "fur" },
      { id: F.wardrobe, from: 2.0, rate: 1.3, start: hit(1) - 12, end: hit(2) + 8, enter: "window", dur: 12 },
      { id: F.swipe, from: 0.75, start: hit(2) - 7, end: hit(3) + 1, enter: "swipe", dur: 14 },
      { id: F.tryon1, from: 6.15, start: hit(3), end: hit(4) + 1, enter: "cut" },
      { id: F.tryon2, from: 17.65, start: hit(4), end: hit(5) + 1, enter: "fur" },
      { id: F.trip, from: 2.35, start: hit(5), end: hit(6) + 1, enter: "cut" },
      { id: F.love, from: 9.6, start: hit(6), end: hit(7) + 6, enter: "cut" },
    ];
    words = [
      { text: "Styled.", at: hit(0) + 3, until: hit(1) - 2 },
      { text: "Sorted.", at: hit(1), until: hit(2) - 8 },
      { text: "Tried on.", at: hit(3), until: hit(4) - 22 },
    ];
    zees = [
      { emo: "excited", at: 0, until: 3, p: M },
      { emo: "happy", at: hit(0) + 15, until: hit(1) - 12, p: R, loopStart: 20 },
      { emo: "listening", at: hit(1) + 6, until: hit(2) - 7, p: L },
      { emo: "love", at: hit(2) + 8, until: hit(3), p: R },
      { emo: "cheer", at: hit(3), until: hit(4) - 21, p: L, loopStart: 18 },
      { emo: "happy", at: hit(4) + 14, until: hit(5), p: R, loopStart: 40 },
      { emo: "curious", at: hit(5), until: hit(6), p: L },
      { emo: "excited", at: hit(6), until: hit(7) - 15, p: M, loopStart: 12 },
    ];
    leaps = [
      { at: 2, dur: hit(0) - 2, dir: 1, p: M },
      { at: hit(0) + 1, dur: 14, dir: -1, p: R, emo: "cheer" },
      { at: hit(4) - 19, dur: 17, dir: 1, p: L },
      { at: hit(4) + 1, dur: 13, dir: -1, p: R, emo: "happy" },
      { at: hit(7) - 15, dur: 17, dir: 1, p: M },
    ];
    furs = [
      { at: hit(0), up: 3, hold: 1, down: 4 },
      { at: hit(4) - 2, up: 3, hold: 1, down: 4 },
      { at: hit(7) + 2, up: 3, hold: 8, down: 0 },
    ];
    windowFx = { at: hit(1) - 12, dur: 12, p: R };
    swipeFx = { at: hit(2) - 7, dur: 14 };
    endAt = hit(7) + 9;
    endLine = "Styled by Zee.";
  } else {
    // the 6 s bumper: fur → moment → window → end card → leap → fur (loops)
    const b = BUMPER[bumper];
    moments = [{ id: b.id, from: b.from, rate: b.rate, start: 0, end: hit(2), enter: "cut" }];
    words = [{ text: b.line, at: hit(0) + 2, until: hit(2) - 12 }];
    zees = [{ emo: "happy", at: hit(0) + 1, until: hit(2) - 12, p: R, loopStart: 20 }];
    leaps = [
      { at: 0, dur: hit(0) + 1, dir: -1, p: R, emo: "cheer" },
      { at: hit(3), dur: durationInFrames - hit(3), dir: 1, p: { x: cx, y: h * (tall ? 0.72 : 0.74) } },
    ];
    furs = [
      { at: 0, up: 0, hold: 2, down: 6 },
      { at: durationInFrames - 1, up: 5, hold: 2, down: 0 },
    ];
    windowFx = { at: hit(2) - 12, dur: 12, p: R };
    endAt = hit(2) - 12;
    zeeUntil = hit(3);
  }

  const punchAt = moments.filter((m) => m.enter === "cut" && m.start > 0).map((m) => m.start);
  const cam = Math.max(1, ...punchAt.map((a) => interpolate(frame, [a, a + 2, a + 9], [1, 1.045, 1], clamp)));

  const phoneWith = (m: Moment, i: number) => (
    <PhoneFrame {...phone(frame)} island={false} screen={C.appGround}>
      <Sequence from={m.start} layout="none" name={`m${i}`}>
        <Footage id={m.id} from={m.from} rate={m.rate ?? 1} />
      </Sequence>
    </PhoneFrame>
  );
  const stage = (m: Moment, i: number) => (
    <Ground>
      <div style={{ position: "absolute", inset: 0, transform: `scale(${cam})` }}>{phoneWith(m, i)}</div>
    </Ground>
  );

  // the swipe: Zee whips right → left; the next moment is on the side she has passed
  let swipeX = 0;
  let swipeBlur = 0;
  if (swipeFx) {
    const st = interpolate(frame, [swipeFx.at, swipeFx.at + swipeFx.dur], [0, 1], clamp);
    const ss = st * st * (3 - 2 * st);
    swipeX = interpolate(ss, [0, 1], [w * 1.6, -w * 0.7]);
    swipeBlur = Math.sin(Math.PI * st) * 46;
  }

  const endCard = compilation ? (
    <StoreEndCard at={endAt + 2} line={endLine} zee="hello" zeeDelay={12} />
  ) : (
    <StoreEndCard at={endAt} zee="curious" zeeDelay={14} zeeUntil={zeeUntil} />
  );
  const iris = interpolate(frame, [endAt, endAt + 14], [0, Math.hypot(w, h) * 0.55], { ...clamp, easing: out });

  return (
    <AbsoluteFill style={{ background: C.night }}>
      <Track id={track} fromSec={clock.fromSec} total={durationInFrames} fps={fps} volume={volume} fadeOut={compilation ? 10 : 6} />
      <ZeeWindowPreload />

      {moments.map((m, i) => {
        if (frame < m.start || frame >= m.end) return null;
        const inWin = m.enter === "window" && frame < m.start + (m.dur ?? 12);
        const inSwipe = m.enter === "swipe" && frame < m.start + (m.dur ?? 14);
        if (inWin && windowFx) {
          return (
            <ZeeWindow key={i} at={windowFx.at} dur={windowFx.dur} from={windowFx.p} size={zs} w={w} h={h}>
              {stage(m, i)}
            </ZeeWindow>
          );
        }
        if (inSwipe) {
          return (
            <AbsoluteFill key={i} style={{ clipPath: `inset(0 0 0 ${Math.max(0, swipeX)}px)` }}>
              {stage(m, i)}
            </AbsoluteFill>
          );
        }
        return (
          <AbsoluteFill key={i}>
            {stage(m, i)}
          </AbsoluteFill>
        );
      })}

      {/* the words, one per wipe */}
      {words.map((t, i) => (
        <Slam key={i} text={t.text} at={t.at} until={t.until} size={wordSize} color={C.ink} style={wordStyle} />
      ))}

      {/* Zee between the wipes: a new mood in a new spot on every hit */}
      {zees.map((z0, i) =>
        frame >= z0.at && frame < z0.until ? (
          <ZeeActor key={i} cues={[{ at: z0.at, emo: z0.emo, cut: true, loopStart: z0.loopStart ?? 8 }]} size={zs} style={{ left: z0.p.x - zs * ZEE_CHEST.x, top: z0.p.y - zs * ZEE_CHEST.y }} />
        ) : null,
      )}

      {/* the swipe Zee, with a motion-blurred trail */}
      {swipeFx && frame >= swipeFx.at && frame < swipeFx.at + swipeFx.dur ? (
        <MotionBlur id="swipe" x={swipeBlur}>
          {[0.14, 0.26, 0.45, 1].map((o, j) => (
            <ZeeActor
              key={j}
              cues={[{ at: swipeFx.at, emo: "excited", cut: true, loopStart: 30 }]}
              size={w * 1.2}
              shadow={false}
              style={{ left: swipeX - w * 0.6 + (3 - j) * u * 10, top: h * 0.17, opacity: o }}
            />
          ))}
        </MotionBlur>
      ) : null}

      {/* the end card: out of the black through an iris (15 s) or through Zee's window (6 s) */}
      {!compilation && windowFx && frame >= windowFx.at && frame < windowFx.at + windowFx.dur ? (
        <ZeeWindow at={windowFx.at} dur={windowFx.dur} from={windowFx.p} size={zs} w={w} h={h}>
          {endCard}
        </ZeeWindow>
      ) : null}
      {!compilation && frame >= endAt + 12 ? endCard : null}

      {/* the leaps and the fur */}
      {leaps.map((l, i) => (
        <ZeeLeap key={i} at={l.at} dur={l.dur} dir={l.dir} from={l.p} size={zs} emo={l.emo ?? "excited"} />
      ))}
      {furs.map((f0, i) => (
        <Fur key={i} at={f0.at} up={f0.up} hold={f0.hold} down={f0.down} />
      ))}
      {compilation && frame >= endAt ? <AbsoluteFill style={{ clipPath: `circle(${iris}px at ${cx}px ${h * 0.45}px)` }}>{endCard}</AbsoluteFill> : null}
    </AbsoluteFill>
  );
};
