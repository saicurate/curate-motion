import { loadFont } from "@remotion/fonts";
import { Easing } from "remotion";
import { src } from "./assets";

// Curate's Mist look (curate-app lib/core/theme/curate_palette.dart and the wardrobe chat's
// chat_mist.dart). Monochrome, per the brand book. Change a token here, never inline a hex.
export const C = {
  ground: "#F6F7F7",
  card: "#FFFFFF",
  you: "#E9EBEE",
  line: "#DCDFE3",
  t2: "#767A82",
  t3: "#878B92",
  ink: "#181818", // curate_palette ink
  strong: "#3A3D42",
  winterGrey: "#656565",
  night: "#0E0E0F", // kDarkSeed
  // Real ads (2026-10-15): the app's own screen ground in build 262 (the gallery import / scan),
  // so a drawn screen can match-cut into the footage; and the grey ramps the scenes stand on.
  appGround: "#F4F4F4",
  desk: "#F4F5F6",
  deskMid: "#E4E7EA",
  deskEdge: "#D6DADE",
  rainHi: "#8F979F",
  rainLo: "#565C64",
  dusk: "#2F3238",
  duskLo: "#1B1D21",
  sunHi: "#FFF7EC", // the faint warmth of a clear sky, used once, as light
} as const;

// Geist, the brand typeface. Titles are Medium (500), never bold.
export const GEIST = "Geist";
const FONT_IDS = { 400: "font.geist.regular.v1", 500: "font.geist.medium.v1", 600: "font.geist.semibold.v1" } as const;

let fontsRequested = false;
/**
 * Load Geist from the library. Call once from an ad's top component (not at module scope),
 * so `remotion compositions` works on a checkout that hasn't pulled media yet.
 */
export const useBrandFonts = () => {
  if (fontsRequested) return;
  fontsRequested = true;
  for (const [weight, id] of Object.entries(FONT_IDS)) {
    // format given, not guessed from the URL: on Lambda the URL is presigned (a query after .ttf)
    loadFont({ family: GEIST, url: src(id), weight, format: "truetype" });
  }
};

export const display = (size: number, color: string = C.ink): React.CSSProperties => ({
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
