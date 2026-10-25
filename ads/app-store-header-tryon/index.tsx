import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { FormatId } from "../../schemas/ad";
import { ContactShadow, Device, deviceLayout, Grain, KeyLine, pieceAspect, StableImg, src, SubframeBlur, useBrandFonts, Vignette } from "../../motion";
import { expoInOut, expoOut, mix, progress, spring, track } from "../../motion/springs";
import { T } from "./timeline";

// The iOS 27 App Store header (21:9, 3840 × 1646) and search card (3:2, 2880 × 1920), film B "See it on
// you", v2 of ads/app-store-header's tryon: her walk-to-work photo as a big lit print, the black tee
// hovering beside it; the tee flies onto her and Studio's real try-on runs down over her under a light
// edge, while the camera pushes in and the street moves behind her (her cut-out over the plate behind
// her, two layers, true parallax); the print slides aside and the phone rises with Studio showing that
// same try-on. Then everything goes back: a seamless 15 s loop. Every value is a function of t.
//
// Layout is in units of the frame's height H around its centre, one table per format (re-laid out, never
// cropped): the header's width carries the words beside the picture; the search card is the same film
// tighter.

// look: "mist" = B1 (the Mist studio, the founder's first pick); "colour" = B2 (a colour-blocked campaign set
// that changes colour with the try-on: the founder, 2026-10-24, "a bit more colorful"); "tonal" = B3 (the same
// idea in subtle, low-saturation colour pushed toward Mist, softer shadows, more air: the
// founder on the colourful set, "feeling cheap… subtle colours").
export const LOOKS = ["mist", "colour", "tonal"] as const;
export const schema = z.object({ format: FormatId, length: z.number(), look: z.enum(LOOKS).default("mist") });
export const defaults = { look: "mist" as const };

const PHONE = { model: "iphone-17-pro-max", color: "silver" } as const;
const INK = "#181818";

// Her photo and Studio's real try-on of it (pasted into the photo at its measured crop), each with her
// cut-out (tools/photo3d). The background is the real photo, never the inpainted plate: her cut-out's soft
// edges then blend with real pixels (the plate's fill smeared the taxi behind her hair, round 3).
const BEFORE = { photo: "photo.emma.r30-walk-to-work.v1", her: "photo.emma.r30-walk-to-work-cutout.v1" };
const AFTER = { photo: "photo.emma.r30-walk-to-work-tryon-tee-black.v1", her: "photo.emma.r30-walk-to-work-tryon-tee-black-cutout.v1" };
const CROP = { x: 64, y: 116, w: 1664, h: 2080, W: 1792, H: 2400 };
const TEE = "garment.emma.tee-black.v1";
// The phone's screen: build 284's Studio, the Off-duty black board with her black-tee try-on (the founder,
// 2026-10-24: the 264 screens are the old design; never use them).
const STUDIO = "screenshot.emma.b284-studio-offduty-tryon.v1";
/** Her chest in the crop (0..1 across, down) and the tee's height on her (× the print's height). */
const TORSO = { x: 0.47, y: 0.412, h: 0.19 };

type Layout = {
  line1: { x: number; y: number; size: number };
  line2: { x: number; y: number; size: number; width: number };
  print: { h: number; x0: number; x1: number };
  tee: { x: number; y: number; h: number };
  phone: { x: number; h: number };
};

const LAYOUT: Record<"store-header" | "store-search", Layout> = {
  // the words clear the App Store's back button (over the header's top left: x −1.08…−0.88 H, y −0.18…0.02 H)
  "store-header": {
    line1: { x: -0.76, y: -0.03, size: 0.118 },
    line2: { x: -0.76, y: -0.01, size: 0.092, width: 0.5 },
    print: { h: 0.82, x0: 0.2, x1: 0.11 },
    tee: { x: 0.85, y: 0.01, h: 0.38 },
    phone: { x: 0.65, h: 0.84 },
  },
  "store-search": {
    line1: { x: -0.66, y: -0.14, size: 0.088 },
    line2: { x: -0.66, y: -0.115, size: 0.064, width: 0.34 },
    print: { h: 0.72, x0: 0.08, x1: 0.04 },
    tee: { x: 0.54, y: 0.02, h: 0.27 },
    phone: { x: 0.43, h: 0.72 },
  },
};

