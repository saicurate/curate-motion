import React from "react";
import { Img, interpolate, Sequence, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { AdSpec, FormatId } from "../../schemas/ad";
import { Script, VoiceOverride } from "../../schemas/voice.ts";
import {
  C,
  clamp,
  clockFor,
  display,
  duckGain,
  Ground,
  inOut,
  lineOf,
  Narration,
  narrationPlan,
  PhoneFrame,
  phraseFrame,
  Piece,
  popCurve,
  projectOnPhone,
  sceneOf,
  shadow,
  src,
  Star,
  Track,
  TypeOn,
  useBrandFonts,
  useFrameBox,
  Words,
  ZeeActor,
} from "../../motion";
import AD from "./ad.json";
import SCRIPT from "./script.json";
import { PhotoTile, rand } from "./PhotoTile";

// The app explainer, opening chapter (ported from the round-2 ExOpen motion test): the problem,
// meet Zee, and "your wardrobe, from your photos". One component for 9:16 and 16:9.
//
// The voiceover is CONFIG, not code (decisions/0009): config/voice.json › mode, this ad's
// ad.json › voice, or `tools/render explainer --voice tts`. Every beat below hangs off the
// narration plan's scenes and lines, so the same code works on the script's hints (captions)
// and on a voice's real durations (human or TTS): scenes grow to fit the voice.

export const schema = z.object({
  format: FormatId,
  length: z.number(),
  track: z.string(),
  /** Per-render voice override (tools/render --voice / --tts put it here). Empty = config + ad.json. */
  voice: VoiceOverride,
});
export type Props = z.infer<typeof schema>;

export const defaults: Omit<Props, "format" | "length"> = { track: AD.track, voice: {} };

const spec = AdSpec.parse(AD);
const script = Script.parse(SCRIPT);
/** Drawing the Sky's swell, seconds into the file: it lands on "Meet Zee". */
const SWELL_IN_TRACK = 14.8;

const PILE = [
  "jacket-denim", "tee-white", "jeans-straight-light-wash", "blazer-black", "shirt-oxford-blue", "dress-little-black",
  "coat-trench-khaki", "tee-long-sleeve-striped", "hoodie-navy", "skirt-midi-satin-camel", "sweatpants-grey",
  "sweater-cable-knit-cream", "jacket-leather-black", "shirt-flannel-plaid", "jeans-straight-dark-wash", "dress-slip-champagne",
  "jacket-varsity-navy-cream", "cardigan-oatmeal", "trousers-black", "shorts-denim-cutoff", "coat-wool-camel", "turtleneck-black",
  "sneakers-leather-white", "boots-cowboy-tan", "bag-tote-leather-black", "beanie-cream",
].map((n) => `garment.emma.${n}.v1`);
const TEE = "garment.emma.tee-white.v1";
const EMMA = "face.emma.b.v1";

export const planFor = (p: Pick<Props, "length" | "voice">, fps = 30) =>
  narrationPlan({ script, adVoice: spec.voice, override: p.voice, scenes: script.cuts[String(p.length)], fps });

/** Root.tsx calls this: the video is as long as the narration plan. */
export const metadata = (p: Props) => ({ durationInFrames: planFor(p).totalFrames });

export const Explainer: React.FC<Props> = ({ length, track, voice }) => {
  useBrandFonts();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { w: W, h: H, u: U, portrait, cx, cy } = useFrameBox();
  const u = U / 10.8; // the motion test's unit: 1 px of a 1080-px short side
  const plan = planFor({ length, voice }, fps);
  const problem = sceneOf(plan, "problem");
  const zee = sceneOf(plan, "meet-zee");
  const photos = sceneOf(plan, "photos");
  const end = photos.from + photos.durationInFrames;

  // music: the swell lands where Zee's scene starts, however long the problem scene ran
  const fromSec = SWELL_IN_TRACK - zee.from / fps;
  const delay = fromSec < 0 ? Math.round(-fromSec * fps) : 0;
  const clock = clockFor(track, Math.max(0, fromSec), fps);
  const SWELL = zee.from;
  const b = (n: number) => SWELL + Math.round(n * clock.perBeat);

  // anchors from the narration
  const nothing = phraseFrame(plan, "l02", "nothing to wear") - 21; // the words land just before they're said
  const meetZeeOut = lineOf(plan, "l04").from + 33;
  const pop = lineOf(plan, "l07").from + 25; // her photo pops as "already in your photos" begins

  // ── 1. the problem: a wall of her clothes that keeps shuffling and never lands ──
  const cols = portrait ? 5 : 9;
  const rows = portrait ? 6 : 3;
  const slotW = W / cols;
  const slotH = H / rows;
  const epoch = Math.floor(frame / 18);
  const dimPile = interpolate(frame, [nothing - 4, nothing + 16], [0, 1], { ...clamp, easing: inOut });
  const blow = interpolate(frame, [SWELL - 4, SWELL + 16], [0, 1], { ...clamp, easing: (t) => t * t });

  // ── 2. meet Zee ──
  const zeeIn = spring({ frame: frame - SWELL, fps, config: { damping: 11, stiffness: 120 } });
  const ZS = (portrait ? 700 : 560) * u;
  const toSide = interpolate(frame, [photos.from - 3, photos.from + 21], [0, 1], { ...clamp, easing: inOut });
  const zx = interpolate(toSide, [0, 1], [cx, portrait ? 210 * u : W * 0.17]);
  const zy = interpolate(toSide, [0, 1], [cy + 40 * u, portrait ? H - 470 * u : cy + 120 * u]);
  const zsize = interpolate(toSide, [0, 1], [ZS, (portrait ? 340 : 380) * u]);

  // ── 3. your wardrobe, from your photos ──
  const PH = { width: (portrait ? 560 : 400) * u, x: portrait ? cx + 60 * u : cx, y: portrait ? cy + 60 * u : cy + 40 * u, rx: 12, ry: -10, rz: 3 };
  const phoneIn = spring({ frame: frame - (photos.from + 5), fps, config: { damping: 16, stiffness: 90 } });
  const ph = { ...PH, y: PH.y + (1 - phoneIn) * H * 0.9 };
  const SW = ph.width * (1 - 0.056);
  const gap = 6 * u;
  const tile = (SW - gap * 4) / 3;
  const scroll = interpolate(frame, [photos.from + 35, Math.max(photos.from + 36, pop)], [0, tile * 2.2], { ...clamp, easing: inOut });
  const ER = { r: 4, c: 1 };
  const slide = interpolate(frame, [pop + 52, pop + 72], [0, 1], { ...clamp, easing: inOut });
  const emmaPop = spring({ frame: frame - pop, fps, config: { damping: 13, stiffness: 140 } });
  const eTile = projectOnPhone(ph, gap + ER.c * (tile + gap) + tile / 2, 150 * u + ER.r * (tile + gap) - scroll + tile / 2);
  const cardW = (portrait ? 600 : 470) * u;
  const cardH = cardW * 1.32;
  const cardX = interpolate(emmaPop, [0, 1], [eTile.x, portrait ? cx : cx - 220 * u]) + slide * (portrait ? -170 : -200) * u;
  const cardY = interpolate(emmaPop, [0, 1], [eTile.y, portrait ? cy - 60 * u : cy - 20 * u]) + slide * (portrait ? 330 : 40) * u;
  const cardS = interpolate(emmaPop, [0, 1], [tile / cardW, 1]) * (1 - slide * 0.22);
  const phoneOut = interpolate(frame, [pop + 10, pop + 40], [0, 1], { ...clamp, easing: inOut });
  const tee = popCurve(frame, pop + 60, 99999, 6, 0); // pops out and stays
  const fadeEnd = interpolate(frame, [end - 30, end], [1, 0], clamp);

  return (
    <Ground>
      <Sequence from={delay} layout="none">
        <Track id={track} fromSec={Math.max(0, fromSec)} total={plan.totalFrames - delay} fps={fps} fadeOut={30} duck={(f) => duckGain(plan, f + delay)} />
      </Sequence>

      <div style={{ position: "absolute", inset: 0, opacity: fadeEnd }}>
        {/* 1. the pile */}
        {blow < 1
          ? PILE.map((id, j) => {
              const N = cols * rows;
              const base = (j * 7) % N;
              const moving = (e: number) => rand(j * 31 + e) > 0.5;
              const lastMove = (e: number) => {
                for (let q = e; q > e - 6; q--) if (q <= 0 || moving(q)) return q;
                return e - 6;
              };
              const curE = lastMove(epoch);
              const prevE = lastMove(curE - 1);
              const k = curE === epoch ? spring({ frame: frame - epoch * 18, fps, config: { damping: 14, stiffness: 160 } }) : 1;
              const sx = (e: number) => (base % cols) * slotW + slotW / 2 + (rand(e * 13 + j) - 0.5) * slotW * 0.9;
              const sy = (e: number) => Math.floor(base / cols) * slotH + slotH / 2 + (rand(e * 17 + j * 3) - 0.5) * slotH * 0.7;
              let x = interpolate(k, [0, 1], [sx(prevE), sx(curE)]);
              let y = interpolate(k, [0, 1], [sy(prevE), sy(curE)]);
              const ang = Math.atan2(y - cy, x - cx);
              x += Math.cos(ang) * blow * W * 1.1;
              y += Math.sin(ang) * blow * H * 1.1;
              const h = Math.min(slotW, slotH) * (1.25 + rand(j) * 0.35);
              return (
                <Piece
                  key={id}
                  id={id}
                  x={x}
                  y={y}
                  h={h}
                  rot={(rand(j * 5 + curE) - 0.5) * 30}
                  opacity={1 - dimPile * 0.7}
                  style={{ filter: dimPile > 0 ? `blur(${dimPile * 6}px)` : undefined }}
                />
              );
            })
          : null}
        {frame < SWELL ? (
          <div style={{ position: "absolute", top: (portrait ? 120 : 60) * u, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
            <div style={{ ...display(40 * u), letterSpacing: "0", background: C.card, borderRadius: 99, padding: `${12 * u}px ${28 * u}px`, boxShadow: shadow.card, fontVariantNumeric: "tabular-nums" }}>
              {frame < problem.from + 120 ? "8:02 am" : "8:03 am"}
            </div>
          </div>
        ) : null}
        <Words text="Nothing to wear." at={nothing} size={(portrait ? 128 : 140) * u} exitAt={SWELL - 6} style={{ top: cy - 90 * u, left: 0, width: W }} />

        {/* 2. Zee */}
        {frame >= SWELL ? (
          <ZeeActor
            cues={[
              { at: SWELL, emo: "hello" },
              { at: b(4), emo: "happy", cut: true },
              { at: b(8), emo: "idea" },
              { at: photos.from + 5, emo: "curious" },
              { at: pop, emo: "excited" },
            ]}
            size={zsize}
            style={{ left: zx - zsize / 2, top: zy - zsize * 0.6, transform: `scale(${interpolate(zeeIn, [0, 1], [0.3, 1])})` }}
          />
        ) : null}
        <Star at={b(8) + 6} x={cx + ZS * 0.36} y={cy - ZS * 0.32} size={110 * u} />
        <Star at={b(8) + 9} x={cx - ZS * 0.38} y={cy - ZS * 0.12} size={70 * u} />
        <Words text="Meet Zee." at={SWELL + 6} size={(portrait ? 150 : 130) * u} exitAt={meetZeeOut} style={{ top: (portrait ? 260 : 90) * u, left: 0, width: W }} />

        {/* 3. the camera roll */}
        {frame >= photos.from + 1 && phoneOut < 1 ? (
          <PhoneFrame {...ph} opacity={1 - phoneOut} scale={1 - phoneOut * 0.08}>
            {Array.from({ length: 9 }).map((_, r) =>
              Array.from({ length: 3 }).map((__, c) => {
                const left = gap + c * (tile + gap);
                const top = 150 * u + r * (tile + gap) - scroll;
                if (r === ER.r && c === ER.c) {
                  return frame >= pop ? null : (
                    <div key={`${r}${c}`} style={{ position: "absolute", left, top, width: tile, height: tile, borderRadius: 5 * u, overflow: "hidden" }}>
                      <Img src={src(EMMA)} style={{ width: tile, height: tile, objectFit: "cover", objectPosition: "50% 30%" }} />
                    </div>
                  );
                }
                return <PhotoTile key={`${r}${c}`} w={tile} h={tile} seed={r * 5 + c * 3 + 1} you={(r * 3 + c) % 3 !== 1} radius={5 * u} style={{ position: "absolute", left, top }} />;
              }),
            )}
          </PhoneFrame>
        ) : null}

        {/* her photo pops out of the roll, up big; the tee she's wearing pops out of it */}
        {frame >= pop ? (
          <div
            style={{
              position: "absolute",
              left: cardX - cardW / 2,
              top: cardY - cardH / 2,
              width: cardW,
              height: cardH,
              borderRadius: 30 * u,
              overflow: "hidden",
              boxShadow: shadow.float,
              transform: `scale(${cardS}) rotate(${interpolate(emmaPop, [0, 1], [6, -2])}deg)`,
            }}
          >
            <Img src={src(EMMA)} style={{ width: cardW, height: cardH, objectFit: "cover", objectPosition: "50% 40%" }} />
            <div style={{ position: "absolute", inset: 0, background: C.ground, opacity: interpolate(frame, [pop + 60, pop + 72], [0, 0.35], clamp) }} />
          </div>
        ) : null}
        <TypeOn text={"Already in\nyour photos."} at={pop + 82} size={(portrait ? 120 : 110) * u} perChar={1.1} style={{ left: portrait ? 80 * u : W * 0.6, top: portrait ? 330 * u : cy - 150 * u, width: portrait ? W - 160 * u : W * 0.4 }} />
        {tee > 0 ? (
          <Piece
            id={TEE}
            x={interpolate(Math.min(tee, 1), [0, 1], [cardX, portrait ? cx + 170 * u : cx + 10 * u])}
            y={interpolate(Math.min(tee, 1), [0, 1], [cardY + cardH * 0.25, portrait ? cy - 140 * u : cy + 10 * u])}
            h={(portrait ? 600 : 560) * u}
            scale={0.15 + 0.85 * tee}
            rot={Math.sin((frame - pop - 60) / 9) * 2}
            outline={interpolate(frame, [pop + 60, pop + 64, pop + 76], [1, 1, 0], clamp)}
          />
        ) : null}
      </div>

      <Narration plan={plan} />
    </Ground>
  );
};
