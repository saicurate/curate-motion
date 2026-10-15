// The asset catalog's schema: ONE zod schema per asset kind, all sharing a base.
// tools/catalog.ts validates every library/**/manifest.json against these and writes
// the JSON Schemas to catalog/schemas/ (z.toJSONSchema), so non-TypeScript tools can use them too.
//
// This file must import nothing but zod: it is loaded both by Node (tools/, with native
// type stripping) and by the Remotion bundler (motion/, ads/).
import { z } from "zod";

// ---------------------------------------------------------------- ids and names

/** kebab-case segment: lowercase letters, digits, single hyphens. */
export const SEGMENT = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Asset id grammar:  <kind>.<scope>.<name>.v<N>
 *   kind   one of KINDS                      garment
 *   scope  persona, emotion, group or source  emma | excited | mixkit | curate
 *   name   kebab-case, most general word first  jeans-straight-light-wash
 *   vN     version, starts at 1, never reused   v1
 * e.g. garment.emma.jeans-straight-light-wash.v1, zee.excited.loop.v1, music.mixkit.cat-walk-arulo.v1
 */
export const ID_RE = /^([a-z]+)\.([a-z0-9]+(?:-[a-z0-9]+)*)\.([a-z0-9]+(?:-[a-z0-9]+)*)\.v([1-9][0-9]*)$/;

export const KINDS = [
  "brand", // logo marks, splash, brand stills
  "font", // typefaces (Geist)
  "zee", // Zee frame sequences: one asset per emotion part (intro / loop / outro)
  "face", // a persona's face references
  "selfie", // a persona's selfies
  "tryon", // a persona's try-on results
  "garment", // a persona's wardrobe pieces (product shot + cutout)
  "photo", // a persona's camera-roll photos
  "stock", // licensed stock photos / video (Unsplash, Pexels)
  "footage", // screen recordings of the app, by moment and app build
  "music", // tracks, with BPM and a beat map
  "sfx", // sound effects
  "reference", // reference reels and breakdowns (never shipped in an ad)
] as const;
export const Kind = z.enum(KINDS);
export type Kind = z.infer<typeof Kind>;

export const AssetId = z
  .string()
  .regex(ID_RE, "id must be <kind>.<scope>.<name>.v<N>, kebab-case (see AGENTS.md › Naming)");
export type AssetId = z.infer<typeof AssetId>;

export const parseId = (id: string) => {
  const m = ID_RE.exec(id);
  if (!m) return null;
  return { kind: m[1], scope: m[2], name: m[3], version: Number(m[4]) };
};

/** A path relative to library/. Its S3 key is `library/<path>` (see ARCHITECTURE.md › S3). */
export const LibPath = z
  .string()
  .min(3)
  .refine((p) => !p.startsWith("/") && !p.split("/").includes("..") && !p.includes("\\"), "path must be relative to library/, no '..'")
  .refine((p) => p.split("/").every((s) => /^[a-z0-9][a-z0-9.\-_]*$/.test(s)), "path segments are lowercase kebab-case (digits, '.', '-', '_' allowed)");

const Sha256 = z.string().regex(/^[a-f0-9]{64}$/, "sha256 is 64 lowercase hex chars");
const IsoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}(T[\d:.]+Z)?$/, "ISO date (YYYY-MM-DD or full UTC timestamp)");

// ---------------------------------------------------------------- shared parts

export const FileRef = z.object({
  /** original = the master; cutout = background removed; thumb = small preview; frame = one frame of a sequence; proof = licence proof. */
  role: z.enum(["original", "cutout", "thumb", "frame", "proof", "stem"]).default("original"),
  path: LibPath,
  sha256: Sha256,
  bytes: z.number().int().positive(),
  mime: z.string().optional(),
});
export type FileRef = z.infer<typeof FileRef>;

/** A frame sequence stored as numbered files: <dir>/0001.webp … <dir>/<count>.webp. */
export const FrameSeq = z.object({
  dir: LibPath,
  pattern: z.string().default("%04d.webp"),
  count: z.number().int().positive(),
  fps: z.number().positive(),
  /** sha256 over the frames' "<sha256>  <name>\n" lines, sorted by name: one hash for the whole folder. */
  treeSha256: Sha256,
  /** Total bytes of all frames. */
  bytes: z.number().int().positive(),
});

export const Licence = z.object({
  /** e.g. "Mixkit Stock Music Free License", "Unsplash License", "SIL OFL 1.1", "Curate original", "AI-generated (Curate-owned)". */
  name: z.string().min(3),
  url: z.url().optional(),
  commercial: z.boolean(),
  attributionRequired: z.boolean().default(false),
  attribution: z.string().optional(),
  /** Channels or uses the licence forbids, e.g. "tv-broadcast", "content-id", "music-only-remix". */
  restrictions: z.array(z.string()).default([]),
  /** Where the proof lives (a page snapshot in library/, or a URL), and when it was checked. */
  proof: z.string().optional(),
  checkedAt: IsoDate,
});
export type Licence = z.infer<typeof Licence>;

