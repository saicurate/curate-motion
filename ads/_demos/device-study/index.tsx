import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { FormatId } from "../../../schemas/ad";
import { Device, DeviceScreen, PhoneFrame } from "../../../motion";

// The device study (gate "explore", never posted): one composition, three options, the same real screens.
//   option "current": the old drawn PhoneFrame (what the ads use today)
//   option "bezel":   Apple's iPhone Product Bezel, as is. Establishing shot, then a slow push-in:
//                     pan + zoom + fade is all Apple allows on its devices (decisions/0012).
//   option "3d":      Curate's generic 3D phone: a slow orbit + tilt, reflections moving over the glass.
// `still` freezes the move (a poster); `pose` sets the 3D phone's angle for a still.

export const schema = z.object({
  format: FormatId,
  length: z.number(),
  option: z.enum(["current", "bezel", "3d"]),
  model: z.string(),
  color: z.string(),
  screen: z.string(),
  from: z.number().nonnegative(),
  still: z.boolean(),
  pose: z.object({ x: z.number(), y: z.number(), z: z.number() }),
  envRot: z.number(),
});
type Props = z.infer<typeof schema>;
export const defaults = {
  option: "bezel" as const,
  model: "iphone-17-pro-max",
  color: "silver",
  screen: "footage.emma.scan-roll.v1",
  from: 0,
  still: false,
  pose: { x: 7, y: -20, z: 0 },
  envRot: 330,
};

/** Smooth 0→1 between a and b seconds (sine in-out: no start or stop hitch). */
const glide = (t: number, a: number, b: number) => {
  const u = Math.min(1, Math.max(0, (t - a) / (b - a)));
  return 0.5 - 0.5 * Math.cos(Math.PI * u);
};
const mix = (a: number, b: number, u: number) => a + (b - a) * u;

export const DeviceStudy: React.FC<Props> = ({ option, model, color, screen, from, still, pose, envRot }) => {
  const frame = useCurrentFrame();
  const { fps, width: W, height: H, durationInFrames } = useVideoConfig();
  const t = still ? 0 : frame / fps;
  const end = durationInFrames / fps;
  const PHONE_W = 600;
  // the push-in for the flat options: hold the whole phone 1.5 s, then glide in 16%
  const push = glide(t, 1.5, end);
  const scale = mix(1, 1.16, push);
  const y = mix(H / 2, H / 2 + 60, push);
  const bg = <AbsoluteFill style={{ background: "radial-gradient(120% 80% at 50% 38%, #FBFBFC 0%, #F1F2F4 55%, #E6E8EB 100%)" }} />;

  if (option === "current") {
    return (
      <AbsoluteFill>
        {bg}
        <PhoneFrame width={PHONE_W} x={W / 2} y={y} scale={scale} island={false}>
          <DeviceScreen id={screen} from={from} />
        </PhoneFrame>
      </AbsoluteFill>
    );
  }
  if (option === "bezel") {
    return (
      <AbsoluteFill>
        {bg}
        <Device model={model} color={color} width={PHONE_W} x={W / 2} y={y} scale={scale} screen={{ id: screen, from }} />
      </AbsoluteFill>
    );
  }
  // 3d: a slow orbit (y) with a little tilt (x) and roll (z); the HDRI stays put, so its softboxes slide over the glass
  const u = glide(t, 0, end);
  const rot = still ? pose : { x: mix(9, 3, u), y: mix(-26, 22, u), z: mix(-1.2, 0.8, u) };
  return (
    <AbsoluteFill>
      {bg}
      <Device variant="3d" color={color} width={PHONE_W} x={W / 2} y={H / 2 - 30} rotation={rot} screen={{ id: screen, from }} environment={{ rotation: envRot }} />
    </AbsoluteFill>
  );
};
