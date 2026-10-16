import React from "react";
import { AbsoluteFill, Img } from "remotion";
import { C, GEIST, src, Track, useBrandFonts, useFrameBox } from "../../../motion";
import { PHOTOS, SORTED, shuffled } from "../data";
import { AiTag, BeatLabels, Close, Cut, ease, Flash, Hook, lerp, prog, sp, useT } from "../kit";
import { demoMetadata, demoSchema, DEMO_FPS, type DemoProps } from "../module";
import { BEATS, FLICKS, FROM, LENGTH, musicGain, ROW, scrollAt, scrollSpeed, T, TRACK } from "./timeline";

// Demo 2 · "Your camera roll is secretly a closet" (rough animatic, gate "explore").
export const schema = demoSchema;
export const defaults = { track: TRACK, fromSec: FROM };
export const metadata = demoMetadata(LENGTH);

const JACKET = "garment.emma.jacket-denim.v1";
const GRID = shuffled(SORTED.filter((id) => id !== JACKET), 21).slice(0, 19);

export const CameraRollCloset: React.FC<DemoProps> = ({ track, fromSec }) => {
  useBrandFonts();
  const t = useT();
  const { w, h, u } = useFrameBox();
  const total = Math.round(LENGTH * DEMO_FPS);
  const off = scrollAt(t);
  const speed = scrollSpeed(t);
  const blur = Math.min(14, speed / 500);

  // the zoom from the ferry tile to full screen
  const z = ease(t, T.freeze + 0.05, T.zoomed - T.freeze);
  const tileX = 360;
  const tileY = 28 * ROW - off;
  const zoomBox = { left: lerp(tileX, 0, z), top: lerp(tileY, 0, z), width: lerp(360, w, z), height: lerp(ROW, h, z) };

  // closet grid (4 × 5), slot 5 left empty for the jacket
  const cols = 4;
  const cellW = w * 0.21;
  const cellH = cellW * 1.2;
  const gx = (i: number) => w * 0.5 + (((i % cols) - 1.5) * (cellW + u * 2));
  const gy = (i: number) => h * 0.34 + Math.floor(i / cols) * (cellH + u * 2);
  const SLOT = 5;

  // jacket: peel then fly
  const peelS = ease(t, T.peel, 1.6);
  const fly = ease(t, T.fly, T.slot - T.fly);
  const jx = lerp(w * 0.5, gx(SLOT), fly);
  const jy = lerp(h * 0.52 - peelS * h * 0.07, gy(SLOT), fly) - Math.sin(Math.PI * fly) * h * 0.1;
  const jh = lerp(h * 0.34 * (1 + 0.12 * peelS), cellH * 0.8, fly);
  const wob = Math.sin((t - T.peel) * 3.2) * 22 * peelS * (1 - fly);

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Track id={track} fromSec={fromSec} total={total} fps={DEMO_FPS} duck={(f) => musicGain(f / DEMO_FPS)} />

      {/* THE SCROLL: her real camera roll, 3 across */}
      {t < T.zoomed + 0.1 ? (
        <AbsoluteFill style={{ background: "#fff", filter: blur > 0.3 ? `blur(${blur}px)` : undefined }}>
          {Array.from({ length: 33 }, (_, r) => r + Math.floor(off / ROW) - 1).flatMap((row) =>
            row < 0
              ? []
              : [0, 1, 2].map((c) => {
                  const k = row * 3 + c;
                  return <Img key={k} src={src(PHOTOS[k % 30])} style={{ position: "absolute", left: c * 360 + 2, top: row * ROW - off + 2, width: 356, height: ROW - 4, objectFit: "cover" }} />;
                }).slice(0, row * ROW - off < h + ROW ? 3 : 0),
          )}
        </AbsoluteFill>
      ) : null}
      {/* thumb flicks */}
      {t < T.freeze
        ? FLICKS.map((f, i) => {
            const p = prog(t, f, 0.22);
            if (p <= 0 || p >= 1) return null;
            return <div key={i} style={{ position: "absolute", left: w * 0.62, top: lerp(h * 0.8, h * 0.45, p), width: u * 16, height: u * 16, borderRadius: "50%", background: "rgba(255,255,255,.55)", border: "3px solid rgba(0,0,0,.25)", opacity: Math.sin(Math.PI * p) }} />;
          })
        : null}
      <Hook text="Your camera roll is secretly a closet." at={0.12} until={T.freeze} y={h * 0.36} size={u * 9.5} />

      {/* FREEZE → full-screen ferry photo, then the PEEL */}
      {t >= T.freeze && t < T.fly + 0.4 ? (
        <div style={{ position: "absolute", ...zoomBox, overflow: "hidden", opacity: 1 - prog(t, T.fly, 0.4) }}>
          <Img src={src("photo.emma.r26-ferry.v1")} style={{ width: "100%", height: "100%", objectFit: "cover", filter: `brightness(${1 - 0.45 * peelS}) blur(${3 * peelS}px)` }} />
          {t < T.peel + 0.3 ? <div style={{ position: "absolute", inset: 0, border: `${u * 1.2}px solid #fff`, opacity: 1 - prog(t, T.peel, 0.3) }} /> : null}
        </div>
      ) : null}
      {t >= T.freeze && t < T.peel ? <Hook text="wait." at={T.freeze + 0.08} y={h * 0.16} size={u * 9} /> : null}

      {/* the closet grid */}
      {t >= T.fly ? (
        <AbsoluteFill style={{ background: `radial-gradient(120% 70% at 50% 18%, #FFFFFF 0%, ${C.ground} 62%, #E4E7EA 100%)`, opacity: prog(t, T.fly, 0.35) }}>
          {Array.from({ length: 16 }, (_, i) => {
            const pi = i < SLOT ? i : i - 1;
            const at = T.slot + 0.1 + (i < SLOT ? i : i - 1) * 0.07;
            const s = i === SLOT ? 1 : sp(t, at, "ui");
            return (
              <div key={i} style={{ position: "absolute", left: gx(i) - cellW / 2, top: gy(i) - cellH / 2, width: cellW, height: cellH, borderRadius: u * 2.4, background: i === SLOT ? "rgba(0,0,0,.05)" : "#fff", border: i === SLOT ? "3px dashed rgba(0,0,0,.18)" : undefined, boxShadow: i === SLOT ? undefined : "0 6px 18px rgba(0,0,0,.06)", transform: `scale(${i === SLOT ? 1 : s})` }}>
                {i !== SLOT && GRID[pi] ? <Cut id={GRID[pi]} x={cellW / 2} y={cellH / 2} h={cellH * 0.72} filter="none" /> : null}
              </div>
            );
          })}
          {t >= T.count ? (
            <div style={{ position: "absolute", left: 0, right: 0, top: h * 0.135, textAlign: "center", fontFamily: GEIST, fontWeight: 500, fontSize: u * 8, letterSpacing: "-0.035em", color: C.ink, transform: `scale(${lerp(1.2, 1, sp(t, T.count, "headline"))})` }}>
              41 pieces,
              <div style={{ fontSize: u * 5, color: C.t2 }}>from your photos.</div>
            </div>
          ) : null}
        </AbsoluteFill>
      ) : null}

      {/* the jacket (peel = AI video later) */}
      {t >= T.peel ? (
        <Cut
          id={JACKET}
          x={jx}
          y={jy}
          h={jh}
          transform={`perspective(1400px) rotateY(${wob}deg) rotateX(${wob * 0.3}deg)`}
          filter={`drop-shadow(0 0 ${u * 0.8 * peelS * (1 - fly)}px #fff) drop-shadow(0 0 ${u * 0.3}px #fff) drop-shadow(0 ${u * 3 * (1 - fly)}px ${u * 4}px rgba(0,0,0,.45))`}
          opacity={ease(t, T.peel, 0.35)}
        />
      ) : null}
      {t >= T.peel && t < T.fly ? <AiTag label="Her denim jacket peels off her into 3D (image-to-video from this photo)" y={h * 0.8} /> : null}

      <Flash at={T.freeze} dur={0.22} />
      <Close at={T.close} line="Curate finds your closet in your camera roll." />
      <BeatLabels beats={BEATS} title="2 · Camera roll closet" />
    </AbsoluteFill>
  );
};
