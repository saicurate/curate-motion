// Every ad, registered once. Root.tsx turns each into one composition per format × length.
// To add an ad: copy ads/_template/, then add one line here (AGENTS.md › Make a new ad).
import type React from "react";
import type { z } from "zod";
import { AdSpec } from "../schemas/ad";
import * as explainer from "./explainer";
import explainerSpec from "./explainer/ad.json";
import * as meetZee from "./meet-zee";
import meetZeeSpec from "./meet-zee/ad.json";
import * as popOut from "./pop-out";
import popOutSpec from "./pop-out/ad.json";
import * as popOutV2 from "./pop-out-v2";
import popOutV2Spec from "./pop-out-v2/ad.json";
import * as popOutV3 from "./pop-out-v3";
import popOutV3Spec from "./pop-out-v3/ad.json";
import * as rainOrShine from "./rain-or-shine";
import rainOrShineSpec from "./rain-or-shine/ad.json";
import * as zeeWipe from "./zee-wipe";
import zeeWipeSpec from "./zee-wipe/ad.json";
// Hooks: the first 8 s of an ad, made for $0 with the 2.5D kit (decisions/0013).
import * as hookZeeCritic from "./hook-zee-critic";
import hookZeeCriticSpec from "./hook-zee-critic/ad.json";
import * as hookCameraRoll from "./hook-camera-roll";
import hookCameraRollSpec from "./hook-camera-roll/ad.json";
// Skits: story-time ads with a made-up persona (Jake), AI stills/video + the real app.
import * as skitChopped from "./skit-chopped";
import skitChoppedSpec from "./skit-chopped/ad.json";
// Concept animatics (gate "explore", ads/_demos/README.md): rough, never posted.
import * as demo1 from "./_demos/nothing-to-wear";
import demo1Spec from "./_demos/nothing-to-wear/ad.json";
import * as demo2 from "./_demos/camera-roll-closet";
import demo2Spec from "./_demos/camera-roll-closet/ad.json";
import * as demo3 from "./_demos/zee-critic";
import demo3Spec from "./_demos/zee-critic/ad.json";
import * as demo4 from "./_demos/speed-run";
import demo4Spec from "./_demos/speed-run/ad.json";
import * as demo5 from "./_demos/outfit-change";
import demo5Spec from "./_demos/outfit-change/ad.json";
import * as demo6 from "./_demos/satisfying-sort";
import demo6Spec from "./_demos/satisfying-sort/ad.json";
// The device study (phone frames, ads/_demos/device-study): never posted.
import * as deviceStudy from "./_demos/device-study";
import deviceStudySpec from "./_demos/device-study/ad.json";

export type AdModule = {
  spec: AdSpec;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: React.FC<any>;
  schema: z.ZodObject;
  defaults: Record<string, unknown>;
  /** Optional: the video's real length from its props (e.g. a voiced narration plan). Default: length × fps. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: (props: any) => { durationInFrames: number };
};

export const ADS: AdModule[] = [
  { spec: AdSpec.parse(explainerSpec), component: explainer.Explainer, schema: explainer.schema, defaults: explainer.defaults, metadata: explainer.metadata },
  { spec: AdSpec.parse(meetZeeSpec), component: meetZee.MeetZee, schema: meetZee.schema, defaults: meetZee.defaults },
  { spec: AdSpec.parse(popOutSpec), component: popOut.PopOut, schema: popOut.schema, defaults: popOut.defaults },
  { spec: AdSpec.parse(popOutV2Spec), component: popOutV2.PopOutV2, schema: popOutV2.schema, defaults: popOutV2.defaults },
  { spec: AdSpec.parse(popOutV3Spec), component: popOutV3.PopOutV3, schema: popOutV3.schema, defaults: popOutV3.defaults },
  { spec: AdSpec.parse(rainOrShineSpec), component: rainOrShine.RainOrShine, schema: rainOrShine.schema, defaults: rainOrShine.defaults },
  { spec: AdSpec.parse(zeeWipeSpec), component: zeeWipe.ZeeWipe, schema: zeeWipe.schema, defaults: zeeWipe.defaults },
  { spec: AdSpec.parse(hookZeeCriticSpec), component: hookZeeCritic.HookZeeCritic, schema: hookZeeCritic.schema, defaults: hookZeeCritic.defaults, metadata: hookZeeCritic.metadata },
  { spec: AdSpec.parse(hookCameraRollSpec), component: hookCameraRoll.HookCameraRoll, schema: hookCameraRoll.schema, defaults: hookCameraRoll.defaults, metadata: hookCameraRoll.metadata },
  { spec: AdSpec.parse(skitChoppedSpec), component: skitChopped.SkitChopped, schema: skitChopped.schema, defaults: skitChopped.defaults, metadata: skitChopped.metadata },
  { spec: AdSpec.parse(demo1Spec), component: demo1.NothingToWear, schema: demo1.schema, defaults: demo1.defaults, metadata: demo1.metadata },
  { spec: AdSpec.parse(demo2Spec), component: demo2.CameraRollCloset, schema: demo2.schema, defaults: demo2.defaults, metadata: demo2.metadata },
  { spec: AdSpec.parse(demo3Spec), component: demo3.ZeeCritic, schema: demo3.schema, defaults: demo3.defaults, metadata: demo3.metadata },
  { spec: AdSpec.parse(demo4Spec), component: demo4.SpeedRun, schema: demo4.schema, defaults: demo4.defaults, metadata: demo4.metadata },
  { spec: AdSpec.parse(demo5Spec), component: demo5.OutfitChange, schema: demo5.schema, defaults: demo5.defaults, metadata: demo5.metadata },
  { spec: AdSpec.parse(demo6Spec), component: demo6.SatisfyingSort, schema: demo6.schema, defaults: demo6.defaults, metadata: demo6.metadata },
  { spec: AdSpec.parse(deviceStudySpec), component: deviceStudy.DeviceStudy, schema: deviceStudy.schema, defaults: deviceStudy.defaults },
];
