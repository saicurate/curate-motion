// Reading and changing WHICH voice the ads use: the code behind the library page's Voice panel
// (tools/library-ui) and `tools/voice use`, so both set exactly the same fields:
//
//   config/voice.json   mode · captions.burnIn · tts.use · tts.spendCapUsd (the cap: UI only, founder only)
//   ads/<ad>/ad.json    voice.mode · voice.tts.use                (anything else under voice is kept)
//
// Every write: the edit is made to the file's TEXT (so hand formatting such as one-line arrays
// survives), the result is re-parsed, checked to equal the intended change, validated with the zod
// schemas (VoiceConfig, AdSpec, and the resolved voice), and only then written atomically
// (temp file + fsync + rename). Nothing is written unless every file in the change is valid.
import { createHash, randomBytes } from "node:crypto";
import { closeSync, existsSync, fsyncSync, openSync, readdirSync, readFileSync, renameSync, rmSync, statSync, writeSync } from "node:fs";
import { dirname, join } from "node:path";
import { AdSpec } from "../../schemas/ad.ts";
import { SEGMENT } from "../../schemas/asset.ts";
import { VOICE_MODES, VoiceConfig, type TtsProfile, type VoiceMode } from "../../schemas/voice.ts";
import { resolveVoice } from "../../motion/narration-plan.ts";
import { CONFIG_PATH, PROVIDER_LABEL, PROVIDERS, planFor, scriptPath, spentUsd } from "./voice.ts";
import { ROOT } from "./core.ts";

type Rec = Record<string, unknown>;

/** The most the spending limit can be set to from the page (a guard against a typo like 1000). */
export const MAX_CAP_USD = 50;

export const MODE_LABEL: Record<VoiceMode, string> = { captions: "Captions only", human: "Human recording", tts: "AI voice" };

// ---------------------------------------------------------------- format-preserving JSON edits

type JNode = { start: number; end: number; kind: "object" | "array" | "value"; members: JMember[] };
type JMember = { key: string; start: number; end: number; value: JNode };

/** A tiny JSON parser that remembers where every value sits in the text. */
const parseSpans = (text: string): JNode => {
  let i = 0;
  const ws = () => {
    while (i < text.length && " \t\r\n".includes(text[i])) i++;
  };
  const fail = (what: string) => {
    throw new Error(`not valid JSON at character ${i}: expected ${what}`);
  };
  const str = () => {
    if (text[i] !== '"') fail("a string");
    const s = i++;
    while (i < text.length && text[i] !== '"') i += text[i] === "\\" ? 2 : 1;
    if (text[i] !== '"') fail("the end of a string");
    i++;
    return JSON.parse(text.slice(s, i)) as string;
  };
  const value = (): JNode => {
    ws();
    const start = i;
    if (text[i] === "{") {
      i++;
      const members: JMember[] = [];
      ws();
      if (text[i] === "}") return { start, end: ++i, kind: "object", members };
      for (;;) {
        ws();
        const ks = i;
        const key = str();
        ws();
        if (text[i++] !== ":") fail("':'");
        const v = value();
        members.push({ key, start: ks, end: v.end, value: v });
        ws();
        if (text[i] === ",") i++;
        else if (text[i] === "}") return { start, end: ++i, kind: "object", members };
        else fail("',' or '}'");
      }
    }
    if (text[i] === "[") {
      i++;
      ws();
      if (text[i] === "]") return { start, end: ++i, kind: "array", members: [] };
      for (;;) {
        value();
        ws();
        if (text[i] === ",") i++;
        else if (text[i] === "]") return { start, end: ++i, kind: "array", members: [] };
        else fail("',' or ']'");
      }
    }
    if (text[i] === '"') {
      str();
      return { start, end: i, kind: "value", members: [] };
    }
    const m = /^(?:-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|true|false|null)/.exec(text.slice(i, i + 64));
    if (!m) fail("a value");
    i += m![0].length;
    return { start, end: i, kind: "value", members: [] };
  };
  const root = value();
  ws();
  if (i !== text.length) fail("the end of the file");
  return root;
};

