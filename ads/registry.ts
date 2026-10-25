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
// Pop out v4: re-cut the header way with the new-look (284) footage (ads/pop-out-v4/README.md).
import * as popOutV4 from "./pop-out-v4";
import popOutV4Spec from "./pop-out-v4/ad.json";
import * as rainOrShine from "./rain-or-shine";
import rainOrShineSpec from "./rain-or-shine/ad.json";
// Designed ads: the app redrawn as motion, in the header's world (decisions/0014, motion/Designed.tsx).
import * as rainOrShineV2 from "./rain-or-shine-v2";
import rainOrShineV2Spec from "./rain-or-shine-v2/ad.json";
import * as askZee from "./ask-zee";
import askZeeSpec from "./ask-zee/ad.json";
import * as seeItOnYou from "./see-it-on-you";
import seeItOnYouSpec from "./see-it-on-you/ad.json";
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
// The iOS 27 App Store header and search card (21:9 and 3:2 muted loops).
import * as appStoreHeader from "./app-store-header";
import appStoreHeaderSpec from "./app-store-header/ad.json";
// Film B of the App Store header, v2 made in parallel (see ads/app-store-header-tryon/README.md).
import * as appStoreHeaderTryOn from "./app-store-header-tryon";
import appStoreHeaderTryOnSpec from "./app-store-header-tryon/ad.json";
// Direction D of the App Store header, "Colour story" (see ads/app-store-header-colour/README.md).
import * as appStoreHeaderColour from "./app-store-header-colour";
import appStoreHeaderColourSpec from "./app-store-header-colour/ad.json";
// Direction C of the App Store header, "A week of looks" (see ads/app-store-header-week/README.md).
import * as appStoreHeaderWeek from "./app-store-header-week";
import appStoreHeaderWeekSpec from "./app-store-header-week/ad.json";
// The App Store header, the one film: A → B → C → the lockup, one 30 s loop (see ads/app-store-header-all/README.md).
import * as appStoreHeaderAll from "./app-store-header-all";
import appStoreHeaderAllSpec from "./app-store-header-all/ad.json";
import * as appStoreShotsV1 from "./app-store-shots-v1";
import appStoreShotsV1Spec from "./app-store-shots-v1/ad.json";
// App Store screenshots, set S-V2 (editorial): six stills, iPhone 6.9" (ads/app-store-shots-v2/README.md).
import * as appStoreShotsV2 from "./app-store-shots-v2";
import appStoreShotsV2Spec from "./app-store-shots-v2/ad.json";
// App Store screenshots, set S-V3 (the Essembl theme, product-led): six stills (ads/app-store-shots-v3/README.md).
import * as appStoreShotsV3 from "./app-store-shots-v3";
import appStoreShotsV3Spec from "./app-store-shots-v3/ad.json";
// App Store previews: three App Previews from real build-284 screen recordings (ads/app-store-previews/README.md).
import * as appStorePreviews from "./app-store-previews";
import appStorePreviewsSpec from "./app-store-previews/ad.json";
// App Store previews, hybrid: the header's world around the real build-284 recordings (ads/app-store-previews-hybrid/README.md).
// App Store screenshots for the Event Draw custom product page, the O2 look (ads/app-store-shots-event/index.tsx).
import * as appStoreShotsEvent from "./app-store-shots-event";
import appStoreShotsEventSpec from "./app-store-shots-event/ad.json";
import * as appStorePreviewsHybrid from "./app-store-previews-hybrid";
import appStorePreviewsHybridSpec from "./app-store-previews-hybrid/ad.json";
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
  { spec: AdSpec.parse(popOutV4Spec), component: popOutV4.PopOutV4, schema: popOutV4.schema, defaults: popOutV4.defaults },
  { spec: AdSpec.parse(rainOrShineSpec), component: rainOrShine.RainOrShine, schema: rainOrShine.schema, defaults: rainOrShine.defaults },
  { spec: AdSpec.parse(rainOrShineV2Spec), component: rainOrShineV2.RainOrShineV2, schema: rainOrShineV2.schema, defaults: rainOrShineV2.defaults },
  { spec: AdSpec.parse(askZeeSpec), component: askZee.AskZee, schema: askZee.schema, defaults: askZee.defaults },
  { spec: AdSpec.parse(seeItOnYouSpec), component: seeItOnYou.SeeItOnYou, schema: seeItOnYou.schema, defaults: seeItOnYou.defaults },
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
  { spec: AdSpec.parse(appStoreHeaderSpec), component: appStoreHeader.AppStoreHeader, schema: appStoreHeader.schema, defaults: appStoreHeader.defaults },
  { spec: AdSpec.parse(appStoreHeaderTryOnSpec), component: appStoreHeaderTryOn.AppStoreHeaderTryOn, schema: appStoreHeaderTryOn.schema, defaults: appStoreHeaderTryOn.defaults },
  { spec: AdSpec.parse(appStoreHeaderColourSpec), component: appStoreHeaderColour.AppStoreHeaderColour, schema: appStoreHeaderColour.schema, defaults: appStoreHeaderColour.defaults },
  { spec: AdSpec.parse(appStoreHeaderWeekSpec), component: appStoreHeaderWeek.AppStoreHeaderWeek, schema: appStoreHeaderWeek.schema, defaults: appStoreHeaderWeek.defaults },
  { spec: AdSpec.parse(appStoreHeaderAllSpec), component: appStoreHeaderAll.AppStoreHeaderAll, schema: appStoreHeaderAll.schema, defaults: appStoreHeaderAll.defaults },
  { spec: AdSpec.parse(appStoreShotsV1Spec), component: appStoreShotsV1.AppStoreShotsV1, schema: appStoreShotsV1.schema, defaults: appStoreShotsV1.defaults },
  { spec: AdSpec.parse(appStoreShotsV2Spec), component: appStoreShotsV2.AppStoreShotsV2, schema: appStoreShotsV2.schema, defaults: appStoreShotsV2.defaults },
  { spec: AdSpec.parse(appStoreShotsV3Spec), component: appStoreShotsV3.AppStoreShotsV3, schema: appStoreShotsV3.schema, defaults: appStoreShotsV3.defaults },
  { spec: AdSpec.parse(appStorePreviewsSpec), component: appStorePreviews.AppStorePreviews, schema: appStorePreviews.schema, defaults: appStorePreviews.defaults, metadata: appStorePreviews.metadata },
  { spec: AdSpec.parse(appStoreShotsEventSpec), component: appStoreShotsEvent.AppStoreShotsEvent, schema: appStoreShotsEvent.schema, defaults: appStoreShotsEvent.defaults },
  { spec: AdSpec.parse(appStorePreviewsHybridSpec), component: appStorePreviewsHybrid.AppStorePreviewsHybrid, schema: appStorePreviewsHybrid.schema, defaults: appStorePreviewsHybrid.defaults, metadata: appStorePreviewsHybrid.metadata },
  { spec: AdSpec.parse(deviceStudySpec), component: deviceStudy.DeviceStudy, schema: deviceStudy.schema, defaults: deviceStudy.defaults },
];
