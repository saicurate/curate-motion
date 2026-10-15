import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Ground, Track } from "../lib/Ground";
import { EndCard } from "../lib/Kinetic";
import { Look, LookPiece } from "../lib/Pieces";
import { beats, C, clamp, display, out, shadow } from "../lib/theme";
import { Zee, zeeFrame } from "../lib/Zee";

// C7 "Zee wipe" — motion test. Zee is a black plush kitten: the perfect wipe.
// 1) she leaps at the lens, her fur fills the frame, the look behind her has changed;
// 2) her own silhouette becomes a window onto the next look and grows to fill the frame;
// 3) she whips across sideways, a swipe wipe; 4) a shuffle on the beat; 5) one last leap into black.
// Cut to "Can't Get You Off My Mind" (Michael Ramir C., Mixkit, ~150 bpm) from 0:24.38: the drop is
// at 1.0 s, as she clears the lens.
export const C7_FRAMES = 336;
const b = beats(149.75, 1.0);

type L = { pieces: LookPiece[]; chip: string };
const LOOKS: L[] = [
  { chip: "Weekend", pieces: [{ slug: "denim-jacket", role: "outer" }, { slug: "white-tee", role: "top" }, { slug: "light-wash-straight-jeans", role: "bottom" }, { slug: "white-leather-sneakers", role: "shoes" }] },
  { chip: "Office", pieces: [{ slug: "black-blazer", role: "outer" }, { slug: "blue-oxford-shirt", role: "top" }, { slug: "black-trousers", role: "bottom" }, { slug: "black-loafers", role: "shoes" }] },
  { chip: "Farmers market", pieces: [{ slug: "striped-long-sleeve-tee", role: "top" }, { slug: "dark-wash-straight-jeans", role: "bottom" }, { slug: "tan-crossbody-bag", role: "bag" }, { slug: "retro-runners", role: "shoes" }] },
  { chip: "Night out", pieces: [{ slug: "little-black-dress", role: "dress" }, { slug: "black-mini-bag", role: "bag" }, { slug: "black-heels", role: "shoes" }] },
  { chip: "Gym", pieces: [{ slug: "sage-sports-bra", role: "top" }, { slug: "sage-leggings", role: "bottom" }, { slug: "retro-runners", role: "shoes" }] },
  { chip: "Lazy Sunday", pieces: [{ slug: "cream-cable-knit-sweater", role: "top" }, { slug: "grey-sweatpants", role: "bottom" }, { slug: "cream-beanie", role: "hat" }] },
  { chip: "Rain at 4", pieces: [{ slug: "khaki-trench-coat", role: "outer" }, { slug: "black-turtleneck", role: "top" }, { slug: "dark-wash-straight-jeans", role: "bottom" }, { slug: "black-ankle-boots", role: "shoes" }] },
];

