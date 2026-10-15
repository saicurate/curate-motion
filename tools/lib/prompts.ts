// The prompt library's operations, shared by tools/prompts (CLI) and tools/library-ui (the
// Prompts tab). Files: prompts/<area>/<name>.v<N>.md (schemas/prompt.ts). Every write validates,
// refuses secrets, and refreshes catalog/prompts.json. Linking outputs also writes the asset's
// source.promptId (tools/lib/catalog.ts › setSourcePrompts), so the link holds both ways.
import { parseId as parseAssetId } from "../../schemas/asset.ts";
import { OUTCOMES, PROMPT_AREAS, parsePromptId, type Outcome, type PromptMeta } from "../../schemas/prompt.ts";
import { findPrompt, kebab, loadPrompts, nextPromptVersion, REMIX_MARK, writePromptFile, writePromptIndex, type Prompt } from "./boards.ts";
import { loadIndex, setSourcePrompts } from "./catalog.ts";
import { today } from "./core.ts";

type Rec = Record<string, unknown>;
const stamp = () => new Date().toISOString().replace(/\.\d+Z$/, "Z");

/** "didnt", "failed", "no" → didn't; "yes", "ok" → worked. Anything else must be one of OUTCOMES. */
export const normaliseOutcome = (s: string | undefined): Outcome | undefined => {
  if (s === undefined || s === "") return undefined;
  const v = s.trim().toLowerCase().replace(/[’`]/g, "'");
  const alias: Record<string, Outcome> = { didnt: "didn't", "did not": "didn't", failed: "didn't", fail: "didn't", no: "didn't", bad: "didn't", yes: "worked", ok: "worked", good: "worked", works: "worked", partly: "mixed", meh: "mixed" };
  const o = (alias[v] ?? v) as Outcome;
  if (!(OUTCOMES as readonly string[]).includes(o)) throw new Error(`outcome must be one of ${OUTCOMES.join(" | ")}`);
  return o;
};

export const normaliseRating = (r: unknown): number | null | undefined => {
  if (r === undefined || r === "") return undefined;
  if (r === null || r === 0 || r === "0" || r === "none") return null;
  const n = Number(r);
  if (!Number.isInteger(n) || n < 1 || n > 5) throw new Error("rating is a whole number from 1 to 5");
  return n;
};

const uniq = <T>(a: T[]) => [...new Set(a)];

export type AddPromptInput = {
  body: string;
  title: string;
  area: string;
  /** kebab-case, most general word first. Default: from the title. */
  name?: string;
  author: string;
  target: string;
  inputs?: string[];
  outputs?: string[];
  outcome?: string;
  rating?: unknown;
  why?: string;
  tags?: string[];
  parents?: string[];
  template?: boolean;
  source?: string;
  costUsd?: number;
  createdAt?: string;
  usedAt?: string[];
  addedBy?: string;
  /** Allow vN+1 when prompt.<area>.<name> already exists (revise / remix of the same name). */
  newVersion?: boolean;
  /** Also point each output asset's source.promptId here (default true). */
  linkAssets?: boolean;
};

/** Add one prompt: prompts/<area>/<name>.v<N>.md. Returns the written prompt. */
export const addPrompt = (inp: AddPromptInput): Prompt => {
  if (!(PROMPT_AREAS as readonly string[]).includes(inp.area)) throw new Error(`--area must be one of ${PROMPT_AREAS.join(", ")}`);
  if (!inp.title?.trim()) throw new Error("a prompt needs a --title");
  if (!inp.author) throw new Error("say who wrote the words: --author founder | agent:<name> | other");
  if (!inp.target) throw new Error('say what it was for: --target "Nano Banana Pro" | gpt-4o-mini-tts | "Claude agent" | Remotion …');
  const name = kebab(inp.name || inp.title);
  if (!name) throw new Error("--name must have letters or digits");
  const v = nextPromptVersion(inp.area, name);
  if (v > 1 && !inp.newVersion) throw new Error(`prompt.${inp.area}.${name}.v${v - 1} exists. For a changed text use: tools/prompts revise prompt.${inp.area}.${name}.v${v - 1} <file>; for a different prompt pick another --name.`);
  const meta: Rec = {
    id: `prompt.${inp.area}.${name}.v${v}`,
    title: inp.title.trim(),
    author: inp.author,
    area: inp.area,
    target: inp.target,
    outcome: normaliseOutcome(inp.outcome) ?? "untested",
    rating: normaliseRating(inp.rating) ?? undefined,
    why: inp.why?.trim() || undefined,
    inputs: uniq(inp.inputs ?? []),
    outputs: uniq(inp.outputs ?? []),
    parents: uniq(inp.parents ?? []),
    tags: uniq((inp.tags ?? []).map((t) => t.trim().toLowerCase().replace(/=/, ":")).filter(Boolean)),
    template: inp.template || undefined,
    createdAt: inp.createdAt ?? today(),
    usedAt: inp.usedAt ?? [],
    costUsd: inp.costUsd,
    source: inp.source,
    addedBy: inp.addedBy,
  };
  checkRefs(meta);
  const p = writePromptFile(meta, inp.body, { create: true });
  if (inp.linkAssets !== false && p.meta.outputs.length) linkAssets(p.meta.id, p.meta.outputs);
  writePromptIndex();
  return p;
};

/** Parents must exist; asset-id inputs/outputs must be in the catalog (checked again by validate). */
const checkRefs = (meta: Rec) => {
  const ids = new Set(loadIndex().assets.map((a) => a.id));
  for (const par of (meta.parents as string[]) ?? []) findPrompt(par);
  for (const x of (meta.outputs as string[]) ?? []) if (!ids.has(x)) throw new Error(`output ${x} is not in the catalog (tools/catalog search --text …)`);
  for (const x of (meta.inputs as string[]) ?? []) if (parseAssetId(x) && !ids.has(x)) throw new Error(`input ${x} looks like an asset id but is not in the catalog`);
};

/** Point assets that have no promptId yet at this prompt (never steals one already linked elsewhere unless force). */
const linkAssets = (promptId: string, assetIds: string[], force = false) => {
  const idx = new Map(loadIndex().assets.map((a) => [a.id, a]));
  const pairs: [string, string][] = [];
  for (const id of assetIds) {
    const cur = ((idx.get(id)?.asset.source as Rec | undefined)?.promptId as string | undefined) ?? null;
    if (cur === promptId) continue;
    if (cur && !force) continue;
    pairs.push([id, promptId]);
  }
  if (pairs.length) setSourcePrompts(pairs);
  return pairs.map(([a]) => a);
};

/** A changed text = a new version: same area/name/target/tags, parents [old], outcome untested. */
export const revisePrompt = (id: string, body: string, o: { title?: string; author?: string; by?: string; target?: string } = {}) => {
  const old = findPrompt(id);
  const p = parsePromptId(id)!;
  return addPrompt({
    body,
    title: o.title ?? old.meta.title,
    area: p.area,
    name: p.name,
    author: o.author ?? old.meta.author,
    target: o.target ?? old.meta.target,
    inputs: old.meta.inputs,
    tags: old.meta.tags,
    template: old.meta.template,
    parents: [id],
    addedBy: o.by,
    newVersion: true,
  });
};

/** Rate after use: stars, worked / didn't / mixed, and why. Metadata only; the text never changes. */
export const ratePrompt = (id: string, rating: unknown, o: { outcome?: string; why?: string } = {}) => {
  const p = findPrompt(id);
  const meta: Rec = { ...p.meta };
  const r = normaliseRating(rating);
  if (r !== undefined) meta.rating = r ?? undefined;
  const oc = normaliseOutcome(o.outcome);
  if (oc) meta.outcome = oc;
  if (o.why !== undefined) meta.why = o.why.trim() || undefined;
  const w = writePromptFile(meta, p.body);
  writePromptIndex();
  return { id, rating: w.meta.rating ?? null, outcome: w.meta.outcome, why: w.meta.why ?? null };
};

/** Log a use (a timestamp in usedAt), and optionally what it made (outputs, linked both ways). */
export const usePrompt = (id: string, o: { at?: string; outputs?: string[]; costUsd?: number } = {}) => {
  const p = findPrompt(id);
  const meta: Rec = { ...p.meta, usedAt: [...p.meta.usedAt, o.at ?? stamp()] };
  if (o.outputs?.length) meta.outputs = uniq([...p.meta.outputs, ...o.outputs]);
  if (o.costUsd) meta.costUsd = Math.round(((p.meta.costUsd ?? 0) + o.costUsd) * 1e6) / 1e6;
  checkRefs(meta);
  const w = writePromptFile(meta, p.body);
  if (o.outputs?.length) linkAssets(id, o.outputs);
  writePromptIndex();
  return { id, uses: w.meta.usedAt.length, outputs: w.meta.outputs.length };
};

/** Record that a prompt produced these assets (prompt.outputs + each asset's source.promptId). */
export const linkOutputs = (id: string, assetIds: string[], o: { force?: boolean } = {}) => {
  const p = findPrompt(id);
  const meta: Rec = { ...p.meta, outputs: uniq([...p.meta.outputs, ...assetIds]) };
  checkRefs(meta);
  writePromptFile(meta, p.body);
  const linked = linkAssets(id, assetIds, o.force);
  writePromptIndex();
  return { id, outputs: (meta.outputs as string[]).length, assetsPointed: linked };
};

/** The merged draft for a hybrid of 2+ prompts: parents set, bodies stacked under comment markers to edit. */
export const remixDraft = (ids: string[], o: { title?: string } = {}) => {
  if (uniq(ids).length < 2) throw new Error("remix needs two or more prompt ids");
  const ps = uniq(ids).map(findPrompt);
  const areas = uniq(ps.map((p) => p.meta.area));
  const stars = (r?: number | null) => (r ? ` · ${"★".repeat(r)}` : "");
  const body = [
    `${REMIX_MARK} merge the parts below into ONE prompt (keep what worked, drop what didn't), then delete these comment lines. -->`,
    ...ps.map((p) => `\n<!-- from ${p.meta.id} · ${p.meta.outcome}${stars(p.meta.rating)}${p.meta.why ? ` · why: ${p.meta.why.replace(/-->/g, "→").slice(0, 200)}` : ""} -->\n${p.body.trim()}\n`),
  ].join("\n");
  return {
    title: o.title ?? `Remix: ${ps.map((p) => p.meta.title).join(" + ")}`.slice(0, 120),
    area: areas.length === 1 ? areas[0] : ps[0].meta.area,
    target: ps[0].meta.target,
    parents: ps.map((p) => p.meta.id),
    inputs: uniq(ps.flatMap((p) => p.meta.inputs)),
    tags: uniq([...ps.flatMap((p) => p.meta.tags.filter((t) => t !== "template")), "remix"]),
    body,
  };
};

export const remixPrompts = (ids: string[], o: { title?: string; name?: string; area?: string; target?: string; author: string; by?: string; body?: string }) => {
  const d = remixDraft(ids, o);
  return addPrompt({ ...d, body: o.body ?? d.body, area: o.area ?? d.area, target: o.target ?? d.target, name: o.name, author: o.author, addedBy: o.by, outcome: "untested" });
};

export type PromptQuery = { area?: string; outcome?: string; tags?: string[]; minRating?: number; text?: string; author?: string; target?: string; template?: boolean };

/** Search the files (always current). Text matches every word against id, title, why, target, tags and the prompt text. */
export const searchPrompts = (q: PromptQuery): Prompt[] => {
  const { ok, errors } = loadPrompts();
  if (errors.length) throw new Error(errors.join("\n"));
  const oc = normaliseOutcome(q.outcome);
  const words = (q.text ?? "").toLowerCase().split(/\s+/).filter(Boolean);
  return ok
    .filter(({ meta: m, body }) => {
      if (q.area && m.area !== q.area) return false;
      if (oc && m.outcome !== oc) return false;
      if (q.minRating && (m.rating ?? 0) < q.minRating) return false;
      if (q.author && !(m.author === q.author || (q.author === "agent" && m.author.startsWith("agent:")))) return false;
      if (q.target && !m.target.toLowerCase().includes(q.target.toLowerCase())) return false;
      if (q.template !== undefined && m.template !== q.template) return false;
      for (const t of q.tags ?? []) if (!m.tags.includes(t.toLowerCase().replace("=", ":"))) return false;
      if (words.length) {
        const hay = `${m.id} ${m.title} ${m.why ?? ""} ${m.target} ${m.tags.join(" ")} ${m.author} ${body}`.toLowerCase();
        if (!words.every((w) => hay.includes(w))) return false;
      }
      return true;
    })
    .sort((a, b) => (b.meta.rating ?? 0) - (a.meta.rating ?? 0) || b.meta.usedAt.length - a.meta.usedAt.length || a.meta.id.localeCompare(b.meta.id));
};

export type { PromptMeta };