export const Source = z.object({
  type: z.enum(["generated", "stock", "captured", "original", "drawn", "rendered", "derived"]),
  /** Model for generated assets, e.g. "gemini-nano-banana-2.1"; never a secret. */
  model: z.string().optional(),
  /** Prompt file or short prompt note (generated assets). */
  prompt: z.string().optional(),
  author: z.string().optional(),
  url: z.string().optional(),
  /** For derived assets: the asset id(s) it was made from. */
  from: z.array(AssetId).default([]),
  tool: z.string().optional(),
});

export const Cost = z.object({
  usd: z.number().nonnegative(),
  calls: z.number().int().nonnegative().default(0),
  note: z.string().optional(),
});

export const CreatedBy = z.object({
  /** "agent" or "human". */
  type: z.enum(["agent", "human"]),
  /** Agent/tool name ("claude-code", "cursor", "codex") or person's first name. */
  name: z.string(),
  /** Session / task note, optional. */
  note: z.string().optional(),
  at: IsoDate,
});

/** draft = usable in tests only; approved = safe in ads (immutable from here on); retired = never use in new ads. */
export const Status = z.enum(["draft", "approved", "retired"]);

export const Tags = z
  .object({
    persona: z.string().regex(SEGMENT).optional(),
    moment: z.string().regex(SEGMENT).optional(),
    mood: z.array(z.string()).default([]),
    colour: z.array(z.string()).default([]),
    season: z.array(z.enum(["spring", "summer", "fall", "winter"])).default([]),
    free: z.array(z.string()).default([]),
  })
  .default({ mood: [], colour: [], season: [], free: [] });

const Dim = z.object({ w: z.number().int().positive(), h: z.number().int().positive() });

const base = {
  id: AssetId,
  title: z.string().min(2),
  description: z.string().optional(),
  files: z.array(FileRef).min(1),
  tags: Tags,
  source: Source,
  licence: Licence,
  cost: Cost.default({ usd: 0, calls: 0 }),
  createdBy: CreatedBy,
  status: Status,
  approvedBy: z.string().optional(),
  approvedAt: IsoDate.optional(),
  /** The id this one replaces (a new version of an approved asset). */
  supersedes: AssetId.optional(),
  /** True for anything an AI model made or altered (drives the platform "AI-generated" label). */
  aiGenerated: z.boolean(),
};

// ---------------------------------------------------------------- one schema per kind

export const BrandAsset = z.object({ ...base, kind: z.literal("brand"), dims: Dim.optional() });
export const FontAsset = z.object({ ...base, kind: z.literal("font"), family: z.string(), weight: z.number().int(), style: z.enum(["normal", "italic"]).default("normal") });
export const ZeeAsset = z.object({
  ...base,
  kind: z.literal("zee"),
  emotion: z.enum(["cheer", "curious", "excited", "focused", "happy", "hello", "idea", "idle", "listening", "love", "sleepy", "thinking"]),
  part: z.enum(["intro", "loop", "outro", "still"]),
  pack: z.string(), // e.g. "zee-sharp-v1"
  dims: Dim,
  frames: FrameSeq.optional(), // absent for a still
});
export const FaceAsset = z.object({ ...base, kind: z.literal("face"), dims: Dim, picked: z.boolean().default(false) });
export const SelfieAsset = z.object({ ...base, kind: z.literal("selfie"), dims: Dim, wearing: z.array(AssetId).default([]) });
export const TryonAsset = z.object({ ...base, kind: z.literal("tryon"), dims: Dim, wearing: z.array(AssetId).min(1), basePhoto: AssetId.optional() });
export const GarmentAsset = z.object({
  ...base,
  kind: z.literal("garment"),
  dims: Dim,
  category: z.enum(["top", "bottom", "dress", "outerwear", "footwear", "accessory", "bag", "jewellery", "activewear"]),
  /** Plain words, as a person would say them; no brand names, no prices. */
  name: z.string(),
  /** Pixel size of the cutout file (trimmed to the piece), when there is one. */
  cutoutDims: Dim.optional(),
});
export const PhotoAsset = z.object({ ...base, kind: z.literal("photo"), dims: Dim, place: z.string().optional(), wearing: z.array(AssetId).default([]), framing: z.string().optional() });
export const StockAsset = z.object({ ...base, kind: z.literal("stock"), dims: Dim, shows: z.string(), media: z.enum(["image", "video"]).default("image"), durationSec: z.number().positive().optional() });
export const FootageAsset = z.object({
  ...base,
  kind: z.literal("footage"),
  dims: Dim,
  durationSec: z.number().positive(),
  fps: z.number().positive(),
  /** The app moment, kebab-case: two-taps-closet, photo-scan, ask-zee, try-on, wardrobe-add… */
  moment: z.string().regex(SEGMENT),
  app: z.object({
    build: z.number().int().positive(), // TestFlight / App Store build number
    version: z.string(), // marketing version, e.g. "1.5.0"
    commit: z.string().optional(), // curate-app commit the build came from
    env: z.enum(["prod", "staging", "local"]),
  }),
  account: z.string().regex(SEGMENT), // persona whose account was used, e.g. "emma"
  device: z.string(), // "iPhone 17 Pro Max (simulator)"
  cleanStatusBar: z.boolean(),
  /** Named points in the clip, seconds from its start: { "tap-1": 1.2, "closet-lands": 3.4 }. */
  marks: z.record(z.string(), z.number().nonnegative()).default({}),
});
export const MusicAsset = z.object({
  ...base,
  kind: z.literal("music"),
  durationSec: z.number().positive(),
  /** Tempo. Absent until measured (tools/beats.py); BeatClock refuses a track without it. */
  bpm: z.number().positive().optional(),
  /** First downbeat, seconds from the start of the file. */
  offsetSec: z.number().nonnegative().default(0),
  /** measured = tools/beats.py or by ear and checked in a cut; estimated = from the store page. */
  beatGrid: z.enum(["measured", "estimated", "unknown"]),
  beatsPerBar: z.number().int().positive().default(4),
  /** Named sections, seconds from the start: { "drop": 30.0, "breakdown": 24.0 }. */
  sections: z.record(z.string(), z.number().nonnegative()).default({}),
  /** Optional explicit beat times (seconds) when the grid drifts; else derived from bpm + offset. */
  beats: z.array(z.number().nonnegative()).optional(),
  vibe: z.string().optional(),
});
export const SfxAsset = z.object({ ...base, kind: z.literal("sfx"), durationSec: z.number().positive() });
export const ReferenceAsset = z.object({ ...base, kind: z.literal("reference"), notes: z.string().optional(), durationSec: z.number().positive().optional() });