const Scene: React.FC<{ i: number; at: number }> = ({ i, at }) => {
  const frame = useCurrentFrame();
  const l = LOOKS[i];
  const settle = interpolate(frame - at, [0, 10], [1.06, 1], { ...clamp, easing: out });
  return (
    <Ground>
      <div style={{ position: "absolute", inset: 0, transform: `scale(${settle})` }}>
        <Look pieces={l.pieces} x={540} y={930} W={780} H={1120} bob={frame} />
      </div>
      <div
        style={{
          position: "absolute",
          top: 210,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div style={{ ...display(46), letterSpacing: "-0.01em", background: C.card, borderRadius: 99, padding: "16px 34px", boxShadow: shadow.card }}>{l.chip}</div>
      </div>
    </Ground>
  );
};

// Zee's body (chest fur) in her 720 px frame: the point we zoom into for the leap.
const BODY = { x: 0.5, y: 0.69 };

/** Zee leaping at the lens (dir=1) or landing away from it (dir=-1). */
const Leap: React.FC<{ at: number; dur: number; dir: 1 | -1; from: { x: number; y: number }; size: number; emo: "excited" | "cheer" | "happy" }> = ({ at, dur, dir, from, size, emo }) => {
  const frame = useCurrentFrame();
  const t = (frame - at) / dur;
  if (t < 0 || t > 1) return null;
  const k = dir === 1 ? Math.pow(t, 2.6) : Math.pow(1 - t, 2.6);
  const scale = 1 + k * 24;
  const cx = interpolate(k, [0, 1], [from.x, 540]);
  const cy = interpolate(k, [0, 1], [from.y, 960]);
  const src = zeeFrame([{ at, emo, cut: true, loopStart: 10 }], frame) ?? "";
  return (
    <Img
      src={staticFile(src)}
      style={{
        position: "absolute",
        left: cx - size * BODY.x,
        top: cy - size * BODY.y,
        width: size,
        height: size,
        transformOrigin: `${BODY.x * 100}% ${BODY.y * 100}%`,
        transform: `scale(${scale})`,
        filter: `blur(${k * 6}px)`,
      }}
    />
  );
};

/** Fur black: guarantees the frame is fully covered at the peak of a leap. */
const Fur: React.FC<{ at: number; up?: number; down?: number }> = ({ at, up = 4, down = 4 }) => {
  const frame = useCurrentFrame();
  const o = frame < at ? interpolate(frame, [at - up, at], [0, 1], clamp) : down > 0 ? interpolate(frame, [at + 1, at + 1 + down], [1, 0], clamp) : 1;
  if (o <= 0) return null;
  return <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 50% 50%, #1d1b1b, #0f0f0f)", opacity: o }} />;
};

export const C7: React.FC = () => {
  const frame = useCurrentFrame();

  const MASK_AT = b(4) - 6;
  const MASK_DUR = 16;
  const SWIPE_AT = b(8) - 7;
  const SWIPE_DUR = 14;
  const SHUF = [b(10), b(12), b(14)];
  const LAST = b(16);

  // which look is the base scene now
  let base = 0;
  if (frame >= b(0)) base = 1;
  if (frame >= MASK_AT + MASK_DUR) base = 2;
  if (frame >= SWIPE_AT + SWIPE_DUR) base = 3;
  if (frame >= SHUF[0]) base = 4;
  if (frame >= SHUF[1]) base = 5;
  if (frame >= SHUF[2]) base = 6;
  const baseAt = [0, b(0), MASK_AT + MASK_DUR, SWIPE_AT, SHUF[0], SHUF[1], SHUF[2]][base];

  // mask through Zee: her silhouette (one held frame) becomes a window onto look 3
  const maskSrc = staticFile("zee/happy/loop/0040.webp");
  const ZPOS = { x: 760, y: 1640 };
  const ZSIZE = 400;
  const mt = interpolate(frame, [MASK_AT, MASK_AT + MASK_DUR], [0, 1], clamp);
  const mk = Math.pow(mt, 2.4);
  const mSize = ZSIZE * (1 + mk * 40);
  const mcx = interpolate(mk, [0, 1], [ZPOS.x, 540]);
  const mcy = interpolate(mk, [0, 1], [ZPOS.y, 960]);

  // the swipe: Zee whips right → left, the next look is on the side she has passed
  const st = interpolate(frame, [SWIPE_AT, SWIPE_AT + SWIPE_DUR], [0, 1], clamp);
  const sx = interpolate(st, [0, 1], [1700, -700], { easing: (x) => x * x * (3 - 2 * x) });

  const punch = (at: number) => interpolate(frame, [at, at + 2, at + 9], [1, 1.04, 1], clamp);
  const cam = Math.max(...[b(0), SHUF[0], SHUF[1], SHUF[2]].map(punch));
  const iris = interpolate(frame, [LAST + 22, LAST + 34], [0, 1200], { ...clamp, easing: out });

  const ended = frame >= LAST + 18;

  return (
    <AbsoluteFill style={{ background: C.night, overflow: "hidden" }}>
      <Track file="mixkit-cant-get-you-off-my-mind-michael-ramir-c.mp3" fromSec={24.38} total={C7_FRAMES} />
      {/* preload the mask frame so it's decoded before it's used as a CSS mask */}
      <Img src={maskSrc} style={{ position: "absolute", width: 1, height: 1, opacity: 0 }} />

      {!ended ? (
        <div style={{ position: "absolute", inset: 0, transform: `scale(${cam})` }}>
          <Scene i={base} at={baseAt} />

          {/* 2) mask through Zee: a dark rim of her silhouette, then the window */}
          {frame >= MASK_AT && frame < MASK_AT + MASK_DUR ? (
            <Img
              src={maskSrc}
              style={{
                position: "absolute",
                left: mcx - mSize * 1.05 * 0.5,
                top: mcy - mSize * 1.05 * 0.69,
                width: mSize * 1.05,
                height: mSize * 1.05,
                filter: "brightness(0)",
                opacity: 0.85,
              }}
            />
          ) : null}
          {frame >= MASK_AT && frame < MASK_AT + MASK_DUR ? (
            <div
              style={{
                position: "absolute",
                inset: 0,
                WebkitMaskImage: `url(${maskSrc})`,
                WebkitMaskRepeat: "no-repeat",
                WebkitMaskSize: `${mSize}px ${mSize}px`,
                WebkitMaskPosition: `${mcx - mSize * 0.5}px ${mcy - mSize * 0.69}px`,
              }}
            >
              <Scene i={2} at={MASK_AT + MASK_DUR} />
            </div>
          ) : null}

          {/* 3) the swipe wipe */}
          {frame >= SWIPE_AT && frame < SWIPE_AT + SWIPE_DUR ? (
            <>
              <div style={{ position: "absolute", inset: 0, clipPath: `inset(0 0 0 ${Math.max(0, sx)}px)` }}>
                <Scene i={3} at={SWIPE_AT} />
              </div>
              {[0.12, 0.22, 0.4, 1].map((o, j) => (
                <Zee key={j} cues={[{ at: SWIPE_AT, emo: "excited", cut: true, loopStart: 30 }]} size={1300} shadow={false} style={{ left: sx - 650 + (3 - j) * 110, top: 330, opacity: o }} />
              ))}
            </>
          ) : null}

          {/* Zee between the wipes */}
          {frame < b(0) - 18 ? <Zee cues={[{ at: 0, emo: "excited" }]} size={400} style={{ left: 340, top: 1400 }} /> : null}
          {frame >= b(0) + 16 && frame < MASK_AT ? (
            <Zee cues={[{ at: b(0) + 16, emo: "cheer", cut: true, loopStart: 18 }, { at: b(2), emo: "happy", cut: true, loopStart: 28 }]} size={ZSIZE} style={{ left: ZPOS.x - ZSIZE * 0.5, top: ZPOS.y - ZSIZE * 0.69 }} />
          ) : null}
          {frame >= MASK_AT + MASK_DUR + 6 && frame < SWIPE_AT - 2 ? <Zee cues={[{ at: MASK_AT + MASK_DUR + 6, emo: "listening" }]} size={380} style={{ left: 60, top: 1420 }} /> : null}
          {frame >= SWIPE_AT + SWIPE_DUR + 4 && frame < SHUF[0] ? <Zee cues={[{ at: SWIPE_AT + SWIPE_DUR + 4, emo: "love" }]} size={380} style={{ left: 640, top: 1420 }} /> : null}
          {/* 4) shuffle: a different mood in a different spot on every beat */}
          {frame >= SHUF[0] && frame < SHUF[1] ? <Zee cues={[{ at: SHUF[0], emo: "cheer", cut: true, loopStart: 20 }]} size={380} style={{ left: 60, top: 1420 }} /> : null}
          {frame >= SHUF[1] && frame < SHUF[2] ? <Zee cues={[{ at: SHUF[1], emo: "sleepy", cut: true, loopStart: 30 }]} size={380} style={{ left: 660, top: 1420 }} /> : null}
          {frame >= SHUF[2] && frame < LAST ? <Zee cues={[{ at: SHUF[2], emo: "curious", cut: true }, { at: LAST - 14, emo: "excited" }]} size={400} style={{ left: 340, top: 1400 }} /> : null}

          {/* 1) and 5) the leaps */}
          <Leap at={b(0) - 18} dur={18} dir={1} from={{ x: 540, y: 1400 + 400 * 0.69 }} size={400} emo="excited" />
          <Leap at={b(0) + 1} dur={15} dir={-1} from={{ x: ZPOS.x, y: ZPOS.y }} size={ZSIZE} emo="cheer" />
          <Leap at={LAST} dur={18} dir={1} from={{ x: 540, y: 1400 + 400 * 0.69 }} size={400} emo="excited" />
          <Fur at={b(0)} up={3} down={3} />
        </div>
      ) : null}
      <Fur at={LAST + 17} up={4} down={0} />
      {/* out of the black: an iris opens onto the end card */}
      {frame >= LAST + 22 ? (
        <div style={{ position: "absolute", inset: 0, clipPath: `circle(${iris}px at 540px 960px)` }}>
          <Ground>
            <EndCard at={LAST + 24} line="Styled by Zee." />
            <Zee cues={[{ at: LAST + 30, emo: "hello" }]} size={380} style={{ left: 350, top: 1360 }} />
          </Ground>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
