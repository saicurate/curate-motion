import React from "react";
import { Audio } from "@remotion/media";
import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { FormatId } from "../../schemas/ad";
import { frameSrc, GEIST, Grain, KeyLine, samplesFor, src, SubframeBlur, useBrandFonts, Vignette } from "../../motion";
import { BODY, Bubble, Card, Garment, Ground, INK, MarkWord, moveP, Pan, Pill, Print, Rain, slotOf, TONE, toneAt, WeatherChip, wave, type Role } from "../../motion/Designed";
import { expoInOut, expoOut, mix, progress, spring } from "../../motion/springs";
import { Line } from "../app-store-header";
import { frameCount } from "../../motion/assets";

// Rain or shine v2 (2026-10-24): the app REDRAWN (decisions/0014), in the header's world. Deep Urban from its
// lift (beatmap.ts: 124 BPM, bars at 0, 1.928, 3.866, 5.794, 7.733, 9.671, 11.61, 13.549).
//
//   HOOK     a big weather chip, 68° Sunny, flips to 54° Rain at 4 pm; rain starts; the ground cools
//   PROBLEM  her sunny look on Today's card, the rain falling on it: "Her look won't last till 4."
//   REVEAL   Curate re-dresses her, one piece a beat: trench, navy knit, dark jeans, boots, the tote
//   PROOF    Zee's line, Try it on, and her rainy-day photo: in the trench, under her umbrella
//   CLOSE    the pan through the light to the lockup, "Rain or shine, you're dressed."; back to the sun

export const schema = z.object({ format: FormatId, length: z.number(), track: z.string(), fromSec: z.number(), volume: z.number().min(0).max(1) });
export type Props = z.infer<typeof schema>;
export const defaults = { track: "music.mixkit.deep-urban-eugenio-mininni.v1", fromSec: 14.994, volume: 0.7 };

const W = 1080;
const H = 1920;
const B = 1.928 / 4; // a beat
const T = { flip: B, line1: 0.62, card: 1.928, line2: 2.3, swap: 3.866, line3: 4.35, zee: 7.733, press: 8.7, photo: 9.671, line4: 10.1, out: 11.61, lockLine: 12.1, cta: 12.58, back: 14.25 };
const OUT_DUR = 1.6;
const BACK_DUR = 0.75;

/** The two looks: sunny (her weekend denim) and covered (Today's rain look in the app). */
const SUNNY: { id: string; role: Role }[] = [
  { id: "garment.emma.jacket-denim.v1", role: "outer" },
  { id: "garment.emma.tee-white.v1", role: "top" },
  { id: "garment.emma.jeans-straight-light-wash.v1", role: "bottom" },
  { id: "garment.emma.sneakers-leather-white.v1", role: "shoes" },
];
const RAINY: { id: string; role: Role }[] = [
  { id: "garment.emma.coat-trench-khaki.v1", role: "outer" },
  { id: "garment.emma.sweater-crewneck-navy.v1", role: "top" },
  { id: "garment.emma.jeans-straight-dark-wash.v1", role: "bottom" },
  { id: "garment.emma.boots-ankle-black.v1", role: "shoes" },
  { id: "garment.emma.bag-tote-leather-black.v1", role: "bag" },
];
/** Which beat each swap lands on (from T.swap), in the order of RAINY. */
const SWAP_AT = RAINY.map((_, i) => T.swap + i * B);

const CARD = { x: 90, y: 690, w: 900, h: 1080 };
const LOOK = { x: CARD.x + CARD.w / 2, y: CARD.y + 600, L: 700 };

/** Zee's still face from the live pack (30 fps clips; this film is 60). */
const ZeeFace: React.FC<{ emo: string; t: number; size: number; x: number; y: number; opacity?: number }> = ({ emo, t, size, x, y, opacity = 1 }) => {
  if (opacity < 0.004) return null;
  const id = `zee.${emo}.loop.v1`;
  const n = frameCount(id);
  return <Img src={frameSrc(id, Math.floor(t * 30) % n)} style={{ position: "absolute", left: x, top: y, width: size, height: size, opacity: opacity < 0.9995 ? opacity : undefined }} />;
};