export const KIND_SCHEMAS = {
  brand: BrandAsset,
  font: FontAsset,
  zee: ZeeAsset,
  face: FaceAsset,
  selfie: SelfieAsset,
  tryon: TryonAsset,
  garment: GarmentAsset,
  photo: PhotoAsset,
  stock: StockAsset,
  footage: FootageAsset,
  music: MusicAsset,
  sfx: SfxAsset,
  reference: ReferenceAsset,
} as const;

export const Asset = z
  .discriminatedUnion("kind", [
    BrandAsset,
    FontAsset,
    ZeeAsset,
    FaceAsset,
    SelfieAsset,
    TryonAsset,
    GarmentAsset,
    PhotoAsset,
    StockAsset,
    FootageAsset,
    MusicAsset,
    SfxAsset,
    ReferenceAsset,
  ])
  .superRefine((a, ctx) => {
    const p = parseId(a.id);
    if (p && p.kind !== a.kind) ctx.addIssue({ code: "custom", message: `id kind "${p.kind}" ≠ kind "${a.kind}"`, path: ["id"] });
    if (a.status === "approved" && (!a.approvedBy || !a.approvedAt)) {
      ctx.addIssue({ code: "custom", message: "approved assets need approvedBy and approvedAt", path: ["status"] });
    }
    if (!a.licence.commercial && a.kind !== "reference") {
      ctx.addIssue({ code: "custom", message: "only references may have a non-commercial licence (they never ship)", path: ["licence", "commercial"] });
    }
    if (!a.aiGenerated && a.source.type === "generated") {
      ctx.addIssue({ code: "custom", message: "generated assets must set aiGenerated: true", path: ["aiGenerated"] });
    }
  });
export type Asset = z.infer<typeof Asset>;

/** One manifest per library folder: library/<folder>/manifest.json. */
export const Manifest = z.object({
  $schema: z.string().optional(),
  /** What this folder holds, one line. */
  about: z.string(),
  assets: z.array(Asset),
});
export type Manifest = z.infer<typeof Manifest>;

/** catalog/index.json: every asset, flattened, plus where its files live in S3. Generated; never hand-edited. */
export const CatalogEntry = z.object({
  id: AssetId,
  kind: Kind,
  title: z.string(),
  status: Status,
  manifest: z.string(),
  files: z.array(FileRef.extend({ s3Key: z.string() })),
  tags: z.array(z.string()),
  licence: z.string(),
  aiGenerated: z.boolean(),
  /** The full asset record. */
  asset: z.record(z.string(), z.unknown()),
});
export const CatalogIndex = z.object({
  generatedAt: z.string(),
  bucket: z.string(),
  counts: z.record(z.string(), z.number()),
  assets: z.array(CatalogEntry),
});
export type CatalogIndex = z.infer<typeof CatalogIndex>;
