import React from "react";
import { Audio } from "@remotion/media";
import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { FormatId } from "../../schemas/ad";
import { frameSrc, GEIST, Grain, KeyLine, samplesFor, src, SubframeBlur, useBrandFonts, Vignette } from "../../motion";
import { frameCount } from "../../motion/assets";
import { BODY, Bubble, Card, Garment, Ground, INK, MarkWord, moveP, Pan, Pill, Print, slotOf, TONE, toneAt, wave, type Role } from "../../motion/Designed";
import { expoInOut, expoOut, mix, progress, spring } from "../../motion/springs";
import { Line } from "../app-store-header";

// Ask Zee (2026-10-24): the chat REDRAWN (decisions/0014), in the header's world. Gummies (beatmap.ts: 120 BPM,
// bars every 2 s from frame 0).
//
//   HOOK     her question types into a big bubble, "What should I wear tonight?"; Zee pops up: "On it."
//   SEARCH   Zee thinks in a ring of her own clothes, turning faster and faster
//   PICK     four pieces fly out of the ring onto the look card, one a beat: the little black dress, the heels,
//            the mini bag, the gold hoops
//   ANSWER   Zee: "Date night? The little black dress, heels and gold hoops."; Try it on; her night-out photo
//   CLOSE    the pan through the light to the lockup, "Your stylist, one message away."; back to the start

export const schema = z.object({ format: FormatId, length: z.number(), track: z.string(), fromSec: z.number(), volume: z.number().min(0).max(1) });
export type Props = z.infer<typeof schema>;
export const defaults = { track: "music.mixkit.gummies-michael-ramir-c.v1", fromSec: 8.307, volume: 0.7 };

const W = 1080;
const H = 1920;
const B = 0.5; // a beat
const T = { ask: 0.05, zee: 1.0, onIt: 1.5, ring: 1.997, line2: 2.3, card: 3.45, pick: 4.005, answer: 6.008, pill: 6.6, press: 7.45, photo: 8.017, line3: 8.5, out: 12.005, lockLine: 12.5, cta: 13.0, back: 14.1 };
const OUT_DUR = 1.6;
const BACK_DUR = 0.75;

const PICKS: { id: string; role: Role }[] = [
  { id: "garment.emma.dress-little-black.v1", role: "dress" },
  { id: "garment.emma.heels-black.v1", role: "shoes" },
  { id: "garment.emma.bag-mini-black.v1", role: "bag" },
  { id: "garment.emma.earrings-hoops-gold.v1", role: "acc" },
];
/** Her wardrobe in the ring: the four picks among the rest, spread round it. */
const RING = [
  "garment.emma.dress-little-black.v1",
  "garment.emma.jeans-straight-light-wash.v1",
  "garment.emma.blazer-black.v1",
  "garment.emma.heels-black.v1",
  "garment.emma.sweater-cable-knit-cream.v1",
  "garment.emma.coat-wool-camel.v1",
  "garment.emma.bag-mini-black.v1",
  "garment.emma.sneakers-leather-white.v1",
  "garment.emma.skirt-midi-satin-camel.v1",
  "garment.emma.earrings-hoops-gold.v1",
];
const CENTRE = { x: W / 2, y: 1120 };
const RADIUS = 380;
const RING_H = 190;
const CARD = { x: 110, y: 640, w: 860, h: 1000 };
const LOOK = { x: W / 2, y: CARD.y + 500, L: 640 };
/** The card's move: up from below, then back and left for her photo (CSS order: scale about the origin, then move). */
const ORIGIN = { x: W / 2, y: CARD.y + CARD.h / 2 };
const cardMove = (t: number) => {
  const cardIn = spring(t - T.card, "panel");
  const photo = spring(t - T.photo, "panel");
  return { cardIn, photo, dx: -250 * photo, dy: (1 - cardIn) * 1300, s: 1 - 0.16 * photo };
};
const onCard = (m: ReturnType<typeof cardMove>, x: number, y: number) => ({ x: ORIGIN.x + (x - ORIGIN.x) * m.s + m.dx, y: ORIGIN.y + (y - ORIGIN.y) * m.s + m.dy });

/** Zee from the live pack: an emotion's intro then its loop (30 fps clips; this film is 60). */
const Zee: React.FC<{ emo: string; from: number; t: number; size: number; x: number; y: number; opacity?: number }> = ({ emo, from, t, size, x, y, opacity = 1 }) => {
  if (opacity < 0.004 || t < from) return null;
  const f = Math.floor((t - from) * 30);
  const intro = `zee.${emo}.intro.v1`;
  const loop = `zee.${emo}.loop.v1`;
  const s = f < frameCount(intro) ? frameSrc(intro, f) : frameSrc(loop, (f - frameCount(intro)) % frameCount(loop));
  return <Img src={s} style={{ position: "absolute", left: x - size / 2, top: y - size / 2, width: size, height: size, opacity: opacity < 0.9995 ? opacity : undefined }} />;
};

