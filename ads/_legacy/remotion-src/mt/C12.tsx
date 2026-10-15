import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { Ground, Track } from "../lib/Ground";
import { EndCard, Words } from "../lib/Kinetic";
import { Look, LookPiece } from "../lib/Pieces";
import { beats, C, clamp, display, inOut, out, shadow } from "../lib/theme";
import { Emotion, Zee } from "../lib/Zee";

// C12 "Mon to Sun, one move" — motion test. One continuous camera move through a week:
// it eases on each day's look for a beat, then whip-pans (speed ramp + horizontal motion blur)
// to the next; each day's name flies past faster than the looks (kinetic-type wipe). Then the
// week folds up into a grid: the same dark jeans turn up three times.
// Cut to "Deep Urban" (Eugenio Mininni, Mixkit, ~124 bpm) from 0:14.2: the drop is on Monday.
export const C12_FRAMES = 450;
const b = beats(123.75, 1.015);
const day = (i: number) => b(i * 3);

type D = { short: string; word: string; chip: string; emo: Emotion; pieces: LookPiece[] };
const WEEK: D[] = [
  { short: "M", word: "MON", chip: "Office", emo: "focused", pieces: [{ slug: "black-blazer", role: "outer" }, { slug: "white-tee", role: "top" }, { slug: "black-trousers", role: "bottom" }, { slug: "black-loafers", role: "shoes" }, { slug: "black-leather-tote", role: "bag" }] },
  { short: "T", word: "TUE", chip: "Gym", emo: "excited", pieces: [{ slug: "sage-sports-bra", role: "top" }, { slug: "sage-leggings", role: "bottom" }, { slug: "retro-runners", role: "shoes" }] },
  { short: "W", word: "WED", chip: "Rain at 4", emo: "curious", pieces: [{ slug: "khaki-trench-coat", role: "outer" }, { slug: "navy-crewneck-sweater", role: "top" }, { slug: "dark-wash-straight-jeans", role: "bottom" }, { slug: "black-ankle-boots", role: "shoes" }] },
  { short: "T", word: "THU", chip: "Dinner", emo: "love", pieces: [{ slug: "black-satin-camisole", role: "top" }, { slug: "camel-satin-midi-skirt", role: "bottom" }, { slug: "black-heels", role: "shoes" }, { slug: "black-mini-bag", role: "bag" }] },
  { short: "F", word: "FRI", chip: "Friday jeans", emo: "happy", pieces: [{ slug: "blue-oxford-shirt", role: "top" }, { slug: "dark-wash-straight-jeans", role: "bottom" }, { slug: "white-leather-sneakers", role: "shoes" }] },
  { short: "S", word: "SAT", chip: "Farmers market", emo: "cheer", pieces: [{ slug: "white-linen-shirt", role: "top" }, { slug: "denim-cutoff-shorts", role: "short" }, { slug: "tan-sandals", role: "shoes" }, { slug: "tan-crossbody-bag", role: "bag" }] },
  { short: "S", word: "SUN", chip: "Lazy Sunday", emo: "sleepy", pieces: [{ slug: "grey-crewneck-sweatshirt", role: "top" }, { slug: "dark-wash-straight-jeans", role: "bottom" }, { slug: "white-leather-sneakers", role: "shoes" }, { slug: "navy-baseball-cap", role: "hat" }] },
];

const whip = (p: number) => {
  // ease on the look, then a fast whip in the last 45% of the day
  if (p < 0.55) return 0.05 * (p / 0.55);
  const q = (p - 0.55) / 0.45;
  const e = q < 0.5 ? 16 * q ** 5 : 1 - (-2 * q + 2) ** 5 / 2;
  return 0.05 + 0.95 * e;
};

const camAt = (f: number) => {
  if (f < day(0)) return interpolate(f, [0, day(0)], [-900, 0], { ...clamp, easing: out });
  for (let i = 0; i < 6; i++) {
    if (f < day(i + 1)) return (i + whip((f - day(i)) / (day(i + 1) - day(i)))) * 1080;
  }
  return 6 * 1080 + Math.min(f - day(6), 40) * 1.2;
};

