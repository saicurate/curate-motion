#!/usr/bin/env node
// tools/render: render an ad to its formats × lengths, through the render queue.
//
//   tools/render <ad-id> [--format 9x16 …] [--length 15 …] [--channel tiktok] [--draft] [--queue-only]
//                        [--voice captions|human|tts] [--tts <profile>]   per-render voice override (config/voice.json is the default)
//                        [--props '<json>'] [--name <variant>]          extra composition props (e.g. '{"bumper":"tryons"}'), named in the file: <ad>-<variant>_…
//                        [--concurrency <n>]                              Chrome tabs at once (default 3; use 1 for heavy 3D/footage scenes, which drop layers above it)
//                        [--frames <a-b>]                                 only those frames (a critic round re-rendering the seconds it fixed); named …_f<a>-<b>_vN
//   tools/render run          render everything queued
//   tools/render queue        print the queue
//
// For each job it stages ONLY the ad's assets (hard links from library/) into .stage/<ad>/ and
// renders with --public-dir pointing there, so Remotion never copies the whole library.
// Output: renders/<ad>/<channel>/<length>s/<ad>_<channel>_<format>_<length>s_v<N>.mp4 (never overwritten).
// The queue lives in renders/queue.json; the library browser (tracker/) shows it.
// Ads with a script.json also get their resolved voice (motion/narration-plan.ts): its audio is
// staged, its captions are written next to the mp4 as .srt / .vtt, and a voiced render with missing
// audio, or an approved/live ad with a draft or preview-only voice, is refused.
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { toSrt, toVtt, type NarrationPlan } from "../motion/narration-plan.ts";
import { planFor } from "./lib/voice.ts";
import { dirname, join } from "node:path";
import { AdSpec, CHANNEL_FORMAT, compositionId, renderPath, type FormatId } from "../schemas/ad.ts";
import { list, parseArgs, readJson, ROOT, writeJson } from "./lib/core.ts";
import { stage } from "./lib/stage.ts";

type Job = {
  id: string;
  ad: string;
  composition: string;
  format: FormatId;
  length: number;
  channel: string;
  out: string;
  draft: boolean;
  status: "queued" | "rendering" | "done" | "failed";
  queuedAt: string;
  startedAt?: string;
  finishedAt?: string;
  error?: string;
  by: string;
  /** Per-render voice override (--voice / --tts), and what the voice resolved to. */
  voiceOverride?: { mode?: "captions" | "human" | "tts"; tts?: { use?: string } };
  voice?: string;
  /** Extra composition props (--props '<json>'), e.g. a bumper variant; merged into the render's props. */
  props?: Record<string, unknown>;
  /** Variant name (--name), added to the file name: <ad>-<name>_<channel>_… */
  name?: string;
  /** Chrome tabs rendering at once (--concurrency, default 3). 1 is the safe choice for heavy 3D scenes: above it Chrome can drop layers. */
  concurrency?: number;
  /** Only these frames (--frames a-b): a critic round's re-render of the seconds it fixed. */
  frames?: string;
};

const QUEUE = join(ROOT, "renders", "queue.json");
const args = parseArgs(process.argv.slice(2));
const now = () => new Date().toISOString();

const readQueue = (): Job[] => (existsSync(QUEUE) ? readJson<{ jobs: Job[] }>(QUEUE).jobs : []);
const saveQueue = (jobs: Job[]) => {
  writeJson(QUEUE, { updated: now(), jobs });
  mkdirSync(join(ROOT, "tracker", "data"), { recursive: true });
  writeFileSync(join(ROOT, "tracker", "data", "queue.js"), `window.CURATE_QUEUE = ${JSON.stringify({ updated: now(), jobs })};\n`);
};

const nextVersion = (ad: string, channel: string, format: FormatId, length: number, taken: Set<string>, name?: string) => {
  for (let v = 1; ; v++) {
    let p = renderPath(ad, channel, format, length, v);
    if (name) p = p.replace(`/${ad}_${channel}_`, `/${ad}-${name}_${channel}_`);
    if (!existsSync(join(ROOT, p)) && !taken.has(p)) return p;
  }
};

const voiceOverride = () => ({
  ...(typeof args.voice === "string" ? { mode: args.voice as "captions" | "human" | "tts" } : {}),
  ...(typeof args.tts === "string" ? { tts: { use: args.tts } } : {}),
});

/** The resolved narration for a job, or null for an ad without a script. Throws if it can't render. */
const narration = (j: Job, status: string): NarrationPlan | null => {
  if (!existsSync(join(ROOT, "ads", j.ad, "script.json"))) return null;
  const plan = planFor(j.ad, { override: j.voiceOverride, length: j.length });
  const v = plan.voice;
  if (plan.missing.length) throw new Error(`${j.ad}: ${v.mode} voice has no audio for ${plan.missing.join(", ")}. Run: tools/voice ${v.mode === "tts" ? `generate ${j.ad} --yes` : `import ${j.ad} <file>`} (or render --voice captions)`);
  if ((status === "approved" || status === "live") && plan.lines.some((l) => l.audio && (l.audio.previewOnly || l.audio.status !== "approved")))
    throw new Error(`${j.ad} is ${status}: its voice must be approved, never preview-only`);
  return plan;
};

