import React from "react";
import { Audio } from "@remotion/media";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { FormatId } from "../../schemas/ad";
import { GEIST, Grain, KeyLine, samplesFor, src, SubframeBlur, useBrandFonts, Vignette } from "../../motion";
import { BODY, Card, Garment, Ground, INK, MarkWord, moveP, Pan, Pill, Print, TONE, toneAt, wave, Wipe } from "../../motion/Designed";
import { pieceAspect } from "../../motion/Piece";
import { expoInOut, expoOut, mix, progress, spring } from "../../motion/springs";
import { Line } from "../app-store-header";

// See it on you (2026-10-24): Studio's try-on REDRAWN (decisions/0014), in the header's world. Can't Get You Off
// My Mind from its drop (beatmap.ts: 150 BPM, bars at 0, 1.603, 3.205, 4.807, 6.403, 8, 9.608, 11.21, 12.795).
//
//   HOOK     her walk-to-work photo; on the drop a black tee falls onto her and the photo changes: she's wearing it
//   STUDIO   the pan to Studio, redrawn: her photo over her wardrobe tray; tap the tee, tap the jeans, each flies
//            onto her; Try it on; the photo sweeps to her in them
//   SPREAD   both try-ons side by side, her pieces drifting round them: "Every look, on you."
//   CLOSE    the pan through the light to the lockup, "Try on your own closet."; back to the walk photo

export const schema = z.object({ format: FormatId, length: z.number(), track: z.string(), fromSec: z.number(), volume: z.number().min(0).max(1) });
export type Props = z.infer<typeof schema>;
export const defaults = { track: "music.mixkit.cant-get-you-off-my-mind-michael-ramir-c.v1", fromSec: 25.588, volume: 0.7 };

const W = 1080;
const H = 1920;
const T = {
  drop: 0.0, land: 0.389, wipe1: 0.45, line1: 0.25,
  studio: 1.603, line2: 2.05, tray: 2.2, tap1: 3.205, tap2: 4.0, press: 4.807, wipe2: 4.9, line3: 5.35, push: 6.403,
  spread: 8.0, line4: 8.4, out: 11.21, lockLine: 11.7, cta: 12.2, back: 14.0,
};
const STUDIO_DUR = 0.8;
const OUT_DUR = 1.6;
const BACK_DUR = 0.75;
const WIPE_DUR = 0.75;

const R30 = "photo.emma.r30-walk-to-work.v1";
const R30_ON = "photo.emma.r30-walk-to-work-tryon-tee-black.v1";
const BASE = "tryon.emma.tryon-base-1.v1"; // white tee, light jeans
const BASE_ON = "tryon.emma.tryon-base-2.v1"; // the black tee and dark jeans, tried on
const TEE = "garment.emma.tee-black.v1";
const JEANS = "garment.emma.jeans-straight-dark-wash.v1";
const ASP = 1792 / 2400;

/** The hook's print, and where her torso is in it (measured off the photo: 0.45 across, 0.49 down). */
const HOOK = { cx: W / 2, cy: 1060, h: 1240 };
const hookTorso = { x: HOOK.cx + (0.45 - 0.5) * HOOK.h * ASP, y: HOOK.cy + (0.49 - 0.5) * HOOK.h };

/** Studio: her photo over the wardrobe tray. Body points measured off tryon-base-1. */
const STUDIO = { cx: W / 2, cy: 880, h: 1000 };
const atStudio = (rx: number, ry: number) => ({ x: STUDIO.cx + (rx - 0.5) * STUDIO.h * ASP, y: STUDIO.cy + (ry - 0.5) * STUDIO.h });
const TRAY = { x: 60, y: 1420, w: 960, h: 400 };
const TRAY_ITEMS = [TEE, JEANS, "garment.emma.blazer-black.v1", "garment.emma.sweater-cable-knit-cream.v1", "garment.emma.loafers-black.v1"];
const slotX = (i: number) => TRAY.x + (TRAY.w / TRAY_ITEMS.length) * (i + 0.5);
const SLOT_Y = TRAY.y + 238;
const SLOT_H = 190;
const SLOT_W = 160;
/** A tray piece's height: fits a 160 × 190 box, so a wide pair of loafers stays inside its slot. */
const slotH = (id: string) => Math.min(SLOT_H, SLOT_W / pieceAspect(id));
/** The two taps: which tray piece, when, and where on her it lands. */
const TAPS = [
  { i: 0, at: T.tap1, to: atStudio(0.51, 0.33), h: 240, rot: 0 },
  { i: 1, at: T.tap2, to: atStudio(0.5, 0.65), h: 470, rot: 0 },
];
/** Studio's print decodes once at its largest (the push-in), so the bitmap never changes size mid-shot. A print
 *  whose photo changes is remounted (its key): a StableImg only holds the frame for the photo it mounted with. */
const STUDIO_DECODE = { w: Math.round(1.15 * 1320 * ASP), h: Math.round(1.15 * 1320) };

