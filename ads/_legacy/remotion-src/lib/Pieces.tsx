import React from "react";
import { Img, staticFile } from "remotion";
import INDEX from "../../public/garments/index.json";

// Emma's generated pieces, cut out locally (tools/cutout.py) so they float like the app's pieces.
export type Slug = keyof typeof INDEX;
export const pieceAspect = (s: Slug) => INDEX[s].w / INDEX[s].h;
export const pieceSrc = (s: Slug) => staticFile(`garments/${s}.png`);

/** One floating piece, centred on (x, y), `h` px tall, with a soft floor shadow. */
export const Piece: React.FC<{
  slug: Slug;
  x: number;
  y: number;
  h: number;
  rot?: number;
  scale?: number;
  opacity?: number;
  shadow?: number; // 0..1
  outline?: number; // 0..1 white outline (the "trace")
  style?: React.CSSProperties;
}> = ({ slug, x, y, h, rot = 0, scale = 1, opacity = 1, shadow = 1, outline = 0, style }) => {
  const w = h * pieceAspect(slug);
  const ol = outline > 0 ? `drop-shadow(0 0 ${2 + 4 * outline}px rgba(255,255,255,${outline})) drop-shadow(0 0 1px rgba(255,255,255,${outline}))` : "";
  return (
    <div
      style={{
        position: "absolute",
        left: x - w / 2,
        top: y - h / 2,
        width: w,
        height: h,
        opacity,
        transform: `rotate(${rot}deg) scale(${scale})`,
        ...style,
      }}
    >
      {shadow > 0 ? (
        <div
          style={{
            position: "absolute",
            left: w * 0.12,
            width: w * 0.76,
            top: h * 1.02,
            height: h * 0.07,
            borderRadius: "50%",
            background: `radial-gradient(closest-side, rgba(16,20,24,${0.2 * shadow}), rgba(16,20,24,0))`,
          }}
        />
      ) : null}
      <Img
        src={pieceSrc(slug)}
        style={{
          width: w,
          height: h,
          filter: `${ol} drop-shadow(0 ${h * 0.02}px ${h * 0.03}px rgba(16,20,24,${0.16 * shadow}))`,
        }}
      />
    </div>
  );
};

export type Role = "outer" | "top" | "bottom" | "short" | "dress" | "shoes" | "bag" | "hat";
export type LookPiece = { slug: Slug; role: Role };

/** Where each role sits in a flat-lay look of size W x H (centre at 0,0). */
export const place = (role: Role, W: number, H: number, hasOuter: boolean) => {
  switch (role) {
    case "dress":
      return { x: 0, y: 0, h: H * 0.92, rot: 0 };
    case "outer":
      return { x: -W * 0.2, y: -H * 0.2, h: H * 0.5, rot: -5 };
    case "top":
      return hasOuter ? { x: W * 0.17, y: -H * 0.22, h: H * 0.44, rot: 4 } : { x: 0, y: -H * 0.22, h: H * 0.46, rot: 0 };
    case "bottom":
      return { x: hasOuter ? W * 0.04 : 0, y: H * 0.24, h: H * 0.56, rot: hasOuter ? 2 : 0 };
    case "short":
      return { x: hasOuter ? W * 0.04 : 0, y: H * 0.2, h: H * 0.32, rot: 0 };
    case "shoes":
      return { x: W * 0.34, y: H * 0.43, h: H * 0.15, rot: -4 };
    case "bag":
      return { x: hasOuter ? W * 0.4 : -W * 0.36, y: H * 0.08, h: H * 0.26, rot: hasOuter ? 5 : -5 };
    case "hat":
      return { x: -W * 0.3, y: -H * 0.42, h: H * 0.14, rot: -8 };
  }
};

/** A whole look laid out like the app's look card, centred at (x, y). Pieces get t in 0..1 each. */
export const Look: React.FC<{
  pieces: LookPiece[];
  x: number;
  y: number;
  W: number;
  H: number;
  t?: number[]; // per-piece visibility 0..1 (pop), default all 1
  bob?: number; // frame, for a gentle float
  scale?: number;
}> = ({ pieces, x, y, W, H, t, bob = 0, scale = 1 }) => {
  const hasOuter = pieces.some((p) => p.role === "outer");
  // outer behind the top, bottoms behind tops
  const order: Role[] = ["bag", "bottom", "short", "dress", "outer", "top", "shoes", "hat"];
  const sorted = pieces.map((p, i) => ({ ...p, i })).sort((a, b) => order.indexOf(a.role) - order.indexOf(b.role));
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `scale(${scale})`, willChange: "transform" }}>
      {sorted.map((p) => {
        const pl = place(p.role, W, H, hasOuter);
        const v = t ? t[p.i] ?? 1 : 1;
        if (v <= 0) return null;
        const float = Math.sin((bob + p.i * 23) / 17) * H * 0.008;
        return <Piece key={p.slug + p.i} slug={p.slug} x={pl.x} y={pl.y + float} h={pl.h} rot={pl.rot} scale={v} opacity={Math.min(1, v * 1.5)} />;
      })}
    </div>
  );
};