/** One-line JSON with spaces, the house style for short values: { "mode": "tts", "tts": { "use": "x" } }. */
const inline = (v: unknown): string => {
  if (Array.isArray(v)) return `[${v.map(inline).join(", ")}]`;
  if (v && typeof v === "object") {
    const e = Object.entries(v as Rec);
    return e.length ? `{ ${e.map(([k, x]) => `${JSON.stringify(k)}: ${inline(x)}`).join(", ")} }` : "{}";
  }
  return JSON.stringify(v);
};
const fmt = (v: unknown, indent: string) => {
  const one = inline(v);
  return one.length <= 90 ? one : JSON.stringify(v, null, 2).replace(/\n/g, `\n${indent}`);
};

/** Set `path` to `value` in the JSON text, touching only that value (or adding the member). */
export const setIn = (text: string, path: string[], value: unknown): string => {
  let node = parseSpans(text);
  for (let d = 0; d < path.length; d++) {
    if (node.kind !== "object") throw new Error(`${path.slice(0, d).join(".")} is not an object`);
    const m = node.members.find((x) => x.key === path[d]);
    if (!m) {
      // add the member, nesting whatever is still missing: {"tts": {"use": "x"}}
      const rest = path.slice(d + 1).reduceRight<unknown>((acc, k) => ({ [k]: acc }), value);
      const key = JSON.stringify(path[d]);
      if (!node.members.length) return text.slice(0, node.start) + `{ ${key}: ${inline(rest)} }` + text.slice(node.end);
      const n = node.members.length;
      const last = node.members[n - 1];
      let sep: string;
      if (n >= 2) sep = text.slice(node.members[n - 2].end, node.members[n - 1].start);
      else {
        const lead = text.slice(node.start + 1, node.members[0].start);
        sep = lead.includes("\n") ? `,${lead}` : ", ";
      }
      const indent = sep.includes("\n") ? sep.slice(sep.lastIndexOf("\n") + 1) : "";
      return text.slice(0, last.end) + sep + `${key}: ${fmt(rest, indent)}` + text.slice(last.end);
    }
    if (d === path.length - 1) {
      const lineStart = text.lastIndexOf("\n", m.start) + 1;
      const indent = /^[ \t]*/.exec(text.slice(lineStart))![0];
      return text.slice(0, m.value.start) + fmt(value, indent) + text.slice(m.value.end);
    }
    node = m.value;
  }
  throw new Error("empty path");
};

/** Remove `path` from the JSON text (no-op if absent). With `pruneEmpty`, parents left as {} go too. */
export const deleteIn = (text: string, path: string[], pruneEmpty = true): string => {
  let node = parseSpans(text);
  for (let d = 0; d < path.length; d++) {
    if (node.kind !== "object") return text;
    const idx = node.members.findIndex((x) => x.key === path[d]);
    if (idx < 0) return text;
    if (d < path.length - 1) {
      node = node.members[idx].value;
      continue;
    }
    const ms = node.members;
    let out: string;
    if (ms.length === 1) out = text.slice(0, node.start) + "{}" + text.slice(node.end);
    else if (idx < ms.length - 1) out = text.slice(0, ms[idx].start) + text.slice(ms[idx + 1].start);
    else out = text.slice(0, ms[idx - 1].end) + text.slice(ms[idx].end);
    if (pruneEmpty && ms.length === 1 && d > 0) return deleteIn(out, path.slice(0, -1), true);
    return out;
  }
  return text;
};

const canon = (v: unknown): string =>
  Array.isArray(v) ? `[${v.map(canon).join(",")}]` : v && typeof v === "object" ? `{${Object.keys(v as Rec).sort().map((k) => `${JSON.stringify(k)}:${canon((v as Rec)[k])}`).join(",")}}` : JSON.stringify(v);

