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
];
