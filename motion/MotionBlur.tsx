import React from "react";

// MotionBlur: a real directional blur (an SVG Gaussian with separate x and y spread), for whips,
// leaps and fast moves. CSS blur() is round; a whip should smear only along its direction.
// `x` / `y` are the blur in px along each axis; 0 = sharp. Give each instance a unique `id`.

export const MotionBlur: React.FC<{ id: string; x?: number; y?: number; style?: React.CSSProperties; children: React.ReactNode }> = ({ id, x = 0, y = 0, style, children }) => {
  const on = x > 0.3 || y > 0.3;
  return (
    <div style={{ position: "absolute", inset: 0, filter: on ? `url(#${id})` : undefined, ...style }}>
      {on ? (
        <svg width="0" height="0" style={{ position: "absolute" }}>
          <filter id={id} x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
            <feGaussianBlur stdDeviation={`${x.toFixed(1)} ${y.toFixed(1)}`} edgeMode="duplicate" />
          </filter>
        </svg>
      ) : null}
      {children}
    </div>
  );
};
