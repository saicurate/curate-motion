import { findAssets } from "./assets";

// The device records (kind "device") that motion/Device.tsx and motion/Device3D.tsx draw. Shared here so
// neither component imports the other's module.

export type ScreenSource = {
  /** A footage.* or screenshot.* id (1320 x 2868). */
  id: string;
  /** footage: seconds into the clip at the Sequence's first frame. */
  from?: number;
  /** footage: playback speed. */
  rate?: number;
};

export type Rect = { x: number; y: number; w: number; h: number };
export type DeviceRecord = {
  id: string;
  maker: string;
  model: string;
  colour: string;
  variant: "bezel" | "3d";
  dims?: { w: number; h: number };
  body?: Rect;
  screen: Rect & { cornerRadius: number };
  island?: Rect;
  sizeMm?: { w: number; h: number; d: number };
  environment?: string;
  colourways?: Record<string, { frame: string; back: string; roughness: number }>;
  moves: string[];
  creditLine?: string;
};

/** The newest device record for a model (+ colour) and variant; throws with what does exist. */
export const device = (model: string, color?: string, variant: "bezel" | "3d" = "bezel"): DeviceRecord => {
  const all = findAssets<DeviceRecord>((e) => e.kind === "device" && e.asset.model === model && e.asset.variant === variant);
  if (!all.length) {
    const models = [...new Set(findAssets<DeviceRecord>((e) => e.kind === "device").map((e) => `${e.asset.model} (${e.asset.variant})`))];
    throw new Error(`No ${variant} device "${model}". In the catalog: ${models.join(", ") || "none"} (tools/catalog search --kind device).`);
  }
  // a 3d model is recoloured by the component, so any record of it will do
  const hit = variant === "3d" || !color ? all[0] : all.find((e) => e.asset.colour === color);
  if (!hit) throw new Error(`${model} has no colour "${color}". Colours: ${[...new Set(all.map((e) => e.asset.colour))].join(", ")}.`);
  return { ...hit.asset, id: hit.id };
};

