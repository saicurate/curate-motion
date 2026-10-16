import { C } from "../../motion";

// Pop out v2's palette, by the founder's brief (prompt.motion-brief.one-thread-showreel.v1):
// at most three colours plus black and white, taken from Emma's own wardrobe. This is a test of
// that rule for one ad; it is NOT in motion/theme.ts until the founder decides (see README).
// Inside the phone the app keeps its real colours (C.appGround is the app's own screen ground).
export const P = {
  ink: C.ink, // black: the brand's Primary Black
  white: C.card, // white
  denim: "#4A6A8F", // her denim jacket
  camel: "#B8875A", // her camel coat
  sage: "#9DAA8C", // her sage set
  app: C.appGround, // the app's screen ground (build 262), only ever inside the phone
} as const;
