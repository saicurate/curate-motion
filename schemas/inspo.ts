// The inspo board's schema: one Markdown file per inspiration, inspo/<id>.md, with YAML front matter
// (validated here) and free notes as the body (tools/inspo breakdown adds a "Breakdown" section).
// Media (the video, image or screenshot itself) lives in the library as a `reference` asset: S3,
// licence "Third-party content, reference only", never shipped (RULES.md › 9).
import { z } from "zod";
import { AssetId } from "./asset.ts";

export const INSPO_KINDS = ["video", "image", "link", "audio", "app-screen", "ad", "other"] as const;
export const InspoKind = z.enum(INSPO_KINDS);

/**
 * Inspo id grammar:  inspo.<source>.<name>.v<N>
 *   source  where it's from, kebab-case: creator, competitor, founder, tiktok, curate…
 *   name    kebab-case, most general word first: pop-off-reel
 * e.g. inspo.creator.pop-off-reel.v1. Its media asset (if any) is reference.<source>.<name>.v<N>.
 * File: inspo/<id>.md
 */
export const INSPO_ID_RE = /^inspo\.([a-z0-9]+(?:-[a-z0-9]+)*)\.([a-z0-9]+(?:-[a-z0-9]+)*)\.v([1-9][0-9]*)$/;
export const InspoId = z.string().regex(INSPO_ID_RE, "inspo ids are inspo.<source>.<name>.v<N>, kebab-case");
export const parseInspoId = (id: string) => {
  const m = INSPO_ID_RE.exec(id);
  return m ? { source: m[1], name: m[2], version: Number(m[3]) } : null;
};
export const inspoPath = (id: string) => `inspo/${id}.md`;

const IsoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}(T[\d:.]+Z)?$/, "ISO date (YYYY-MM-DD or full UTC timestamp)");
const Tag = z.string().regex(/^[a-z0-9][a-z0-9:._-]*$/, "tags are lowercase, e.g. transition, type, colour:warm");
const Words = z.array(z.string().min(1)).default([]);

/** The craft to borrow, by kind, so agents can search "every whip-pan we liked". */
export const Techniques = z
  .strictObject({
    /** Transition names, kebab-case where possible: pop-out-return, match-cut, whip-pan, mask-through-subject. */
    transitions: Words,
    /** Rhythm: "a new look every 2 beats", "hook in 1 s", "129 BPM, cuts on the kick". */
    pacing: Words,
    /** Type: "condensed display, typed on behind the subject". */
    type: Words,
    /** Colour and grade: "cool grey plate so skin and clothes pop". */
    colour: Words,
    other: Words,
  })
  .default({ transitions: [], pacing: [], type: [], colour: [], other: [] });

export const InspoMeta = z
  .strictObject({
    id: InspoId,
    title: z.string().min(3),
    kind: InspoKind,
    /** Where it lives on the web (the original post, a site, a competitor's page). */
    url: z.url().optional(),
    /** The media in the library: a `reference` asset id (checked: must exist and be kind reference). */
    asset: AssetId.optional(),
    addedBy: z.string().min(2),
    addedAt: IsoDate,
    /** What we love about it, one point per item, in plain words. */
    love: Words,
    techniques: Techniques,
    /** Which concepts or ads it should feed: "concept:c14", "ad:pop-out", or free words. */
    useFor: Words,
    tags: z.array(Tag).default([]),
    status: z.enum(["active", "archived"]).default("active"),
    /** Other pages about it (a breakdown, a thread). */
    links: z.array(z.strictObject({ label: z.string().min(1), url: z.url() })).default([]),
    /** Who sent it / how it reached us, e.g. "the founder, on WhatsApp". */
    source: z.string().optional(),
  })
  .refine((x) => !!x.url || !!x.asset, { message: "an inspo needs a url, a media asset, or both", path: ["url"] });
export type InspoMeta = z.infer<typeof InspoMeta>;

/** catalog/inspo.json: every inspo entry with its notes. Generated; never hand-edited. */
export const InspoIndex = z.object({
  about: z.string(),
  count: z.number().int(),
  counts: z.object({ kind: z.record(z.string(), z.number()), status: z.record(z.string(), z.number()) }),
  inspo: z.array(
    z.object({
      id: InspoId,
      title: z.string(),
      kind: InspoKind,
      status: z.enum(["active", "archived"]),
      url: z.string().nullable(),
      asset: z.string().nullable(),
      /** The asset's files (paths under library/), for thumbnails. */
      files: z.array(z.object({ role: z.string(), path: z.string(), mime: z.string().nullable() })),
      /** An image to show on a card (path under library/): the asset's thumb or image, else the breakdown's contact sheet. */
      cover: z.string().nullable(),
      love: z.array(z.string()),
      techniques: z.record(z.string(), z.array(z.string())),
      useFor: z.array(z.string()),
      tags: z.array(z.string()),
      links: z.array(z.object({ label: z.string(), url: z.string() })),
      addedBy: z.string(),
      addedAt: z.string(),
      source: z.string().nullable(),
      hasBreakdown: z.boolean(),
      path: z.string(),
      body: z.string(),
    }),
  ),
});
export type InspoIndex = z.infer<typeof InspoIndex>;
