import { staticFile } from "remotion";
import INDEX from "../catalog/index.json";

// The ONLY way motion/ and ads/ reach media: by asset id, through catalog/index.json.
// Never call staticFile() with a raw path in an ad.

type FileEntry = { role: string; path: string; sha256: string; bytes: number; s3Key: string };
type Entry = { id: string; kind: string; title: string; status: string; files: FileEntry[]; asset: Record<string, unknown> };

const BY_ID = new Map<string, Entry>((INDEX.assets as unknown as Entry[]).map((a) => [a.id, a]));

/** The catalog record for an id. Throws on an unknown or retired id, so a typo fails the render, not the ad. */
export const asset = <T = Record<string, unknown>>(id: string): Entry & { asset: T } => {
  const e = BY_ID.get(id);
  if (!e) throw new Error(`Unknown asset id "${id}". Run: node tools/catalog.ts search … (see AGENTS.md)`);
  if (e.status === "retired") throw new Error(`Asset "${id}" is retired; use the id that supersedes it.`);
  return e as Entry & { asset: T };
};

export const has = (id: string) => BY_ID.has(id);

/** staticFile URL for one of an asset's files (default: the original; "cutout" for floating garments). */
export const src = (id: string, role: string = "original"): string => {
  const e = asset(id);
  const f = e.files.find((x) => x.role === role) ?? (role === "original" ? e.files[0] : undefined);
  if (!f) throw new Error(`Asset "${id}" has no "${role}" file.`);
  return staticFile(f.path);
};

type Seq = { dir: string; pattern: string; count: number; fps: number };

/** Frame n (0-based, wraps) of a frame-sequence asset (Zee clips). */
export const frameSrc = (id: string, n: number): string => {
  const f = asset<{ frames?: Seq }>(id).asset.frames;
  if (!f) throw new Error(`Asset "${id}" is not a frame sequence.`);
  const i = (((n % f.count) + f.count) % f.count) + 1;
  const name = f.pattern.replace(/%0(\d)d/, (_, w) => String(i).padStart(Number(w), "0"));
  return staticFile(`${f.dir.replace(/\/$/, "")}/${name}`);
};

export const frameCount = (id: string): number => asset<{ frames?: Seq }>(id).asset.frames?.count ?? 1;

/** Pixel size of an image-like asset. */
export const dims = (id: string): { w: number; h: number } => {
  const d = asset<{ dims?: { w: number; h: number } }>(id).asset.dims;
  if (!d) throw new Error(`Asset "${id}" has no dims.`);
  return d;
};

/** Every catalog record that passes `pred` (retired ones left out), newest version first within an id stem. */
export const findAssets = <T = Record<string, unknown>>(pred: (e: Entry & { asset: T }) => boolean): (Entry & { asset: T })[] =>
  [...BY_ID.values()]
    .filter((e) => e.status !== "retired")
    .filter((e) => pred(e as Entry & { asset: T }))
    .sort((a, b) => b.id.localeCompare(a.id, "en", { numeric: true })) as (Entry & { asset: T })[];
