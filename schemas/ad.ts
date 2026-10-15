// ads/<ad-id>/ad.json: what an ad is, in data, so any agent can read or reuse it without the code.
// Also the format and length presets every ad renders to. Imports only zod (see asset.ts).
import { z } from "zod";
import { AssetId, SEGMENT } from "./asset.ts";

/** Output frames. App Store previews: 886x1920 (6.9"/6.5" iPhone) and 1200x1600 (13" iPad), 15–30 s, 30 fps. */
export const FORMATS = {
  "9x16": { width: 1080, height: 1920, note: "TikTok, Reels, Shorts, Stories" },
  "4x5": { width: 1080, height: 1350, note: "Instagram / Facebook feed" },
  "1x1": { width: 1080, height: 1080, note: "Square feed, X, LinkedIn" },
  "16x9": { width: 1920, height: 1080, note: "YouTube, website hero" },
  "appstore-iphone": { width: 886, height: 1920, note: "App Store preview, iPhone 6.9\" and 6.5\" (15–30 s)" },
  "appstore-ipad": { width: 1200, height: 1600, note: "App Store preview, iPad 13\" (15–30 s)" },
} as const;
export type FormatId = keyof typeof FORMATS;
export const FormatId = z.enum(Object.keys(FORMATS) as [FormatId, ...FormatId[]]);

/** Length variants, seconds. 90 and 120 are the long explainer. */
export const LENGTHS = [6, 15, 30, 60, 90, 120] as const;
export type LengthSec = (typeof LENGTHS)[number];

export const CHANNELS = ["tiktok", "reels", "shorts", "meta-feed", "youtube", "appstore", "website", "x"] as const;
export const Channel = z.enum(CHANNELS);

/** Which format each channel renders to, by default. */
export const CHANNEL_FORMAT: Record<(typeof CHANNELS)[number], FormatId> = {
  tiktok: "9x16",
  reels: "9x16",
  shorts: "9x16",
  "meta-feed": "4x5",
  youtube: "16x9",
  appstore: "appstore-iphone",
  website: "16x9",
  x: "1x1",
};

export const AdStatus = z.enum(["idea", "draft", "review", "approved", "live", "retired"]);

export const AdSpec = z
  .object({
    $schema: z.string().optional(),
    id: z.string().regex(SEGMENT, "ad ids are kebab-case, e.g. meet-zee or two-taps-closet"),
    title: z.string(),
    /** One paragraph: who it is for, the single idea, the hook. */
    brief: z.string(),
    hook: z.string().optional(),
    channels: z.array(Channel).min(1),
    formats: z.array(FormatId).min(1),
    lengths: z.array(z.number().refine((n) => (LENGTHS as readonly number[]).includes(n), "length must be one of 6/15/30/60/90/120")).min(1),
    fps: z.literal(30).default(30),
    /** The music asset id. */
    track: AssetId,
    /** Every asset id the ad uses (the code may only use ids listed here; tools/catalog validate checks they exist and aren't retired). */
    assets: z.array(AssetId),
    /** The reusable motion/ components it is built from (for search; informational). */
    components: z.array(z.string()).default([]),
    status: AdStatus,
    approvedBy: z.string().optional(),
    approvedAt: z.string().optional(),
    /** Platform notes: the AI-generated label, App Store constraints, etc. */
    disclosures: z.array(z.string()).default([]),
    createdBy: z.object({ type: z.enum(["agent", "human"]), name: z.string(), at: z.string() }),
    notes: z.string().optional(),
  })
  .superRefine((a, ctx) => {
    if ((a.status === "approved" || a.status === "live") && (!a.approvedBy || !a.approvedAt)) {
      ctx.addIssue({ code: "custom", message: "approved/live ads need approvedBy and approvedAt", path: ["status"] });
    }
    if (a.formats.some((f) => f.startsWith("appstore")) && a.lengths.some((l) => l < 15 || l > 30)) {
      ctx.addIssue({ code: "custom", message: "App Store previews must be 15–30 s: render appstore formats only at 15 or 30", path: ["lengths"] });
    }
    if (!a.assets.includes(a.track)) ctx.addIssue({ code: "custom", message: "list the track in assets too", path: ["assets"] });
  });
export type AdSpec = z.infer<typeof AdSpec>;

/** Every composition id is <ad-id>--<format>--<length>s, e.g. meet-zee--9x16--15s. */
export const compositionId = (ad: string, format: FormatId, length: number) => `${ad}--${format}--${length}s`;

/** renders/<ad>/<channel>/<length>s/<ad>_<channel>_<format>_<length>s_v<N>.mp4 */
export const renderPath = (ad: string, channel: string, format: FormatId, length: number, v: number) =>
  `renders/${ad}/${channel}/${length}s/${ad}_${channel}_${format}_${length}s_v${v}.mp4`;
