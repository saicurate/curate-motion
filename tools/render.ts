#!/usr/bin/env node
// tools/render: render an ad to its formats × lengths, through the render queue.
//
//   tools/render <ad-id> [--format 9x16 …] [--length 15 …] [--channel tiktok] [--draft] [--queue-only]
//   tools/render run          render everything queued
//   tools/render queue        print the queue
//
// For each job it stages ONLY the ad's assets (hard links from library/) into .stage/<ad>/ and
// renders with --public-dir pointing there, so Remotion never copies the whole library.
// Output: renders/<ad>/<channel>/<length>s/<ad>_<channel>_<format>_<length>s_v<N>.mp4 (never overwritten).
// The queue lives in renders/queue.json; the library browser (tracker/) shows it.
import { spawnSync } from "node:child_process";
import { existsSync, linkSync, mkdirSync, readdirSync, rmSync, writeFileSync, copyFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { AdSpec, CHANNEL_FORMAT, compositionId, renderPath, type FormatId } from "../schemas/ad.ts";
import { INDEX_PATH, LIB, list, parseArgs, readJson, ROOT, writeJson } from "./lib/core.ts";

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

const nextVersion = (ad: string, channel: string, format: FormatId, length: number, taken: Set<string>) => {
  for (let v = 1; ; v++) {
    const p = renderPath(ad, channel, format, length, v);
    if (!existsSync(join(ROOT, p)) && !taken.has(p)) return p;
  }
};

const stage = (ad: string, ids: string[]) => {
  const idx = readJson<{ assets: { id: string; files: { path: string }[]; asset: { frames?: { dir: string } } }[] }>(INDEX_PATH).assets;
  const dir = join(ROOT, ".stage", ad);
  rmSync(dir, { recursive: true, force: true });
  const missing: string[] = [];
  const put = (rel: string) => {
    const from = join(LIB, rel);
    const to = join(dir, rel);
    if (!existsSync(from)) return missing.push(rel);
    mkdirSync(dirname(to), { recursive: true });
    try {
      linkSync(from, to);
    } catch {
      copyFileSync(from, to);
    }
  };
  for (const id of ids) {
    const e = idx.find((a) => a.id === id);
    if (!e) throw new Error(`${ad}: asset ${id} is not in the catalog`);
    for (const f of e.files) put(f.path);
    const fr = e.asset.frames;
    if (fr && existsSync(join(LIB, fr.dir))) for (const n of readdirSync(join(LIB, fr.dir))) put(`${fr.dir.replace(/\/$/, "")}/${n}`);
    else if (fr) missing.push(fr.dir);
  }
  if (missing.length) throw new Error(`${ad}: ${missing.length} files not on disk (first: ${missing[0]}). Run: tools/sync pull --ad ${ad}`);
  return dir;
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
      const out = nextVersion(adId, channel, format, length, taken);
      taken.add(out);
      jobs.push({ id: `${adId}-${format}-${length}-${Date.now().toString(36)}`, ad: adId, composition: compositionId(adId, format, length), format, length, channel, out, draft: !!args.draft, status: "queued", queuedAt: now(), by: String(args.by ?? "agent") });
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
      const pub = stage(j.ad, spec.assets);
      mkdirSync(dirname(join(ROOT, j.out)), { recursive: true });
      const q = j.draft ? ["--crf=30", "--scale=0.5"] : ["--crf=18"];
      const r = spawnSync("npx", ["remotion", "render", j.composition, j.out, `--public-dir=${pub}`, "--codec=h264", "--concurrency=3", ...q], { cwd: ROOT, stdio: "inherit" });
      if (r.status !== 0) throw new Error(`remotion render exited ${r.status}`);
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
