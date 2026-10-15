import React from "react";
import { useVideoConfig } from "remotion";
import { z } from "zod";
import { FormatId } from "../../schemas/ad";
import { clockFor, Ground, Logo, Track, useBrandFonts, useFrameBox, Words } from "../../motion";
import AD from "./ad.json";

// Template ad: copy this folder to ads/<ad-id>/, rename the component, fill ad.json, register it
// in ads/registry.ts. Reach media only by asset id; time everything on the beat clock.

export const schema = z.object({
  format: FormatId,
  length: z.number(),
  track: z.string(),
  fromSec: z.number().nonnegative(),
  line: z.string(),
});
export type Props = z.infer<typeof schema>;
export const defaults: Omit<Props, "format" | "length"> = { track: AD.track, fromSec: 0, line: "Your stylist." };

export const TemplateAd: React.FC<Props> = ({ track, fromSec, line }) => {
  useBrandFonts();
  const { fps, durationInFrames } = useVideoConfig();
  const { u, h, safe } = useFrameBox();
  const clock = clockFor(track, fromSec, fps);
  return (
    <Ground>
      <Track id={track} fromSec={clock.fromSec} total={durationInFrames} fps={fps} />
      <Words text={line} at={clock.frame(0)} size={u * 11} style={{ left: 0, right: 0, top: h * 0.4 }} />
      <Logo at={clock.frame(4)} y={h - safe.bottom} width={u * 24} />
    </Ground>
  );
};
