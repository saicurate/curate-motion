import React from "react";
import { asset, src } from "./assets";
import { device, type Rect, type ScreenSource } from "./devices";
import { Footage } from "./Footage";
import { StableImg } from "./StableImg";
import { Device3D, type Device3DOwnProps } from "./Device3D";

export { device, type DeviceRecord, type ScreenSource } from "./devices";

// Device: the app's real screen inside a real-looking phone, by catalog id (kind "device").
//
//   <Device model="iphone-17-pro-max" color="silver" width={560} x={540} y={980}>
//     <Footage id="footage.emma.scan-roll.v1" />
//   </Device>
//   <Device model="iphone-17-pro-max" screen={{ id: "screenshot.emma.wardrobe-top.v1" }} />
//   <Device variant="3d" color="graphite" screen={{ id: "footage.emma.scan-roll.v1" }} rotation={{ y: -18 }} />
//
// Two variants (decisions/0012-device-frames.md):
//  - "bezel" (default): Apple's official Product Bezel PNG, AS IS and straight on. Apple's rules allow
//    only pan (x, y), zoom (scale, width) and fades (opacity), so that is all this variant takes: no
//    rotation, no shadow, nothing drawn over the device. Children are masked to the display.
//  - "3d": Curate's own generic phone (motion/Device3D.tsx, three.js): rotation, camera, shadow and
//    reflections. Apple forbids 3D renderings of its products, so there is no 3D iPhone.
// Frame-pure: everything comes from props; animate them from useCurrentFrame() in the ad.
// PhoneFrame (the old drawn phone) stays for the ads already cut to it.

/** Fills its parent with a real app screen by id: footage plays (OffthreadVideo), screenshots stay still. */
export const DeviceScreen: React.FC<ScreenSource> = ({ id, from, rate }) =>
  asset(id).kind === "footage" ? (
    <Footage id={id} from={from} rate={rate} />
  ) : (
    <StableImg src={src(id)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
  );

type BezelLayoutIn = { model?: string; color?: string; width?: number; x?: number; y?: number; scale?: number };

/**
 * Where a bezel's phone and screen land on the canvas (px), for placing words or badges BESIDE it
 * (never on top: Apple's rule). Mirrors the transform <Device> applies.
 */
export const deviceLayout = ({ model = "iphone-17-pro-max", color = "silver", width = 560, x = 540, y = 960, scale = 1 }: BezelLayoutIn = {}) => {
  const d = device(model, color, "bezel");
  const body = d.body!;
  const k = (width / body.w) * scale;
  const ox = x - (body.x + body.w / 2) * k;
  const oy = y - (body.y + body.h / 2) * k;
  const at = (r: Rect) => ({ x: ox + r.x * k, y: oy + r.y * k, w: r.w * k, h: r.h * k });
  return { device: d, k, image: { x: ox, y: oy, w: d.dims!.w * k, h: d.dims!.h * k }, body: at(body), screen: { ...at(d.screen), r: d.screen.cornerRadius * k } };
};

export type BezelProps = {
  variant?: "bezel";
  /** iphone-17-pro-max (fits our 17 Pro Max captures exactly) or iphone-18-pro-max. */
  model?: string;
  /** silver, deep-blue, cosmic-orange (17); silver, black, burgundy, glacier (18). */
  color?: string;
  /** Width of the visible phone, px (the PNG's transparent margin is extra). */
  width?: number;
  /** Centre of the phone, px from the composition's left / top. Animate these to pan. */
  x?: number;
  y?: number;
  /** Zoom about the phone's centre. Pan + zoom only after a shot of the whole phone (Apple). */
  scale?: number;
  /** Fades are the only transition Apple allows on its devices. */
  opacity?: number;
  /** What the screen shows: an id, or children (fill the screen box: e.g. <Footage>). */
  screen?: ScreenSource;
  /** Behind the screen content (what shows while a video loads). */
  screenBackground?: string;
  children?: React.ReactNode;
};

const Bezel: React.FC<BezelProps> = ({ model = "iphone-17-pro-max", color = "silver", width = 560, x = 540, y = 960, scale = 1, opacity = 1, screen, screenBackground = "#000", children }) => {
  const d = device(model, color, "bezel");
  const body = d.body!;
  const s = d.screen;
  // laid out once at scale 1, then moved by a transform: transforms land on sub-pixels, so a slow pan or
  // push-in glides instead of stepping a whole pixel at a time (left/top snap). Animate x, y and scale, not width.
  const k = width / body.w;
  const cx = (body.x + body.w / 2) * k;
  const cy = (body.y + body.h / 2) * k;
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: d.dims!.w * k,
        height: d.dims!.h * k,
        opacity,
        transformOrigin: `${cx}px ${cy}px`,
        transform: `translate(${x - cx}px, ${y - cy}px) scale(${scale})`,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: s.x * k,
          top: s.y * k,
          width: s.w * k,
          height: s.h * k,
          borderRadius: s.cornerRadius * k,
          overflow: "hidden",
          isolation: "isolate",
          background: screenBackground,
        }}
      >
        {screen ? <DeviceScreen {...screen} /> : children}
      </div>
      {/* Apple's bezel, as is, on top: its frame hides the screen's corners, its island sits over the app's */}
      <StableImg src={src(d.id)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
    </div>
  );
};

export type DeviceProps = BezelProps | (Device3DOwnProps & { variant: "3d" });

export const Device: React.FC<DeviceProps> = (p) => {
  if (p.variant === "3d") {
    if (p.model && p.model.startsWith("iphone")) throw new Error(`Device: no 3D iPhone. Apple's marketing guidelines forbid 3D renderings of Apple products; use variant "bezel" for an iPhone, or the generic 3D phone (model "phone-generic").`);
    return <Device3D {...p} />;
  }
  return <Bezel {...p} />;
};