/** The ring's angle at t: a slow turn that speeds up while Zee looks, like a wheel about to stop. */
const ringAngle = (t: number) => {
  const u = Math.max(0, t - T.ring);
  return 0.9 * u + 0.9 * Math.max(0, u - 1.2) ** 2;
};
const ringAt = (t: number, i: number) => {
  const a = ringAngle(t) + (2 * Math.PI * i) / RING.length;
  return { x: CENTRE.x + RADIUS * Math.cos(a), y: CENTRE.y + RADIUS * 0.82 * Math.sin(a) + 10 * wave(t, 1.6, i) };
};

const Scene: React.FC<{ t: number }> = ({ t }) => {
  const ask = expoOut(progress(t, T.ask, 0.2));
  // the question rises to the top as the ring opens
  const up = spring(t - T.ring, "panel");
  const ringO = expoOut(progress(t, T.ring, 0.4));
  const m = cardMove(t);
  // Zee: hello in the middle → thinking at the ring's hub → down to the card's foot as the card rises
  const down = spring(t - T.card, "panel");
  const foot = onCard(m, CARD.x + 96, CARD.y + CARD.h - 84);
  const zx = mix(CENTRE.x, foot.x, down);
  const zy = mix(mix(1280, CENTRE.y, up), foot.y, down);
  const zs = mix(mix(540, 380, up), 160 * m.s, down);
  const emo = t < T.ring ? "hello" : t < T.answer ? "thinking" : "happy";
  const emoFrom = t < T.ring ? T.zee : t < T.answer ? T.ring : T.answer;
  return (
    <>
      <Bubble text="What should I wear tonight?" who="her" x={90} y={mix(560, 150, up)} w={900} size={mix(70, 46, up)} words={(t - T.ask) / 0.85} opacity={ask * (1 - expoInOut(progress(t, T.answer, 0.4)))} />
      {/* the look card, redrawn: the picks land on it */}
      <div style={{ position: "absolute", inset: 0, transform: `translate(${m.dx.toFixed(2)}px, ${m.dy.toFixed(2)}px) scale(${m.s.toFixed(4)})`, transformOrigin: `${ORIGIN.x}px ${ORIGIN.y}px`, filter: `brightness(${(1 - 0.12 * m.photo).toFixed(3)})` }}>
        <Card x={CARD.x} y={CARD.y} w={CARD.w} h={CARD.h} r={46} opacity={m.cardIn > 0.002 ? 1 : 0}>
          <div style={{ position: "absolute", left: 52, top: 46, fontFamily: GEIST, fontWeight: 500, color: INK }}>
            <div style={{ fontSize: 30, color: BODY }}>Tonight</div>
            <div style={{ fontSize: 58, letterSpacing: "-0.03em", marginTop: 6 }}>Date night</div>
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 200, height: 640, background: "#F4F4F2" }} />
        </Card>
        <Pill label="Try it on" x={CARD.x + CARD.w - 300} y={CARD.y + 56} size={34} press={(t - T.press) / 0.3} opacity={expoOut(progress(t, T.pill, 0.3))} />
      </div>
      {/* the ring of her wardrobe: the rest scatter as the card comes; the picks fly onto it, one a beat */}
      {RING.map((id, i) => {
        const pi = PICKS.findIndex((p) => p.id === id);
        const r = ringAt(t, i);
        const rot = 8 * wave(t, 2.4, i);
        if (pi < 0) {
          const off = expoInOut(progress(t, T.card - 0.1, 0.55));
          const k = 1 + 0.5 * off;
          return <Garment key={id} id={id} cx={CENTRE.x + (r.x - CENTRE.x) * k} cy={CENTRE.y + (r.y - CENTRE.y) * k} h={RING_H * (1 - 0.4 * off)} rot={rot} opacity={ringO * (1 - off)} lift={0.4} />;
        }
        const at = T.pick + pi * B;
        const fly = spring(t - at, { zeta: 0.9, response: 0.45 });
        const from = ringAt(Math.min(t, at), i);
        const s = slotOf(id, PICKS[pi].role, LOOK.x, LOOK.y, LOOK.L);
        const land = onCard(m, s.cx, s.cy);
        const x = mix(from.x, land.x, fly);
        const y = mix(from.y, land.y, fly) - 160 * Math.sin(Math.PI * Math.min(1, fly));
        return <Garment key={id} id={id} cx={x} cy={y} h={mix(RING_H, s.h * m.s, fly)} rot={mix(rot, s.rot, fly)} opacity={t < at ? ringO : 1} lift={0.4 * (1 - fly) + 0.2} />;
      })}
      <Zee emo={emo} from={emoFrom} t={t} size={zs} x={zx} y={zy} opacity={expoOut(progress(t, T.zee, 0.15)) * (1 - expoInOut(progress(t, T.photo, 0.4)))} />
      <Bubble text="On it." who="zee" x={640} y={930} w={360} size={56} words={1} opacity={expoOut(progress(t, T.onIt, 0.2)) * (1 - expoInOut(progress(t, T.ring, 0.3)))} />
      <Bubble text="Date night? The little black dress, heels and gold hoops." who="zee" x={CARD.x + 190} y={CARD.y + CARD.h - 150} w={CARD.w - 220} size={34} words={(t - T.answer) / 0.7} opacity={expoOut(progress(t, T.answer, 0.25)) * (1 - expoInOut(progress(t, T.photo, 0.4)))} />
      {/* her night-out photo: in it */}
      <Print id="photo.emma.r10-night-out.v1" cx={mix(1320, 650, m.photo)} cy={1160} h={1120} rot={mix(6, 1.5, m.photo)} opacity={m.photo > 0.002 ? 1 : 0} />
      <KeyLine text={"Zee looks through\n*her wardrobe.*"} at={T.line2} exitAt={T.answer - 0.1} size={76} lineHeight={1.04} bodyColor={BODY} keyColor={INK} style={{ left: 72, top: 300 }} />
      <KeyLine text={"Dressed in\n*one message.*"} at={T.line3} size={80} lineHeight={1.04} bodyColor={BODY} keyColor={INK} style={{ left: 72, top: 140 }} />
    </>
  );
};

