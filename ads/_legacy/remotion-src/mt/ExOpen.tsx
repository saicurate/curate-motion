import React from "react";
import { Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Ground, Track } from "../lib/Ground";
import { Words } from "../lib/Kinetic";
import { Phone } from "../lib/Phone";
import { Piece, Slug } from "../lib/Pieces";
import { PhotoTile, rand } from "../lib/shapes";
import { Star } from "../lib/Star";
import { popCurve, projectOnPhone, TypeOn } from "../lib/fx";
import { beats, C, clamp, display, GEIST, inOut, shadow } from "../lib/theme";
import { Zee } from "../lib/Zee";

// The app explainer — opening motion test (0:00–0:27): the problem, meet Zee, and the start of
// "your wardrobe, from your photos". One component for 9:16 and 16:9 (it reads the frame size).
// The voiceover isn't recorded (a paid voice needs the founder's OK), so its lines run as
// captions to show the timing. Music: "Drawing the Sky" (Eugenio Mininni, Mixkit, 100 bpm)
// from 0:06.3, so its swell lands on "Meet Zee" at 8.5 s.
export const EX_OPEN_FRAMES = 810;
const SWELL = 255;
const b = beats(100, SWELL / 30);

const PILE: Slug[] = [
  "denim-jacket", "white-tee", "light-wash-straight-jeans", "black-blazer", "blue-oxford-shirt", "little-black-dress",
  "khaki-trench-coat", "striped-long-sleeve-tee", "navy-hoodie", "camel-satin-midi-skirt", "grey-sweatpants",
  "cream-cable-knit-sweater", "black-leather-jacket", "plaid-flannel-shirt", "dark-wash-straight-jeans", "champagne-slip-dress",
  "varsity-jacket", "oatmeal-cardigan", "black-trousers", "denim-cutoff-shorts", "camel-wool-coat", "black-turtleneck",
  "white-leather-sneakers", "tan-cowboy-boots", "black-leather-tote", "cream-beanie",
];

// voiceover lines (seconds) — see the explainer script in the tracker
const VO: [number, number, string][] = [
  [0.5, 3.6, "You've got a closet full of clothes."],
  [3.7, 6.2, "And somehow, every morning, it's the same thing:"],
  [8.6, 11.4, "Meet Zee. She's your stylist."],
  [11.5, 15.4, "She lives in Curate, she learns your closet, and she's always up early."],
  [15.5, 18.4, "First, Zee needs to see what you own."],
  [18.5, 20.4, "No photo shoots, no typing."],
  [20.5, 24.6, "Your clothes are already in your photos, because you wear them."],
];

const Caption: React.FC<{ W: number; H: number; u: number; portrait: boolean }> = ({ W, H, u, portrait }) => {
  const frame = useCurrentFrame();
  const s = frame / 30;
  const line = VO.find(([a, z]) => s >= a && s < z);
  if (!line) return null;
  const o = interpolate(s, [line[0], line[0] + 0.15, line[1] - 0.15, line[1]], [0, 1, 1, 0], clamp);
  return (
    <div style={{ position: "absolute", left: W * 0.08, width: W * 0.84, top: portrait ? H - 330 * u : H - 150 * u, display: "flex", justifyContent: "center", opacity: o }}>
      <div
        style={{
          fontFamily: GEIST,
          fontWeight: 400,
          fontSize: (portrait ? 46 : 40) * u,
          lineHeight: 1.25,
          color: C.ink,
          textAlign: "center",
          background: "rgba(255,255,255,0.86)",
          padding: `${12 * u}px ${24 * u}px`,
          borderRadius: 18 * u,
          boxShadow: shadow.card,
        }}
      >
        {line[2]}
      </div>
    </div>
  );
};