/** B3: the same places with more air: a smaller print, tee and phone. */
const LAYOUT_TONAL: Record<"store-header" | "store-search", Layout> = {
  "store-header": {
    line1: { x: -0.76, y: -0.03, size: 0.112 },
    line2: { x: -0.76, y: -0.01, size: 0.088, width: 0.48 },
    print: { h: 0.72, x0: 0.2, x1: 0.13 },
    tee: { x: 0.8, y: 0.02, h: 0.32 },
    phone: { x: 0.63, h: 0.76 },
  },
  "store-search": {
    line1: { x: -0.64, y: -0.13, size: 0.084 },
    line2: { x: -0.64, y: -0.105, size: 0.06, width: 0.32 },
    print: { h: 0.64, x0: 0.09, x1: 0.06 },
    tee: { x: 0.52, y: 0.03, h: 0.24 },
    phone: { x: 0.42, h: 0.66 },
  },
};

/** Periodic in the 15 s loop (whole cycles), so frame 899 runs into frame 0. */
const wave = (t: number, period: number, phase = 0) => Math.sin((2 * Math.PI * t) / period + phase);

/** The stage: a seamless studio sweep, lit from the upper left (a soft key and a darker floor). */
const Stage: React.FC = () => (
  <>
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #F8F9F9 0%, #F5F6F6 50%, #EEF0F0 70%, #E5E7E8 100%)" }} />
    <AbsoluteFill style={{ background: "radial-gradient(62% 92% at 26% 16%, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0) 66%)" }} />
    <AbsoluteFill style={{ background: "radial-gradient(150% 120% at 46% 38%, rgba(0,0,0,0) 56%, rgba(28,24,20,0.06) 100%)" }} />
  </>
);

/** B2's set: a colour-blocked cyclorama (a wall and a floor in two colours, a soft curve between them).
 *  Tonal blocks: before the try-on, cobalt over powder blue (cool, like her navy stripes; never blue over
 *  yellow, which reads as a flag); once she's wearing the black tee, rust over blush (warm, the black reads
 *  hard against it). Deep, campaign colours, never candy. */
type SetColours = { wallHi: string; wall: string; floor: string; floorLo: string; shade: string };
type Palette = { a: SetColours; b: SetColours; seam: number; key: number; fall: number; glow: number; weave: boolean };
const PALETTES: Record<"colour" | "tonal", Palette> = {
  // B2: the wall meets the floor 82% down the frame (the white words stay on the deep wall)
  colour: {
    a: { wallHi: "#3A549E", wall: "#2A4385", floor: "#AFBCDB", floorLo: "#97A5C7", shade: "14,20,46" },
    b: { wallHi: "#BB5A36", wall: "#A0452A", floor: "#E3BBA2", floorLo: "#CC9F86", shade: "52,20,10" },
    seam: 0.82, key: 0.26, fall: 0.1, glow: 0.55, weave: false,
  },
  // B3: pale dusty blue (cool, her navy stripes) → soft blush oat (warm, once she's in the black tee), both
  // within a few points of Mist; the floor only a shade deeper than the wall. (A drawn linen weave read as a
  // screen-door grid at full size, round 1; the film grain carries the texture.)
  tonal: {
    a: { wallHi: "#EDF1F5", wall: "#DCE3EB", floor: "#D3DBE5", floorLo: "#C5CFDB", shade: "44,56,74" },
    b: { wallHi: "#F5EEE8", wall: "#EBDDD2", floor: "#E3D2C5", floorLo: "#D6C1B2", shade: "74,52,40" },
    seam: 0.8, key: 0.5, fall: 0.06, glow: 0.4, weave: false,
  },
};
const SetLayer: React.FC<{ c: SetColours; seam: number }> = ({ c, seam }) => (
  <AbsoluteFill
    style={{
      background: `linear-gradient(180deg, ${c.wallHi} 0%, ${c.wall} ${(seam * 100 - 10).toFixed(1)}%, ${c.floor} ${(seam * 100 + 7).toFixed(1)}%, ${c.floorLo} 100%)`,
    }}
  />
);
/** A fine linen weave over the set (warp and weft a few px apart, barely there), static, so it never
 *  shimmers and loops for free. */
