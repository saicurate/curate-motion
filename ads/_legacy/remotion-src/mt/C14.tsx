import React from "react";
import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Track } from "../lib/Ground";
import { EndCard } from "../lib/Kinetic";
import { Phone } from "../lib/Phone";
import { Look, LookPiece, Piece, Slug } from "../lib/Pieces";
import { PhotoTile } from "../lib/shapes";
import { DrawFrame, Flash, HandEllipse, popCurve, printLand, projectOnPhone, ScanDots, TypeOn } from "../lib/fx";
import { beats, C, clamp, display, inOut, out, shadow } from "../lib/theme";
import { Zee } from "../lib/Zee";

// C14 "Pop out" — motion test, after the founder's reference reel ("how to: Pop Off").
// A phone lies on a desk showing a camera roll; pieces pop out of photos (15% → 100% in 0.2 s,
// overshoot, hold ~0.5 s, sink back), a new one every two beats, overlapping. Words type on
// BEHIND the pieces at ~1 s. Then a burst into the floating grid, a hand-drawn ellipse, the
// look card lands as a flash + tilted print, alternatives stack, a stroke draws round the frame.
// Cut to "Cat Walk" (Arulo, Mixkit, 130 bpm) from 0:29.4 so the drop is on the first pop.
export const C14_FRAMES = 302;
const b = beats(130, 0.11);

const PH = { width: 700, x: 560, y: 1290, rx: 30, rz: -9 };
const SW = PH.width - 2 * PH.width * 0.028;
const GAP = 8;
const TILE = (SW - GAP * 4) / 3;
const TOP = 170;
const tileXY = (r: number, c: number) => ({ x: GAP + c * (TILE + GAP), y: TOP + r * (TILE + GAP) });

// [row, col] of the source photos
const SRC_A: [number, number] = [0, 0];
const SRC_B: [number, number] = [1, 2];
const SRC_EMMA: [number, number] = [2, 1];

const LOOK: LookPiece[] = [
  { slug: "denim-jacket", role: "outer" },
  { slug: "white-tee", role: "top" },
  { slug: "light-wash-straight-jeans", role: "bottom" },
];
const ALT1: LookPiece[] = [
  { slug: "blue-oxford-shirt", role: "top" },
  { slug: "dark-wash-straight-jeans", role: "bottom" },
];
const ALT2: LookPiece[] = [
  { slug: "striped-long-sleeve-tee", role: "top" },
  { slug: "denim-cutoff-shorts", role: "short" },
];
const GRID: { slug: Slug; src: [number, number] }[] = [
  { slug: "denim-jacket", src: [0, 0] },
  { slug: "white-tee", src: [2, 1] },
  { slug: "light-wash-straight-jeans", src: [1, 2] },
  { slug: "blue-oxford-shirt", src: [0, 2] },
  { slug: "little-black-dress", src: [3, 0] },
  { slug: "striped-long-sleeve-tee", src: [3, 2] },
];

const Pop: React.FC<{ slug: Slug; src: [number, number]; at: number; tx: number; ty: number; h: number; sway?: number }> = ({ slug, src, at, tx, ty, h, sway = 1 }) => {
  const frame = useCurrentFrame();
  const v = popCurve(frame, at, 17);
  if (v <= 0) return null;
  const t = tileXY(src[0], src[1]);
  const home = projectOnPhone(PH, t.x + TILE / 2, t.y + TILE / 2);
  const k = Math.max(0, Math.min(1, v));
  const x = interpolate(k, [0, 1], [home.x, tx]);
  const y = interpolate(k, [0, 1], [home.y, ty]);
  const scale = 0.15 + 0.85 * v;
  const rot = Math.sin((frame - at) / 5) * 3 * sway * k;
  const outline = interpolate(frame - at, [0, 3, 14], [1, 1, 0], clamp);
  return <Piece slug={slug} x={x} y={y} h={h} scale={scale} rot={rot} outline={outline} shadow={k} />;
};