export const ExOpen: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width: W, height: H } = useVideoConfig();
  const portrait = H > W;
  const u = portrait ? W / 1080 : H / 1080;
  const cx = W / 2;
  const cy = H / 2;

  // ── 1. the problem: a wall of her clothes that keeps shuffling and never lands ──
  const cols = portrait ? 5 : 9;
  const rows = portrait ? 6 : 3;
  const slotW = W / cols;
  const slotH = H / rows;
  const epoch = Math.floor(frame / 18);
  const dimPile = interpolate(frame, [176, 196], [0, 1], { ...clamp, easing: inOut });
  const blow = interpolate(frame, [SWELL - 4, SWELL + 16], [0, 1], { ...clamp, easing: (t) => t * t });

  // ── 2. meet Zee ──
  const zeeIn = spring({ frame: frame - SWELL, fps, config: { damping: 11, stiffness: 120 } });
  const ZS = (portrait ? 700 : 560) * u;
  const toSide = interpolate(frame, [462, 486], [0, 1], { ...clamp, easing: inOut });
  const zx = interpolate(toSide, [0, 1], [cx, portrait ? 210 * u : W * 0.17]);
  const zy = interpolate(toSide, [0, 1], [cy + 40 * u, portrait ? H - 470 * u : cy + 120 * u]);
  const zsize = interpolate(toSide, [0, 1], [ZS, (portrait ? 340 : 380) * u]);

  // ── 3. your wardrobe, from your photos ──
  const PH = { width: (portrait ? 560 : 400) * u, x: portrait ? cx + 60 * u : cx, y: portrait ? cy + 60 * u : cy + 40 * u, rx: 12, ry: -10, rz: 3 };
  const phoneIn = spring({ frame: frame - 470, fps, config: { damping: 16, stiffness: 90 } });
  const ph = { ...PH, y: PH.y + (1 - phoneIn) * H * 0.9 };
  const SW = ph.width * (1 - 0.056);
  const gap = 6 * u;
  const tile = (SW - gap * 4) / 3;
  const scroll = interpolate(frame, [500, 640], [0, tile * 2.2], { ...clamp, easing: inOut });
  const EMMA = { r: 4, c: 1 };
  const slide = interpolate(frame, [692, 712], [0, 1], { ...clamp, easing: inOut });
  const emmaPop = spring({ frame: frame - 640, fps, config: { damping: 13, stiffness: 140 } });
  const eTile = projectOnPhone(ph, gap + EMMA.c * (tile + gap) + tile / 2, 150 * u + EMMA.r * (tile + gap) - scroll + tile / 2);
  const cardW = (portrait ? 600 : 470) * u;
  const cardH = cardW * 1.32;
  const cardX = interpolate(emmaPop, [0, 1], [eTile.x, portrait ? cx : cx - 220 * u]) + slide * (portrait ? -170 : -200) * u;
  const cardY = interpolate(emmaPop, [0, 1], [eTile.y, portrait ? cy - 60 * u : cy - 20 * u]) + slide * (portrait ? 330 : 40) * u;
  const cardS = interpolate(emmaPop, [0, 1], [tile / cardW, 1]) * (1 - slide * 0.22);
  const phoneOut = interpolate(frame, [650, 680], [0, 1], { ...clamp, easing: inOut });
  const tee = popCurve(frame, 700, 999, 6, 0); // pops out and stays
  const fadeEnd = interpolate(frame, [780, 810], [1, 0], clamp);

  return (
    <Ground>
      <Track file="mixkit-drawing-the-sky-eugenio-mininni.mp3" fromSec={6.3} total={EX_OPEN_FRAMES} fadeOut={30} />

      <div style={{ position: "absolute", inset: 0, opacity: fadeEnd }}>
        {/* 1. the pile */}
        {blow < 1
          ? PILE.map((slug, j) => {
              const N = cols * rows;
              const base = (j * 7) % N;
              const moving = (e: number) => rand(j * 31 + e) > 0.5;
              // the last epoch this piece moved in (it keeps that spot until it moves again)
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
              // on the swell, everything blows out of frame
              const ang = Math.atan2(y - cy, x - cx);
              x += Math.cos(ang) * blow * W * 1.1;
              y += Math.sin(ang) * blow * H * 1.1;
              const h = Math.min(slotW, slotH) * (1.25 + rand(j) * 0.35);
              return (
                <Piece
                  key={slug}
                  slug={slug}
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
              {frame < 120 ? "8:02 am" : "8:03 am"}
            </div>
          </div>
        ) : null}
        <Words text="Nothing to wear." at={180} size={(portrait ? 128 : 140) * u} exitAt={SWELL - 6} style={{ top: cy - 90 * u, left: 0, width: W }} />

        {/* 2. Zee */}
        {frame >= SWELL ? (
          <Zee
            cues={[
              { at: SWELL, emo: "hello" },
              { at: b(4), emo: "happy", cut: true },
              { at: b(8), emo: "idea" },
              { at: 470, emo: "curious" },
              { at: 640, emo: "excited" },
            ]}
            size={zsize}
            style={{ left: zx - zsize / 2, top: zy - zsize * 0.6, transform: `scale(${interpolate(zeeIn, [0, 1], [0.3, 1])})` }}
          />
        ) : null}
        <Star at={b(8) + 6} x={cx + ZS * 0.36} y={cy - ZS * 0.32} size={110 * u} />
        <Star at={b(8) + 9} x={cx - ZS * 0.38} y={cy - ZS * 0.12} size={70 * u} />
        <Words text="Meet Zee." at={SWELL + 6} size={(portrait ? 150 : 130) * u} exitAt={378} style={{ top: (portrait ? 260 : 90) * u, left: 0, width: W }} />

        {/* 3. the camera roll */}
        {frame >= 466 && phoneOut < 1 ? (
          <Phone {...ph} opacity={1 - phoneOut} scale={1 - phoneOut * 0.08}>
            {Array.from({ length: 9 }).map((_, r) =>
              Array.from({ length: 3 }).map((__, c) => {
                const left = gap + c * (tile + gap);
                const top = 150 * u + r * (tile + gap) - scroll;
                if (r === EMMA.r && c === EMMA.c) {
                  return frame >= 640 ? null : (
                    <div key={`${r}${c}`} style={{ position: "absolute", left, top, width: tile, height: tile, borderRadius: 5 * u, overflow: "hidden" }}>
                      <Img src={staticFile("emma/emma-B.jpg")} style={{ width: tile, height: tile, objectFit: "cover", objectPosition: "50% 30%" }} />
                    </div>
                  );
                }
                return <PhotoTile key={`${r}${c}`} w={tile} h={tile} seed={r * 5 + c * 3 + 1} you={(r * 3 + c) % 3 !== 1} radius={5 * u} style={{ position: "absolute", left, top }} />;
              }),
            )}
          </Phone>
        ) : null}

        {/* her photo pops out of the roll, up big; the tee she's wearing pops out of it */}
        {frame >= 640 ? (
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
            <Img src={staticFile("emma/emma-B.jpg")} style={{ width: cardW, height: cardH, objectFit: "cover", objectPosition: "50% 40%" }} />
            <div style={{ position: "absolute", inset: 0, background: `rgba(246,247,247,${interpolate(frame, [700, 712], [0, 0.35], clamp)})` }} />
          </div>
        ) : null}
        {/* the line types on behind the tee (depth) */}
        <TypeOn text={"Already in\nyour photos."} at={722} size={(portrait ? 120 : 110) * u} perChar={1.1} style={{ left: portrait ? 80 * u : W * 0.6, top: portrait ? 330 * u : cy - 150 * u, width: portrait ? W - 160 * u : W * 0.4 }} />
        {tee > 0 ? (
          <Piece
            slug="white-tee"
            x={interpolate(Math.min(tee, 1), [0, 1], [cardX, portrait ? cx + 170 * u : cx + 10 * u])}
            y={interpolate(Math.min(tee, 1), [0, 1], [cardY + cardH * 0.25, portrait ? cy - 140 * u : cy + 10 * u])}
            h={(portrait ? 600 : 560) * u}
            scale={0.15 + 0.85 * tee}
            rot={Math.sin((frame - 700) / 9) * 2}
            outline={interpolate(frame, [700, 704, 716], [1, 1, 0], clamp)}
          />
        ) : null}
      </div>

      <Caption W={W} H={H} u={u} portrait={portrait} />
    </Ground>
  );
};