const Weave: React.FC<{ H: number }> = ({ H }) => {
  const p = Math.max(3, Math.round(H / 420));
  return (
    <AbsoluteFill
      style={{
        backgroundImage: `repeating-linear-gradient(0deg, rgba(60,48,40,0.035) 0 1px, rgba(0,0,0,0) 1px ${p}px), repeating-linear-gradient(90deg, rgba(60,48,40,0.028) 0 1px, rgba(255,255,255,0.03) 1px ${p * 0.5}px, rgba(0,0,0,0) ${p * 0.5}px ${p}px)`,
        mixBlendMode: "multiply",
      }}
    />
  );
};
/** The new colour comes down the whole set with the print's light edge (setEdge: px from the top). */
const ColourSet: React.FC<{ H: number; s: number; edge: number; pal: Palette }> = ({ H, s, edge, pal }) => {
  const SETS = pal;
  const SEAM = pal.seam;
  const setEdge = mix(-0.06 * H, 1.06 * H, s);
  const f = 0.05 * H;
  const mask = `linear-gradient(180deg, #000 ${(setEdge - f).toFixed(1)}px, rgba(0,0,0,0) ${(setEdge + f).toFixed(1)}px)`;
  return (
    <>
      {s < 0.9995 ? <SetLayer c={SETS.a} seam={SEAM} /> : null}
      {s > 0.0005 ? (
        <AbsoluteFill style={s < 0.9995 ? { WebkitMaskImage: mask, maskImage: mask } : undefined}>
          <SetLayer c={SETS.b} seam={SEAM} />
        </AbsoluteFill>
      ) : null}
      {pal.weave ? <Weave H={H} /> : null}
      {edge > 0.004 ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: setEdge - 0.08 * H, height: 0.16 * H, opacity: pal.glow * edge, mixBlendMode: "screen", background: "linear-gradient(180deg, rgba(255,240,224,0) 0%, rgba(255,240,224,0.22) 45%, rgba(255,246,236,0.34) 50%, rgba(255,240,224,0.22) 55%, rgba(255,240,224,0) 100%)" }} />
      ) : null}
      {/* the key light from the upper left, and the floor falling off toward the camera */}
      <AbsoluteFill style={{ background: `radial-gradient(64% 96% at 22% 12%, rgba(255,244,230,${pal.key}) 0%, rgba(255,244,230,0) 66%)`, mixBlendMode: "screen" }} />
      <AbsoluteFill style={{ background: `linear-gradient(180deg, rgba(0,0,0,0) ${(SEAM * 100).toFixed(1)}%, rgba(20,12,8,${pal.fall}) 100%)`, mixBlendMode: "multiply" }} />
    </>
  );
};

/** One version of the photo (the photo + her cut-out over it), the crop filling the box. u = how far the
 *  camera has pushed in: the whole photo grows (about the lens axis, the box centre) and she grows a little
 *  more about her own middle (she's nearer), so the street shifts behind her and she always covers her own
 *  outline in the photo underneath. drift: a slow lateral breath, the same for both layers. */
const HER_MID = { x: 0.47, y: 0.56 };
const PhotoLayers: React.FC<{ v: typeof BEFORE; w: number; h: number; u: number; drift: number }> = ({ v, w, h, u, drift }) => {
  const box = { left: (-CROP.x * w) / CROP.w, top: (-CROP.y * h) / CROP.h, width: (CROP.W * w) / CROP.w, height: (CROP.H * h) / CROP.h };
  const s0 = 1 + 0.03 * u;
  const sHer = 1 + 0.032 * u;
  const dx = (drift - 0.5) * w * 0.006;
  const img: React.CSSProperties = { position: "absolute", ...box };
  return (
    <div style={{ position: "absolute", inset: 0, transformOrigin: `${w / 2}px ${h / 2}px`, transform: `translateX(${dx.toFixed(3)}px) scale(${s0.toFixed(5)})` }}>
      <StableImg src={src(v.photo)} style={img} />
      <StableImg src={src(v.her)} style={{ ...img, transformOrigin: `${HER_MID.x * CROP.w * (w / CROP.w) + CROP.x * (w / CROP.w)}px ${HER_MID.y * CROP.h * (h / CROP.h) + CROP.y * (h / CROP.h)}px`, transform: `scale(${sHer.toFixed(5)})` }} />
    </div>
  );
};

/** The print: rounded, lit from the upper left (a sheen across it, two shadows falling right and down),
 *  the try-on running down over her as s goes 0 → 1, the light edge riding the boundary. */