/** Where the Studio print is: still, then pushed in on the result, then stepping back left for the spread. */
const studioPrint = (t: number) => {
  const push = spring(t - T.push, "camera");
  const back = spring(t - T.spread, "panel");
  const cx = mix(STUDIO.cx, 352, back);
  const cy = mix(mix(STUDIO.cy, 1010, push), 990, back);
  const h = mix(mix(STUDIO.h, 1320, push), 820, back);
  return { cx, cy, h, rot: mix(0, -3.5, back), push, back };
};

/** A tap: a soft ring that opens and fades where the finger was. */
const Tap: React.FC<{ x: number; y: number; t: number; at: number }> = ({ x, y, t, at }) => {
  const u = progress(t, at - 0.05, 0.45);
  if (u <= 0 || u >= 1) return null;
  const r = mix(34, 96, expoOut(u));
  return <div style={{ position: "absolute", left: x - r, top: y - r, width: 2 * r, height: 2 * r, borderRadius: "50%", border: `3px solid rgba(24,24,24,${(0.55 * (1 - u)).toFixed(3)})`, background: `rgba(255,255,255,${(0.35 * (1 - u)).toFixed(3)})` }} />;
};

/** How much a piece laid on a print is left as the wipe's edge passes its centre (`ry` 0 → 1 down the print). */
const absorbed = (u: number, ry: number) => 1 - expoInOut(progress(u, (ry + 0.15) / 1.3 - 0.1, 0.2));

const Hook: React.FC<{ t: number }> = ({ t }) => {
  const fall = spring(t - T.drop, { zeta: 0.86, response: 0.32 });
  const u = expoInOut(progress(t, T.wipe1, WIPE_DUR));
  const w = HOOK.h * ASP;
  const done = u >= 0.999;
  return (
    <>
      <Print key={done ? "on" : "off"} id={done ? R30_ON : R30} cx={HOOK.cx} cy={HOOK.cy} h={HOOK.h}>
        {!done ? <Wipe to={R30_ON} w={w} h={HOOK.h} u={u} /> : null}
      </Print>
      <Garment id={TEE} cx={hookTorso.x} cy={mix(-260, hookTorso.y, fall)} h={300} rot={mix(-14, 0, fall)} opacity={absorbed(u, 0.49)} lift={1 - fall} />
      <KeyLine text={"See it *on you.*"} at={T.line1} exitAt={T.studio - 0.15} size={92} lineHeight={1.04} bodyColor={BODY} keyColor={INK} style={{ left: 72, top: 150 }} />
    </>
  );
};

