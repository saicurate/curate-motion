// The catalog's operations, shared by tools/catalog (CLI) and tools/library-ui (the founder's
// local page). Every write validates against schemas/ and rebuilds catalog/index.json.
import { copyFileSync, cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { basename, dirname, extname, join, relative } from "node:path";
import { z } from "zod";
import { Asset, CatalogIndex, KIND_SCHEMAS, KINDS, Manifest, parseId, SEGMENT, type FileRef } from "../../schemas/asset.ts";
import { AdSpec } from "../../schemas/ad.ts";
import { AccountState, PersonaAccount } from "../../schemas/account.ts";
import { Script, VoiceConfig } from "../../schemas/voice.ts";
import { aws, BUCKET, CATALOG, findAccounts, findAds, findManifests, INDEX_PATH, LIB, probe, readJson, ROOT, s3KeyFor, sha256File, today, treeSha, writeJson } from "./core.ts";
import { deleteRemote, pushEntries, remoteSha, type Entry } from "./s3sync.ts";
import { InspoIndex, InspoMeta } from "../../schemas/inspo.ts";
import { PromptIndex, PromptMeta } from "../../schemas/prompt.ts";
import { loadPrompts, validateBoards, writeBoardIndexes, writePromptFile } from "./boards.ts";

type A = z.infer<typeof Asset>;
type Rec = Record<string, unknown>;
export type Loaded = { manifest: string; data: z.infer<typeof Manifest> };
export type Index = z.infer<typeof CatalogIndex>;
export type IndexEntry = Index["assets"][number];

// ---------------------------------------------------------------- where each kind lives

/** Folder (under library/) and manifest for a new asset of `kind`. */
export const home = (kind: string, scope: string, name: string, rec: Rec = {}): { dir: string; manifest: string; about: string } => {
  switch (kind) {
    case "brand":
      return { dir: `brand/${scope}`, manifest: "brand/manifest.json", about: "Curate's own brand marks and typefaces." };
    case "font":
      return { dir: "brand/fonts", manifest: "brand/manifest.json", about: "Curate's own brand marks and typefaces." };
    case "zee":
      return { dir: `zee/${scope}`, manifest: "zee/manifest.json", about: "Zee, Curate's black plush kitten: frame sequences, one asset per emotion part." };
    case "face":
      return { dir: `people/${scope}`, manifest: `people/${scope}/manifest.json`, about: `${scope}: a marketing persona's face references, selfies and try-ons.` };
    case "selfie":
    case "tryon":
      return { dir: `people/${scope}/${kind}`, manifest: `people/${scope}/manifest.json`, about: `${scope}: a marketing persona's face references, selfies and try-ons.` };
    case "garment":
      return { dir: `wardrobe/${scope}`, manifest: `wardrobe/${scope}/manifest.json`, about: `${scope}'s wardrobe: product shots (no logos) with cutouts and thumbs.` };
    case "photo":
      return { dir: `camera-roll/${scope}`, manifest: `camera-roll/${scope}/manifest.json`, about: `${scope}'s camera roll: the photos on her phone.` };
    case "stock":
      return { dir: `stock/${scope}`, manifest: "stock/manifest.json", about: "Licensed stock photos and video." };
    case "footage": {
      const moment = String(rec.moment ?? name.replace(/-b\d+$/, ""));
      return { dir: `footage/${moment}`, manifest: `footage/${moment}/manifest.json`, about: `App footage of the ${moment} moment, by persona and build.` };
    }
    case "screenshot":
      return { dir: `screenshots/${scope}`, manifest: `screenshots/${scope}/manifest.json`, about: `${scope}: still screenshots of the app, by screen, state and build.` };
    case "music":
      return { dir: `music/${scope}`, manifest: "music/manifest.json", about: "Music, with tempo, first beat and named sections." };
    case "sfx":
      return { dir: `music/sfx/${scope}`, manifest: "music/manifest.json", about: "Music, with tempo, first beat and named sections." };
    case "voice":
      return { dir: `voice/${scope}`, manifest: "voice/manifest.json", about: "Voiceover audio, by ad: TTS clips (one per script line) and human takes. Made by tools/voice." };
    case "reference":
      return { dir: `references/${name}`, manifest: "references/manifest.json", about: "Reference reels and breakdowns. Study only: never shipped in an ad." };
    default:
      throw new Error(`unknown kind ${kind}`);
  }
};

/** Licence presets, so nobody has to type a licence object. `--licence <preset>` or the UI's dropdown. */
export const LICENCES: Record<string, { licence: Rec; aiGenerated?: boolean; source?: string }> = {
  "ai-owned": { licence: { name: "AI-generated, Curate-owned output", commercial: true, restrictions: ["no-real-person-likeness", "persona-never-vouches-for-products"] }, aiGenerated: true, source: "generated" },
  curate: { licence: { name: "Curate original", commercial: true, restrictions: [] }, aiGenerated: false, source: "original" },
  unsplash: { licence: { name: "Unsplash License", url: "https://unsplash.com/license", commercial: true, restrictions: ["no-unsplash-plus", "not-a-similar-competing-service"] }, aiGenerated: false, source: "stock" },
  pexels: { licence: { name: "Pexels License", url: "https://www.pexels.com/license/", commercial: true, restrictions: ["no-identifiable-person-endorsement", "not-sold-unaltered"] }, aiGenerated: false, source: "stock" },
  mixkit: { licence: { name: "Mixkit Stock Music Free License", url: "https://mixkit.co/license/#musicFree", commercial: true, restrictions: ["tv-radio-broadcast", "cd-dvd", "video-games", "music-only-remix", "content-id-registration"] }, aiGenerated: false, source: "stock" },
  ofl: { licence: { name: "SIL Open Font License 1.1", url: "https://openfontlicense.org", commercial: true, restrictions: ["do-not-sell-the-font-alone"] }, aiGenerated: false, source: "stock" },
  reference: { licence: { name: "Third-party content, reference only", commercial: false, restrictions: ["never-ship"] }, aiGenerated: false, source: "original" },
};

/** Extra fields each kind needs, for the UI form and for CLI defaults. */
export const KIND_FIELDS: Record<string, { key: string; label: string; options?: string[]; required?: boolean; type?: "number" | "text" }[]> = {
  garment: [
    { key: "category", label: "Category", options: ["top", "bottom", "dress", "outerwear", "footwear", "accessory", "bag", "jewellery", "activewear"], required: true },
    { key: "name", label: "Plain name (no brands)", required: true },
  ],
  zee: [
    { key: "emotion", label: "Emotion", options: ["cheer", "curious", "excited", "focused", "happy", "hello", "idea", "idle", "listening", "love", "sleepy", "thinking"], required: true },
    { key: "part", label: "Part", options: ["intro", "loop", "outro", "still"], required: true },
    { key: "pack", label: "Pack", required: true },
  ],
  music: [
    { key: "bpm", label: "BPM (blank if unknown)", type: "number" },
    { key: "offsetSec", label: "First beat (s)", type: "number" },
  ],
  footage: [
    { key: "moment", label: "Moment (kebab-case)", required: true },
    { key: "app.build", label: "App build", type: "number", required: true },
    { key: "app.version", label: "App version", required: true },
    { key: "device", label: "Device" },
  ],
  screenshot: [
    { key: "screen", label: "Screen (kebab-case)", required: true },
    { key: "state", label: "State (kebab-case)", required: true },
    { key: "app.build", label: "App build", type: "number", required: true },
    { key: "app.version", label: "App version", required: true },
    { key: "capture", label: "Capture", options: ["screenshot", "frame"], required: true },
    { key: "origin", label: "Origin", options: ["app", "probe"], required: true },
    { key: "variant", label: "Variant", options: ["native", "appstore-6.9"] },
    { key: "device", label: "Device" },
  ],
  stock: [{ key: "shows", label: "What it shows", required: true }],
  photo: [{ key: "place", label: "Place / moment" }],
  tryon: [{ key: "wearing", label: "Wearing (garment ids, comma-separated)", required: true }],
  font: [
    { key: "family", label: "Family", required: true },
    { key: "weight", label: "Weight", type: "number", required: true },
  ],
};

// ---------------------------------------------------------------- load / index / schemas

export const loadManifests = (): { ok: Loaded[]; errors: string[] } => {
  const ok: Loaded[] = [];
  const errors: string[] = [];
  for (const m of findManifests()) {
    const r = Manifest.safeParse(readJson(join(ROOT, m)));
    if (!r.success) {
      for (const i of r.error.issues) errors.push(`${m}: ${i.path.join(".")}: ${i.message}`);
      continue;
    }
    ok.push({ manifest: m, data: r.data });
  }
  return { ok, errors };
};

export const flatTags = (a: A): string[] => {
  const p = parseId(a.id)!;
  const t = new Set<string>([`kind:${a.kind}`, `status:${a.status}`, `scope:${p.scope}`, `licence:${a.licence.name}`]);
  if (a.aiGenerated) t.add("ai-generated");
  if (a.tags.persona) t.add(`persona:${a.tags.persona}`);
  if (a.tags.moment) t.add(`moment:${a.tags.moment}`);
  for (const m of a.tags.mood) t.add(`mood:${m}`);
  for (const c of a.tags.colour) t.add(`colour:${c}`);
  for (const s of a.tags.season) t.add(`season:${s}`);
  for (const f of a.tags.free) t.add(f);
  const x = a as Rec;
  if (a.kind === "garment") t.add(`category:${x.category}`);
  if (a.kind === "zee") {
    t.add(`emotion:${x.emotion}`);
    t.add(`part:${x.part}`);
  }
  if (a.kind === "music" && x.bpm) t.add(`bpm:${Math.round(x.bpm as number)}`);
  if (a.kind === "footage") {
    t.add(`moment:${x.moment}`);
    t.add(`build:${(x.app as { build: number }).build}`);
  }
  if (a.kind === "screenshot") {
    t.add(`screen:${x.screen}`);
    t.add(`state:${x.state}`);
    t.add(`build:${(x.app as { build: number }).build}`);
    t.add(`source:${x.origin}`);
    t.add(`size:${(x.dims as { w: number; h: number }).w}x${(x.dims as { w: number; h: number }).h}`);
  }
  return [...t].sort();
};

export const buildIndex = (loaded: Loaded[]): Index => {
  const assets = loaded.flatMap(({ manifest, data }) =>
    data.assets.map((a) => ({
      id: a.id,
      kind: a.kind,
      title: a.title,
      status: a.status,
      manifest,
      files: a.files.map((f) => ({ ...f, s3Key: s3KeyFor(f.path) })),
      tags: flatTags(a),
      licence: a.licence.name,
      aiGenerated: a.aiGenerated,
      asset: a as unknown as Rec,
    })),
  );
  assets.sort((a, b) => a.id.localeCompare(b.id));
  const counts: Record<string, number> = {};
  for (const a of assets) counts[a.kind] = (counts[a.kind] ?? 0) + 1;
  return CatalogIndex.parse({ generatedAt: "", bucket: BUCKET, counts, assets });
};

export const writeSchemas = () => {
  const dir = join(CATALOG, "schemas");
  mkdirSync(dir, { recursive: true });
  const emit = (name: string, s: z.ZodType) => writeJson(join(dir, `${name}.schema.json`), z.toJSONSchema(s, { io: "input", unrepresentable: "any" }));
  for (const [k, s] of Object.entries(KIND_SCHEMAS)) emit(`asset.${k}`, s);
  emit("asset", Asset);
  emit("manifest", Manifest);
  emit("index", CatalogIndex);
  emit("ad", AdSpec);
  emit("account", PersonaAccount);
  emit("account-state", AccountState);
  emit("voice-config", VoiceConfig);
  emit("script", Script);
  emit("prompt", PromptMeta);
  emit("prompt-index", PromptIndex);
  emit("inspo", InspoMeta);
  emit("inspo-index", InspoIndex);
};

const sameIndex = (a: Index | null, b: Index) => !!a && JSON.stringify({ ...a, generatedAt: "" }) === JSON.stringify({ ...b, generatedAt: "" });

/** Write the index only when its content changed (idempotent), plus the browser's script mirror. */
export const writeIndex = (idx: Index) => {
  const prev = existsSync(INDEX_PATH) ? readJson<Index>(INDEX_PATH) : null;
  if (sameIndex(prev, idx)) return false;
  writeJson(INDEX_PATH, { ...idx, generatedAt: new Date().toISOString() });
  mkdirSync(join(ROOT, "tracker", "data"), { recursive: true });
  writeFileSync(join(ROOT, "tracker", "data", "catalog.js"), `window.CURATE_CATALOG = ${JSON.stringify(readJson(INDEX_PATH))};\n`);
  return true;
};

export const rebuild = () => {
  const { ok, errors } = loadManifests();
  if (errors.length) throw new Error(errors.join("\n"));
  const changed = writeIndex(buildIndex(ok));
  writeBoardIndexes(); // catalog/prompts.json + catalog/inspo.json (tools/lib/boards.ts)
  writeSchemas();
  return { changed, count: ok.reduce((s, l) => s + l.data.assets.length, 0) };
};

export const loadIndex = (): Index => {
  if (!existsSync(INDEX_PATH)) throw new Error("catalog/index.json missing: run tools/catalog build");
  return readJson<Index>(INDEX_PATH);
};

// ---------------------------------------------------------------- search

export type Query = { kind?: string; status?: string; tags?: string[]; text?: string };
export const search = (q: Query): IndexEntry[] =>
  loadIndex().assets.filter((e) => {
    if (q.kind && e.kind !== q.kind) return false;
    if (q.status && e.status !== q.status) return false;
    for (const t of q.tags ?? []) {
      const want = t.replace("=", ":").toLowerCase();
      if (!e.tags.some((x) => x.toLowerCase() === want || x.toLowerCase().endsWith(`:${want}`))) return false;
    }
    if (q.text) {
      const hay = `${e.id} ${e.title} ${(e.asset.description as string) ?? ""} ${(e.asset.name as string) ?? ""} ${e.tags.join(" ")}`.toLowerCase();
      if (!q.text.toLowerCase().split(/\s+/).every((w) => hay.includes(w))) return false;
    }
    return true;
  });

// ---------------------------------------------------------------- validate

export const validate = (o: { sha?: string; immutableAgainst?: string; checkIndex?: boolean } = {}) => {
  const shaMode = o.sha ?? "auto";
  const errors: string[] = [];
  const warnings: string[] = [];
  const { ok, errors: schemaErrors } = loadManifests();
  errors.push(...schemaErrors);
  const seen = new Map<string, A>();
  let s3ok: boolean | null = null;
  const canS3 = () => (s3ok ??= aws(["s3api", "head-bucket", "--bucket", BUCKET], true) !== null);
  let checked = 0;
  for (const { manifest, data } of ok) {
    const dir = relative(LIB, dirname(join(ROOT, manifest))).split("\\").join("/");
    for (const a of data.assets) {
      if (seen.has(a.id)) errors.push(`${manifest}: duplicate id ${a.id}`);
      seen.set(a.id, a);
      if (a.supersedes && !ok.some((l) => l.data.assets.some((x) => x.id === a.supersedes))) warnings.push(`${a.id}: supersedes ${a.supersedes}, which is not in the catalog`);
      for (const f of a.files as FileRef[]) {
        if (dir && !f.path.startsWith(`${dir}/`)) errors.push(`${a.id}: ${f.path} is outside its manifest folder library/${dir}/`);
        if (shaMode === "none") continue;
        const local = join(LIB, f.path);
        if ((shaMode === "local" || shaMode === "auto") && existsSync(local)) {
          checked++;
          if (statSync(local).size !== f.bytes || sha256File(local) !== f.sha256) errors.push(`${a.id}: local ${f.path} does not match its sha256 (a changed file is a new version: tools/catalog replace)`);
        } else if (shaMode === "s3" || (shaMode === "auto" && canS3())) {
          checked++;
          const r = remoteSha(s3KeyFor(f.path));
          if (r === null) (shaMode === "s3" ? errors : warnings).push(`${a.id}: ${f.path} is not in S3 yet (tools/sync push)`);
          else if (r !== f.sha256) errors.push(`${a.id}: S3 copy of ${f.path} has a different sha256 than the manifest`);
        } else if (shaMode === "local") errors.push(`${a.id}: ${f.path} is not on disk (tools/sync pull)`);
      }
      const fr = "frames" in a ? a.frames : undefined;
      if (fr && shaMode !== "none" && shaMode !== "s3" && existsSync(join(LIB, fr.dir))) {
        const t = treeSha(join(LIB, fr.dir));
        checked++;
        if (t.sha256 !== fr.treeSha256 || t.count !== fr.count) errors.push(`${a.id}: frames in ${fr.dir} do not match treeSha256/count`);
      }
    }
  }
  for (const p of findAds()) {
    const r = AdSpec.safeParse(readJson(join(ROOT, p)));
    if (!r.success) {
      for (const i of r.error.issues) errors.push(`${p}: ${i.path.join(".")}: ${i.message}`);
      continue;
    }
    if (`ads/${r.data.id}/ad.json` !== p) errors.push(`${p}: id "${r.data.id}" must match its folder`);
    for (const id of r.data.assets) {
      const a = seen.get(id);
      if (!a) {
        (r.data.status === "draft" || r.data.status === "idea" ? warnings : errors).push(`${p}: uses ${id}, which is not in the catalog`);
        continue;
      }
      if (a.status === "retired") errors.push(`${p}: uses retired asset ${id}`);
      if (a.kind === "reference") errors.push(`${p}: lists reference ${id}: references (inspo) are study only and never shipped in an ad (RULES.md › 9)`);
      if ((r.data.status === "approved" || r.data.status === "live") && a.status !== "approved") errors.push(`${p}: ${r.data.status} ad uses ${a.status} asset ${id}`);
      // the studio process makes one asset AFTER G1: the ad's own designed sound (G5: motion/sound,
      // an sfx tagged ad:<this ad>). It may stay draft until the founder reviews G5; G5 approved needs it approved.
      const g5Sound = a.kind === "sfx" && (a.tags?.free ?? []).includes(`ad:${r.data.id}`) && r.data.gates?.G5 !== "approved";
      if (r.data.gates?.G1 === "approved" && a.status !== "approved") {
        if (g5Sound) warnings.push(`${p}: ${id} (the ad's designed sound, G5) is ${a.status}: the founder approves it with G5`);
        else errors.push(`${p}: G1 (assets approved) is approved but ${id} is ${a.status}`);
      }
    }
    // the studio process (decisions/0011): each gate's files exist once the gate is in review
    const g = r.data.gates;
    if (g) {
      const dir = join(ROOT, "ads", r.data.id);
      const need: [keyof typeof g, string[]][] = [
        ["G2", ["brief.md", "style_guide.md", "shotlist.md"]],
        ["G3", ["shots.ts"]],
        ["G6", ["README.md"]],
      ];
      for (const [gate, files] of need)
        if (g[gate] !== "pending") for (const f of files) if (!existsSync(join(dir, f))) errors.push(`${p}: ${gate} is ${g[gate]} but ads/${r.data.id}/${f} is missing`);
      if ((g.G3 === "approved" || g.G5 === "review" || g.G5 === "approved") && !existsSync(join(ROOT, "reviews", r.data.id))) errors.push(`${p}: no reviews/${r.data.id}/ (run tools/critic) for a gate that needs a critiqued render`);
    }
  }
  for (const p of findAccounts()) {
    const r = PersonaAccount.safeParse(readJson(join(ROOT, p)));
    if (!r.success) for (const i of r.error.issues) errors.push(`${p}: ${i.path.join(".")}: ${i.message}`);
    const sp = join(dirname(join(ROOT, p)), "account-state.json");
    if (existsSync(sp)) {
      const s = AccountState.safeParse(readJson(sp));
      if (!s.success) for (const i of s.error.issues) errors.push(`${relative(ROOT, sp)}: ${i.path.join(".")}: ${i.message}`);
    }
  }
  // the voiceover config and every ad's script (schemas/voice.ts)
  const vcPath = join(ROOT, "config", "voice.json");
  if (existsSync(vcPath)) {
    const r = VoiceConfig.safeParse(readJson(vcPath));
    if (!r.success) for (const i of r.error.issues) errors.push(`config/voice.json: ${i.path.join(".")}: ${i.message}`);
  }
  for (const p of findAds()) {
    const sp = join(ROOT, dirname(p), "script.json");
    if (!existsSync(sp)) continue;
    const r = Script.safeParse(readJson(sp));
    if (!r.success) for (const i of r.error.issues) errors.push(`${dirname(p)}/script.json: ${i.path.join(".")}: ${i.message}`);
    else if (`ads/${r.data.ad}/ad.json` !== p) errors.push(`${dirname(p)}/script.json: ad "${r.data.ad}" must match its folder`);
  }
  if (o.immutableAgainst) {
    for (const { manifest, data } of ok) {
      let before: { assets?: Rec[] } | null = null;
      try {
        before = JSON.parse(execFileSync("git", ["show", `${o.immutableAgainst}:${manifest}`], { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }));
      } catch {
        continue;
      }
      for (const old of before!.assets ?? []) {
        if (old.status !== "approved") continue;
        const now = data.assets.find((a) => a.id === old.id) as Rec | undefined;
        if (!now) errors.push(`${old.id}: approved asset was deleted (retire it instead)`);
        else if (JSON.stringify(now.files) !== JSON.stringify(old.files) || JSON.stringify(now.frames) !== JSON.stringify(old.frames))
          errors.push(`${old.id}: approved asset's files changed; use tools/catalog replace (new version) instead`);
      }
    }
  }
  if (o.checkIndex && !sameIndex(existsSync(INDEX_PATH) ? readJson<Index>(INDEX_PATH) : null, buildIndex(ok))) errors.push("catalog/index.json is stale: run tools/catalog build and commit it");
  // the prompt library and the inspo board (prompts/, inspo/): schema, links both ways, no secrets, indexes fresh
  const b = validateBoards(seen as unknown as Map<string, { id: string; kind: string; source?: { promptId?: string } }>, { checkIndex: o.checkIndex, immutableAgainst: o.immutableAgainst });
  errors.push(...b.errors);
  warnings.push(...b.warnings);
  return { errors, warnings, checked, assets: seen.size, manifests: ok.length, ads: findAds().length, prompts: b.prompts, inspo: b.inspo };
};

// ---------------------------------------------------------------- write helpers

type M = { $schema?: string; about: string; assets: Rec[] };

const findAsset = (id: string): { mpath: string; m: M; i: number; a: Rec } => {
  for (const rel of findManifests()) {
    const mpath = join(ROOT, rel);
    const m = readJson<M>(mpath);
    const i = m.assets.findIndex((a) => a.id === id);
    if (i >= 0) return { mpath, m, i, a: m.assets[i] };
  }
  throw new Error(`no asset ${id}. Find ids with: tools/catalog search --text …`);
};

const saveManifest = (mpath: string, m: M) => {
  const r = Manifest.safeParse(m);
  if (!r.success) throw new Error(r.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "));
  writeJson(mpath, m);
};

const kebab = (s: string) => s.toLowerCase().replace(/\.v\d+$/, "").replace(/-v\d+$/, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const setPath = (o: Rec, key: string, v: unknown) => {
  const ks = key.split(".");
  let cur = o;
  for (const k of ks.slice(0, -1)) cur = (cur[k] ??= {}) as Rec;
  cur[ks.at(-1)!] = v;
};

const coerce = (raw: unknown): unknown => {
  if (typeof raw !== "string") return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
};

const nextVersion = (kind: string, scope: string, name: string) => {
  const re = new RegExp(`^${kind}\\.${scope}\\.${name}\\.v(\\d+)$`);
  let max = 0;
  for (const rel of findManifests()) for (const a of readJson<M>(join(ROOT, rel)).assets) {
    const m = re.exec(String(a.id));
    if (m) max = Math.max(max, Number(m[1]));
  }
  return max + 1;
};

const fileRefAt = (rel: string, role: string): FileRef => {
  const abs = join(LIB, rel);
  return { role: role as FileRef["role"], path: rel, sha256: sha256File(abs), bytes: statSync(abs).size, mime: probe(abs).mime };
};

const place = (src: string, rel: string) => {
  const dst = join(LIB, rel);
  if (existsSync(dst)) throw new Error(`library/${rel} already exists; never overwrite (use a new version)`);
  mkdirSync(dirname(dst), { recursive: true });
  copyFileSync(src, dst);
};

const entryOf = (id: string): Entry => {
  const e = loadIndex().assets.find((a) => a.id === id);
  if (!e) throw new Error(`${id} not in the index`);
  return e as unknown as Entry;
};

// ---------------------------------------------------------------- add / replace / tag / retire / remove / approve

export type AddInput = {
  /** A file anywhere on disk (it is COPIED into library/), or already under library/. */
  file: string;
  kind: string;
  /** persona / emotion / source / group. Default: emma for persona kinds. */
  scope?: string;
  /** kebab-case, most general word first. Default: from the file name. */
  name?: string;
  id?: string;
  title?: string;
  licence: string | Rec; // a LICENCES preset key, or a full licence object
  tags?: string[]; // "persona=emma", "colour=black", "mood=calm", "season=fall", or free words
  fields?: Rec; // kind-specific fields (dotted keys allowed: "app.build")
  extras?: { role: string; file: string }[]; // cutout / thumb / proof files
  frames?: string; // a folder of numbered frames (Zee clips)
  source?: Rec;
  costUsd?: number;
  costCalls?: number;
  aiGenerated?: boolean;
  by: string;
  byType?: "agent" | "human";
  supersedes?: string;
  push?: boolean; // upload to S3 right away (default true)
};

const PERSONA_KINDS = new Set(["face", "selfie", "tryon", "garment", "photo"]);

export const addAsset = (inp: AddInput) => {
  if (!KINDS.includes(inp.kind as (typeof KINDS)[number])) throw new Error(`--kind must be one of ${KINDS.join(", ")}`);
  if (!existsSync(inp.file)) throw new Error(`no such file: ${inp.file}`);
  const fields: Rec = {};
  for (const [k, v] of Object.entries(inp.fields ?? {})) if (v !== "" && v !== undefined) setPath(fields, k, coerce(v));
  if (inp.kind === "tryon" && typeof fields.wearing === "string") fields.wearing = (fields.wearing as string).split(",").map((s) => s.trim()).filter(Boolean);
  let scope = inp.scope ?? (PERSONA_KINDS.has(inp.kind) ? "emma" : inp.kind === "zee" ? String(fields.emotion ?? "") : inp.kind === "footage" ? String(fields.account ?? "emma") : "curate");
  let name = inp.name ? kebab(inp.name) : kebab(basename(inp.file, extname(inp.file)));
  if (inp.kind === "zee" && fields.part) name = String(fields.part);
  if (inp.kind === "footage") {
    const moment = String(fields.moment ?? name);
    const build = (fields.app as Rec | undefined)?.build;
    name = build ? `${moment}-b${build}` : moment;
    fields.moment = moment;
    fields.account ??= scope;
  }
  let version = 0;
  if (inp.id) {
    const p = parseId(inp.id);
    if (!p || p.kind !== inp.kind) throw new Error(`--id must be ${inp.kind}.<scope>.<name>.v<N>`);
    ({ scope, name, version } = p);
  }
  if (!SEGMENT.test(scope) || !SEGMENT.test(name)) throw new Error(`scope "${scope}" and name "${name}" must be kebab-case`);
  const existing = nextVersion(inp.kind, scope, name) - 1;
  if (!version) version = existing + 1;
  else if (version <= existing) throw new Error(`${inp.kind}.${scope}.${name}.v${version} exists. Never overwrite: use tools/catalog replace <id> <file> for a new version.`);
  if (existing && !inp.supersedes && !inp.id) throw new Error(`${inp.kind}.${scope}.${name}.v${existing} already exists. To change it use: tools/catalog replace ${inp.kind}.${scope}.${name}.v${existing} <file>`);
  const id = `${inp.kind}.${scope}.${name}.v${version}`;
  const h = home(inp.kind, scope, name, fields);
  const ext = extname(inp.file).toLowerCase().replace(".jpeg", ".jpg");

  // copy into library/ (unless it is already the right file there)
  // footage files are named <persona>-b<build>.vN inside footage/<moment>/ (the folder already says the moment)
  const fileBase = inp.kind === "footage" ? `${fields.account}-b${(fields.app as Rec | undefined)?.build ?? "x"}` : name;
  const rel = `${h.dir}/${fileBase}.v${version}${ext}`;
  const already = relative(LIB, inp.file);
  const mainRel = !already.startsWith("..") && existsSync(join(LIB, already)) ? already.split("\\").join("/") : rel;
  if (mainRel === rel) place(inp.file, rel);
  const files: FileRef[] = [fileRefAt(mainRel, "original")];
  for (const x of inp.extras ?? []) {
    const sub = x.role === "cutout" ? "cutouts" : x.role === "thumb" ? "thumbs" : x.role;
    const xr = `${h.dir}/${sub}/${name}.v${version}${extname(x.file).toLowerCase()}`;
    place(x.file, xr);
    files.push(fileRefAt(xr, x.role));
  }
  const facts = probe(join(LIB, mainRel));
  if (inp.frames) {
    const fdir = `${h.dir}/${name}.v${version}`;
    if (existsSync(join(LIB, fdir))) throw new Error(`library/${fdir} exists`);
    cpSync(inp.frames, join(LIB, fdir), { recursive: true });
    const t = treeSha(join(LIB, fdir));
    const first = readdirSync(join(LIB, fdir)).sort()[0];
    const ff = probe(join(LIB, fdir, first));
    fields.frames = { dir: fdir, pattern: `%0${first.replace(/\..*$/, "").length}d${extname(first)}`, count: t.count, fps: Number(fields.fps ?? 30), treeSha256: t.sha256, bytes: t.bytes };
    if (ff.w && ff.h) fields.dims ??= { w: ff.w, h: ff.h };
  }
  const preset = typeof inp.licence === "string" ? LICENCES[inp.licence] : undefined;
  if (typeof inp.licence === "string" && !preset) throw new Error(`unknown licence preset "${inp.licence}" (one of ${Object.keys(LICENCES).join(", ")}), or pass a full licence object`);
  const licence = { ...(preset ? preset.licence : (inp.licence as Rec)), checkedAt: today() };
  const tags: Rec = { mood: [], colour: [], season: [], free: [] };
  for (const t of inp.tags ?? []) {
    const [k, v] = t.includes("=") ? t.split("=") : t.includes(":") ? t.split(":") : [null, t];
    if (k === "persona" || k === "moment") tags[k] = v;
    else if (k && Array.isArray(tags[k])) (tags[k] as string[]).push(v);
    else (tags.free as string[]).push(k ? `${k}:${v}` : v);
  }
  if (PERSONA_KINDS.has(inp.kind)) tags.persona ??= scope;
  const rec: Rec = {
    id,
    kind: inp.kind,
    title: inp.title ?? String(fields.name ?? name.replace(/-/g, " ")),
    files,
    tags,
    source: { type: preset?.source ?? "original", from: [], ...(inp.source ?? {}) },
    licence,
    cost: { usd: inp.costUsd ?? 0, calls: inp.costCalls ?? 0 },
    createdBy: { type: inp.byType ?? "agent", name: inp.by, at: today() },
    status: "draft",
    aiGenerated: inp.aiGenerated ?? preset?.aiGenerated ?? false,
    ...(inp.supersedes ? { supersedes: inp.supersedes } : {}),
  };
  if (facts.w && facts.h && !fields.dims) rec.dims = { w: facts.w, h: facts.h };
  if (facts.durationSec) rec.durationSec = facts.durationSec;
  if (facts.fps && inp.kind === "footage") rec.fps = facts.fps;
  if (inp.kind === "music") rec.beatGrid = fields.bpm ? "estimated" : "unknown";
  if (inp.kind === "footage") Object.assign(rec, { device: "unknown", cleanStatusBar: false, app: { env: "prod" } });
  if (inp.kind === "screenshot") Object.assign(rec, { device: "unknown", cleanStatusBar: false, account: scope, app: { env: "prod" } });
  if (inp.kind === "zee") rec.pack ??= "unknown";
  for (const [k, v] of Object.entries(fields)) {
    if (k === "app" && typeof v === "object") rec.app = { ...(rec.app as Rec), ...(v as Rec) };
    else rec[k] = v;
  }
  if (inp.kind === "garment" && files.some((f) => f.role === "cutout")) {
    const c = probe(join(LIB, files.find((f) => f.role === "cutout")!.path));
    if (c.w && c.h) rec.cutoutDims = { w: c.w, h: c.h };
  }
  const parsed = Asset.safeParse(rec);
  if (!parsed.success) {
    // undo the copy so a failed add leaves nothing behind
    for (const f of files) if (f.path !== already) rmSync(join(LIB, f.path), { force: true });
    if (inp.frames) rmSync(join(LIB, `${h.dir}/${name}.v${version}`), { recursive: true, force: true });
    throw new Error(parsed.error.issues.map((i) => `${i.path.join(".") || "asset"}: ${i.message}`).join("; "));
  }
  const mpath = join(LIB, h.manifest);
  const m: M = existsSync(mpath) ? readJson<M>(mpath) : { $schema: `${"../".repeat(h.manifest.split("/").length)}catalog/schemas/manifest.schema.json`, about: h.about, assets: [] };
  m.assets.push(parsed.data as unknown as Rec);
  saveManifest(mpath, m);
  rebuild();
  let pushed = false;
  if (inp.push !== false) {
    pushEntries([entryOf(id)], { quiet: true });
    pushed = true;
  }
  return { id, manifest: relative(ROOT, mpath), files: files.map((f) => `library/${f.path}`), pushed };
};

/** A new version of an existing asset from a new file: same kind/scope/name/fields, vN+1, supersedes the old. */
export const replaceAsset = (id: string, file: string, o: { by: string; byType?: "agent" | "human"; push?: boolean; extras?: { role: string; file: string }[]; costUsd?: number } ) => {
  const { a } = findAsset(id);
  const p = parseId(id)!;
  const keep: Rec = { ...a };
  for (const k of ["id", "kind", "title", "files", "tags", "source", "licence", "cost", "createdBy", "status", "approvedBy", "approvedAt", "supersedes", "aiGenerated", "dims", "durationSec", "fps", "frames", "cutoutDims"]) delete keep[k];
  const t = a.tags as { persona?: string; moment?: string; mood: string[]; colour: string[]; season: string[]; free: string[] };
  const tags = [...(t.persona ? [`persona=${t.persona}`] : []), ...(t.moment ? [`moment=${t.moment}`] : []), ...t.mood.map((x) => `mood=${x}`), ...t.colour.map((x) => `colour=${x}`), ...t.season.map((x) => `season=${x}`), ...t.free];
  const v = nextVersion(p.kind, p.scope, p.name);
  return addAsset({
    file,
    kind: p.kind,
    id: `${p.kind}.${p.scope}.${p.name}.v${v}`,
    title: String(a.title),
    licence: a.licence as Rec,
    tags,
    fields: keep,
    extras: o.extras,
    source: a.source as Rec,
    aiGenerated: a.aiGenerated as boolean,
    costUsd: o.costUsd,
    by: o.by,
    byType: o.byType,
    supersedes: id,
    push: o.push,
  });
};

/** Edit tags (metadata only: allowed on any status, files never change). */
export const tagAsset = (id: string, add: string[], remove: string[]) => {
  const { mpath, m, a } = findAsset(id);
  const t = a.tags as Rec & { mood: string[]; colour: string[]; season: string[]; free: string[] };
  const split = (s: string) => (s.includes("=") ? s.split("=") : s.includes(":") ? s.split(":") : [null, s]) as [string | null, string];
  for (const s of remove) {
    const [k, v] = split(s);
    if (k === "persona" || k === "moment") delete t[k];
    else if (k && Array.isArray(t[k])) t[k] = (t[k] as string[]).filter((x) => x !== v);
    else t.free = t.free.filter((x) => x !== s && x !== v);
  }
  for (const s of add) {
    const [k, v] = split(s);
    if (k === "persona" || k === "moment") t[k] = v;
    else if (k && Array.isArray(t[k])) (t[k] as string[]).includes(v) || (t[k] as string[]).push(v);
    else t.free.includes(s) || t.free.push(s);
  }
  saveManifest(mpath, m);
  rebuild();
  return { id, tags: t };
};

export const retireAsset = (id: string, o: { for?: string } = {}) => {
  const { mpath, m, a } = findAsset(id);
  a.status = "retired";
  if (o.for) a.description = `${a.description ? `${a.description} ` : ""}Retired for ${o.for}.`;
  saveManifest(mpath, m);
  rebuild();
  return { id, status: "retired" };
};

/**
 * remove = retire, unless --force on a DRAFT: then the manifest entry, the local files and the
 * S3 objects go (S3 keeps the bytes 90 days as non-current versions). Approved assets are never
 * hard-deleted; ads that list the id block the delete too.
 */
export const removeAsset = (id: string, o: { force?: boolean } = {}) => {
  if (!o.force) return { ...retireAsset(id), note: "retired (the default). Hard delete only for drafts: add --force." };
  const { mpath, m, i, a } = findAsset(id);
  if (a.status !== "draft") throw new Error(`${id} is ${a.status}: only drafts can be hard-deleted. Use retire.`);
  const users = findAds().filter((p) => readJson<{ assets: string[] }>(join(ROOT, p)).assets.includes(id));
  if (users.length) throw new Error(`${id} is used by ${users.join(", ")}; remove it there first`);
  let entry: Entry | null = null;
  try {
    entry = entryOf(id);
  } catch {
    /* not indexed yet */
  }
  m.assets.splice(i, 1);
  saveManifest(mpath, m);
  for (const f of a.files as FileRef[]) rmSync(join(LIB, f.path), { force: true });
  const fr = a.frames as { dir: string } | undefined;
  if (fr) rmSync(join(LIB, fr.dir), { recursive: true, force: true });
  if (entry) deleteRemote(entry);
  // a deleted draft is no longer any prompt's output
  for (const p of loadPrompts().ok) if (p.meta.outputs.includes(id)) writePromptFile({ ...p.meta, outputs: p.meta.outputs.filter((x) => x !== id) }, p.body);
  rebuild();
  return { id, status: "deleted" };
};

/** Founder sign-off. Approving a new version retires the one it supersedes. */
export const approveAsset = (id: string, by: string) => {
  if (!by) throw new Error("approve needs --by <who approved>");
  const { mpath, m, a } = findAsset(id);
  a.status = "approved";
  a.approvedBy = by;
  a.approvedAt = today();
  saveManifest(mpath, m);
  if (a.supersedes) {
    try {
      const old = findAsset(String(a.supersedes));
      if (old.a.status !== "retired") {
        old.a.status = "retired";
        old.a.description = `${old.a.description ? `${old.a.description} ` : ""}Superseded by ${id}.`;
        saveManifest(old.mpath, old.m);
      }
    } catch {
      /* the old one is gone */
    }
  }
  rebuild();
  return { id, status: "approved", by };
};

/**
 * Point assets at the prompt that made them (source.promptId), or clear it (null). Metadata only:
 * allowed on any status, files never change. One rebuild for the whole batch. The prompt side
 * (its outputs) is written by tools/lib/prompts.ts › linkOutputs, which calls this.
 */
export const setSourcePrompts = (pairs: [assetId: string, promptId: string | null][]) => {
  const touched = new Map<string, M>();
  for (const [id, promptId] of pairs) {
    const { mpath, m, i } = findAsset(id);
    const mm = touched.get(mpath) ?? m;
    touched.set(mpath, mm);
    const a = mm.assets[i];
    const src = { ...(a.source as Rec) };
    if (promptId) src.promptId = promptId;
    else delete src.promptId;
    a.source = src;
  }
  for (const [mpath, m] of touched) saveManifest(mpath, m);
  if (touched.size) rebuild();
  return { assets: pairs.length, manifests: touched.size };
};