const Print: React.FC<{ cx: number; cy: number; h: number; s: number; edge: number; u: number; drift: number; dim: number }> = ({ cx, cy, h, s, edge, u, drift, dim }) => {
  const w = h * (CROP.w / CROP.h);
  const r = h * 0.024;
  const ey = s * h;
  return (
    <div
      style={{
        position: "absolute",
        left: cx - w / 2,
        top: cy - h / 2,
        width: w,
        height: h,
        borderRadius: r,
        overflow: "hidden",
        boxShadow: `${h * 0.004}px ${h * 0.008}px ${h * 0.02}px rgba(20,18,16,0.12), ${h * 0.03}px ${h * 0.06}px ${h * 0.13}px rgba(20,18,16,0.17)`,
        filter: dim > 0.004 ? `brightness(${(1 - dim).toFixed(3)})` : undefined,
      }}
    >
      {/* only the version(s) on screen: both while the edge runs, one otherwise (half the layers: heavy
          frames with sub-frame samples otherwise make Chrome drop layers) */}
      {s < 0.9995 ? <PhotoLayers v={BEFORE} w={w} h={h} u={u} drift={drift} /> : null}
      {s > 0.0005 ? (
        <div style={{ position: "absolute", inset: 0, clipPath: s < 0.9995 ? `inset(0 0 ${((1 - s) * 100).toFixed(3)}% 0)` : undefined }}>
          <PhotoLayers v={AFTER} w={w} h={h} u={u} drift={drift} />
        </div>
      ) : null}
      {edge > 0.004 ? (
        <>
          <div
            style={{
              position: "absolute",
              left: 0,
              width: w,
              top: ey - 0.06 * h,
              height: 0.12 * h,
              opacity: 0.8 * edge,
              background: "linear-gradient(180deg, rgba(255,252,247,0) 0%, rgba(255,252,247,0.16) 38%, rgba(255,252,247,0.4) 50%, rgba(255,252,247,0.16) 62%, rgba(255,252,247,0) 100%)",
              mixBlendMode: "screen",
            }}
          />
          <div style={{ position: "absolute", left: 0, width: w, top: ey - h * 0.0012, height: h * 0.0024, opacity: 0.45 * edge, background: "linear-gradient(90deg, rgba(255,255,255,0) 4%, rgba(255,255,255,0.9) 30%, rgba(255,255,255,0.9) 70%, rgba(255,255,255,0) 96%)", filter: `blur(${(h * 0.0015).toFixed(2)}px)` }} />
        </>
      ) : null}
      {/* the print's surface: a soft sheen from the key light, sliding a little as the camera moves */}
      <div style={{ position: "absolute", inset: 0, background: `linear-gradient(118deg, rgba(255,255,255,0) ${30 + 6 * u}%, rgba(255,255,255,0.085) ${42 + 6 * u}%, rgba(255,255,255,0) ${56 + 6 * u}%)` }} />
      <div style={{ position: "absolute", inset: 0, borderRadius: r, boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.18)" }} />
    </div>
  );
};

/** The tee, floating: its own soft shadow and one on the floor beneath it while it rests. */
const Tee: React.FC<{ cx: number; cy: number; h: number; rot: number; opacity: number; lift: number; floorY?: number; floorO: number; clipTop: number }> = ({ cx, cy, h, rot, opacity, lift, floorY, floorO, clipTop }) => {
  const w = h * pieceAspect(TEE);
  return (
    <>
      {floorY !== undefined && floorO > 0.01 ? <ContactShadow x={cx} y={floorY} w={w * 0.86} squash={0.14} opacity={0.3 * floorO} lift={0.6} /> : null}
      <div
        style={{
          position: "absolute",
          left: cx - w / 2,
          top: cy - h / 2,
          width: w,
          height: h,
          opacity,
          transform: `rotate(${rot.toFixed(3)}deg)`,
          clipPath: clipTop > 0.01 ? `inset(${clipTop.toFixed(2)}px -20% -20% -20%)` : undefined,
          filter: `drop-shadow(${h * 0.012}px ${h * (0.018 + 0.02 * lift)}px ${h * (0.022 + 0.03 * lift)}px rgba(20,18,16,${(0.16 + 0.08 * lift).toFixed(3)}))`,
        }}
      >
        <StableImg src={src(TEE, "cutout")} style={{ position: "absolute", inset: 0, width: w, height: h }} />
      </div>
    </>
  );
};

/** The phone's width for a visible body height (a whole iPhone bezel, straight on: x, y, scale, opacity only). */
const phoneW = (H: number, hFrac: number) => {
  const l = deviceLayout({ ...PHONE, width: 100 });
  return ((hFrac * H) / l.body.h) * 100;
};

const useT = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return frame / fps;
};

