// Every ad, registered once. Root.tsx turns each into one composition per format × length.
// To add an ad: copy ads/_template/, then add one line here (AGENTS.md › Make a new ad).
import type React from "react";
import type { z } from "zod";
import { AdSpec } from "../schemas/ad";
import * as explainer from "./explainer";
import explainerSpec from "./explainer/ad.json";
import * as meetZee from "./meet-zee";
import meetZeeSpec from "./meet-zee/ad.json";

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
];
