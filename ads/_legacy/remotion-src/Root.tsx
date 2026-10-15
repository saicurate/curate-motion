import React from "react";
import { Composition } from "remotion";
import { C1, C1_FRAMES } from "./mt/C1";
import { C2, C2_FRAMES } from "./mt/C2";
import { C3, C3_FRAMES } from "./mt/C3";
import { C4, C4_FRAMES } from "./mt/C4";
import { C5, C5_FRAMES } from "./mt/C5";
import { C14, C14_FRAMES } from "./mt/C14";
import { C7, C7_FRAMES } from "./mt/C7";
import { C9, C9_FRAMES } from "./mt/C9";
import { C12, C12_FRAMES } from "./mt/C12";
import { ExOpen, EX_OPEN_FRAMES } from "./mt/ExOpen";

// Motion tests: Zee's own clips + abstract shapes and Geist type ONLY.
// Real app footage comes later from the marketing account.
const V = { fps: 30, width: 1080, height: 1920 } as const;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="c1-mt" component={C1} durationInFrames={C1_FRAMES} {...V} />
      <Composition id="c2-mt" component={C2} durationInFrames={C2_FRAMES} {...V} />
      <Composition id="c3-mt" component={C3} durationInFrames={C3_FRAMES} {...V} />
      <Composition id="c4-mt" component={C4} durationInFrames={C4_FRAMES} {...V} />
      <Composition id="c5-mt" component={C5} durationInFrames={C5_FRAMES} {...V} />
      {/* Round 2 (2026-10-15): transition concepts + the explainer opening */}
      <Composition id="c7-mt" component={C7} durationInFrames={C7_FRAMES} {...V} />
      <Composition id="c9-mt" component={C9} durationInFrames={C9_FRAMES} {...V} />
      <Composition id="c12-mt" component={C12} durationInFrames={C12_FRAMES} {...V} />
      <Composition id="c14-mt" component={C14} durationInFrames={C14_FRAMES} {...V} />
      <Composition id="explainer-open-916" component={ExOpen} durationInFrames={EX_OPEN_FRAMES} {...V} />
      <Composition id="explainer-open-169" component={ExOpen} durationInFrames={EX_OPEN_FRAMES} fps={30} width={1920} height={1080} />
    </>
  );
};
