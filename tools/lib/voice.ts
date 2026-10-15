// The voiceover's Node side: TTS providers (pluggable), the cost estimate and spend cap, the
// cache, and registering clips and takes as `voice` assets. Used by tools/voice and tools/render.
// The timing itself lives in motion/narration-plan.ts so the Remotion bundle shares it.
import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { extname, join } from "node:path";
import { AdSpec } from "../../schemas/ad.ts";
import { Script, VoiceConfig, type TtsProfile } from "../../schemas/voice.ts";
import { planNarration, resolveVoice, spokenText, ttsIdentity, type IndexLike } from "../../motion/narration-plan.ts";
import { addAsset, loadIndex, rebuild } from "./catalog.ts";
import { aws, findManifests, probe, readJson, ROOT, today, writeJson } from "./core.ts";
import { Manifest } from "../../schemas/asset.ts";

type Rec = Record<string, unknown>;

export const CONFIG_PATH = join(ROOT, "config", "voice.json");
export const loadConfig = () => VoiceConfig.parse(readJson(CONFIG_PATH));
export const loadAd = (ad: string) => AdSpec.parse(readJson(join(ROOT, "ads", ad, "ad.json")));
export const scriptPath = (ad: string) => join(ROOT, "ads", ad, "script.json");
export const loadScript = (ad: string) => {
  if (!existsSync(scriptPath(ad))) throw new Error(`ads/${ad}/script.json is missing: the words go there (schemas/voice.ts › Script)`);
  return Script.parse(readJson(scriptPath(ad)));
};
export const index = () => loadIndex().assets as unknown as IndexLike[];

/** The narration plan for an ad, exactly as the Remotion bundle computes it. */
export const planFor = (ad: string, o: { override?: Rec; length?: number; fps?: number } = {}) => {
  const spec = loadAd(ad);
  const script = loadScript(ad);
  const voice = resolveVoice(readJson(CONFIG_PATH), spec.voice, o.override);
  const scenes = o.length !== undefined ? script.cuts[String(o.length)] : undefined;
  return planNarration({ script, voice, index: index(), scenes, fps: o.fps ?? spec.fps });
};

// ---------------------------------------------------------------- providers

export type Licence = { name: string; url?: string; commercial: boolean; attributionRequired?: boolean; restrictions: string[]; proof?: string };

export type TtsAdapter = {
  name: string;
  /** What the provider's terms say about using its output, recorded on every clip. */
  licence: Licence;
  /** The AWS SSM parameter NAME holding its key (never the value), if it needs one. */
  secretName?: string;
  /** Free and offline previews only (never shipped). */
  previewOnly: boolean;
  /** USD for one line. Prices as published on `pricedAt` (see `priceSource`). */
  estimateUsd: (text: string, p: TtsProfile) => number;
  priceNote: string;
  priceSource: string;
  pricedAt: string;
  /** Write `text` spoken by profile `p` to `out` (its extension is the format). */
  synth: (text: string, p: TtsProfile, out: string) => Promise<void>;
};

const words = (t: string) => t.trim().split(/\s+/).length;