const Lockup: React.FC = () => (
  <>
    <MarkWord y={0.42 * H} />
    <Line text={"Your stylist, *one message away.*"} at={T.lockLine} x={48} y={0.42 * H + 120} size={58} width={W - 96} align="center" keyColor={INK} bodyColor={BODY} />
    <Line text={"On the App Store"} at={T.cta} x={48} y={0.42 * H + 250} size={44} width={W - 96} align="center" keyColor={INK} bodyColor={BODY} />
  </>
);

const Film: React.FC<{ t: number }> = ({ t }) => {
  const qOut = moveP(t, T.out, OUT_DUR);
  const qBack = moveP(t, T.back, BACK_DUR, { zeta: 1, response: 0.32 });
  const ground = toneAt(t, TONE.blush, [[T.ring, TONE.sand], [T.photo, TONE.blush], [T.out, TONE.mist], [T.back, TONE.blush]]);
  return (
    <>
      <Ground color={ground} />
      {qBack < 0.0005 ? <Pan q={qOut} W={W} a={<Scene t={t} />} b={<Lockup />} /> : <Pan q={qBack} W={W} a={<Lockup />} b={null} /> /* back to frame 0: the bare blush ground */}
      <Grain amount={0.03} />
      <Vignette strength={0.12} />
    </>
  );
};

const SampleT: React.FC<{ children: (t: number) => React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return <>{children(frame / fps)}</>;
};

const speedAt = (t: number) => {
  const picks = PICKS.some((_, i) => t > T.pick + i * B && t < T.pick + i * B + 0.5) ? 30 : 0;
  const ring = t > T.ring + 1.2 && t < T.pick + 1.8 ? 20 : 0;
  const pan = (t > T.out && t < T.out + OUT_DUR) || (t > T.back && t < T.back + BACK_DUR) ? 34 : 0;
  return Math.max(picks, ring, pan);
};

export const AskZee: React.FC<Props> = ({ track, fromSec, volume }) => {
  useBrandFonts();
  const { fps, durationInFrames } = useVideoConfig();
  const tail = (fr: number) => Math.min(1, (durationInFrames - fr) / 4);
  return (
    <AbsoluteFill style={{ background: TONE.blush, color: INK, overflow: "hidden" }}>
      <Audio src={src(track)} trimBefore={Math.round(fromSec * fps)} volume={(fr) => volume * tail(fr)} />
      <SubframeBlur samples={(fr) => { const v = speedAt(fr / fps); return v > 2 ? samplesFor(v, 0.5, 3, 10) : 1; }} shutter={0.5}>
        <SampleT>{(st) => <Film t={st} />}</SampleT>
      </SubframeBlur>
    </AbsoluteFill>
  );
};
