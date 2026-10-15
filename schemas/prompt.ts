// The prompt library's schema: one Markdown file per prompt, prompts/<area>/<name>.v<N>.md, with
// YAML front matter (validated here) and the prompt text itself as the body. tools/prompts reads and
// writes them; tools/catalog build indexes them into catalog/prompts.json; validate checks every link.
//
// Imports nothing but zod and ./asset.ts (Node and the Remotion bundle can both load it).
import { z } from "zod";
import { AssetId } from "./asset.ts";

/** What a prompt is for. One of these is the second segment of its id. */
export const PROMPT_AREAS = [
  "image-gen", // image models (Nano Banana / Gemini image, …)
  "video-gen", // video models
  "voice", // TTS style instructions, voice direction
  "music", // music generation or music briefs
  "copy", // on-screen words, captions, scripts
  "motion-brief", // what a video / ad / concept should be
  "agent-brief", // a brief handed to an AI agent (Claude, Cursor, Codex…) to do a job
  "research", // "read this", "analyse that"
  "other",
] as const;
export const PromptArea = z.enum(PROMPT_AREAS);
export type PromptArea = z.infer<typeof PromptArea>;

/**
 * Prompt id grammar:  prompt.<area>.<name>.v<N>
 *   area  one of PROMPT_AREAS                image-gen
 *   name  kebab-case, most general word first  garment-product-shot
 *   vN    version from 1; a changed prompt TEXT is a new version (tools/prompts revise)
 * e.g. prompt.image-gen.garment-product-shot.v1, prompt.agent-brief.emma-assets.v1
 * File: prompts/<area>/<name>.v<N>.md
 */
export const PROMPT_ID_RE = new RegExp(`^prompt\\.(${PROMPT_AREAS.join("|")})\\.([a-z0-9]+(?:-[a-z0-9]+)*)\\.v([1-9][0-9]*)$`);
export const PromptId = z.string().regex(PROMPT_ID_RE, "prompt ids are prompt.<area>.<name>.v<N> (area one of " + PROMPT_AREAS.join(", ") + ")");
export type PromptId = z.infer<typeof PromptId>;

export const parsePromptId = (id: string) => {
  const m = PROMPT_ID_RE.exec(id);
  return m ? { area: m[1] as PromptArea, name: m[2], version: Number(m[3]) } : null;
};
export const promptPath = (id: string) => {
  const p = parsePromptId(id);
  if (!p) throw new Error(`not a prompt id: ${id}`);
  return `prompts/${p.area}/${p.name}.v${p.version}.md`;
};

/** Who wrote the WORDS: the founder, an agent (agent:<name>, e.g. agent:main-session), or someone else (other / other:<who>). */
export const Author = z
  .string()
  .regex(/^(founder|agent:[a-z0-9][a-z0-9._-]*|other(:[^\n]{1,60})?)$/, "author is founder, agent:<name> (lowercase) or other[:<who>]");

/** Did it work? untested until someone used it and said. */
export const OUTCOMES = ["worked", "didn't", "mixed", "untested"] as const;
export const Outcome = z.enum(OUTCOMES);
export type Outcome = z.infer<typeof Outcome>;

const IsoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}(T[\d:.]+Z)?$/, "ISO date (YYYY-MM-DD or full UTC timestamp)");
const Tag = z.string().regex(/^[a-z0-9][a-z0-9:._-]*$/, "tags are lowercase, e.g. persona:emma, logo-free, hero");

/** The front matter of prompts/<area>/<name>.v<N>.md. Strict: an unknown key is an error (catches typos). */
export const PromptMeta = z
  .strictObject({
    id: PromptId,
    title: z.string().min(3),
    author: Author,
    area: PromptArea,
    /** The model or tool it was written for: "Nano Banana Pro (gemini-3-pro-image)", "gpt-4o-mini-tts", "Claude agent", "Remotion". */
    target: z.string().min(2),
    /** What went in besides the text: asset ids (checked) or free refs ("persona.md", "a photo of the founder's closet"). */
    inputs: z.array(z.string().min(1)).default([]),
    outcome: Outcome,
    /** 1–5 stars; absent until rated (tools/prompts rate). */
    rating: z.number().int().min(1).max(5).nullable().optional(),
    /** Library asset ids this prompt produced (checked; the asset's source.promptId points back). */
    outputs: z.array(AssetId).default([]),
    /** What made it work or fail, in a sentence or two. Required for didn't / mixed. */
    why: z.string().optional(),
    tags: z.array(Tag).default([]),
    /** Prompts it was mixed or remixed from (hybrids; tools/prompts remix), or the version it revises. */
    parents: z.array(PromptId).default([]),
    createdAt: IsoDate,
    /** One entry per use (tools/prompts use). */
    usedAt: z.array(IsoDate).default([]),
    /** True when the body is a template with {placeholders}; its filled-in children list it as a parent. */
    template: z.boolean().default(false),
    /** Where it came from: a script, a session, a file. Never a secret. */
    source: z.string().optional(),
    /** What running it cost, all uses so far (USD). */
    costUsd: z.number().nonnegative().optional(),
    /** Who filed it (may differ from the author of the words). */
    addedBy: z.string().optional(),
  })
  .superRefine((p, ctx) => {
    const id = parsePromptId(p.id);
    if (id && id.area !== p.area) ctx.addIssue({ code: "custom", message: `id area "${id.area}" ≠ area "${p.area}"`, path: ["area"] });
    if (p.parents.includes(p.id)) ctx.addIssue({ code: "custom", message: "a prompt can't be its own parent", path: ["parents"] });
    if ((p.outcome === "didn't" || p.outcome === "mixed") && !p.why?.trim()) ctx.addIssue({ code: "custom", message: `outcome "${p.outcome}" needs a why (what went wrong), so nobody repeats it`, path: ["why"] });
  });
export type PromptMeta = z.infer<typeof PromptMeta>;

/** catalog/prompts.json: every prompt, flattened, with its text. Generated by tools/catalog build (or tools/prompts build); never hand-edited. */
export const PromptIndexEntry = z.object({
  id: PromptId,
  title: z.string(),
  author: z.string(),
  area: PromptArea,
  target: z.string(),
  outcome: Outcome,
  rating: z.number().nullable(),
  tags: z.array(z.string()),
  inputs: z.array(z.string()),
  outputs: z.array(z.string()),
  parents: z.array(z.string()),
  /** Prompts that list this one as a parent. */
  children: z.array(z.string()),
  why: z.string().nullable(),
  template: z.boolean(),
  createdAt: z.string(),
  useCount: z.number().int(),
  lastUsedAt: z.string().nullable(),
  costUsd: z.number().nullable(),
  source: z.string().nullable(),
  path: z.string(),
  body: z.string(),
});
export const PromptIndex = z.object({
  about: z.string(),
  count: z.number().int(),
  counts: z.object({ area: z.record(z.string(), z.number()), outcome: z.record(z.string(), z.number()), author: z.record(z.string(), z.number()) }),
  prompts: z.array(PromptIndexEntry),
});
export type PromptIndex = z.infer<typeof PromptIndex>;