/** OpenAI text-to-speech (gpt-4o-mini-tts / tts-1 / tts-1-hd). Paid. The key is read from SSM into memory only. */
const openai: TtsAdapter = {
  name: "openai",
  licence: {
    name: "OpenAI API output (customer owns the output; OpenAI Services Agreement and Usage Policies)",
    url: "https://openai.com/policies/services-agreement/",
    commercial: true,
    attributionRequired: false,
    restrictions: ["disclose-ai-generated-voice-to-listeners", "openai-usage-policies", "no-impersonation-of-real-people"],
    proof:
      "https://developers.openai.com/api/docs/guides/text-to-speech: OpenAI's usage policies \"require you to provide a clear disclosure to end users that the TTS voice they are hearing is AI-generated\" and not a human voice (checked 2026-10-15).",
  },
  secretName: "/curate/openai-api-key",
  previewOnly: false,
  // tts-1 $15 and tts-1-hd $30 per 1M characters; gpt-4o-mini-tts $0.60/1M text tokens + $12/1M audio tokens
  // (OpenAI's own rule of thumb: about $0.015 a minute of speech). Estimate minutes from words at 150 wpm.
  estimateUsd: (text, p) => {
    const m = p.model ?? "gpt-4o-mini-tts";
    if (m === "tts-1") return (text.length * 15) / 1e6;
    if (m === "tts-1-hd") return (text.length * 30) / 1e6;
    const minutes = words(text) / 150 / (p.speed || 1);
    const inTokens = (text.length + (p.style?.length ?? 0)) / 4;
    return minutes * 0.015 + (inTokens * 0.6) / 1e6;
  },
  priceNote: "gpt-4o-mini-tts ≈ $0.015/min of speech (+ $0.60/1M text tokens); tts-1 $15/1M chars; tts-1-hd $30/1M chars",
  priceSource: "https://developers.openai.com/api/docs/pricing",
  pricedAt: "2026-10-15",
  synth: async (text, p, out) => {
    const key = readKey(openai.secretName!, "OpenAI");
    const fmt = extname(out).slice(1);
    const want = fmt === "mp3" ? "mp3" : "wav"; // m4a: fetch wav, then convert
    const model = p.model ?? "gpt-4o-mini-tts";
    const body: Rec = { model, voice: p.voice, input: text, response_format: want, speed: p.speed };
    if (p.style && model.startsWith("gpt-")) body.instructions = p.style;
    const r = await fetch("https://api.openai.com/v1/audio/speech", { method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!r.ok) throw new Error(`OpenAI TTS ${r.status}: ${(await r.text()).slice(0, 200)}`);
    const buf = Buffer.from(await r.arrayBuffer());
    if (want === fmt) return writeFileSync(out, buf);
    const tmp = `${out}.${want}`;
    writeFileSync(tmp, buf);
    execFileSync("afconvert", ["-f", "m4af", "-d", "aac", tmp, out], { stdio: "ignore" });
    rmSync(tmp, { force: true });
  },
};

/** Read a provider key from SSM into memory, with a plain message when it isn't set up. Never printed. */
const readKey = (name: string, provider: string) => {
  if (!secretExists(name)) throw new Error(`${provider} key not set up: there is no SSM parameter ${name}. Add it (AGENTS.md › "How to change the voice"), then run again.`);
  return aws(["ssm", "get-parameter", "--name", name, "--with-decryption", "--query", "Parameter.Value", "--output", "text"])!.trim();
};

/** Models ElevenLabs bills at half a credit per character (GET /v1/models › character_cost_multiplier 0.5). */
const ELEVEN_HALF = /flash|turbo|conversational/;
/**
 * Curate's account is on Starter: $6 a month for 40,000 credits (checked 2026-10-15 with GET
 * /v1/user/subscription), so a credit costs $0.00015. Generation spends the plan's credits, not
 * per-call dollars; the spend log records credits × that rate. (Pay-as-you-go API price is lower,
 * $0.08 per 1,000 characters for v2/v3, but that isn't how this account is billed.)
 */
const ELEVEN_USD_PER_CREDIT = 6 / 40000;
let elevenKey: string | undefined;
let elevenTierChecked = false;

/**
 * ElevenLabs text-to-speech (POST /v1/text-to-speech/{voice_id}, header xi-api-key). Paid. `voice` is
 * a voice id from their library; `model` defaults to eleven_multilingual_v2 (their stable, most
 * natural TTS-endpoint model; eleven_v3 also works). Commercial use needs a PAID plan (Starter or
 * above), so a key on the Free plan is refused rather than making clips that could never ship.
 */
const elevenlabs: TtsAdapter = {
  name: "elevenlabs",
  licence: {
    name: "ElevenLabs output (ElevenLabs Terms of Service): commercial use only on a paid plan (Starter or above)",
    url: "https://elevenlabs.io/terms-of-use",
    commercial: true,
    attributionRequired: false,
    restrictions: [
      "commercial-use-requires-paid-elevenlabs-plan-starter-or-above",
      "free-plan-output-is-non-commercial-and-must-credit-elevenlabs-never-ship-it",
      "keep-the-paid-plan-active-when-generating-clips-that-ship",
      "disclose-ai-generated-voice-to-listeners",
      "elevenlabs-prohibited-use-policy",
      "no-impersonation-of-real-people",
    ],
    proof:
      "https://elevenlabs.io/pricing: \"Commercial License\" is listed from the Starter plan up and not on Free (checked 2026-10-15). Curate's account is on Starter (paid, active; GET /v1/user/subscription, 2026-10-15). The adapter checks the key's plan on every run and refuses a Free-plan key.",
  },
  secretName: "/curate/elevenlabs-api-key",
  previewOnly: false,
  // credits = characters × the model's multiplier (1 for v2 / v3 / v4; 0.5 for Flash / Turbo), priced at the Starter plan's rate
  estimateUsd: (text, p) => text.length * (ELEVEN_HALF.test(p.model ?? "") ? 0.5 : 1) * ELEVEN_USD_PER_CREDIT,
  priceNote: "1 credit a character (Multilingual v2 / v3 / v4; Flash / Turbo 0.5), charged to the Starter plan: $6 for 40,000 credits a month = $0.15 per 1,000 characters",
  priceSource: "https://elevenlabs.io/pricing + GET /v1/user/subscription (tier starter, 40,000 credits)",
  pricedAt: "2026-10-15",
  synth: async (text, p, out) => {
    elevenKey ??= readKey(elevenlabs.secretName!, "ElevenLabs");
    const headers = { "xi-api-key": elevenKey, "Content-Type": "application/json" };
    if (!elevenTierChecked) {
      const s = await fetch("https://api.elevenlabs.io/v1/user/subscription", { headers });
      if (s.ok) {
        const tier = String(((await s.json()) as { tier?: string }).tier ?? "");
        if (tier === "free") throw new Error("refused: the ElevenLabs key is on the Free plan, whose output can't be used commercially (and must credit ElevenLabs). Upgrade the account to Starter or above, then run again.");
        console.log(`  ElevenLabs plan: ${tier || "unknown"}`);
      } else console.log(`  ElevenLabs plan: couldn't check (HTTP ${s.status}; the key may lack the user_read permission). Make sure the account is on a paid plan before shipping.`);
      elevenTierChecked = true;
    }
    const model = p.model ?? "eleven_multilingual_v2";
    const speed = Math.min(1.2, Math.max(0.7, p.speed || 1)); // ElevenLabs takes 0.7–1.2
    const body = { text, model_id: model, voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0, use_speaker_boost: true, speed } };
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(p.voice)}?output_format=mp3_44100_128`, { method: "POST", headers, body: JSON.stringify(body) });
    if (!r.ok) throw new Error(`ElevenLabs TTS ${r.status}: ${(await r.text()).slice(0, 200)}`);
    const buf = Buffer.from(await r.arrayBuffer());
    const fmt = extname(out).slice(1);
    if (fmt === "mp3") return writeFileSync(out, buf);
    const tmp = `${out}.mp3`;
    writeFileSync(tmp, buf);
    if (fmt === "m4a") execFileSync("afconvert", ["-f", "m4af", "-d", "aac", tmp, out], { stdio: "ignore" });
    else execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", tmp, out], { stdio: "ignore" });
    rmSync(tmp, { force: true });
  },
};

/** macOS `say`: free, offline, PREVIEW ONLY (Apple's licence doesn't cover commercial use of the system voices). */
const say: TtsAdapter = {
  name: "say",
  licence: {
    name: "macOS system voice via `say` (Apple macOS Software License Agreement): preview only",
    url: "https://www.apple.com/legal/sla/",
    commercial: false,
    attributionRequired: false,
    restrictions: ["preview-only", "not-for-release", "apple-sla-system-voices-personal-non-commercial"],
    proof: "The macOS SLA licenses the system voices for personal, non-commercial use, so these clips only preview timing and are never shipped (checked 2026-10-15).",
  },
  previewOnly: true,
  estimateUsd: () => 0,
  priceNote: "free (runs on this Mac)",
  priceSource: "n/a",
  pricedAt: "2026-10-15",
  synth: async (text, p, out) => {
    const aiff = `${out}.aiff`;
    const txt = `${out}.txt`;
    writeFileSync(txt, text);
    execFileSync("say", ["-v", p.voice, "-r", String(Math.round(175 * (p.speed || 1))), "-f", txt, "-o", aiff], { stdio: "ignore" });
    const fmt = extname(out).slice(1);
    if (fmt === "m4a") execFileSync("afconvert", ["-f", "m4af", "-d", "aac", aiff, out], { stdio: "ignore" });
    else if (fmt === "wav") execFileSync("afconvert", ["-f", "WAVE", "-d", "LEI16", aiff, out], { stdio: "ignore" });
    else execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", aiff, "-q:a", "2", out], { stdio: "ignore" });
    rmSync(aiff, { force: true });
    rmSync(txt, { force: true });
  },
};

/** Every adapter. To add a provider: write an adapter here and add its name to schemas/voice.ts › TTS_PROVIDERS. */
export const PROVIDERS: Record<string, TtsAdapter> = { openai, elevenlabs, say };

/** Display names for providers (messages, the Voice panel). */
export const PROVIDER_LABEL: Record<string, string> = { openai: "OpenAI", elevenlabs: "ElevenLabs", say: "Mac voice" };

/** Does the SSM parameter exist? Asks for its NAME only; never reads the value. */
export const secretExists = (name: string) => aws(["ssm", "describe-parameters", "--parameter-filters", `Key=Name,Values=${name}`, "--query", "Parameters[].Name", "--output", "text"], true)?.trim() === name;

// ---------------------------------------------------------------- the cache and the spend cap

export const cacheKey = (text: string, p: TtsProfile) => createHash("sha256").update(JSON.stringify(ttsIdentity(text, p))).digest("hex");

const voiceEntries = () => index().filter((e) => e.kind === "voice");
/** What paid TTS has cost so far: the sum of every voice asset's cost.usd. */
export const spentUsd = () => voiceEntries().reduce((s, e) => s + Number((e.asset.cost as { usd?: number } | undefined)?.usd ?? 0), 0);
const cached = (key: string) => voiceEntries().find((e) => e.status !== "retired" && (e.asset.tts as { cacheKey?: string } | undefined)?.cacheKey === key);

const kebab = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const latestVersion = (base: string) => {
  let v = 0;
  for (const e of index()) {
    const m = new RegExp(`^${base.replace(/\./g, "\\.")}\\.v(\\d+)$`).exec(e.id);
    if (m) v = Math.max(v, Number(m[1]));
  }
  return v;
};

// ---------------------------------------------------------------- generate

export type GenerateOpts = { profile?: string; provider?: string; voice?: string; speed?: number; style?: string; lines?: string[]; yes?: boolean; push?: boolean; by: string };

export const generate = async (ad: string, o: GenerateOpts) => {
  const cfg = loadConfig();
  const spec = loadAd(ad);
  const script = loadScript(ad);
  const baseName = o.profile ?? spec.voice?.tts?.use ?? cfg.tts.use;
  const base = cfg.tts.profiles[baseName];
  if (!base) throw new Error(`no TTS profile "${baseName}" in config/voice.json (have: ${Object.keys(cfg.tts.profiles).join(", ")})`);
  const adhoc = !!(o.provider || o.voice || o.speed !== undefined || o.style !== undefined);
  const providerName = o.provider ?? base.provider;
  const adapter = PROVIDERS[providerName];
  if (!adapter) throw new Error(`no TTS provider "${providerName}" (have: ${Object.keys(PROVIDERS).join(", ")})`);
  const profile: TtsProfile = {
    ...base,
    provider: providerName as TtsProfile["provider"],
    voice: o.voice ?? base.voice,
    speed: o.speed ?? base.speed,
    style: o.style ?? base.style,
    model: o.provider && o.provider !== base.provider ? undefined : base.model,
    format: o.provider && o.provider !== base.provider ? (providerName === "say" ? "m4a" : "mp3") : base.format,
    previewOnly: adapter.previewOnly || base.previewOnly,
  };
  const profileName = adhoc ? kebab(`${providerName}-${profile.voice}`) : baseName;
  const want = o.lines?.length ? script.lines.filter((l) => o.lines!.includes(l.id)) : script.lines;
  const rows = want.map((l) => {
    const text = spokenText(l);
    const key = cacheKey(text, profile);
    const hit = cached(key);
    return { line: l, text, key, hit, chars: text.length, usd: hit ? 0 : adapter.estimateUsd(text, profile) };
  });
  const todo = rows.filter((r) => !r.hit);
  const chars = todo.reduce((s, r) => s + r.chars, 0);
  const est = todo.reduce((s, r) => s + r.usd, 0);
  const spent = spentUsd();
  const cap = cfg.tts.spendCapUsd;
  console.log(`${ad}: ${rows.length} lines, profile ${profileName} = ${profile.provider}${profile.model ? `/${profile.model}` : ""} voice "${profile.voice}" speed ${profile.speed}${profile.previewOnly ? "  (PREVIEW ONLY, not for release)" : ""}`);
  for (const r of rows) console.log(`  ${r.line.id}  ${String(r.chars).padStart(4)} chars  ${r.hit ? `cached  ${r.hit.id}` : `$${r.usd.toFixed(4)}`}  ${r.text.slice(0, 60)}${r.text.length > 60 ? "…" : ""}`);
  console.log(`to generate: ${todo.length} lines, ${chars} characters, estimated $${est.toFixed(4)}  (${adapter.priceNote}; ${adapter.priceSource}, ${adapter.pricedAt})`);
  console.log(`paid TTS so far: $${spent.toFixed(4)} · spend cap (config/voice.json › tts.spendCapUsd): $${cap.toFixed(2)}`);
  const keyExists = adapter.secretName ? secretExists(adapter.secretName) : undefined;
  if (adapter.secretName) console.log(`key: SSM ${adapter.secretName} (${keyExists ? "exists" : "MISSING"}; the value is never printed)`);
  // the same facts as the text above, for tools/voice generate --json (the library page reads it)
  const summary = {
    ad,
    profile: profileName,
    provider: profile.provider,
    model: profile.model,
    voice: profile.voice,
    previewOnly: profile.previewOnly,
    lines: rows.map((r) => ({ id: r.line.id, chars: r.chars, usd: r.usd, cached: r.hit?.id ?? null })),
    todo: todo.length,
    chars,
    est,
    spent,
    cap,
    priceNote: adapter.priceNote,
    ...(adapter.secretName ? { keyName: adapter.secretName, keyExists } : {}),
  };
  if (!o.yes) {
    console.log("dry run (the default): nothing generated, nothing spent. Add --yes to generate.");
    return { ...summary, generated: [] as string[], dryRun: true };
  }
  if (est > 0) {
    if (cap <= 0) throw new Error(`refused: this costs ~$${est.toFixed(4)} and tts.spendCapUsd is 0. Paid TTS needs the founder's OK; they raise the cap in config/voice.json.`);
    if (spent + est > cap) throw new Error(`refused: $${spent.toFixed(4)} spent + ~$${est.toFixed(4)} would pass the $${cap.toFixed(2)} cap in config/voice.json › tts.spendCapUsd.`);
    if (adapter.secretName && !keyExists) throw new Error(`refused: ${PROVIDER_LABEL[adapter.name] ?? adapter.name} key not set up (no SSM parameter ${adapter.secretName}). Add it, then run again.`);
  }
  const tmp = join(ROOT, ".cache", "voice");
  mkdirSync(tmp, { recursive: true });
  const generated: string[] = [];
  for (const r of todo) {
    const file = join(tmp, `${r.key.slice(0, 16)}.${profile.format}`);
    await adapter.synth(r.text, profile, file);
    const dur = probe(file).durationSec ?? 0;
    const name = `${r.line.id}-${profileName}`;
    const prev = latestVersion(`voice.${ad}.${name}`);
    const id = `voice.${ad}.${name}.v${prev + 1}`;
    const res = addAsset({
      file,
      kind: "voice",
      id,
      title: `${ad} ${r.line.id} · ${profileName}${profile.previewOnly ? " (preview only)" : ""}`,
      licence: { ...adapter.licence, checkedAt: today() },
      tags: [`ad=${ad}`, `line=${r.line.id}`, `profile=${profileName}`, `provider=${profile.provider}`, ...(profile.previewOnly ? ["preview-only"] : [])],
      fields: {
        ad,
        origin: "tts",
        lines: [{ line: r.line.id, text: r.line.text, startSec: 0, endSec: dur }],
        tts: { provider: profile.provider, ...(profile.model ? { model: profile.model } : {}), voice: profile.voice, speed: profile.speed, ...(profile.style ? { style: profile.style } : {}), format: profile.format, text: r.text, chars: r.chars, cacheKey: r.key },
        previewOnly: profile.previewOnly,
      },
      source: { type: "generated", model: `${profile.provider}${profile.model ? `/${profile.model}` : ""}:${profile.voice}`, tool: "tools/voice generate", ...(profile.style ? { prompt: profile.style } : {}) },
      costUsd: Math.round(r.usd * 1e6) / 1e6,
      costCalls: adapter.previewOnly ? 0 : 1,
      aiGenerated: true,
      by: o.by,
      ...(prev ? { supersedes: `voice.${ad}.${name}.v${prev}` } : {}),
      push: o.push,
    });
    rmSync(file, { force: true });
    generated.push(res.id);
    console.log(`  made ${res.id}  ${dur.toFixed(2)} s  ${res.pushed ? "(in S3)" : ""}`);
  }
  if (adhoc) console.log(`note: these clips use ad-hoc settings. To render with them, add a profile with exactly these settings to config/voice.json › tts.profiles (e.g. "${profileName}") and set tts.use to it.`);
  return { ...summary, generated, dryRun: false };
};

