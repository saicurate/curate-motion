// Every ad, registered once. Root.tsx turns each into one composition per format × length.
// To add an ad: copy ads/_template/, then add one line here (AGENTS.md › Make a new ad).
import type React from "react";
import type { z } from "zod";
import { AdSpec } from "../schemas/ad";
import * as meetZee from "./meet-zee";
import meetZeeSpec from "./meet-zee/ad.json";

export type AdModule = {
  spec: AdSpec;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: React.FC<any>;
  schema: z.ZodObject;
  defaults: Record<string, unknown>;
};

export const ADS: AdModule[] = [
  { spec: AdSpec.parse(meetZeeSpec), component: meetZee.MeetZee, schema: meetZee.schema, defaults: meetZee.defaults },
];
