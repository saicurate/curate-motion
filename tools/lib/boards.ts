// The prompt library (prompts/) and the inspo board (inspo/): load, write, index, validate.
// Pure file work: no S3, no catalog writes, so tools/lib/catalog.ts can call it from build and
// validate without an import cycle. The commands that also touch assets live in prompts.ts / inspo.ts.
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, statSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join, relative, sep } from "node:path";
import { parseId as parseAssetId } from "../../schemas/asset.ts";
import { InspoIndex, InspoMeta, inspoPath } from "../../schemas/inspo.ts";
import { PROMPT_ID_RE, PromptIndex, PromptMeta, parsePromptId, promptPath } from "../../schemas/prompt.ts";
import { CATALOG, INDEX_PATH, readJson, ROOT } from "./core.ts";
import { parseFrontMatter, stringifyFrontMatter } from "./frontmatter.ts";
import { assertNoSecrets, scanSecrets } from "./leakscan.ts";

export const PROMPTS_DIR = join(ROOT, "prompts");
export const INSPO_DIR = join(ROOT, "inspo");
export const PROMPT_INDEX_PATH = join(CATALOG, "prompts.json");
export const INSPO_INDEX_PATH = join(CATALOG, "inspo.json");
/** Left in a remix draft until someone merges it into one prompt. */
export const REMIX_MARK = "<!-- remix:";

export type Prompt = { meta: PromptMeta; body: string; path: string };
export type Inspo = { meta: InspoMeta; body: string; path: string };
type Rec = Record<string, unknown>;

const PROMPT_KEYS = ["id", "title", "author", "area", "target", "outcome", "rating", "why", "inputs", "outputs", "parents", "tags", "template", "createdAt", "usedAt", "costUsd", "source", "addedBy"];
const INSPO_KEYS = ["id", "title", "kind", "status", "url", "asset", "source", "addedBy", "addedAt", "love", "techniques", "useFor", "tags", "links"];
const ordered = (m: Rec, keys: string[]) => Object.fromEntries([...keys.filter((k) => k in m), ...Object.keys(m).filter((k) => !keys.includes(k))].map((k) => [k, m[k]]));

const walkMd = (dir: string): string[] => {
  const out: string[] = [];
  const walk = (d: string) => {
    if (!existsSync(d)) return;
    for (const n of readdirSync(d).sort()) {
      if (n.startsWith(".")) continue;
      const p = join(d, n);
      if (statSync(p).isDirectory()) walk(p);
      else if (n.endsWith(".md") && n.toLowerCase() !== "readme.md") out.push(relative(ROOT, p).split(sep).join("/"));
    }
  };
  walk(dir);
  return out;
};

const atomicWrite = (abs: string, text: string) => {
  mkdirSync(dirname(abs), { recursive: true });
  const tmp = `${abs}.tmp-${process.pid}`;
  writeFileSync(tmp, text);
  renameSync(tmp, abs);
};

/** An empty value (`key:` with nothing under it) means "not set", same as leaving the key out. */
const present = (m: Record<string, unknown>) => Object.fromEntries(Object.entries(m).filter(([, v]) => v !== null));

const issues = (where: string, e: { issues: { path: PropertyKey[]; message: string }[] }) => e.issues.map((i) => `${where}: ${i.path.join(".") || "front matter"}: ${i.message}`);

// ---------------------------------------------------------------- prompts

export const loadPrompts = (): { ok: Prompt[]; errors: string[] } => {
  const ok: Prompt[] = [];
  const errors: string[] = [];
  for (const rel of walkMd(PROMPTS_DIR)) {
    try {
      const { meta, body } = parseFrontMatter(readFileSync(join(ROOT, rel), "utf8"));
      const r = PromptMeta.safeParse(present(meta));
      if (!r.success) errors.push(...issues(rel, r.error));
      else ok.push({ meta: r.data, body, path: rel });
    } catch (e) {
      errors.push(`${rel}: ${(e as Error).message}`);
    }
  }
  return { ok, errors };
};