const Studio: React.FC<{ t: number }> = ({ t }) => {
  const p = studioPrint(t);
  const trayIn = spring(t - T.tray, "panel");
  const trayOut = spring(t - T.push, "panel");
  const trayDy = (1 - trayIn) * 560 + trayOut * 620;
  const u = expoInOut(progress(t, T.wipe2, WIPE_DUR));
  const done = u >= 0.999;
  const w = p.h * ASP;
  // the second try-on joins it for the spread, from the right
  const join = spring(t - (T.spread + 0.12), "panel");
  const drift = (i: number) => 14 * wave(t, 3.1, i);
  return (
    <>
      {/* her pieces drifting round the spread */}
      {[
        { id: TEE, x: 880, y: 540, h: 180, rot: 9 },
        { id: "garment.emma.bag-tote-leather-black.v1", x: 930, y: 1700, h: 220, rot: 6 },
        { id: "garment.emma.loafers-black.v1", x: 200, y: 1560, h: 110, rot: -10 },
      ].map((g, i) => (
        <Garment key={g.id} id={g.id} cx={g.x + drift(i)} cy={g.y + drift(i + 2)} h={g.h} rot={g.rot + 2 * wave(t, 2.7, i)} opacity={expoOut(progress(t, T.spread + 0.3 + 0.12 * i, 0.4))} lift={0.6} />
      ))}
      <Print key={done ? "on" : "off"} id={done ? BASE_ON : BASE} cx={p.cx} cy={p.cy} h={p.h} rot={p.rot} decode={STUDIO_DECODE} dim={0.06 * join}>
        {!done ? <Wipe to={BASE_ON} w={w} h={p.h} u={u} /> : null}
      </Print>
      <Print id={R30_ON} cx={mix(1420, 760, join)} cy={1130} h={820} rot={mix(8, 3, join)} opacity={join > 0.002 ? 1 : 0} />
      {/* the wardrobe tray, redrawn */}
      <div style={{ position: "absolute", inset: 0, transform: `translateY(${trayDy.toFixed(2)}px)` }}>
        <Card x={TRAY.x} y={TRAY.y} w={TRAY.w} h={TRAY.h} r={44} opacity={trayIn > 0.002 && trayOut < 0.998 ? 1 : 0}>
          <div style={{ position: "absolute", left: 46, top: 40, fontFamily: GEIST, fontWeight: 500, fontSize: 34, color: INK, letterSpacing: "-0.02em" }}>Your wardrobe</div>
          <div style={{ position: "absolute", left: 30, right: 30, top: 120, height: 236, borderRadius: 26, background: "#F4F4F2" }} />
        </Card>
        {trayIn > 0.002 && trayOut < 0.998 ? (
          <>
            <Pill label="Try it on" x={TRAY.x + TRAY.w - 262} y={TRAY.y + 22} size={32} press={(t - T.press) / 0.3} opacity={expoOut(progress(t, T.tap2 + 0.45, 0.3))} />
            {TRAY_ITEMS.map((id, i) => {
              const tap = TAPS.find((k) => k.i === i);
              if (tap && t >= tap.at) return null;
              const press = tap ? 1 - 0.06 * Math.sin(Math.PI * progress(t, tap.at - 0.12, 0.12)) : 1;
              return <Garment key={id} id={id} cx={slotX(i)} cy={SLOT_Y} h={slotH(id) * press} rot={0} lift={0.1} />;
            })}
            {TAPS.map((k) => <Tap key={k.i} x={slotX(k.i)} y={SLOT_Y} t={t} at={k.at} />)}
          </>
        ) : null}
      </div>
      {/* the tapped pieces fly up onto her, and the try-on takes them in */}
      {TAPS.map((k) => {
        if (t < k.at) return null;
        const f = spring(t - k.at, "piece");
        const x = mix(slotX(k.i), k.to.x, f);
        const y = mix(SLOT_Y + trayDy, k.to.y, f) - 220 * Math.sin(Math.PI * Math.min(1, f));
        const ry = (k.to.y - (STUDIO.cy - STUDIO.h / 2)) / STUDIO.h;
        return <Garment key={k.i} id={TRAY_ITEMS[k.i]} cx={x} cy={y} h={mix(slotH(TRAY_ITEMS[k.i]), k.h, f)} rot={k.rot} opacity={absorbed(u, ry)} lift={0.6 * (1 - f) + 0.15} />;
      })}
      <KeyLine text={"Pick anything\n*from your closet.*"} at={T.line2} exitAt={T.line3 - 0.25} size={74} lineHeight={1.04} bodyColor={BODY} keyColor={INK} style={{ left: 72, top: 120 }} />
      <KeyLine text={"On you,\n*before you wear it.*"} at={T.line3} exitAt={T.spread - 0.1} size={74} lineHeight={1.04} bodyColor={BODY} keyColor={INK} style={{ left: 72, top: 120 }} />
      <KeyLine text={"Every look,\n*on you.*"} at={T.line4} size={84} lineHeight={1.04} bodyColor={BODY} keyColor={INK} style={{ left: 72, top: 140 }} />
    </>
  );
};

/** Frame 0, for the loop's return: her walk photo alone, exactly where the hook starts it. */
const Opening: React.FC = () => <Print id={R30} cx={HOOK.cx} cy={HOOK.cy} h={HOOK.h} />;

const Lockup: React.FC = () => (
  <>
    <MarkWord y={0.42 * H} />
    <Line text={"Try on *your own closet.*"} at={T.lockLine} x={48} y={0.42 * H + 120} size={60} width={W - 96} align="center" keyColor={INK} bodyColor={BODY} />
    <Line text={"On the App Store"} at={T.cta} x={48} y={0.42 * H + 250} size={44} width={W - 96} align="center" keyColor={INK} bodyColor={BODY} />
  </>
);

const Film: React.FC<{ t: number }> = ({ t }) => {
  const qStudio = moveP(t, T.studio, STUDIO_DUR, { zeta: 1, response: 0.34 });
  const qOut = moveP(t, T.out, OUT_DUR);
  const qBack = moveP(t, T.back, BACK_DUR, { zeta: 1, response: 0.32 });
  const ground = toneAt(t, TONE.oat, [[T.studio, TONE.mist], [T.spread, TONE.sand], [T.out, TONE.mist], [T.back, TONE.oat]]);
  const set =
    qStudio < 0.9995 ? <Pan q={qStudio} W={W} a={<Hook t={t} />} b={<Studio t={t} />} />
    : qBack < 0.0005 ? <Pan q={qOut} W={W} a={<Studio t={t} />} b={<Lockup />} />
    : <Pan q={qBack} W={W} a={<Lockup />} b={<Opening />} />;
  return (
    <>
      <Ground color={ground} />
      {set}
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

/** The fast moments, in px a frame: the tee's fall (≈1300 px in 0.4 s), the flights to her, the pans. */
const speedAt = (t: number) => {
  const fall = t < T.land + 0.1 ? 40 : 0;
  const fly = TAPS.some((k) => t > k.at && t < k.at + 0.55) ? 28 : 0;
  const pan = (t > T.studio && t < T.studio + STUDIO_DUR) || (t > T.out && t < T.out + OUT_DUR) || (t > T.back && t < T.back + BACK_DUR) ? 34 : 0;
  const spread = t > T.spread && t < T.spread + 0.6 ? 24 : 0;
  return Math.max(fall, fly, pan, spread);
};

export const SeeItOnYou: React.FC<Props> = ({ track, fromSec, volume }) => {
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
