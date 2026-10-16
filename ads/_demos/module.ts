// The props every concept animatic takes, and its real length (each demo is 8–15 s, registered
// under the 15 s preset; `metadata` sets the true duration). 30 fps, rendered at 540×960 (--scale 0.5).
import { z } from "zod";
import { FormatId } from "../../schemas/ad";

export const demoSchema = z.object({
  format: FormatId,
  length: z.number(),
  track: z.string(),
  fromSec: z.number().nonnegative(),
});
export type DemoProps = z.infer<typeof demoSchema>;

export const DEMO_FPS = 30;
export const demoMetadata = (lengthSec: number) => () => ({ durationInFrames: Math.round(lengthSec * DEMO_FPS) });