const enqueue = (adId: string) => {
  const spec = AdSpec.parse(readJson(join(ROOT, "ads", adId, "ad.json")));
  const formats = (list(args.format).length ? list(args.format) : spec.formats) as FormatId[];
  const lengths = list(args.length).length ? list(args.length).map(Number) : spec.lengths;
  const jobs = readQueue();
  const taken = new Set(jobs.filter((j) => j.status !== "failed").map((j) => j.out));
  for (const format of formats) {
    if (!spec.formats.includes(format)) throw new Error(`${adId} does not list format ${format} in ad.json`);
    for (const length of lengths) {
      if (!spec.lengths.includes(length)) throw new Error(`${adId} does not list length ${length} in ad.json`);
      if (format.startsWith("appstore") && (length < 15 || length > 30)) continue; // App Store: 15–30 s only
      const channel = typeof args.channel === "string" ? args.channel : (spec.channels.find((c) => CHANNEL_FORMAT[c] === format) ?? "master");
      const frames = typeof args.frames === "string" ? args.frames : undefined;
      if (frames && !/^\d+-\d+$/.test(frames)) throw new Error("--frames must be a-b (frame numbers)");
      const name = typeof args.name === "string" ? args.name : frames ? `f${frames}` : undefined;
      if (name && !/^[a-z0-9-]+$/.test(name)) throw new Error("--name must be kebab-case");
      const extra = typeof args.props === "string" ? (JSON.parse(args.props) as Record<string, unknown>) : undefined;
      const out = nextVersion(adId, channel, format, length, taken, name);
      taken.add(out);
      const vo = voiceOverride();
      jobs.push({ id: `${adId}-${format}-${length}-${Date.now().toString(36)}`, ad: adId, composition: compositionId(adId, format, length), format, length, channel, out, draft: !!args.draft, status: "queued", queuedAt: now(), by: String(args.by ?? "agent"), ...(Object.keys(vo).length ? { voiceOverride: vo } : {}), ...(extra ? { props: extra } : {}), ...(name ? { name } : {}), ...(args.concurrency ? { concurrency: Number(args.concurrency) } : {}), ...(frames ? { frames } : {}) });
      console.log(`queued  ${out}`);
    }
  }
  saveQueue(jobs);
};

const run = () => {
  const jobs = readQueue();
  for (const j of jobs.filter((x) => x.status === "queued")) {
    j.status = "rendering";
    j.startedAt = now();
    saveQueue(jobs);
    try {
      const spec = AdSpec.parse(readJson(join(ROOT, "ads", j.ad, "ad.json")));
      const plan = narration(j, spec.status);
      const voiceIds = plan ? [...new Set(plan.lines.flatMap((l) => (l.audio ? [l.audio.id] : [])))] : [];
      if (plan) j.voice = plan.voice.mode === "tts" ? `tts:${plan.voice.tts.use}` : plan.voice.mode === "human" ? `human:${plan.voice.human.take ?? "per-line"}` : "captions";
      const pub = stage(j.ad, [...spec.assets, ...voiceIds]);
      mkdirSync(dirname(join(ROOT, j.out)), { recursive: true });
      const q = j.draft ? ["--crf=30", "--scale=0.5"] : ["--crf=18"];
      const props: string[] = [];
      if (j.voiceOverride || j.props) {
        const pf = join(ROOT, ".cache", "render-props", `${j.id}.json`);
        mkdirSync(dirname(pf), { recursive: true });
        writeFileSync(pf, JSON.stringify({ ...(j.props ?? {}), ...(j.voiceOverride ? { voice: j.voiceOverride } : {}) }));
        props.push(`--props=${pf}`);
      }
      const r = spawnSync("npx", ["remotion", "render", j.composition, j.out, `--public-dir=${pub}`, "--codec=h264", `--concurrency=${j.concurrency ?? 3}`, ...(j.frames ? [`--frames=${j.frames}`] : []), ...q, ...props], { cwd: ROOT, stdio: "inherit" });
      if (r.status !== 0) throw new Error(`remotion render exited ${r.status}`);
      // sidecar captions, whatever the mode (captions are always available)
      for (const kind of plan?.voice.captions.sidecar ?? []) writeFileSync(join(ROOT, j.out.replace(/\.mp4$/, `.${kind}`)), kind === "srt" ? toSrt(plan!) : toVtt(plan!));
      j.status = "done";
    } catch (e) {
      j.status = "failed";
      j.error = (e as Error).message;
      console.log(`ERROR ${j.error}`);
    }
    j.finishedAt = now();
    saveQueue(jobs);
  }
};

try {
  const c = args._[0];
  if (!c) console.log("usage: tools/render <ad-id> [--format …] [--length …] [--draft] [--queue-only] | run | queue");
  else if (c === "queue") for (const j of readQueue()) console.log(`${j.status.padEnd(9)} ${j.out}${j.error ? `  (${j.error})` : ""}`);
  else if (c === "run") run();
  else {
    enqueue(c);
    if (!args["queue-only"]) run();
  }
} catch (e) {
  console.log(`ERROR ${(e as Error).message}`);
  process.exit(1);
}