export const C12: React.FC = () => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);
  const v = Math.abs(camAt(frame + 0.5) - camAt(frame - 0.5));
  const blur = Math.min(v * 0.12, 28);
  const cur = Math.max(0, Math.min(6, Math.round(cam / 1080)));

  const FOLD = b(20);
  const END = b(25.5);
  const fadeAll = interpolate(frame, [END - 8, END], [1, 0], clamp);
  const bigOut = interpolate(frame, [FOLD - 6, FOLD + 4], [1, 0], clamp);

  return (
    <Ground>
      <Track file="mixkit-deep-urban-eugenio-mininni.mp3" fromSec={14.2} total={C12_FRAMES} />
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <filter id="hblur" x="-20%" y="-5%" width="140%" height="110%">
          <feGaussianBlur stdDeviation={`${blur} 0`} />
        </filter>
      </svg>

      <div style={{ position: "absolute", inset: 0, opacity: fadeAll }}>
        {/* the week: looks on a long strip, folding into a grid at the end */}
        <div style={{ position: "absolute", inset: 0, filter: blur > 0.6 && frame < FOLD ? "url(#hblur)" : undefined }}>
          {WEEK.map((d, i) => {
            const k = interpolate(frame, [FOLD + i * 2, FOLD + i * 2 + 22], [0, 1], { ...clamp, easing: inOut });
            const sx = i * 1080 - cam + 540;
            if (k === 0 && (sx < -700 || sx > 1780)) return null;
            const gx = 290 + (i % 2) * 500;
            const gy = 600 + Math.floor(i / 2) * 350;
            const x = interpolate(k, [0, 1], [sx, gx]);
            const y = interpolate(k, [0, 1], [1080, gy]);
            const s = interpolate(k, [0, 1], [1, 0.29]);
            return (
              <div key={i} style={{ position: "absolute", left: 0, top: 0 }}>
                <Look pieces={d.pieces} x={x} y={y} W={760} H={1060} scale={s} bob={frame} />
                {/* chip under the look while on the strip; a small day label in the grid */}
                <div style={{ position: "absolute", left: x - 300, top: y + 600 * s + 20, width: 600, display: "flex", justifyContent: "center", opacity: 1 - k }}>
                  <div style={{ ...display(44), letterSpacing: "-0.01em", background: C.card, borderRadius: 99, padding: "14px 30px", boxShadow: shadow.card }}>{d.chip}</div>
                </div>
                <div style={{ position: "absolute", left: x - 230, top: y - 150, ...display(40), color: C.t2, opacity: k }}>{d.word.charAt(0) + d.word.slice(1).toLowerCase()}</div>
              </div>
            );
          })}
        </div>

        {/* the day names fly past faster than the looks: the kinetic-type wipe */}
        {frame < FOLD + 6
          ? WEEK.map((d, i) => {
              const wx = (i * 1080 - cam) * 1.75 + 540;
              if (wx < -900 || wx > 1980) return null;
              return (
                <div
                  key={d.word}
                  style={{
                    position: "absolute",
                    left: wx - 540,
                    top: 120,
                    width: 1080,
                    textAlign: "center",
                    ...display(400),
                    letterSpacing: "-0.06em",
                    opacity: bigOut,
                    filter: blur > 0.6 ? "url(#hblur)" : undefined,
                  }}
                >
                  {d.word}
                </div>
              );
            })
          : null}

        {/* the app's This week strip, tracking the day */}
        <div style={{ position: "absolute", top: 70, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 18, opacity: bigOut }}>
          {WEEK.map((d, i) => (
            <div
              key={i}
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                ...display(30),
                letterSpacing: 0,
                background: i === cur ? C.ink : "transparent",
                color: i === cur ? "#FFFFFF" : C.t2,
              }}
            >
              {d.short}
            </div>
          ))}
        </div>

        {/* Zee rides along, a new mood every day */}
        {frame < FOLD ? (
          <Zee cues={WEEK.map((d, i) => ({ at: i === 0 ? 0 : day(i) - 4, emo: d.emo, cut: i > 0, loopStart: 12 }))} size={300} style={{ left: 30, top: 1560 }} />
        ) : (
          <Zee cues={[{ at: FOLD + 14, emo: "cheer" }]} size={330} style={{ left: 640, top: 1520 }} />
        )}

        {frame >= FOLD + 12 ? <Words text="Same closet. New look every day." at={FOLD + 12} size={84} stagger={2} style={{ top: 230, left: 60, width: 960 }} /> : null}
      </div>
      {frame >= END ? (
        <>
          <EndCard at={END} />
          <Zee cues={[{ at: END + 4, emo: "hello" }]} size={380} style={{ left: 350, top: 1330 }} />
        </>
      ) : null}
    </Ground>
  );
};
