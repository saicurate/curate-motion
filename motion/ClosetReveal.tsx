import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { pieceAspect, Piece } from "./Piece";
import { clamp, out } from "./theme";

// ClosetReveal: a scatter of garments slams together into a tidy closet grid on the drop
// ("Two taps to a closet", C4). Pieces start blurred and far out, staggered by `stagger`
// frames, and land in a cols-wide grid inside the box. Put `at` on the drop: clock.section("drop").

export const ClosetReveal: React.FC<{
  ids: string[];
  at: number;
  box: { x: number; y: number; w: number; h: number };
  cols?: number;
  stagger?: number;
  dur?: number;
}> = ({ ids, at, box, cols = 4, stagger = 1.5, dur = 12 }) => {
  const frame = useCurrentFrame();
  const rows = Math.ceil(ids.length / cols);
  const cw = box.w / cols;
  const ch = box.h / rows;
  return (
    <>
      {ids.map((id, i) => {
        const c = i % cols;
        const r = Math.floor(i / cols);
        const tx = box.x + cw * (c + 0.5);
        const ty = box.y + ch * (r + 0.5);
        // deterministic scatter start
        const a = (i * 137.5 * Math.PI) / 180;
        const fx = tx + Math.cos(a) * box.w * 0.9;
        const fy = ty + Math.sin(a) * box.h * 0.9;
        const s = at + i * stagger;
        const t = interpolate(frame, [s, s + dur], [0, 1], { ...clamp, easing: out });
        if (frame < s) return null;
        const h = Math.min(ch * 0.8, (cw * 0.8) / pieceAspect(id));
        return (
          <Piece
            key={id + i}
            id={id}
            x={fx + (tx - fx) * t}
            y={fy + (ty - fy) * t}
            h={h}
            rot={(1 - t) * (i % 2 ? 18 : -18)}
            scale={0.6 + 0.4 * t}
            opacity={Math.min(1, t * 2)}
            shadow={t}
            style={{ filter: t < 0.8 ? `blur(${(1 - t) * 10}px)` : undefined }}
          />
        );
      })}
    </>
  );
};