// ---------------------------------------------------------------- human takes

export type Mark = { line: string; startSec: number; endSec: number };

/** "l01=0.40-3.52,l02=3.9-7.1" */
export const parseMarks = (s: string): Mark[] =>
  s.split(",").filter(Boolean).map((x) => {
    const m = /^\s*(l\d{2,3})\s*=\s*([\d.]+)\s*-\s*([\d.]+)\s*$/.exec(x);
    if (!m) throw new Error(`bad mark "${x}": use l01=0.40-3.52`);
    return { line: m[1], startSec: Number(m[2]), endSec: Number(m[3]) };
  });

/** An Audacity label file (start<TAB>end<TAB>label, label = the line id), or a JSON [{line,startSec,endSec}]. */
export const readMarksFile = (p: string): Mark[] => {
  const raw = readFileSync(p, "utf8");
  if (raw.trim().startsWith("[")) return JSON.parse(raw) as Mark[];
  return raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const [a, b, label] = l.split("\t");
      return { line: label.trim(), startSec: Number(a), endSec: Number(b) };
    });
};

/** Speech segments in a recording, from ffmpeg's silencedetect (pauses ≥ minPause s, quieter than noiseDb). */
export const speechSegments = (file: string, noiseDb = -35, minPause = 0.45): { startSec: number; endSec: number }[] => {
  const dur = probe(file).durationSec ?? 0;
  const log = spawnSync("ffmpeg", ["-hide_banner", "-nostats", "-i", file, "-af", `silencedetect=noise=${noiseDb}dB:d=${minPause}`, "-f", "null", "-"], { encoding: "utf8" }).stderr ?? "";
  const starts = [...log.matchAll(/silence_start: (-?[\d.]+)/g)].map((m) => Math.max(0, Number(m[1])));
  const ends = [...log.matchAll(/silence_end: ([\d.]+)/g)].map((m) => Number(m[1]));
  const segs: { startSec: number; endSec: number }[] = [];
  let at = 0;
  starts.forEach((s, i) => {
    if (s - at > 0.15) segs.push({ startSec: Math.max(0, at - 0.08), endSec: Math.min(dur, s + 0.08) });
    at = ends[i] ?? dur;
  });
  if (dur - at > 0.15) segs.push({ startSec: Math.max(0, at - 0.08), endSec: dur });
  const r2 = (n: number) => Math.round(n * 100) / 100;
  return segs.map((x) => ({ startSec: r2(x.startSec), endSec: r2(x.endSec) }));
};