export const findPrompt = (id: string): Prompt => {
  if (!PROMPT_ID_RE.test(id)) throw new Error(`"${id}" is not a prompt id (prompt.<area>.<name>.v<N>). Find ids with: tools/prompts search --text …`);
  const rel = promptPath(id);
  if (!existsSync(join(ROOT, rel))) throw new Error(`no prompt ${id} (expected ${rel}). Find ids with: tools/prompts search --text …`);
  const { meta, body } = parseFrontMatter(readFileSync(join(ROOT, rel), "utf8"));
  const r = PromptMeta.safeParse(present(meta));
  if (!r.success) throw new Error(issues(rel, r.error).join("; "));
  return { meta: r.data, body, path: rel };
};

/** Validate, secret-scan and write one prompt file (atomically). The path always follows the id. */
export const writePromptFile = (meta: Rec, body: string, o: { create?: boolean } = {}): Prompt => {
  const r = PromptMeta.safeParse(meta);
  if (!r.success) throw new Error(r.error.issues.map((i) => `${i.path.join(".") || "prompt"}: ${i.message}`).join("; "));
  if (!body.trim()) throw new Error("the prompt text (body) is empty");
  const rel = promptPath(r.data.id);
  const abs = join(ROOT, rel);
  if (o.create && existsSync(abs)) throw new Error(`${rel} already exists; never overwrite a prompt (tools/prompts revise <id> makes a new version)`);
  const clean = Object.fromEntries(Object.entries(r.data).filter(([k, v]) => v !== undefined && !(k === "template" && v === false) && !(k === "rating" && v === null)));
  const text = stringifyFrontMatter(ordered(clean, PROMPT_KEYS), body);
  assertNoSecrets(text, rel);
  atomicWrite(abs, text);
  return { meta: r.data, body, path: rel };
};

export const buildPromptIndex = (ps: Prompt[]): PromptIndex => {
  const children = new Map<string, string[]>();
  for (const p of ps) for (const par of p.meta.parents) children.set(par, [...(children.get(par) ?? []), p.meta.id]);
  const count = (f: (p: Prompt) => string) => {
    const c: Record<string, number> = {};
    for (const p of ps) c[f(p)] = (c[f(p)] ?? 0) + 1;
    return Object.fromEntries(Object.entries(c).sort());
  };
  const prompts = [...ps]
    .sort((a, b) => a.meta.id.localeCompare(b.meta.id))
    .map(({ meta: m, body, path }) => ({
      id: m.id,
      title: m.title,
      author: m.author,
      area: m.area,
      target: m.target,
      outcome: m.outcome,
      rating: m.rating ?? null,
      tags: m.tags,
      inputs: m.inputs,
      outputs: m.outputs,
      parents: m.parents,
      children: (children.get(m.id) ?? []).sort(),
      why: m.why ?? null,
      template: m.template,
      createdAt: m.createdAt,
      useCount: m.usedAt.length,
      lastUsedAt: m.usedAt.length ? [...m.usedAt].sort().at(-1)! : null,
      costUsd: m.costUsd ?? null,
      source: m.source ?? null,
      path,
      body,
    }));
  return PromptIndex.parse({
    about: "Every prompt in prompts/ (generated by tools/catalog build; never hand-edit). Search with tools/prompts search.",
    count: ps.length,
    counts: { area: count((p) => p.meta.area), outcome: count((p) => p.meta.outcome), author: count((p) => (p.meta.author.startsWith("agent:") ? "agent" : p.meta.author.split(":")[0])) },
    prompts,
  });
};

// ---------------------------------------------------------------- inspo

export const loadInspo = (): { ok: Inspo[]; errors: string[] } => {
  const ok: Inspo[] = [];
  const errors: string[] = [];
  for (const rel of walkMd(INSPO_DIR)) {
    try {
      const { meta, body } = parseFrontMatter(readFileSync(join(ROOT, rel), "utf8"));
      const r = InspoMeta.safeParse(present(meta));
      if (!r.success) errors.push(...issues(rel, r.error));
      else ok.push({ meta: r.data, body, path: rel });
    } catch (e) {
      errors.push(`${rel}: ${(e as Error).message}`);
    }
  }
  return { ok, errors };
};

