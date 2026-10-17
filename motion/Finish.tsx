import React, { useMemo } from "react";
import { useCurrentFrame } from "remotion";
import { hash, rand01 } from "./noise";

// motion/Finish.tsx: the finishing pass that keeps a code-built film from looking pasted together (decisions/0013).
//   <Grain seed amount>          seeded film grain, a new field every 2 frames (24 fps grain inside 60 fps motion)
//   <Vignette strength>          a soft optical fall-off at the corners
//   <ContactShadow …>            where a composited thing touches a surface: a tight dark core + a wide soft shadow
//   <LightWrap light from …>     the scene's light spilling round a cut-out's edge, on the side it comes from
// All frame-pure (no Math.random, no clocks): the same frame always draws the same pixels.

const TILE = 512;
const TILES = 8;

/** One grain tile as a PNG data URL: Gaussian-ish luminance noise, clumped a little like film. */
const grainTile = (seed: number, k: number): string => {
  const c = document.createElement("canvas");
  c.width = TILE;
  c.height = TILE;
  const g = c.getContext("2d")!;
  const img = g.createImageData(TILE, TILE);
  const raw = new Float32Array(TILE * TILE);
  for (let i = 0; i < raw.length; i++) {
    // sum of 3 uniforms ≈ Gaussian, centred on 0
    const u = (hash(seed + k * 7919, i * 3) + hash(seed + k * 7919, i * 3 + 1) + hash(seed + k * 7919, i * 3 + 2)) / 4294967296;
    raw[i] = u / 1.5 - 1;
  }
  // a 3-tap blur: grain clumps instead of single-pixel digital noise
  for (let y = 0; y < TILE; y++)
    for (let x = 0; x < TILE; x++) {
      const i = y * TILE + x;
      const n = raw[i] * 0.5 + 0.125 * (raw[y * TILE + ((x + 1) % TILE)] + raw[y * TILE + ((x + TILE - 1) % TILE)] + raw[((y + 1) % TILE) * TILE + x] + raw[((y + TILE - 1) % TILE) * TILE + x]);
      const v = Math.max(0, Math.min(255, Math.round(128 + n * 150)));
      img.data[i * 4] = v;
      img.data[i * 4 + 1] = v;
      img.data[i * 4 + 2] = v;
      img.data[i * 4 + 3] = 255;
    }
  g.putImageData(img, 0, 0);
  return c.toDataURL("image/png");
};

const tileCache = new Map<string, string[]>();

/** Seeded film grain over everything below it. amount ≈ 0.05 (subtle) … 0.12 (gritty). */
export const Grain: React.FC<{ seed?: number; amount?: number; size?: number; every?: number }> = ({ seed = 0x6a1, amount = 0.07, size = 1.25, every = 2 }) => {
  const frame = useCurrentFrame();
  const tiles = useMemo(() => {
    const key = `${seed}`;
    if (!tileCache.has(key)) tileCache.set(key, Array.from({ length: TILES }, (_, k) => grainTile(seed, k)));
    return tileCache.get(key)!;
  }, [seed]);
  const f = Math.floor(frame / every);
  const k = hash(seed, f) % TILES;
  const ox = Math.floor(rand01(seed + 1, f) * TILE);
  const oy = Math.floor(rand01(seed + 2, f) * TILE);
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundImage: `url(${tiles[k]})`,
        backgroundSize: `${TILE * size}px ${TILE * size}px`,
        backgroundPosition: `${ox}px ${oy}px`,
        mixBlendMode: "overlay",
        opacity: amount * 4,
        pointerEvents: "none",
      }}
    />
  );
};

/** A soft optical vignette (multiply), strongest in the corners. */
export const Vignette: React.FC<{ strength?: number; color?: string }> = ({ strength = 0.28, color = "24,20,16" }) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      pointerEvents: "none",
      background: `radial-gradient(130% 95% at 50% 46%, rgba(${color},0) 55%, rgba(${color},${strength * 0.55}) 82%, rgba(${color},${strength}) 100%)`,
    }}
  />
);

/**
 * A contact shadow under something standing on a surface (Zee on a cushion, a piece on a table): a tight,
 * dark core where it touches and a wide soft fall-off, squashed by the surface's angle. x, y = the contact
 * point (px), w = the footprint width (px). lift (0..1) fades and widens it as the thing rises off the surface.
 */
export const ContactShadow: React.FC<{ x: number; y: number; w: number; squash?: number; opacity?: number; lift?: number; color?: string }> = ({ x, y, w, squash = 0.22, opacity = 0.55, lift = 0, color = "22,16,12" }) => {
  const a = opacity * (1 - 0.85 * Math.min(1, lift));
  const spread = 1 + 1.4 * lift;
  const core = { w: w * 0.78 * (1 + 0.6 * lift), h: w * squash * 0.5 };
  const soft = { w: w * 1.6 * spread, h: w * squash * 1.3 * spread };
  return (
    <>
      <div style={{ position: "absolute", left: x - soft.w / 2, top: y - soft.h / 2, width: soft.w, height: soft.h, borderRadius: "50%", background: `radial-gradient(closest-side, rgba(${color},${a * 0.55}) 0%, rgba(${color},${a * 0.22}) 55%, rgba(${color},0) 100%)`, mixBlendMode: "multiply", pointerEvents: "none" }} />
      <div style={{ position: "absolute", left: x - core.w / 2, top: y - core.h / 2, width: core.w, height: core.h, borderRadius: "50%", background: `radial-gradient(closest-side, rgba(${color},${a}) 0%, rgba(${color},${a * 0.5}) 50%, rgba(${color},0) 100%)`, mixBlendMode: "multiply", filter: `blur(${2 + 6 * lift}px)`, pointerEvents: "none" }} />
    </>
  );
};

/**
 * Light wrap for a cut-out composited into a photo: the edge facing the light picks up the light's colour,
 * so it sits IN the scene instead of on it. Wrap the cut-out (an <img>/<canvas> with alpha) in it.
 *   light: the light's colour, e.g. a lamp "255,214,160"; dir: where the light comes from, degrees
 *   (0 = from the right, 90 = from below, 180 = from the left, 270 = from above); width: the rim, px.
 */
export const LightWrap: React.FC<{ id: string; light: string; dir: number; width?: number; strength?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ id, light, dir, width = 7, strength = 0.75, children, style }) => {
  const dx = -Math.cos((dir * Math.PI) / 180) * width;
  const dy = -Math.sin((dir * Math.PI) / 180) * width;
  const [r, g, b] = light.split(",").map((v) => Number(v) / 255);
  const fid = `lw-${id}`;
  return (
    <div style={{ position: "absolute", inset: 0, filter: `url(#${fid})`, ...style }}>
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <filter id={fid} x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
          {/* the rim: inside the shape, but whose neighbour toward the light is outside it */}
          <feOffset in="SourceAlpha" dx={dx} dy={dy} result="shifted" />
          <feComposite in="SourceAlpha" in2="shifted" operator="out" result="rim" />
          <feGaussianBlur in="rim" stdDeviation={width * 0.45} result="rimSoft" />
          <feComposite in="rimSoft" in2="SourceAlpha" operator="in" result="rimIn" />
          <feColorMatrix in="rimIn" type="matrix" values={`0 0 0 0 ${r}  0 0 0 0 ${g}  0 0 0 0 ${b}  0 0 0 ${strength} 0`} result="lit" />
          <feBlend in="lit" in2="SourceGraphic" mode="screen" />
        </filter>
      </svg>
      {children}
    </div>
  );
};