export type ImportOpts = { line?: string; lines?: string[]; marks?: Mark[]; auto?: boolean; speaker?: string; release?: string; name?: string; dryRun?: boolean; push?: boolean; by: string };

const HUMAN_LICENCE = (release?: string): Licence => ({
  name: "Voice recording made for Curate (speaker's written release)",
  commercial: true,
  attributionRequired: false,
  restrictions: release ? [] : ["no-release-on-file: get the speaker's signed release before any ad goes live"],
  proof: release ?? "release not on file yet",
});

export const importTake = (ad: string, audio: string, o: ImportOpts) => {
  loadAd(ad); // the ad must exist and be valid
  const script = loadScript(ad);
  if (!existsSync(audio)) throw new Error(`no such file: ${audio}`);
  const ids = new Set(script.lines.map((l) => l.id));
  const ext = extname(audio).toLowerCase();
  let file = audio;
  if (![".wav", ".mp3", ".m4a"].includes(ext)) {
    // aiff, flac, caf…: convert to wav so Remotion can play it
    mkdirSync(join(ROOT, ".cache", "voice"), { recursive: true });
    file = join(ROOT, ".cache", "voice", `import-${Date.now()}.wav`);
    execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", audio, file]);
  }
  const dur = probe(file).durationSec ?? 0;
  let marks: Mark[] = [];
  if (o.line) {
    if (!ids.has(o.line)) throw new Error(`no line ${o.line} in ads/${ad}/script.json`);
    marks = [{ line: o.line, startSec: 0, endSec: dur }];
  } else if (o.marks?.length) marks = o.marks;
  else if (o.auto) {
    const order = o.lines?.length ? o.lines : script.lines.map((l) => l.id);
    const segs = speechSegments(file);
    console.log(`found ${segs.length} speech segments for ${order.length} lines:`);
    segs.forEach((s, i) => console.log(`  ${order[i] ?? "(extra)"}=${s.startSec}-${s.endSec}`));
    if (segs.length === order.length) marks = segs.map((s, i) => ({ line: order[i], ...s }));
    else console.log("counts differ, so no marks were set. Mark them by hand: tools/voice mark <take-id> --marks \"l01=0.40-3.52,…\" (or an Audacity label file with --marks-file)");
  }
  for (const m of marks) {
    if (!ids.has(m.line)) throw new Error(`mark for unknown line ${m.line}`);
    if (!(m.endSec > m.startSec) || m.endSec > dur + 0.05) throw new Error(`mark ${m.line}=${m.startSec}-${m.endSec} is outside the ${dur.toFixed(2)} s file`);
  }
  const name = kebab(o.name ?? (o.line ? `${o.line}-take` : "take"));
  const prev = latestVersion(`voice.${ad}.${name}`);
  const id = `voice.${ad}.${name}.v${prev + 1}`;
  const textOf = (l: string) => script.lines.find((x) => x.id === l)?.text;
  console.log(`${id}: ${dur.toFixed(2)} s, ${marks.length} line marks${o.speaker ? `, spoken by ${o.speaker}` : ""}`);
  if (o.dryRun) {
    if (file !== audio) rmSync(file, { force: true });
    return { id, marks };
  }
  const res = addAsset({
    file,
    kind: "voice",
    id,
    title: `${ad} voiceover · ${o.line ? `${o.line} ` : ""}${name}${o.speaker ? ` (${o.speaker})` : ""}`,
    licence: { ...HUMAN_LICENCE(o.release), checkedAt: today() },
    tags: [`ad=${ad}`, "origin=human", ...(o.line ? [`line=${o.line}`] : [])],
    fields: { ad, origin: "human", lines: marks.map((m) => ({ ...m, text: textOf(m.line) })), ...(o.speaker ? { speaker: o.speaker } : {}) },
    source: { type: "original", tool: "tools/voice import", ...(o.speaker ? { author: o.speaker } : {}) },
    aiGenerated: false,
    by: o.by,
    ...(prev ? { supersedes: `voice.${ad}.${name}.v${prev}` } : {}),
    push: o.push,
  });
  // record the take in ad.json › voice.human (the MODE is not changed: that is the one config edit)
  const adPath = join(ROOT, "ads", ad, "ad.json");
  const raw = readJson<Rec>(adPath);
  const v = (raw.voice ?? {}) as Rec;
  const h = (v.human ?? {}) as { take?: string; lines?: Record<string, string> };
  if (o.line) h.lines = { ...(h.lines ?? {}), [o.line]: res.id };
  else h.take = res.id;
  raw.voice = { ...v, human: h };
  AdSpec.parse(raw);
  writeJson(adPath, raw);
  if (file !== audio) rmSync(file, { force: true });
  return { id: res.id, marks };
};