export const findInspo = (id: string): Inspo => {
  const rel = inspoPath(id);
  if (!existsSync(join(ROOT, rel))) throw new Error(`no inspo ${id} (expected ${rel}). Find ids with: tools/inspo search`);
  const { meta, body } = parseFrontMatter(readFileSync(join(ROOT, rel), "utf8"));
  const r = InspoMeta.safeParse(present(meta));
  if (!r.success) throw new Error(issues(rel, r.error).join("; "));
  return { meta: r.data, body, path: rel };
};

export const writeInspoFile = (meta: Rec, body: string, o: { create?: boolean } = {}): Inspo => {
  const r = InspoMeta.safeParse(meta);
  if (!r.success) throw new Error(r.error.issues.map((i) => `${i.path.join(".") || "inspo"}: ${i.message}`).join("; "));
  const rel = inspoPath(r.data.id);
  const abs = join(ROOT, rel);
  if (o.create && existsSync(abs)) throw new Error(`${rel} already exists`);
  const tech = r.data.techniques as Record<string, string[]>;
  const used = Object.fromEntries(Object.entries(tech).filter(([, v]) => v.length));
  const clean = { ...r.data, techniques: Object.keys(used).length ? used : undefined };
  const text = stringifyFrontMatter(ordered(clean as Rec, INSPO_KEYS), body);
  assertNoSecrets(text, rel);
  atomicWrite(abs, text);
  return { meta: r.data, body, path: rel };
};

type IndexAsset = { id: string; kind: string; files: { role: string; path: string; mime?: string }[] };
const catalogAssets = (): Map<string, IndexAsset> => {
  if (!existsSync(INDEX_PATH)) return new Map();
  return new Map(readJson<{ assets: IndexAsset[] }>(INDEX_PATH).assets.map((a) => [a.id, a]));
};

export const buildInspoIndex = (xs: Inspo[], assets = catalogAssets()): InspoIndex => {
  const count = (f: (x: Inspo) => string) => {
    const c: Record<string, number> = {};
    for (const x of xs) c[f(x)] = (c[f(x)] ?? 0) + 1;
    return Object.fromEntries(Object.entries(c).sort());
  };
  const inspo = [...xs]
    .sort((a, b) => a.meta.id.localeCompare(b.meta.id))
    .map(({ meta: m, body, path }) => {
      const a = m.asset ? assets.get(m.asset) : undefined;
      const files = (a?.files ?? []).map((f) => ({ role: f.role, path: f.path, mime: f.mime ?? null }));
      const img = (f: { mime: string | null }) => !!f.mime?.startsWith("image/");
      const bodyImg = /!\[[^\]]*\]\(\.\.\/library\/([^)\s]+)\)/.exec(body)?.[1] ?? null;
      const cover = files.find((f) => f.role === "thumb" && img(f))?.path ?? files.find((f) => f.role === "original" && img(f))?.path ?? bodyImg ?? files.find((f) => f.role === "frame" && img(f))?.path ?? null;
      return {
        id: m.id,
        title: m.title,
        kind: m.kind,
        status: m.status,
        url: m.url ?? null,
        asset: m.asset ?? null,
        files,
        cover,
        love: m.love,
        techniques: Object.fromEntries(Object.entries(m.techniques as Record<string, string[]>).filter(([, v]) => v.length)),
        useFor: m.useFor,
        tags: m.tags,
        links: m.links,
        addedBy: m.addedBy,
        addedAt: m.addedAt,
        source: m.source ?? null,
        hasBreakdown: body.includes("<!-- breakdown:start"),
        path,
        body,
      };
    });
  return InspoIndex.parse({
    about: "Every inspiration in inspo/ (generated by tools/catalog build; never hand-edit). Media is in the library as kind reference: never shipped.",
    count: xs.length,
    counts: { kind: count((x) => x.meta.kind), status: count((x) => x.meta.status) },
    inspo,
  });
};