const setObj = (o: Rec, path: string[], v: unknown) => {
  let c = o;
  for (const k of path.slice(0, -1)) c = (c[k] ??= {}) as Rec;
  c[path[path.length - 1]] = v;
};
const delObj = (o: Rec, path: string[]) => {
  const chain: Rec[] = [o];
  for (const k of path.slice(0, -1)) {
    const n = chain[chain.length - 1][k];
    if (!n || typeof n !== "object") return;
    chain.push(n as Rec);
  }
  delete chain[chain.length - 1][path[path.length - 1]];
  for (let d = chain.length - 1; d > 0 && !Object.keys(chain[d]).length; d--) delete chain[d - 1][path[d - 1]];
};

export type JsonEdit = { set: string[]; value: unknown } | { del: string[] };

/** Apply edits to JSON text, and prove the text now means exactly the intended object. */
export const editJsonText = (text: string, edits: JsonEdit[]) => {
  const want = JSON.parse(text) as Rec;
  let out = text;
  for (const e of edits) {
    if ("set" in e) {
      out = setIn(out, e.set, e.value);
      setObj(want, e.set, e.value);
    } else {
      out = deleteIn(out, e.del);
      delObj(want, e.del);
    }
  }
  const got = JSON.parse(out) as Rec;
  if (canon(got) !== canon(want)) throw new Error("internal: the edited file doesn't match the intended change; nothing was written");
  return { text: out, value: got };
};

/** Write a file atomically: a temp file in the same folder, flushed to disk, then renamed over. */
export const writeAtomic = (p: string, text: string) => {
  const tmp = join(dirname(p), `.${randomBytes(6).toString("hex")}.tmp`);
  const fd = openSync(tmp, "w", existsSync(p) ? statSync(p).mode & 0o777 : 0o644);
  try {
    writeSync(fd, text);
    fsyncSync(fd);
  } finally {
    closeSync(fd);
  }
  try {
    renameSync(tmp, p);
  } catch (e) {
    rmSync(tmp, { force: true });
    throw e;
  }
};

export const versionOf = (text: string) => createHash("sha256").update(text).digest("hex").slice(0, 16);

// ---------------------------------------------------------------- reading the state

const adPath = (ad: string) => join(ROOT, "ads", ad, "ad.json");
const issues = (r: { error: { issues: { path: PropertyKey[]; message: string }[] } }) => r.error.issues.map((i) => `${i.path.join(".") || "(file)"}: ${i.message}`).join("; ");

/** Every ad folder with an ad.json (not _template / _legacy). */
export const listAds = () =>
  readdirSync(join(ROOT, "ads"))
    .filter((n) => !n.startsWith("_") && !n.startsWith(".") && SEGMENT.test(n) && existsSync(adPath(n)))
    .sort();

const title = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** A profile in plain English, for dropdowns and messages. */
export const describeProfile = (key: string, p: TtsProfile) => {
  const shown = p.name ?? title(p.voice);
  const free = (PROVIDERS[p.provider]?.estimateUsd("Hello there.", p) ?? 0) === 0;
  const label = p.previewOnly ? `${PROVIDER_LABEL[p.provider] ?? p.provider} (${p.voice}): free preview, not for release` : `${shown} · ${PROVIDER_LABEL[p.provider] ?? p.provider}${free ? " · free" : " · paid"}`;
  const about = p.previewOnly ? "Robotic but free and instant, made on this Mac. Only for checking the timing: never in a real ad." : (p.style ?? p.note ?? "");
  const inWords = p.previewOnly ? `the Mac preview voice (${p.voice}, not for release)` : `the AI voice ${shown} (${PROVIDER_LABEL[p.provider] ?? p.provider}${free ? ", free" : ", paid"})`;
  return { key, label, about, inWords, provider: p.provider, voice: p.voice, paid: !free, previewOnly: p.previewOnly };
};

export type AdPart = { key: string; label: string; length?: number; lines: string[] };

