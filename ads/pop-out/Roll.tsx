import React from "react";
import { Img } from "remotion";
import { C, GEIST, src } from "../../motion";

// Emma's camera roll, drawn in the app's own pixels (1320 x 2868, the footage's size) and scaled
// onto the phone screen. The order and the 4-column grid are exactly what the app's scan deals
// (footage.emma.scan-roll.v1 at 1.40 s: newest first, 327 x 287 tiles), so cutting from this roll
// to the real scan is a true match cut: the same photos, in the same places.

/** Newest first, as on her phone (library/people/emma/account-state.json › cameraRoll, minus the cap packshot). */
export const ROLL = [
  "selfie.emma.selfie.v1", "stock.unsplash.beach-empty-highrise.v1", "stock.unsplash.sunset-wave.v1", "photo.emma.r30-walk-to-work.v1",
  "stock.unsplash.nyc-williamsburg-bridge.v1", "stock.unsplash.sunset-trees-lake.v1", "photo.emma.r29-gym-mirror.v1", "stock.unsplash.dog-5.v1",
  "stock.unsplash.pizza-pepperoni.v1", "photo.emma.r28-couch-cozy.v1", "stock.unsplash.pizza-picking-slice.v1", "stock.unsplash.pizza-slice-hand.v1",
  "photo.emma.r27-chelsea-market.v1", "stock.unsplash.sunset-sea-clouds.v1", "stock.unsplash.nyc-skyline-east-river.v1", "photo.emma.r26-ferry.v1",
  "stock.unsplash.brunch-blueberry-toast.v1", "photo.emma.r25-cafe-laptop.v1", "stock.unsplash.flowers-vase.v1", "photo.emma.r24-dinner.v1",
  "stock.unsplash.food-donut-box.v1", "photo.emma.r23-rainy-day.v1", "stock.unsplash.dog-4.v1", "photo.emma.r22-stoop.v1",
  "stock.unsplash.nyc-central-park.v1", "photo.emma.r21-museum-steps.v1", "stock.unsplash.hands-cheers-glasses.v1", "photo.emma.r20-country-night.v1",
  "stock.unsplash.dog-golden-retriever-2.v1", "stock.unsplash.autumn-bench.v1", "photo.emma.r19-fall-game-day.v1", "stock.unsplash.coffee-mug-hand.v1",
  "photo.emma.r18-office-lobby.v1", "stock.unsplash.brunch-waffles.v1", "stock.unsplash.brunch-egg-toast.v1", "photo.emma.r17-brunch.v1",
];

export const APP = { w: 1320, h: 2868 };
const COLS = [0, 331, 662, 994];
const TW = 326;
const TH = 287;
const PITCH = 292;
/** Where the scan's grid starts (app px) at footage.emma.scan-roll.v1 1.40 s. */
export const SCAN_TOP = 722; // measured against the rendered footage frame (the deal is still settling at 1.40 s)
/** Where the roll's grid starts on her own phone (under the status bar). */
export const ROLL_TOP = 176;

/** A tile's rect in app px. */
export const tile = (i: number, top: number) => ({ x: COLS[i % 4], y: top + Math.floor(i / 4) * PITCH, w: TW, h: TH });

const StatusBar: React.FC<{ k: number }> = ({ k }) => (
  <div style={{ position: "absolute", left: 0, top: 0, width: APP.w * k, height: 170 * k }}>
    <div style={{ position: "absolute", left: 186 * k, top: 62 * k, fontFamily: GEIST, fontWeight: 600, fontSize: 58 * k, letterSpacing: "-0.01em", color: C.ink, lineHeight: 1.2 }}>9:41</div>
    <svg width={270 * k} height={70 * k} viewBox="0 0 270 70" style={{ position: "absolute", left: 930 * k, top: 62 * k }}>
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={i * 19} y={44 - 10 - i * 9} width={13} height={14 + i * 9} rx={3} fill={C.ink} />
      ))}
      <path d="M118 30 a34 34 0 0 1 48 0" stroke={C.ink} strokeWidth="7" fill="none" strokeLinecap="round" />
      <path d="M127 39 a21 21 0 0 1 30 0" stroke={C.ink} strokeWidth="7" fill="none" strokeLinecap="round" />
      <circle cx="142" cy="47" r="5" fill={C.ink} />
      <rect x="186" y="18" width="66" height="34" rx="10" fill="none" stroke={C.ink} strokeOpacity="0.4" strokeWidth="4" />
      <rect x="191" y="23" width="56" height="24" rx="6" fill={C.ink} />
      <rect x="256" y="29" width="5" height="12" rx="2" fill={C.ink} fillOpacity="0.4" />
    </svg>
  </div>
);

/**
 * The roll at screen size: `k` = screen px per app px (every position is multiplied by k, so
 * there is no giant scaled layer for Chrome to drop). `top` is where row 0 starts (app px);
 * `fade` (0..1) fades the rows below the scan's fourth row the way the app does.
 */
export const Roll: React.FC<{ k: number; top: number; fade?: number; bg?: string; status?: number; rows?: number }> = ({ k, top, fade = 0, bg = C.card, status = 1, rows = 9 }) => {
  const mask = fade > 0 ? `linear-gradient(to bottom, #000 0px, #000 ${(SCAN_TOP + 3 * PITCH - 40) * k}px, rgba(0,0,0,${(1 - fade).toFixed(3)}) ${(SCAN_TOP + 4 * PITCH - 20) * k}px)` : undefined;
  return (
    <div style={{ position: "absolute", inset: 0, background: bg }}>
      <div style={{ position: "absolute", inset: 0, WebkitMaskImage: mask }}>
        {ROLL.slice(0, rows * 4).map((id, i) => {
          const t = tile(i, top);
          if (t.y > APP.h || t.y + t.h < 0) return null;
          return (
            <Img
              key={id}
              src={src(id)}
              style={{ position: "absolute", left: t.x * k, top: t.y * k, width: t.w * k, height: t.h * k, objectFit: "cover", background: C.you }}
            />
          );
        })}
      </div>
      {status > 0 ? (
        <div style={{ position: "absolute", inset: 0, opacity: status }}>
          <StatusBar k={k} />
        </div>
      ) : null}
    </div>
  );
};