// ---------------------------------------------------------------- indexes (idempotent, like catalog/index.json)

const writeIfChanged = (abs: string, v: unknown) => {
  const text = JSON.stringify(v, null, 2) + "\n";
  if (existsSync(abs) && readFileSync(abs, "utf8") === text) return false;
  atomicWrite(abs, text);
  return true;
};

// A broken prompt/inspo file must never block asset work (tools/catalog add rebuilds these too): the
// index is left as it was, a warning names the file, and tools/catalog validate fails until it's fixed.
const warnBroken = (what: string, errors: string[]) => console.error(`warn  ${what} not rebuilt: ${errors.length} broken file(s), first: ${errors[0]} (tools/prompts validate)`);
export const writePromptIndex = () => {
  const { ok, errors } = loadPrompts();
  if (errors.length) return (warnBroken("catalog/prompts.json", errors), false);
  return writeIfChanged(PROMPT_INDEX_PATH, buildPromptIndex(ok));
};
export const writeInspoIndex = () => {
  const { ok, errors } = loadInspo();
  if (errors.length) return (warnBroken("catalog/inspo.json", errors), false);
  return writeIfChanged(INSPO_INDEX_PATH, buildInspoIndex(ok));
};
/** catalog/prompts.json + catalog/inspo.json. Called by tools/catalog build (rebuild) and every prompts/inspo write. */
export const writeBoardIndexes = () => ({ prompts: writePromptIndex(), inspo: writeInspoIndex() });

// ---------------------------------------------------------------- validate

type AssetLike = { id: string; kind: string; source?: { promptId?: string } };

/**
 * Everything checkable about prompts/ and inspo/, given the catalog's assets:
 * schema, file path = id, unique ids, no secrets, parents exist and form no cycle, inputs/outputs
 * that are asset ids exist, an asset's source.promptId names a prompt that lists it as an output,
 * inspo media is a `reference` asset, indexes fresh, and (with a git ref) used prompts' text unchanged.
 */