/** The parts of an ad's script you can preview: each length cut in script.json › cuts, and the whole script. */
export const partsOf = (ad: string): AdPart[] => {
  if (!existsSync(scriptPath(ad))) return [];
  const s = JSON.parse(readFileSync(scriptPath(ad), "utf8")) as { lines: { id: string; scene: string }[]; cuts?: Record<string, string[]> };
  const spec = AdSpec.parse(JSON.parse(readFileSync(adPath(ad), "utf8")));
  const cuts = Object.entries(s.cuts ?? {}).sort(([a], [b]) => {
    const built = (k: string) => (spec.lengths.includes(Number(k)) ? 0 : 1);
    return built(a) - built(b) || Number(a) - Number(b);
  });
  const parts: AdPart[] = cuts.map(([k, scenes]) => {
    const lines = s.lines.filter((l) => scenes.includes(l.scene)).map((l) => l.id);
    return { key: k, label: `The ${k}-second cut (${lines.length} lines)`, length: Number(k), lines };
  });
  parts.push({ key: "all", label: `The whole script (${s.lines.length} lines)`, lines: s.lines.map((l) => l.id) });
  return parts;
};
export const partOf = (ad: string, key?: string) => {
  const ps = partsOf(ad);
  if (!ps.length) throw new Error(`${ad} has no voiceover script yet (ads/${ad}/script.json)`);
  const p = key ? ps.find((x) => x.key === key) : ps[0];
  if (!p) throw new Error(`${ad} has no part "${key}" (have: ${ps.map((x) => x.key).join(", ")})`);
  return p;
};

export type AdChoice = { mode: VoiceMode; use?: string };

/** Everything the Voice panel shows. Read fresh every time (the files are the truth). */
export const readVoiceState = () => {
  const cfgText = readFileSync(CONFIG_PATH, "utf8");
  const cfg = VoiceConfig.parse(JSON.parse(cfgText));
  const ads = listAds().map((id) => {
    const text = readFileSync(adPath(id), "utf8");
    const spec = AdSpec.parse(JSON.parse(text));
    const v = spec.voice ?? {};
    const override: AdChoice | null = v.mode ? { mode: v.mode, ...(v.tts?.use ? { use: v.tts.use } : {}) } : null;
    const human = { take: v.human?.take ?? null, lines: Object.keys(v.human?.lines ?? {}).length };
    const parts = partsOf(id);
    return {
      id,
      title: spec.title,
      status: spec.status,
      version: versionOf(text),
      hasScript: parts.length > 0,
      parts: parts.map(({ key, label, lines }) => ({ key, label, lines: lines.length })),
      override,
      /** An AI-voice choice without the mode (tts.use alone in ad.json), shown so it isn't a surprise. */
      strayUse: !v.mode && v.tts?.use ? v.tts.use : null,
      ownCaptions: v.captions && Object.keys(v.captions).length ? v.captions : null,
      human,
    };
  });
  return {
    version: versionOf(cfgText),
    config: { mode: cfg.mode, use: cfg.tts.use, burnIn: cfg.captions.burnIn, sidecar: cfg.captions.sidecar, capUsd: cfg.tts.spendCapUsd, gapSec: cfg.timing.gapSec },
    spentUsd: spentUsd(),
    maxCapUsd: MAX_CAP_USD,
    modes: VOICE_MODES.map((k) => ({ key: k, label: MODE_LABEL[k] })),
    profiles: Object.entries(cfg.tts.profiles).map(([k, p]) => describeProfile(k, p)),
    ads,
  };
};

// ---------------------------------------------------------------- what the next render does

