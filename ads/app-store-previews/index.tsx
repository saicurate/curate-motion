import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { FormatId, fpsFor } from "../../schemas/ad";
import { Device, deviceLayout, Footage, GEIST, spring, StableImg, src, useBrandFonts } from "../../motion";
import { END, lengthOf, PREVIEWS, XF, type Preview } from "./shots";

// The App Store previews (2026-10-24, the founder: "let's generate videos for the previews as well"):
// three 886 × 1920 App Previews for the screenshot row, one feature each, cut from real screen
// recordings of build 284 (the new look) through the dev probes, no prod account, nothing paid.
// Apple's rules (App Review 2.3.4): screen captures of the app itself, with text overlays; Apple's
// bezel straight on (decisions/0012: pan, zoom and fades only; nothing over its screen; words beside it).
// The look is S-V3's (ads/app-store-shots-v3): the linen ground, the two-tone Geist headline.
//
//   1 Your closet, from your photos.   Extract all: the sort, the items found, the landing in her rails
//   2 See it on you, before you wear it.   Try-ons: her photo, a shop link and her trousers, Try on, the reveal
//   3 Always know what to wear.   Today's look, then asking her stylist in Chat and the look it picks

export const schema = z.object({ format: FormatId, length: z.number(), preview: z.number().int().min(1).max(3), palette: z.enum(["blue", "cream"]) });
export type Props = z.infer<typeof schema>;
export const defaults = { preview: 1, palette: "blue" as const };

const W = 886;
const H = 1920;

/** S-V3's palettes (ads/app-store-shots-v3/index.tsx): the linen ground, ink, the headline's deep tone. */
const PALETTES = {
  blue: { ground: "stock.polyhaven.linen-blue-ground.v1", ink: "#171B21", deep: "#33475E" },
  cream: { ground: "stock.polyhaven.linen-cream-ground.v1", ink: "#1C1916", deep: "#6A5443" },
} as const;

const LOCKUP = "brand.curate.logo-splash.v1"; // 670 × 742
const PHONE_W = 712;
/** The phone's centre: its body ends 64 px above the bottom edge. */
const PHONE = (() => {
  const l = deviceLayout({ width: PHONE_W, x: W / 2, y: 0 });
  return { x: W / 2, y: H - 64 - (l.body.y + l.body.h) };
})();

const previewOf = (n: number): Preview => PREVIEWS.find((p) => p.n === n) ?? PREVIEWS[0];

/** The cuts, end to end on the composition's clock, each fading in over the one before it. */
const Cuts: React.FC<{ p: Preview }> = ({ p }) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  let at = 0;
  return (
    <>
      {p.cuts.map((c, i) => {
        const start = at;
        const len = c.to - c.from;
        at += len - XF;
        const from = Math.round(start * fps);
        const dur = Math.round(len * fps) + (i === p.cuts.length - 1 ? Math.round(END * fps) : 0);
        const local = (frame - from) / fps;
        const opacity = i === 0 ? 1 : Math.min(1, Math.max(0, local / XF));
        return (
          <Sequence key={i} from={from} durationInFrames={dur} layout="none">
            <div style={{ position: "absolute", inset: 0, opacity }}>
              <Footage id={c.id} from={c.from} />
            </div>
          </Sequence>
        );
      })}
    </>
  );
};

export const AppStorePreviews: React.FC<Props> = ({ preview, palette }) => {
  useBrandFonts();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const p = previewOf(preview);
  const pal = PALETTES[palette];
  const total = lengthOf(p);
  const endAt = total - END;
  // The headline is up from the first frame (the preview autoplays muted); it settles 14 px.
  const rise = 14 * (1 - spring(t, "headline"));
  // A slow push on the whole phone (Apple allows zoom once the whole phone has been seen).
  const push = 0.985 + 0.015 * spring(t, "camera");
  // The end card: the phone and the words fade (the only transition on Apple's bezel), the lockup fades in.
  const out = Math.min(1, Math.max(0, (t - endAt) / 0.35));
  const lockIn = Math.min(1, Math.max(0, (t - endAt - 0.2) / 0.45));
  const lockH = 214;
  const lockW = lockH * (670 / 742);
  return (
    <AbsoluteFill style={{ background: "#E6EDF5" }}>
      <StableImg src={src(pal.ground)} style={{ position: "absolute", inset: 0, width: W, height: H }} />
      <div
        style={{
          position: "absolute",
          left: 28,
          right: 28,
          top: 96,
          textAlign: "center",
          fontFamily: GEIST,
          fontWeight: 500,
          fontSize: 90,
          lineHeight: 1.0,
          letterSpacing: "-0.055em",
          opacity: 1 - out,
          transform: `translateY(${rise}px)`,
        }}
      >
        <div style={{ color: pal.ink }}>{p.a}</div>
        <div style={{ color: pal.deep }}>{p.b}</div>
      </div>
      <Device model="iphone-17-pro-max" color="silver" width={PHONE_W} x={PHONE.x} y={PHONE.y} scale={push} opacity={1 - out} screenBackground="#FFFFFF">
        <Cuts p={p} />
      </Device>
      <StableImg
        src={src(LOCKUP)}
        style={{ position: "absolute", left: (W - lockW) / 2, top: H * 0.43 - lockH / 2, width: lockW, height: lockH, opacity: lockIn }}
      />
    </AbsoluteFill>
  );
};

/** Each preview's real length: its cuts, less the overlaps, plus the end card. */
export const metadata = (props: Props) => ({ durationInFrames: Math.round(lengthOf(previewOf(props.preview)) * fpsFor(60, props.format)) });