export const validateBoards = (assets: Map<string, AssetLike>, o: { checkIndex?: boolean; immutableAgainst?: string } = {}) => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const P = loadPrompts();
  const I = loadInspo();
  errors.push(...P.errors, ...I.errors);
  const byId = new Map<string, Prompt>();
  for (const p of P.ok) {
    const where = p.path;
    if (byId.has(p.meta.id)) errors.push(`${where}: duplicate prompt id ${p.meta.id}`);
    byId.set(p.meta.id, p);
    if (promptPath(p.meta.id) !== p.path) errors.push(`${where}: id ${p.meta.id} belongs at ${promptPath(p.meta.id)}`);
    if (!p.body.trim()) errors.push(`${where}: the prompt text (body) is empty`);
    const s = scanSecrets(readFileSync(join(ROOT, p.path), "utf8"));
    if (s.length) errors.push(`${where}: looks like it contains a secret (${s.map((x) => `${x.kind}, line ${x.line}`).join("; ")}); value not shown`);
    if (p.body.includes(REMIX_MARK)) warnings.push(`${where}: still a remix draft (merge the parts into one prompt and delete the <!-- remix: … --> lines)`);
  }
  for (const p of P.ok) {
    const where = p.path;
    for (const par of p.meta.parents) if (!byId.has(par)) errors.push(`${where}: parent ${par} is not in prompts/`);
    for (const x of p.meta.inputs) {
      if (parseAssetId(x) && !assets.has(x)) errors.push(`${where}: input ${x} is not in the catalog`);
      if (PROMPT_ID_RE.test(x) && !byId.has(x)) errors.push(`${where}: input ${x} is not in prompts/`);
    }
    for (const x of p.meta.outputs) if (!assets.has(x)) errors.push(`${where}: output ${x} is not in the catalog`);
  }
  // no cycles in the remix graph
  const state = new Map<string, 1 | 2>();
  const visit = (id: string, trail: string[]): void => {
    if (state.get(id) === 2) return;
    if (state.get(id) === 1) {
      errors.push(`prompts: parent cycle ${[...trail, id].join(" → ")}`);
      return;
    }
    state.set(id, 1);
    for (const par of byId.get(id)?.meta.parents ?? []) visit(par, [...trail, id]);
    state.set(id, 2);
  };
  for (const id of byId.keys()) visit(id, []);
  // asset → prompt links
  for (const a of assets.values()) {
    const pid = a.source?.promptId;
    if (!pid) continue;
    const p = byId.get(pid);
    if (!p) errors.push(`${a.id}: source.promptId ${pid} is not in prompts/`);
    else if (!p.meta.outputs.includes(a.id)) errors.push(`${a.id}: source.promptId ${pid}, but that prompt doesn't list it in outputs (tools/prompts link ${pid} ${a.id})`);
  }
  // inspo
  const seen = new Set<string>();
  for (const x of I.ok) {
    const where = x.path;
    if (seen.has(x.meta.id)) errors.push(`${where}: duplicate inspo id ${x.meta.id}`);
    seen.add(x.meta.id);
    if (inspoPath(x.meta.id) !== x.path) errors.push(`${where}: id ${x.meta.id} belongs at ${inspoPath(x.meta.id)}`);
    if (x.meta.asset) {
      const a = assets.get(x.meta.asset);
      if (!a) errors.push(`${where}: asset ${x.meta.asset} is not in the catalog`);
      else if (a.kind !== "reference") errors.push(`${where}: asset ${x.meta.asset} is a ${a.kind}; inspo media must be kind reference (never shipped)`);
    }
    for (const u of x.meta.useFor) if (u.startsWith("ad:") && !existsSync(join(ROOT, "ads", u.slice(3), "ad.json"))) warnings.push(`${where}: useFor ${u}: no ads/${u.slice(3)}/ad.json yet`);
    const s = scanSecrets(readFileSync(join(ROOT, x.path), "utf8"));
    if (s.length) errors.push(`${where}: looks like it contains a secret (${s.map((f) => `${f.kind}, line ${f.line}`).join("; ")}); value not shown`);
  }
  if (o.checkIndex && !P.errors.length && !I.errors.length) {
    const fresh = (abs: string, v: unknown) => existsSync(abs) && readFileSync(abs, "utf8") === JSON.stringify(v, null, 2) + "\n";
    if (!fresh(PROMPT_INDEX_PATH, buildPromptIndex(P.ok))) errors.push("catalog/prompts.json is stale: run tools/catalog build (or tools/prompts build) and commit it");
    if (!fresh(INSPO_INDEX_PATH, buildInspoIndex(I.ok))) errors.push("catalog/inspo.json is stale: run tools/catalog build (or tools/inspo build) and commit it");
  }
  if (o.immutableAgainst) {
    // a prompt someone used or judged keeps its text: a changed text is a new version (tools/prompts revise)
    for (const p of P.ok) {
      let before: string | null = null;
      try {
        before = execFileSync("git", ["show", `${o.immutableAgainst}:${p.path}`], { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
      } catch {
        continue;
      }
      try {
        const old = parseFrontMatter(before);
        const used = (old.meta.outcome && old.meta.outcome !== "untested") || (Array.isArray(old.meta.usedAt) && old.meta.usedAt.length > 0);
        if (used && old.body.trim() !== p.body.trim()) errors.push(`${p.path}: its text changed after it was used or rated; restore it and use tools/prompts revise ${p.meta.id} for a new version`);
      } catch {
        /* the old file didn't parse: nothing to compare */
      }
    }
  }
  return { errors, warnings, prompts: P.ok.length, inspo: I.ok.length, prompt: byId };
};

/** The next free version for prompt.<area>.<name>. */
export const nextPromptVersion = (area: string, name: string) => {
  let max = 0;
  const dir = join(PROMPTS_DIR, area);
  if (existsSync(dir)) for (const n of readdirSync(dir)) {
    const m = new RegExp(`^${name}\\.v(\\d+)\\.md$`).exec(n);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return max + 1;
};

export const kebab = (s: string) => s.toLowerCase().replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").split("-").slice(0, 8).join("-");
export { parsePromptId };