/** One plain-English line per ad, "next render of <ad> uses …", and what it still needs. */
export const describeNext = (ad: string): string => {
  const spec = AdSpec.parse(JSON.parse(readFileSync(adPath(ad), "utf8")));
  if (!existsSync(scriptPath(ad))) return `${spec.title} (${ad}) has no voiceover script yet (ads/${ad}/script.json), so the voice setting doesn't apply.`;
  const part = partOf(ad);
  const plan = planFor(ad, { length: part.length });
  const v = plan.voice;
  const from = v.from.mode === "ad" ? "its own setting" : "the default for every ad";
  const caps = v.mode === "captions" ? "" : v.captions.burnIn ? ", captions burned in" : `, captions in separate ${v.captions.sidecar.map((x) => `.${x}`).join(" and ")} files`;
  const voiced = plan.lines.length;
  let what: string;
  if (v.mode === "captions") what = "captions only, no voice";
  else if (v.mode === "tts") {
    what = describeProfile(v.tts.use, v.tts.profile).inWords;
  } else what = "the human recording";
  let need = "";
  if (v.mode !== "captions") {
    const have = voiced - plan.missing.length;
    need = plan.missing.length
      ? ` ${have} of ${voiced} lines in ${part.label.replace(/ \(.*/, "").toLowerCase()} have audio: ${v.mode === "tts" ? "make the rest first (Generate, or Preview with Mac voice for a free timing check)" : "record the rest (tools/voice import)"}, or the render stops.`
      : ` All ${voiced} lines in ${part.label.replace(/ \(.*/, "").toLowerCase()} have audio.`;
    if (plan.previewOnly && plan.missing.length === 0) need += " It's the Mac preview voice: not for release.";
  }
  return `next render of ${spec.title} (${ad}) uses ${what}${caps} (${from}).${need}`;
};

// ---------------------------------------------------------------- changing it

export type VoiceChange = {
  /** The default for every ad (config/voice.json). Omitted fields stay as they are. */
  global?: { mode?: VoiceMode; use?: string; burnIn?: boolean };
  /** Per ad: null = use the default; otherwise its own mode (+ AI voice; omitted = same as the default). */
  ads?: Record<string, AdChoice | null>;
  /** The paid-TTS spending limit in USD. Founder only: the page asks them to confirm. */
  capUsd?: number;
  /** The versions the caller last read; a file changed since then is not overwritten. */
  versions?: { config?: string; ads?: Record<string, string> };
};

const isMode = (m: unknown): m is VoiceMode => typeof m === "string" && (VOICE_MODES as readonly string[]).includes(m);

