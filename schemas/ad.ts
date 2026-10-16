// ads/<ad-id>/ad.json: what an ad is, in data, so any agent can read or reuse it without the code.
// Also the format and length presets every ad renders to. Imports only zod (see asset.ts).
import { z } from "zod";
import { AssetId, SEGMENT } from "./asset.ts";
import { VoiceOverride } from "./voice.ts";

/** Output frames. App Store previews: 886x1920 (6.9"/6.5" iPhone) and 1200x1600 (13" iPad), 15–30 s, 30 fps (always: Root.tsx). */
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

/**
 * The studio gates (decisions/0011, proposed; .claude/skills/motion-reel/SKILL.md):
 * G1 assets approved · G2 style guide + shot list (FOUNDER) · G3 stills for every shot, critiqued
 * (FOUNDER) · G4 960×540 animatic, placeholder audio · G5 full pass, polish, sound · G6 formats,
 * loop check, poster frame, README. A gate opens only when the one before is approved.
 */
export const GATES = ["G1", "G2", "G3", "G4", "G5", "G6"] as const;
export const FOUNDER_GATES = ["G2", "G3"] as const;
export const GateStatus = z.enum(["pending", "review", "approved", "skipped"]);
export const Gates = z.object(Object.fromEntries(GATES.map((g) => [g, GateStatus])) as Record<(typeof GATES)[number], typeof GateStatus>);
export const GateEvent = z.object({
  gate: z.enum(GATES),
  status: GateStatus,
  by: z.string(),
  byType: z.enum(["agent", "human"]),
  at: z.string(),
  note: z.string().optional(),
});

/** Frame rates. New ads are 60 (the render contract); App Store previews always render at 30. */
export const FPS = [24, 30, 60] as const;

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
    /** 60 for new ads (decisions/0011); older ads are 30. App Store formats always render at 30 (Root.tsx). */
    fps: z.union([z.literal(24), z.literal(30), z.literal(60)]).default(30),
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
    /** Voiceover override for this ad (config/voice.json is the default; tools/render --voice beats both). Words: ads/<ad>/script.json. */
    voice: VoiceOverride.optional(),
    createdBy: z.object({ type: z.enum(["agent", "human"]), name: z.string(), at: z.string() }),
    notes: z.string().optional(),
    /** Studio-process ads (made with the motion-reel skill): where it stands at each gate. */
    gates: Gates.optional(),
    /** Who moved each gate, when. G2 and G3 need a human (the founder) to approve. */
    gateLog: z.array(GateEvent).default([]),
  })
  .superRefine((a, ctx) => {
    if ((a.status === "approved" || a.status === "live") && (!a.approvedBy || !a.approvedAt)) {
      ctx.addIssue({ code: "custom", message: "approved/live ads need approvedBy and approvedAt", path: ["status"] });
    }
    if (a.formats.some((f) => f.startsWith("appstore")) && a.lengths.some((l) => l < 15 || l > 30)) {
      ctx.addIssue({ code: "custom", message: "App Store previews must be 15–30 s: render appstore formats only at 15 or 30", path: ["lengths"] });
    }
    if (!a.assets.includes(a.track)) ctx.addIssue({ code: "custom", message: "list the track in assets too", path: ["assets"] });
    if (a.gates) {
      const g = a.gates;
      GATES.forEach((id, i) => {
        if (i > 0 && g[id] !== "pending" && !["approved", "skipped"].includes(g[GATES[i - 1]]))
          ctx.addIssue({ code: "custom", message: `${id} is ${g[id]} but ${GATES[i - 1]} is ${g[GATES[i - 1]]}: a gate opens only when the one before is approved`, path: ["gates", id] });
      });
      for (const id of FOUNDER_GATES) {
        if (g[id] === "approved" && !a.gateLog.some((e) => e.gate === id && e.status === "approved" && e.byType === "human"))
          ctx.addIssue({ code: "custom", message: `${id} is approved, but only the founder approves ${id}: add a gateLog entry { gate: "${id}", status: "approved", byType: "human", by, at }`, path: ["gates", id] });
        if (g[id] === "skipped") ctx.addIssue({ code: "custom", message: `${id} can't be skipped (the founder sees it)`, path: ["gates", id] });
      }
      if ((a.status === "approved" || a.status === "live") && GATES.some((id) => !["approved", "skipped"].includes(g[id])))
        ctx.addIssue({ code: "custom", message: `${a.status} ad with gates still open`, path: ["gates"] });
      if (a.fps !== 60) ctx.addIssue({ code: "custom", message: "studio ads render at 60 fps (the render contract, decisions/0011)", path: ["fps"] });
    }
  });
export type AdSpec = z.infer<typeof AdSpec>;

/** Every composition id is <ad-id>--<format>--<length>s, e.g. meet-zee--9x16--15s. */
export const compositionId = (ad: string, format: FormatId, length: number) => `${ad}--${format}--${length}s`;

/** renders/<ad>/<channel>/<length>s/<ad>_<channel>_<format>_<length>s_v<N>.mp4 */
export const renderPath = (ad: string, channel: string, format: FormatId, length: number, v: number) =>
  `renders/${ad}/${channel}/${length}s/${ad}_${channel}_${format}_${length}s_v${v}.mp4`;

/** The fps a composition renders at: the ad's, except App Store previews (Apple takes 30 at most). */
export const fpsFor = (adFps: number, format: FormatId) => (format.startsWith("appstore") ? Math.min(30, adFps) : adFps);