/** Set (or replace) a draft take's line marks. Metadata only; an approved take needs a new version. */
export const markTake = (takeId: string, marks: Mark[]) => {
  for (const rel of findManifests()) {
    const p = join(ROOT, rel);
    const m = readJson<{ assets: Rec[] }>(p);
    const a = m.assets.find((x) => x.id === takeId);
    if (!a) continue;
    if (a.kind !== "voice" || a.origin !== "human") throw new Error(`${takeId} is not a human take`);
    if (a.status !== "draft") throw new Error(`${takeId} is ${a.status}: marks on a signed-off take need a new version (tools/voice import … --name …)`);
    const ad = String(a.ad);
    const script = loadScript(ad);
    const dur = Number(a.durationSec);
    const byLine = new Map(((a.lines as Mark[]) ?? []).map((x) => [x.line, x]));
    for (const mk of marks) {
      if (!script.lines.some((l) => l.id === mk.line)) throw new Error(`no line ${mk.line} in ads/${ad}/script.json`);
      if (!(mk.endSec > mk.startSec) || mk.endSec > dur + 0.05) throw new Error(`mark ${mk.line} is outside the ${dur} s take`);
      byLine.set(mk.line, { ...mk, text: script.lines.find((l) => l.id === mk.line)!.text } as Mark);
    }
    a.lines = [...byLine.values()].sort((x, y) => x.startSec - y.startSec);
    const r = Manifest.safeParse(m);
    if (!r.success) throw new Error(r.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "));
    writeJson(p, m);
    rebuild();
    return { id: takeId, lines: a.lines };
  }
  throw new Error(`no asset ${takeId}`);
};