/** Validate a change, write every file it touches (all or nothing), and say what the next render uses. */
export const applyVoiceChange = (ch: VoiceChange, o: { dryRun?: boolean } = {}) => {
  const cfgText = readFileSync(CONFIG_PATH, "utf8");
  if (ch.versions?.config && ch.versions.config !== versionOf(cfgText)) throw new Error("config/voice.json changed since this page loaded it (someone else saved). Reload and try again.");
  const cfg0 = VoiceConfig.parse(JSON.parse(cfgText));
  const profiles = Object.keys(cfg0.tts.profiles);
  const checkUse = (u: unknown, where: string) => {
    if (u === undefined) return;
    if (typeof u !== "string" || !cfg0.tts.profiles[u]) throw new Error(`${where}: no AI voice "${String(u)}" (have: ${profiles.join(", ")})`);
  };

  // --- config/voice.json
  const cfgEdits: JsonEdit[] = [];
  const g = ch.global ?? {};
  if (g.mode !== undefined) {
    if (!isMode(g.mode)) throw new Error(`mode must be one of ${VOICE_MODES.join(", ")}`);
    if (g.mode !== cfg0.mode) cfgEdits.push({ set: ["mode"], value: g.mode });
  }
  if (g.use !== undefined) {
    checkUse(g.use, "default");
    if (g.use !== cfg0.tts.use) cfgEdits.push({ set: ["tts", "use"], value: g.use });
  }
  if (g.burnIn !== undefined) {
    if (typeof g.burnIn !== "boolean") throw new Error("burnIn must be true or false");
    if (g.burnIn !== cfg0.captions.burnIn) cfgEdits.push({ set: ["captions", "burnIn"], value: g.burnIn });
  }
  if (ch.capUsd !== undefined) {
    const c = Number(ch.capUsd);
    if (!Number.isFinite(c) || c < 0 || c > MAX_CAP_USD) throw new Error(`the spending limit must be between $0 and $${MAX_CAP_USD}`);
    const cents = Math.round(c * 100) / 100;
    if (cents !== cfg0.tts.spendCapUsd) cfgEdits.push({ set: ["tts", "spendCapUsd"], value: cents });
  }
  const cfgNew = cfgEdits.length ? editJsonText(cfgText, cfgEdits) : { text: cfgText, value: JSON.parse(cfgText) as Rec };
  const cfgCheck = VoiceConfig.safeParse(cfgNew.value);
  if (!cfgCheck.success) throw new Error(`config/voice.json would be invalid, so nothing was saved: ${issues(cfgCheck)}`);

  // --- ads/<ad>/ad.json
  const writes: { path: string; text: string; rel: string }[] = [];
  if (cfgEdits.length) writes.push({ path: CONFIG_PATH, text: cfgNew.text, rel: "config/voice.json" });
  const known = new Set(listAds());
  const touched = new Set<string>();
  for (const [ad, choice] of Object.entries(ch.ads ?? {})) {
    if (!known.has(ad)) throw new Error(`no ad "${ad}" (have: ${[...known].join(", ")})`);
    const p = adPath(ad);
    const text = readFileSync(p, "utf8");
    if (ch.versions?.ads?.[ad] && ch.versions.ads[ad] !== versionOf(text)) throw new Error(`ads/${ad}/ad.json changed since this page loaded it. Reload and try again.`);
    const cur = AdSpec.parse(JSON.parse(text)).voice ?? {};
    const edits: JsonEdit[] = [];
    if (choice === null) {
      if (cur.mode !== undefined) edits.push({ del: ["voice", "mode"] });
      if (cur.tts?.use !== undefined) edits.push({ del: ["voice", "tts", "use"] });
    } else {
      if (!isMode(choice.mode)) throw new Error(`${ad}: mode must be one of ${VOICE_MODES.join(", ")}`);
      if (choice.use !== undefined && choice.mode !== "tts") throw new Error(`${ad}: an AI voice only applies when the mode is tts`);
      checkUse(choice.use, ad);
      if (cur.mode !== choice.mode) edits.push({ set: ["voice", "mode"], value: choice.mode });
      if (choice.use !== undefined) {
        if (cur.tts?.use !== choice.use) edits.push({ set: ["voice", "tts", "use"], value: choice.use });
      } else if (cur.tts?.use !== undefined) edits.push({ del: ["voice", "tts", "use"] });
    }
    if (!edits.length) continue;
    const next = editJsonText(text, edits);
    const r = AdSpec.safeParse(next.value);
    if (!r.success) throw new Error(`ads/${ad}/ad.json would be invalid, so nothing was saved: ${issues(r)}`);
    writes.push({ path: p, text: next.text, rel: `ads/${ad}/ad.json` });
    touched.add(ad);
  }
  // every ad must still resolve to a real voice with the new default
  for (const ad of known) {
    const w = writes.find((x) => x.path === adPath(ad));
    const spec = AdSpec.parse(JSON.parse(w ? w.text : readFileSync(adPath(ad), "utf8")));
    try {
      resolveVoice(cfgNew.value, spec.voice);
    } catch (e) {
      throw new Error(`${ad}: ${(e as Error).message}; nothing was saved`);
    }
  }

  if (!o.dryRun) for (const w of writes) writeAtomic(w.path, w.text);
  const changed = writes.map((w) => w.rel);
  const lines = o.dryRun ? [] : listAds().map(describeNext);
  return { changed, dryRun: !!o.dryRun, next: lines, message: changed.length ? `Saved ${changed.join(" and ")}.` : "Nothing changed." };
};