/** The weather chip, centred on (x, y): Sunny crossfading to Rain at 4 pm, both in one grid cell. */
const Chip: React.FC<{ x: number; y: number; s: number; flip: number }> = ({ x, y, s, flip }) => (
  <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%, -50%) scale(${s.toFixed(4)})`, display: "grid", justifyItems: "center", alignItems: "center" }}>
    <div style={{ gridArea: "1 / 1" }}>
      <WeatherChip glyph="sun" temp="68°" words="Sunny" size={70} opacity={1 - flip} inline />
    </div>
    <div style={{ gridArea: "1 / 1" }}>
      <WeatherChip glyph="rain" temp="54°" words="Rain at 4 pm" size={70} opacity={flip} inline />
    </div>
  </div>
);

const Scene: React.FC<{ t: number }> = ({ t }) => {
  const flip = expoInOut(progress(t, T.flip, 0.35));
  const rain = expoOut(progress(t, T.flip, 0.6));
  // the chip: big in the middle, then up into the card's corner as the card rises
  const cardIn = spring(t - T.card, "panel");
  const chipX = mix(W / 2, CARD.x + CARD.w - 200, cardIn);
  const chipY = mix(700, CARD.y + 92, cardIn);
  const chipS = mix(1, 0.52, cardIn);
  const cardY = mix(H + 80, CARD.y, cardIn);
  // the payoff: the card steps back and left, her rainy-day photo rises in front
  const photo = spring(t - T.photo, "panel");
  const cardX = CARD.x - 260 * photo;
  const cardS = 1 - 0.18 * photo;
  const shiver = t > T.card && t < T.swap ? 4 * wave(t, 0.23) * expoOut(progress(t, T.card + 0.5, 0.6)) : 0;
  const titleRain = t >= T.swap + 2 * B;
  return (
    <>
      <Rain t={t} W={W} H={H} amount={rain * (1 - 0.5 * photo)} />
      {/* Today's card, redrawn */}
      <div style={{ position: "absolute", inset: 0, transformOrigin: `${CARD.x + CARD.w / 2}px ${CARD.y + CARD.h / 2}px`, transform: `translate(${cardX - CARD.x + shiver}px, ${cardY - CARD.y}px) scale(${cardS.toFixed(4)})`, filter: `brightness(${(1 - 0.12 * photo).toFixed(3)})` }}>
        <Card x={CARD.x} y={CARD.y} w={CARD.w} h={CARD.h} r={46} opacity={cardIn > 0.002 ? 1 : 0}>
          <div style={{ position: "absolute", left: 56, top: 52, fontFamily: GEIST, fontWeight: 500, color: INK }}>
            <div style={{ fontSize: 30, color: BODY, letterSpacing: "0.01em" }}>Today</div>
            <div style={{ fontSize: 58, letterSpacing: "-0.03em", marginTop: 6, opacity: 1 }}>{titleRain ? "Rain till 4 pm" : "Errands & coffee"}</div>
            <div style={{ fontSize: 32, color: BODY, marginTop: 8 }}>{titleRain ? "Covered" : "Easy"}</div>
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 300, height: 600, background: "#F4F4F2" }} />
        </Card>
        {/* the looks: each sunny piece flies out right on its beat; its rainy one flies in from the left */}
        {cardIn > 0.002
          ? RAINY.map((r, i) => {
              const at = SWAP_AT[i];
              const old = SUNNY.find((s) => s.role === r.role);
              const outU = spring(t - at, "piece");
              const inU = spring(t - (at + 0.06), "piece");
              const sNew = slotOf(r.id, r.role, LOOK.x, LOOK.y, LOOK.L);
              return (
                <React.Fragment key={r.role}>
                  {old && outU < 0.999
                    ? (() => {
                        const s = slotOf(old.id, old.role, LOOK.x, LOOK.y, LOOK.L);
                        return <Garment id={old.id} cx={s.cx + 900 * outU} cy={s.cy - 140 * Math.sin(Math.PI * outU)} h={s.h} rot={s.rot + 18 * outU} opacity={1 - expoInOut(progress(outU, 0.5, 0.5))} lift={0.3 + outU} />;
                      })()
                    : null}
                  {inU > 0.001 ? <Garment id={r.id} cx={sNew.cx - 900 * (1 - inU)} cy={sNew.cy - 140 * Math.sin(Math.PI * (1 - inU))} h={sNew.h} rot={sNew.rot - 18 * (1 - inU)} opacity={expoOut(progress(inU, 0, 0.3))} lift={0.3 * (1 - inU) + 0.3} /> : null}
                </React.Fragment>
              );
            })
          : null}
        <Bubble text="Rain on the way. Keep a layer you can carry." who="zee" x={CARD.x + 130} y={CARD.y + CARD.h - 175} w={CARD.w - 170} size={34} words={(t - T.zee) / 0.6} opacity={expoOut(progress(t, T.zee, 0.25))} />
        <ZeeFace emo="curious" t={t} size={110} x={CARD.x + 26} y={CARD.y + CARD.h - 150} opacity={expoOut(progress(t, T.zee, 0.25))} />
        <Pill label="Try it on" x={CARD.x + CARD.w - 300} y={CARD.y + 210} size={34} press={(t - T.press) / 0.3} opacity={expoOut(progress(t, T.swap + 5 * B, 0.3))} />
      </div>
      <Chip x={chipX} y={chipY} s={chipS} flip={flip} />
      {/* her rainy-day photo: in the trench, under her umbrella */}
      <Print id="photo.emma.r23-rainy-day.v1" cx={mix(1300, 640, photo)} cy={1150} h={1150} rot={mix(6, 1.5, photo)} opacity={photo > 0.002 ? 1 : 0} />
      <KeyLine text={"It's going to rain *at 4.*"} at={T.line1} exitAt={T.card - 0.1} size={88} lineHeight={1.04} bodyColor={BODY} keyColor={INK} style={{ left: 72, top: 150 }} />
      <KeyLine text={"Her look won't *last till 4.*"} at={T.line2} exitAt={T.swap - 0.08} size={76} lineHeight={1.04} bodyColor={BODY} keyColor={INK} style={{ left: 72, top: 150 }} />
      <KeyLine text={"Curate re-dresses her\n*for the weather.*"} at={T.line3} exitAt={T.photo - 0.1} size={76} lineHeight={1.04} bodyColor={BODY} keyColor={INK} style={{ left: 72, top: 140 }} />
      <KeyLine text={"Dressed for it,\n*before it starts.*"} at={T.line4} size={76} lineHeight={1.04} bodyColor={BODY} keyColor={INK} style={{ left: 72, top: 140 }} />
    </>
  );
};

/** Frame 0, for the loop's return: the sunny chip alone, exactly where the hook starts it. */
const Opening: React.FC = () => <Chip x={W / 2} y={700} s={1} flip={0} />;

const Lockup: React.FC<{ t: number }> = ({ t }) => (
  <>
    <Rain t={t} W={W} H={H} amount={0.25} n={40} />
    <MarkWord y={0.42 * H} />
    <Line text={"Rain or shine, *you're dressed.*"} at={T.lockLine} x={48} y={0.42 * H + 120} size={60} width={W - 96} align="center" keyColor={INK} bodyColor={BODY} />
    <Line text={"On the App Store"} at={T.cta} x={48} y={0.42 * H + 250} size={44} width={W - 96} align="center" keyColor={INK} bodyColor={BODY} />
  </>
);

const Film: React.FC<{ t: number }> = ({ t }) => {
  const qOut = moveP(t, T.out, OUT_DUR);
  const qBack = moveP(t, T.back, BACK_DUR, { zeta: 1, response: 0.32 });
  const ground = toneAt(t, TONE.oat, [[T.flip, TONE.slate], [T.photo, TONE.blue], [T.out, TONE.mist], [T.back, TONE.oat]]);
  return (
    <>
      <Ground color={ground} />
      {qBack < 0.0005 ? <Pan q={qOut} W={W} a={<Scene t={t} />} b={<Lockup t={t} />} /> : <Pan q={qBack} W={W} a={<Lockup t={t} />} b={<Opening />} />}
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

/** The fast moments, in px a frame: the pieces' swaps (≈900 px in ≈0.5 s), the pans. */
const speedAt = (t: number) => {
  const swaps = SWAP_AT.some((a) => t > a && t < a + 0.6) ? 30 : 0;
  const pan = (t > T.out && t < T.out + OUT_DUR) || (t > T.back && t < T.back + BACK_DUR) ? 34 : 0;
  const card = t > T.card && t < T.card + 0.5 ? 26 : 0;
  return Math.max(swaps, pan, card);
};

export const RainOrShineV2: React.FC<Props> = ({ track, fromSec, volume }) => {
  useBrandFonts();
  const { fps, durationInFrames } = useVideoConfig();
  const tail = (fr: number) => Math.min(1, (durationInFrames - fr) / 4);
  return (
    <AbsoluteFill style={{ background: TONE.oat, color: INK, overflow: "hidden" }}>
      <Audio src={src(track)} trimBefore={Math.round(fromSec * fps)} volume={(fr) => volume * tail(fr)} />
      <SubframeBlur samples={(fr) => { const v = speedAt(fr / fps); return v > 2 ? samplesFor(v, 0.5, 3, 10) : 1; }} shutter={0.5}>
        <SampleT>{(st) => <Film t={st} />}</SampleT>
      </SubframeBlur>
    </AbsoluteFill>
  );
};
