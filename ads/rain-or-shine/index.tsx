import React from "react";
import { AbsoluteFill, interpolate, Sequence, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { FormatId } from "../../schemas/ad";
import { C, clamp, clockFor, Footage, inOut, out, PhoneFrame, PHONE_RATIO, Slam, StoreEndCard, Track, useBrandFonts, useFrameBox, Words, type PhonePose } from "../../motion";
import AD from "./ad.json";
import { Bokeh, Rain, Wiper, wipeMask } from "./Rain";

// Rain or shine (concept c9). Rain runs down the glass over Emma's phone while Zee works out
// tomorrow ("Going through your 49 pieces…") and lands a drizzle-proof work look; then a windshield
// wiper sweeps the rain away exactly as Better Times comes back, and the app's own window wipe
// answers it ("There's your sky"); the look swaps for the sun, the light drops to dusk and the
// carousel swipes to the coat for 57° tonight; a second sweep clears to the end card.
// All app footage is real (Emma's chat, build 262). Beat clock: Better Times from 33.1 s, so the
// song's return (38.1 s) is the first wiper's last frame.

export const schema = z.object({
  format: FormatId,
  length: z.number(),
  track: z.string(),
  fromSec: z.number().nonnegative(),
  volume: z.number().min(0).max(1),
});
export type Props = z.infer<typeof schema>;
export const defaults: Omit<Props, "format" | "length"> = { track: AD.track, fromSec: 33.1, volume: 0.84 };

export const RainOrShine: React.FC<Props> = ({ track, fromSec, volume }) => {
  useBrandFonts();
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const { w, h, u, cx, tall, safe } = useFrameBox();
  const clock = clockFor(track, fromSec, fps);
  const B = clock.frame;

  const WIPE1 = B(10); // the song comes back
  const W1 = WIPE1 - 22;
  const LOOK_RAIN = B(7);
  const LOOK_SUN = B(14);
  const LOVED = B(17);
  const DUSK = B(19);
  const WIPE2 = B(24);
  const W2 = WIPE2 - 18;
  const pivot = { x: cx, y: h * 1.05 };
  const blade = Math.hypot(Math.max(cx, w - cx), pivot.y) * 1.08;
  const wipe1 = interpolate(frame, [W1, WIPE1], [0, 1], { ...clamp, easing: inOut });
  const wipe2 = interpolate(frame, [W2, WIPE2], [0, 1], { ...clamp, easing: inOut });

  // 9:16: the phone in the middle under the words. 4:5 and 1:1 (the feed): the frame is wider than
  // the phone needs, so the phone stands on the right at full height and the words get the left column.
  const square = h / w < 1.1;
  const pw = tall ? Math.min(w * 0.62, (h * 0.8) / PHONE_RATIO) : (h * (square ? 0.8 : 0.78)) / PHONE_RATIO;
  const px = tall ? cx : w - safe.side - pw * 0.53;
  const drift = (f: number) => Math.sin(f / 45);
  const rainPhone: PhonePose = { width: pw * 0.93, x: px + u * (tall ? 5 : 1), y: h * (tall ? 0.6 : 0.515), rx: 6 + drift(frame) * 1.5, ry: -14 + drift(frame + 30) * 3, rz: 2 };
  const sunPhone: PhonePose = { width: pw, x: px - u * (tall ? 4 : 1), y: h * (tall ? 0.56 : 0.5), rx: 5, ry: 12 + drift(frame) * 3, rz: -1.5 };
  const punch = (at: number) => interpolate(frame, [at, at + 8], [1.045, 1], { ...clamp, easing: out });
  const push = interpolate(frame, [36, LOOK_RAIN], [1, 1.16], { ...clamp, easing: inOut });
  const duskT = interpolate(frame, [DUSK - 6, DUSK + 10], [0, 1], { ...clamp, easing: inOut });
  const wordSize = u * (tall ? 12 : square ? 8.8 : 7.6);
  const wordTop = h * (tall ? 0.085 : square ? 0.1 : 0.12);
  // the feed's left column ends a little short of the phone's left edge
  const wordStyle: React.CSSProperties = tall ? { left: safe.side + u * 1, top: wordTop, width: w * 0.8 } : { left: safe.side + u * 1, top: wordTop, width: px - pw * 0.5 - safe.side - u * 4 };

  // a single light sweep as the sun comes out (the only light leak)
  const sweep = interpolate(frame, [WIPE1 - 2, WIPE1 + 16], [-0.6, 1.4], clamp);

  return (
    <AbsoluteFill style={{ background: C.rainLo }}>
      <Track id={track} fromSec={clock.fromSec} total={durationInFrames} fps={fps} volume={volume} fadeOut={14} />

      {/* ── RAIN ── */}
      {frame < WIPE1 + 1 ? (
        <AbsoluteFill style={{ background: `linear-gradient(${C.rainHi}, ${C.rainLo})` }}>
          <Bokeh />
          <div style={{ position: "absolute", inset: 0, transform: `scale(${punch(B(2))})` }}>
            <PhoneFrame {...rainPhone} island={false} screen={C.ground}>
              <Sequence durationInFrames={LOOK_RAIN} layout="none">
                <Footage id="footage.emma.chat-thinking-lines.v2" from={2.3} zoom={push} ox={0.5} oy={0.3} />
              </Sequence>
              {/* °F: from 27.3 at 0.7x the card lands on "Covered." and the shot ends at 28.35 s, before
                  Zee's reply line ("13–23°… 22°C", the brain writes °C) appears at 28.45 s */}
              <Sequence from={LOOK_RAIN} layout="none">
                <Footage id="footage.emma.chat-thinking-lines.v2" from={27.3} rate={0.7} zoom={1.12} ox={0.5} oy={0.32} />
              </Sequence>
            </PhoneFrame>
          </div>
          <Rain amount={1} />
          <Words text="Rain tomorrow." at={3} size={wordSize} color={C.card} exitAt={LOOK_RAIN - 8} align="left" style={wordStyle} />
          <Slam text="Covered." at={LOOK_RAIN} size={wordSize} color={C.card} style={{ ...wordStyle }} />
        </AbsoluteFill>
      ) : null}

      {/* ── SUN, swept in by the wiper, then DUSK ── */}
      {frame >= W1 && frame < WIPE2 + 1 ? (
        <AbsoluteFill style={{ WebkitMaskImage: frame < WIPE1 ? wipeMask(wipe1, pivot) : undefined }}>
          <AbsoluteFill style={{ background: `radial-gradient(80% 50% at 82% 8%, ${C.sunHi} 0%, ${C.card} 40%, ${C.ground} 100%)` }} />
          <AbsoluteFill style={{ background: `linear-gradient(${C.dusk}, ${C.duskLo})`, opacity: duskT }} />
          <AbsoluteFill style={{ background: "radial-gradient(55% 38% at 50% 58%, rgba(255,255,255,0.20), rgba(255,255,255,0))", opacity: duskT }} />
          <div style={{ position: "absolute", inset: 0, transform: `scale(${frame < LOOK_SUN ? punch(WIPE1) : frame < LOVED ? punch(LOOK_SUN) : frame < DUSK ? punch(LOVED) : punch(DUSK)})` }}>
            <PhoneFrame {...sunPhone} island={false} screen={C.ground}>
              <Sequence from={W1} durationInFrames={LOOK_SUN - W1} layout="none">
                <Footage id="footage.emma.location-ask-sky-wipe.v1" from={1.25} zoom={1.1} ox={0.5} oy={0.25} />
              </Sequence>
              {/* °F: the landing plays 4.1–5.57 s only (its "17°" thinking line has faded by 4.08 s and
                  the reply's "14° tonight" streams in at 5.63 s); then her real "Love it" tap on that look */}
              <Sequence from={LOOK_SUN} durationInFrames={LOVED - LOOK_SUN} layout="none">
                <Footage id="footage.emma.look-card-landing.v1" from={4.1} />
              </Sequence>
              <Sequence from={LOVED} durationInFrames={DUSK - LOVED} layout="none">
                <Footage id="footage.emma.look-love-it.v1" from={9.6} />
              </Sequence>
              <Sequence from={DUSK} layout="none">
                <Footage id="footage.emma.multiple-looks-swipe.v1" from={4.6} />
              </Sequence>
            </PhoneFrame>
          </div>
          <Slam text="Sun's out." at={WIPE1} until={DUSK - 3} size={wordSize} color={C.ink} style={wordStyle} />
          <Slam text="57° tonight." at={DUSK + 2} size={wordSize} color={C.card} style={wordStyle} />
          {sweep > -0.5 && sweep < 1.3 ? (
            <AbsoluteFill
              style={{
                background: `linear-gradient(115deg, rgba(255,255,255,0) ${(sweep - 0.25) * 100}%, rgba(255,255,255,0.55) ${sweep * 100}%, rgba(255,255,255,0) ${(sweep + 0.25) * 100}%)`,
                mixBlendMode: "screen",
              }}
            />
          ) : null}
        </AbsoluteFill>
      ) : null}

      {/* ── END, swept in by a second pass ── */}
      {frame >= W2 ? (
        <AbsoluteFill style={{ WebkitMaskImage: frame < WIPE2 ? wipeMask(wipe2, pivot) : undefined }}>
          <StoreEndCard at={W2 + 6} line="Dressed for the weather." zee="happy" zeeDelay={18} />
        </AbsoluteFill>
      ) : null}

      <Wiper t={wipe1} pivot={pivot} length={blade} />
      <Wiper t={wipe2} pivot={pivot} length={blade} />
    </AbsoluteFill>
  );
};
