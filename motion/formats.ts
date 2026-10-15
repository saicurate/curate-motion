import { useVideoConfig } from "remotion";
import { FORMATS, LENGTHS, type FormatId } from "../schemas/ad";

export { FORMATS, LENGTHS };
export type { FormatId };

/**
 * The frame an ad is drawing into, in its own pixels, plus safe areas.
 * Ads lay out against this (fractions of w/h, or `u` = 1% of the short side), never against
 * a hard-coded 1080x1920, so one ad renders to every format.
 */
export const useFrameBox = () => {
  const { width: w, height: h } = useVideoConfig();
  const portrait = h > w;
  const tall = h / w > 1.6; // 9:16 and App Store iPhone
  const u = Math.min(w, h) / 100;
  // Platform UI covers the top ~8% and the bottom ~20% of a 9:16 feed (caption, buttons).
  const safe = tall ? { top: h * 0.08, bottom: h * 0.2, side: w * 0.06 } : { top: h * 0.05, bottom: h * 0.06, side: w * 0.05 };
  return { w, h, cx: w / 2, cy: h / 2, u, portrait, tall, safe, aspect: w / h };
};