const Film: React.FC<{ L: Layout; W: number; H: number; look: (typeof LOOKS)[number] }> = ({ L, W, H, look }) => {
  const t = useT();
  const cx = W / 2;
  const cy = H / 2;

  // the camera push into the photo: 0 at rest, 1 after the reveal, back to 0 before the loop
  const u = track(t, 0, [
    { t: T.push, v: 1, spring: "camera" },
    { t: T.slide - 0.2, v: 0.55, spring: "camera" },
    { t: T.printBack, v: 0, spring: "camera" },
  ]);
  const drift = 0.5 * wave(t, 15, -Math.PI / 2) + 0.5; // 0 at the loop point, a slow breath between
  // the sweep: 0 = before, 1 = after; the light edge only while it moves
  const s = expoInOut(progress(t, T.sweep, T.sweepDur)) * (1 - expoInOut(progress(t, T.unsweep, T.unsweepDur)));
  const edgeOn = (a: number, d: number) => expoOut(progress(t, a - 0.08, 0.18)) * (1 - expoOut(progress(t, a + d - 0.14, 0.2)));
  const edge = Math.max(edgeOn(T.sweep, T.sweepDur), edgeOn(T.unsweep, T.unsweepDur));

  // the print: beside the tee → (slide) aside for the phone → back
  const px = cx + track(t, L.print.x0, [{ t: T.slide, v: L.print.x1, spring: "panel" }, { t: T.printBack, v: L.print.x0, spring: "panel" }]) * H;
  const ph = L.print.h * H * (1 + 0.025 * u);
  const pw = ph * (CROP.w / CROP.h);

  // the phone rises with Studio, sinks on the way back
  const rise = spring(t - (T.slide + 0.12), "panel") - spring(t - T.back, "panel");
  const phoneO = expoOut(progress(t, T.slide + 0.12, 0.45)) * (1 - expoOut(progress(t, T.back + 0.05, 0.4)));
  const phoneY = cy + 0.3 * H * (1 - rise);

  // the tee: hovering beside the print → a small lift → flies in an arc onto her chest → goes in under the
  // light edge (above the edge she's wearing it: the real try-on; below it the tee is still there over her
  // stripes). It stays hidden while the edge runs back up; once her stripes are back it floats in from the
  // right to its rest (frame 0) — never shown on her in reverse (round 4: it read as a pasted block).
  const restX = cx + L.tee.x * H + 0.004 * H * wave(t, 5);
  const restY = cy + L.tee.y * H + 0.007 * H * wave(t, 7.5);
  const restRot = 3 + 1.1 * wave(t, 5, 1.2);
  const gather = spring(t - T.lift, "ui") - spring(t - T.fly, "ui");
  const fly = spring(t - T.fly, { zeta: 0.94, response: 0.52 });
  const torsoX = px + (TORSO.x - 0.5) * pw;
  const torsoY = cy + (TORSO.y - 0.5) * ph;
  const returning = t >= T.teeBack;
  const back = spring(t - T.teeBack, "piece");
  const onHer = returning ? 0 : fly;
  const arc = -0.07 * H * Math.sin(Math.PI * Math.min(1, fly)) * (returning ? 0 : 1);
  const floatIn = returning ? 1 - back : 0; // 1 → 0 as it arrives
  const teeX = mix(restX, torsoX, onHer) + 0.14 * H * floatIn;
  const teeY = mix(restY - 0.025 * H * gather, torsoY, onHer) + arc - 0.03 * H * floatIn;
  const teeH = mix(L.tee.h * H, TORSO.h * ph, onHer);
  const teeRot = mix(restRot, 0, onHer) + 6 * floatIn;
  const edgeY = cy - ph / 2 + s * ph;
  const clipTop = returning ? 0 : Math.max(0, Math.min(teeH, edgeY - (teeY - teeH / 2)));
  const teeO = returning ? expoOut(progress(t, T.teeBack, 0.5)) : t > T.sweep + T.sweepDur ? 0 : 1;
  const floorO = (1 - Math.min(1, onHer * 3)) * teeO;
  // the print stands a little above the floor: a soft shadow under it
  const printFloor = cy + ph / 2 + 0.03 * H;

  const colour = look === "colour";
  const pal = look === "mist" ? null : PALETTES[look];
  // B2/B3: the shadows take the set's own dark (they fall on colour); B2's words are white, B3's stay ink
  const shade = pal ? (s < 0.5 ? pal.a.shade : pal.b.shade) : "20,18,16";
  const words = colour ? { keyColor: "#FFFFFF", bodyColor: "rgba(255,255,255,0.72)" } : {};
  // B3's shadows are softer and wider (a big diffused key), B2's harder
  const wallShadow = look === "tonal" ? { dx: 0.045, dy: 0.035, a: 0.16, blur: 0.055 } : { dx: 0.055, dy: 0.03, a: 0.34, blur: 0.035 };
  return (
    <>
      {pal ? <ColourSet H={H} s={s} edge={edge} pal={pal} /> : <Stage />}
      {pal ? (
        // the key light throws the print's shadow onto the wall behind it, to the right and a little down
        <div style={{ position: "absolute", left: px - pw / 2 + wallShadow.dx * H, top: cy - ph / 2 + wallShadow.dy * H, width: pw, height: ph, borderRadius: ph * 0.03, background: `rgba(${shade},${wallShadow.a})`, filter: `blur(${(wallShadow.blur * H).toFixed(1)}px)`, mixBlendMode: "multiply" }} />
      ) : null}
      <ContactShadow x={px} y={printFloor} w={pw * 1.05} squash={0.09} opacity={colour ? 0.34 : 0.26} lift={0.8} color={pal ? shade : undefined} />
      <Print cx={px} cy={cy} h={ph} s={s} edge={edge} u={u} drift={drift} dim={0.06 * phoneO} />
      <Tee cx={teeX} cy={teeY} h={teeH} rot={teeRot} opacity={teeO} lift={1 - 0.7 * onHer} floorY={cy + 0.43 * H} floorO={floorO} clipTop={clipTop} />
      <div style={{ position: "absolute", inset: 0, opacity: phoneO, filter: `drop-shadow(${0.012 * H}px ${0.03 * H}px ${0.05 * H}px rgba(${shade},${colour ? 0.32 : 0.2}))` }}>
        <Device {...PHONE} width={phoneW(H, L.phone.h)} x={cx + L.phone.x * H} y={phoneY} screen={{ id: STUDIO }} />
      </div>
      {/* "See it on you." is up at the loop point (the poster frame), through the reveal, and lands again before the end */}
      <KeyLine text={"See it\n*on you.*"} at={-2} exitAt={T.line1Out} size={L.line1.size * H} stagger={0.07} lineHeight={1.02} {...words} style={{ left: cx + L.line1.x * H, top: cy + L.line1.y * H }} />
      <KeyLine text={"See it\n*on you.*"} at={T.line1Back} size={L.line1.size * H} stagger={0.07} lineHeight={1.02} {...words} style={{ left: cx + L.line1.x * H, top: cy + L.line1.y * H }} />
      <KeyLine text={"Before you\n*wear it.*"} at={T.line2} exitAt={T.back} size={L.line2.size * H} stagger={0.07} lineHeight={1.04} {...words} style={{ left: cx + L.line2.x * H, top: cy + L.line2.y * H, width: L.line2.width * H }} />
    </>
  );
};

