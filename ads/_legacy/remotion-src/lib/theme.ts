import { loadFont } from "@remotion/fonts";
import { Easing, staticFile } from "remotion";

// Curate's Mist look (curate-app lib/features/wardrobe_tab/presentation/chat/chat_mist.dart
// + lib/core/theme/curate_palette.dart). Monochrome, per the brand book.
export const C = {
  ground: "#F6F7F7",
  card: "#FFFFFF",
  you: "#E9EBEE",
  line: "#DCDFE3",
  t2: "#767A82",
  t3: "#878B92",
  ink: "#181818",
  strong: "#3A3D42",
  night: "#0E0E0F",
};

// Geist, the brand typeface (the app bundles vercel/geist-font 1.7.2, OFL).
// Titles are Medium, never bold (memory: titles-geist-not-thick).
export const GEIST = "Geist";
loadFont({ family: GEIST, url: staticFile("fonts/Geist-Regular.ttf"), weight: "400" });
loadFont({ family: GEIST, url: staticFile("fonts/Geist-Medium.ttf"), weight: "500" });
loadFont({ family: GEIST, url: staticFile("fonts/Geist-SemiBold.ttf"), weight: "600" });

export const display = (size: number, color = C.ink): React.CSSProperties => ({
  fontFamily: GEIST,
  fontWeight: 500,
  fontSize: size,
  letterSpacing: "-0.035em",
  lineHeight: 1.02,
  color,
});

export const out = Easing.bezier(0.16, 1, 0.3, 1);
export const inOut = Easing.bezier(0.65, 0, 0.35, 1);
export const snap = Easing.bezier(0.2, 1.4, 0.4, 1); // a little overshoot

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Soft Mist shadows, scaled up for video.
export const shadow = {
  card: "0 2px 6px rgba(16,20,24,0.06), 0 18px 40px rgba(16,20,24,0.08)",
  float: "0 8px 20px rgba(16,20,24,0.08), 0 60px 120px rgba(16,20,24,0.16)",
};

/** A beat grid: frame of beat n for a track at `bpm`, first beat at `offsetSec` (video time). */
export const beats = (bpm: number, offsetSec: number, fps = 30) => (n: number) =>
  Math.round((offsetSec + (n * 60) / bpm) * fps);
