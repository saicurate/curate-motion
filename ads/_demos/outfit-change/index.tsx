import React from "react";
import { AbsoluteFill, Img } from "remotion";
import { C, GEIST, Look, src, Track, useBrandFonts, useFrameBox, ZeeActor, type LookPiece } from "../../../motion";
import { LOOKS } from "../data";
import { AiShot, AiTag, BeatLabels, Close, ease, Hook, lerp, MiniPhone, prog, Shot, sp, useT } from "../kit";
import { demoMetadata, demoSchema, DEMO_FPS, type DemoProps } from "../module";
import { BEATS, CHANGES, COVER, FROM, LENGTH, musicGain, T, TRACK } from "./timeline";

// Demo 5 · "Outfit-change trend" (rough animatic, gate "explore").
export const schema = demoSchema;
export const defaults = { track: TRACK, fromSec: FROM };
export const metadata = demoMetadata(LENGTH);

const SEQ = [
  { look: LOOKS.dateNight, chip: "Zee's pick: Date night" },
  { look: LOOKS.coatDress, chip: "Zee's pick: look 3 of 3" },
  { look: LOOKS.work, chip: "Zee's pick: work, drizzly tomorrow" },
];

export const OutfitChange: React.FC<DemoProps> = ({ track, fromSec }) => {
  useBrandFonts();
  const t = useT();
  const fps = DEMO_FPS;
  const { w, h, u } = useFrameBox();
  const total = Math.round(LENGTH * fps);

  const idx = CHANGES.filter((c) => t >= c).length - 1; // -1 before the first change
  const since = idx >= 0 ? t - CHANGES[idx] : t;
  // the hand: covers the lens over COVER s before each change, pulls away 0.3 s after
  const hand = Math.max(0, ...CHANGES.map((c) => (t < c ? ease(t, c - COVER, COVER) : 1 - ease(t, c + 0.04, 0.3))));
  const cur = idx >= 0 ? SEQ[idx] : null;

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Track id={track} fromSec={fromSec} total={total} fps={fps} duck={() => musicGain()} />

      {/* the plain mirror shot, then each look */}
      {!cur ? (
        <AiShot label="Emma in her mirror, phone up, plain outfit" still="tryon.emma.tryon-base-1.v1" stillOpacity={0.85} labelY={0.8} />
      ) : (
        <AbsoluteFill style={{ background: `radial-gradient(120% 70% at 50% 18%, #FFFFFF 0%, ${C.ground} 62%, #E4E7EA 100%)` }}>
          <Img src={src("tryon.emma.tryon-base-1.v1")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.16, filter: "grayscale(1)" }} />
          <Look pieces={cur.look.pieces as unknown as LookPiece[]} x={w * 0.5} y={h * 0.5} W={w * 0.78} H={h * 0.56} bob={t * fps} scale={lerp(1.08, 1, sp(since, 0, "piece"))} />
          <AiTag label="Emma WEARING this look, same mirror, same pose" y={h * 0.86} />
          {/* Zee's pick chip */}
          <div style={{ position: "absolute", left: u * 5, top: h * 0.16, display: "flex", alignItems: "center", gap: u * 1.5, background: "#181818", color: "#fff", fontFamily: GEIST, fontWeight: 500, fontSize: u * 4.4, borderRadius: 99, padding: `${u * 1}px ${u * 3}px ${u * 1}px ${u * 1}px`, transform: `scale(${sp(since, 0.25, "ui")})`, transformOrigin: "left center" }}>
            <div style={{ position: "relative", width: u * 8, height: u * 8 }}>
              <ZeeActor cues={[{ at: 0, emo: "hello", cut: true }]} size={u * 8} shadow={false} style={{ left: 0, top: 0 }} />
            </div>
            {cur.chip}
          </div>
          {/* the real look card from the app */}
          <MiniPhone x={w * 0.84} y={lerp(h * 1.2, h * 0.36, sp(since, 0.4, "panel"))} width={u * 24} rot={4}>
            <Shot id={cur.look.shot} />
          </MiniPhone>
          <div style={{ position: "absolute", right: u * 3, top: h * 0.555, fontFamily: GEIST, fontWeight: 600, fontSize: u * 2.6, color: C.t2, opacity: prog(since, 0.6, 0.2) }}>REAL LOOK IN THE APP</div>
        </AbsoluteFill>
      )}

      {/* the hand over the lens */}
      {hand > 0.001 ? (
        <AbsoluteFill style={{ pointerEvents: "none" }}>
          <div style={{ position: "absolute", left: w * 0.5 - h * 0.7, top: h * 0.5 - h * 0.7, width: h * 1.4, height: h * 1.4, borderRadius: "50%", background: "radial-gradient(closest-side, #2a1d17 0%, #3b2a21 55%, rgba(59,42,33,.0) 100%)", transform: `translate(${(1 - hand) * w * 0.9}px, ${(1 - hand) * h * 0.6}px) scale(${lerp(0.3, 1.25, hand)})` }} />
          {hand > 0.4 ? <div style={{ position: "absolute", left: 0, right: 0, top: h * 0.47, textAlign: "center", fontFamily: GEIST, fontSize: u * 3.4, fontWeight: 600, color: "rgba(255,255,255,.6)", letterSpacing: ".1em" }}>HAND OVER LENS</div> : null}
        </AbsoluteFill>
      ) : null}

      <Hook text="letting my AI stylist pick my outfits" at={0.1} until={CHANGES[0] - COVER} y={h * 0.4} size={u * 8.5} />

      <Close at={T.close} line="Which one? It picks from YOUR closet." />
      <BeatLabels beats={BEATS} title="5 · Outfit-change trend" />
    </AbsoluteFill>
  );
};