/** The fast moves (s): the tee's flight, the print and the phone going and coming back, the tee's return. */
const FAST: [number, number][] = [
  [T.fly - 0.05, T.fly + 0.62],
  [T.slide, T.slide + 0.75],
  [T.back, T.back + 0.6],
  [T.printBack, T.printBack + 0.7],
  [T.teeBack, T.teeBack + 0.55],
];

export const AppStoreHeaderTryOn: React.FC<z.infer<typeof schema>> = ({ format, look = "mist" }) => {
  useBrandFonts();
  const { fps, width: W, height: H } = useVideoConfig();
  const L = (look === "tonal" ? LAYOUT_TONAL : LAYOUT)[format === "store-search" ? "store-search" : "store-header"];
  const fast = (f: number) => FAST.some(([a, b]) => f / fps >= a && f / fps <= b);
  return (
    <AbsoluteFill style={{ background: "#F6F7F7", color: INK, overflow: "hidden" }}>
      {/* the stage is inside every sample, so each sub-frame is opaque and averaging them is exact */}
      <SubframeBlur samples={(f) => (fast(f) ? Math.round(8 * (H / 1646)) + 2 : 1)} shutter={0.35}>
        <Film L={L} W={W} H={H} look={look} />
        <Grain amount={look === "colour" ? 0.03 : look === "tonal" ? 0.03 : 0.025} />
        <Vignette strength={look === "colour" ? 0.18 : look === "tonal" ? 0.09 : 0.12} color={look === "colour" ? "18,10,8" : look === "tonal" ? "60,44,34" : undefined} />
      </SubframeBlur>
    </AbsoluteFill>
  );
};
