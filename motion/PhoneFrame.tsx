import React from "react";
import { C, shadow } from "./theme";

// Ported from marketing/videos/remotion/src/lib/Phone.tsx (motion tests c1–c14).

// An iPhone 17 Pro Max silhouette (1320 x 2868 screen) that can float in 3D.
// The screen is a slot: today abstract shapes, later the marketing account's real footage.
export const PHONE_RATIO = 2868 / 1320;

export const PhoneFrame: React.FC<{
  width: number;
  x?: number; // centre, px from the left of the parent
  y?: number; // centre, px from the top
  rx?: number; // degrees
  ry?: number;
  rz?: number;
  scale?: number;
  opacity?: number;
  screen?: string;
  children?: React.ReactNode;
}> = ({ width, x = 540, y = 960, rx = 0, ry = 0, rz = 0, scale = 1, opacity = 1, screen = C.ground, children }) => {
  const h = width * PHONE_RATIO;
  const bezel = width * 0.028;
  const r = width * 0.135;
  return (
    <div
      style={{
        position: "absolute",
        left: x - width / 2,
        top: y - h / 2,
        width,
        height: h,
        opacity,
        transformStyle: "preserve-3d",
        transform: `perspective(2600px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg) scale(${scale})`,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: r,
          background: "linear-gradient(145deg, #2a2b2e, #0c0c0d 40%, #1d1e20)",
          boxShadow: shadow.float,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: bezel,
          borderRadius: r - bezel,
          overflow: "hidden",
          background: screen,
        }}
      >
        {children}
        {/* Dynamic Island */}
        <div
          style={{
            position: "absolute",
            top: width * 0.024,
            left: "50%",
            width: width * 0.27,
            height: width * 0.078,
            marginLeft: -width * 0.135,
            borderRadius: width,
            background: "#000",
          }}
        />
        {/* glass sheen */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(120deg, rgba(255,255,255,0.10), rgba(255,255,255,0) 35%)",
            pointerEvents: "none",
          }}
        />
      </div>
    </div>
  );
};

export type PhonePose = { width: number; x: number; y: number; rx?: number; ry?: number; rz?: number; scale?: number };

/** Where a point on a <PhoneFrame> screen lands on the canvas (mirrors the CSS transform above). */
export const projectOnPhone = (ph: PhonePose, sx: number, sy: number) => {
  const h = ph.width * PHONE_RATIO;
  const bezel = ph.width * 0.028;
  const s = ph.scale ?? 1;
  let x = (bezel + sx - ph.width / 2) * s;
  let y = (bezel + sy - h / 2) * s;
  let z = 0;
  const rz = ((ph.rz ?? 0) * Math.PI) / 180;
  const ry = ((ph.ry ?? 0) * Math.PI) / 180;
  const rx = ((ph.rx ?? 0) * Math.PI) / 180;
  [x, y] = [x * Math.cos(rz) - y * Math.sin(rz), x * Math.sin(rz) + y * Math.cos(rz)];
  [x, z] = [x * Math.cos(ry) + z * Math.sin(ry), -x * Math.sin(ry) + z * Math.cos(ry)];
  [y, z] = [y * Math.cos(rx) - z * Math.sin(rx), y * Math.sin(rx) + z * Math.cos(rx)];
  const P = 2600;
  const k = P / (P - z);
  return { x: ph.x + x * k, y: ph.y + y * k, k };
};