export const C14: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const burst = b(8);
  const pick = b(10);
  const land = b(12);
  const endAt = b(17);

  // after the pops, the camera tilts up off the desk: the phone sinks and the grid floats
  const sink = interpolate(frame, [burst, burst + 14], [0, 1], { ...clamp, easing: inOut });
  const ph = { ...PH, y: PH.y + sink * 340, scale: 1 - sink * 0.1 };
  const dimGrid = interpolate(frame, [land, land + 8], [1, 0.25], clamp);
  const gather = interpolate(frame, [b(16), b(16.9)], [0, 1], { ...clamp, easing: inOut });

  const zeePeek = interpolate(frame, [b(6) - 2, b(6) + 7], [0, 1], { ...clamp, easing: out });

  return (
    <AbsoluteFill style={{ background: "radial-gradient(110% 80% at 50% 30%, #F4F5F6 0%, #E4E7EA 60%, #D6DADE 100%)", overflow: "hidden" }}>
      <Track file="mixkit-cat-walk-arulo.mp3" fromSec={29.4} total={C14_FRAMES} />

      <div style={{ position: "absolute", inset: 0, opacity: 1 - gather, transform: `scale(${1 - gather * 0.06})` }}>
        {/* the line, typed on at ~1 s, sitting BEHIND the pieces */}
        <TypeOn text={"Already in\nyour photos."} at={30} size={128} perChar={1.1} until={burst + 2} style={{ left: 80, top: 210, width: 920, opacity: interpolate(frame, [burst - 4, burst + 2], [1, 0], clamp) }} />

        {/* Zee peeks over the phone's top edge (in front of the words, behind the phone) */}
        {frame >= b(6) - 2 && frame < burst + 10 ? (
          <Zee
            cues={[{ at: b(6) - 2, emo: "curious" }]}
            size={440}
            shadow={false}
            style={{ left: 500, top: interpolate(zeePeek, [0, 1], [600, 300]) + sink * 340, transform: "rotate(-9deg)" }}
          />
        ) : null}

        {/* the phone on the desk, showing a camera roll */}
        <Phone {...ph}>
          {Array.from({ length: 6 }).map((_, r) =>
            Array.from({ length: 3 }).map((__, c) => {
              const { x, y } = tileXY(r, c);
              const isEmma = r === SRC_EMMA[0] && c === SRC_EMMA[1];
              const style: React.CSSProperties = { position: "absolute", left: x, top: y };
              return isEmma ? (
                <div key={`${r}${c}`} style={{ ...style, width: TILE, height: TILE, borderRadius: 6, overflow: "hidden" }}>
                  <Img src={staticFile("emma/emma-B.jpg")} style={{ width: TILE, height: TILE, objectFit: "cover", objectPosition: "50% 30%" }} />
                </div>
              ) : (
                <PhotoTile key={`${r}${c}`} w={TILE} h={TILE} seed={r * 4 + c * 7 + 2} you={(r + c) % 2 === 0 || (r === SRC_B[0] && c === SRC_B[1])} radius={6} style={style} />
              );
            }),
          )}
          {/* scan dots, then the outline trace, before each pop (no percentages) */}
          {[
            { src: SRC_A, at: b(0) - 9 },
            { src: SRC_B, at: b(2) - 9 },
            { src: SRC_EMMA, at: b(4) - 9 },
          ].map((s, i) => {
            const t = tileXY(s.src[0], s.src[1]);
            return <ScanDots key={i} at={s.at} dur={9} w={TILE} h={TILE} x={t.x} y={t.y} gap={16} />;
          })}
          {GRID.map((g, i) => {
            const t = tileXY(g.src[0], g.src[1]);
            return <ScanDots key={`g${i}`} at={burst - 8} dur={8} w={TILE} h={TILE} x={t.x} y={t.y} gap={16} />;
          })}
        </Phone>

        {/* pops: kick 1 jacket, kick 3 jeans, kick 5 the whole look out of her photo */}
        <Pop slug="denim-jacket" src={SRC_A} at={b(0)} tx={560} ty={760} h={860} />
        <Pop slug="light-wash-straight-jeans" src={SRC_B} at={b(2)} tx={560} ty={720} h={1050} sway={-1} />
        {(() => {
          const v = popCurve(frame, b(4), 22);
          if (v <= 0) return null;
          const t = tileXY(SRC_EMMA[0], SRC_EMMA[1]);
          const home = projectOnPhone(ph, t.x + TILE / 2, t.y + TILE / 2);
          const k = Math.max(0, Math.min(1, v));
          return (
            <div style={{ position: "absolute", left: 0, top: 0, filter: `drop-shadow(0 0 ${6 * interpolate(frame - b(4), [0, 14], [1, 0], clamp)}px #fff)` }}>
              <Look pieces={LOOK} x={interpolate(k, [0, 1], [home.x, 545])} y={interpolate(k, [0, 1], [home.y, 760])} W={760} H={1080} scale={0.15 + 0.85 * v} bob={frame} />
            </div>
          );
        })()}

        {/* kick 9: everything bursts up at once and floats in a grid */}
        {frame >= burst
          ? GRID.map((g, i) => {
              const s = spring({ frame: frame - burst - i, fps, config: { damping: 12, stiffness: 170 } });
              const t = tileXY(g.src[0], g.src[1]);
              const home = projectOnPhone(ph, t.x + TILE / 2, t.y + TILE / 2);
              const gx = 220 + (i % 3) * 320;
              const gy = 520 + Math.floor(i / 3) * 520;
              const bob = Math.sin((frame + i * 19) / 13) * 10;
              return (
                <Piece
                  key={i}
                  slug={g.slug}
                  x={interpolate(s, [0, 1], [home.x, gx])}
                  y={interpolate(s, [0, 1], [home.y, gy]) + bob * s}
                  h={g.slug === "light-wash-straight-jeans" || g.slug === "little-black-dress" ? 430 : 360}
                  scale={0.15 + 0.85 * s}
                  opacity={dimGrid}
                />
              );
            })
          : null}

        {/* kick 11: Zee rings the two that go together */}
        {frame >= pick && frame < land ? (
          <>
            <HandEllipse at={pick} cx={380} cy={510} rx={330} ry={210} dur={11} width={10} />
            <div style={{ position: "absolute", left: 600, top: 238, ...display(70), opacity: interpolate(frame, [pick + 6, pick + 10], [0, 1], clamp) }}>These two.</div>
          </>
        ) : null}
        {frame >= pick - 4 && frame < land ? (
          <Zee cues={[{ at: pick - 4, emo: "idea" }]} size={380} style={{ left: 640, top: 1380 }} />
        ) : null}

        {/* kick 13: flash, then the look card lands as a tilted print; alternatives stack */}
        {[
          { at: b(14), tilt: -7, dx: -150, dy: -40, look: ALT1 },
          { at: b(15), tilt: 8, dx: 160, dy: 10, look: ALT2 },
          { at: land, tilt: 4, dx: 0, dy: 0, look: LOOK },
        ]
          .sort((a, z) => (a.at === land ? 1 : 0) - (z.at === land ? 1 : 0))
          .map((p, i) => {
            const pl = printLand(frame, p.at, p.tilt);
            if (!pl.on) return null;
            const W = 640;
            const H = 860;
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: 540 - W / 2 + p.dx,
                  top: 820 - H / 2 + p.dy,
                  width: W,
                  height: H,
                  borderRadius: 34,
                  background: C.card,
                  boxShadow: shadow.float,
                  transform: `rotate(${pl.r}deg) scale(${pl.s})`,
                  opacity: pl.o,
                  overflow: "hidden",
                }}
              >
                <div style={{ position: "absolute", inset: 22, borderRadius: 24, background: C.ground }} />
                <Look pieces={p.look} x={W / 2} y={H / 2 - 10} W={460} H={700} bob={frame} />
              </div>
            );
          })}
        {frame >= land ? (
          <Zee cues={[{ at: land, emo: "love" }]} size={360} style={{ left: 680, top: 1330 }} />
        ) : null}
        <Flash at={land} />
        <Flash at={b(14)} strength={0.7} />
        <Flash at={b(15)} strength={0.7} />
      </div>

      {/* kick 17: a stroke draws round the frame, then the end card */}
      <DrawFrame at={b(15.4)} x={34} y={34} w={1012} h={1852} r={70} dur={20} width={12} id="c14frame" />
      {frame >= endAt ? <Zee cues={[{ at: endAt, emo: "hello" }]} size={380} style={{ left: 350, top: 1330 }} /> : null}
      <EndCard at={endAt} line="Your closet, styled by Zee." />
    </AbsoluteFill>
  );
};
