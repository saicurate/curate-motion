#!/usr/bin/env node
// tools/render-lambda: render an ad on AWS Lambda (Remotion Lambda, us-east-1) instead of this Mac.
//
//   tools/render-lambda <ad> --format store-header --length 15 [--props '<json>'] [--name <variant>] [--draft]
//   tools/render-lambda <ad> --format store-header --length 15 --stills 36,132,540 [--props …] [--scale 1] [--out dir]
//                          [--frames a-b]           only those frames of the film (named …_f<a>-<b>_vN)
//                          [--frames-per-lambda n]  frames each Lambda renders (default 8: a 900-frame film runs on ~113 Lambdas)
//                          [--no-deploy]            reuse the ad's last deployed code (only when nothing changed)
//
// Output: films go where tools/render puts them, renders/<ad>/<channel>/<length>s/<ad>[-<name>]_<channel>_<format>_<length>s_v<N>.mp4
// (never overwritten); stills go to ads/<ad>/out/stills/<ad>_<format>_f<frame>.png (or --out), as tools/stills.
//
// How it stays private (infra/remotion-lambda/README.md): Remotion serves the code from a public URL, so
// media never goes in it. The site is code only (an empty public dir, source maps deleted). The ad's
// staged media is uploaded to a private prefix of the same bucket, media/<run>/, and each file reaches the
// render as a presigned URL in props.__media (motion/assets.ts reads it); same origin, so fonts and WebGL
// textures load. The prefix is deleted when the render ends. Every render's time and Remotion's reported
// cost go to infra/remotion-lambda/costs.jsonl (tracked) and ~/.curate-cost/laptop.log (the Spend tab).
import { spawnSync } from "node:child_process";
import { appendFileSync, existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, relative } from "node:path";
import { downloadMedia, getRenderProgress, presignUrl, renderMediaOnLambda, renderStillOnLambda } from "@remotion/lambda";
import { AdSpec, CHANNEL_FORMAT, compositionId, renderPath, type FormatId } from "../schemas/ad.ts";
import { list, parseArgs, readJson, ROOT } from "./lib/core.ts";
import { stage } from "./lib/stage.ts";

type Cfg = { region: "us-east-1"; functionName: string; bucketName: string; siteBase: string };
const CFG = readJson<Cfg>(join(ROOT, "infra", "remotion-lambda", "config.json"));
const COSTS = join(ROOT, "infra", "remotion-lambda", "costs.jsonl");
const args = parseArgs(process.argv.slice(2));
const sh = (cmd: string, a: string[]) => {
  const r = spawnSync(cmd, a, { cwd: ROOT, stdio: ["ignore", "inherit", "inherit"] });
  if (r.status !== 0) throw new Error(`${cmd} ${a[0]} exited ${r.status}`);
};
const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((n) => (statSync(join(dir, n)).isDirectory() ? walk(join(dir, n)) : [join(dir, n)]));

/** The ad's code as its own public site (code only), so two ads rendering at once never share a bundle. */
const deploy = (ad: string): string => {
  const site = `${CFG.siteBase}-${ad}`;
  if (!args["no-deploy"]) {
    sh("npx", ["remotion", "lambda", "sites", "create", "ads/index.ts", `--region=${CFG.region}`, `--site-name=${site}`, "--public-dir=infra/remotion-lambda/public-site", "--disable-git-source", "--quiet"]);
    // the site is public by URL; source maps would publish the source too
    sh("aws", ["s3", "rm", `s3://${CFG.bucketName}/sites/${site}/`, "--recursive", "--exclude", "*", "--include", "*.map", "--only-show-errors"]);
  }
  return `https://${CFG.bucketName}.s3.${CFG.region}.amazonaws.com/sites/${site}/index.html`;
};

/** Uploads the ad's staged media to media/<run>/ (private) and returns path → presigned URL. */
const media = async (ad: string, run: string, ids: string[]): Promise<Record<string, string>> => {
  const dir = stage(ad, ids, `${ad}-lambda`);
  sh("aws", ["s3", "cp", dir, `s3://${CFG.bucketName}/media/${run}/`, "--recursive", "--only-show-errors"]);
  const map: Record<string, string> = {};
  for (const f of walk(dir)) {
    const p = relative(dir, f).split("\\").join("/");
    map[p] = await presignUrl({ region: CFG.region, bucketName: CFG.bucketName, objectKey: `media/${run}/${p}`, expiresInSeconds: 6 * 3600, checkIfObjectExists: false });
  }
  return map;
};

const cleanup = (run: string) => {
  try {
    sh("aws", ["s3", "rm", `s3://${CFG.bucketName}/media/${run}/`, "--recursive", "--only-show-errors"]);
  } catch (e) {
    console.log(`WARN media/${run}/ not deleted: ${(e as Error).message}`);
  }
};

const log = (row: Record<string, unknown>) => {
  appendFileSync(COSTS, JSON.stringify(row) + "\n");
  // the Spend tab (curate-cost): an AICOST receipt like receipts.py writes; usd is Remotion's own estimate
  const r = { v: 1, provider: "aws", api: "remotion-lambda", service: "laptop", feature: `curate-motion.${row.kind}`, promptTokens: 0, outputTokens: 0, cachedTokens: 0, thoughtsTokens: 0, images: Number(row.frames ?? 1), ok: row.ok, bench: true, script: "curate-motion/tools/render-lambda.ts", ts: row.at, latencyMs: row.ms, usd: row.usd, ad: row.ad, out: row.out, totalTokens: 0 };
  try {
    mkdirSync(join(homedir(), ".curate-cost"), { recursive: true });
    appendFileSync(join(homedir(), ".curate-cost", "laptop.log"), "AICOST " + JSON.stringify(r) + "\n");
  } catch {
    // the Spend tab is best effort; costs.jsonl is the record
  }
};

const nextVersion = (ad: string, channel: string, format: FormatId, length: number, name?: string) => {
  for (let v = 1; ; v++) {
    let p = renderPath(ad, channel, format, length, v);
    if (name) p = p.replace(`/${ad}_${channel}_`, `/${ad}-${name}_${channel}_`);
    if (!existsSync(join(ROOT, p))) return p;
  }
};

const gl = () => (process.env.CURATE_LAMBDA_GL ?? "swangle") as "swangle" | "swiftshader" | "angle";

const main = async () => {
  const ad = args._[0];
  if (!ad) throw new Error("usage: tools/render-lambda <ad> --format <f> --length <s> [--stills a,b,c] [--props '<json>'] [--name v] [--draft]");
  const spec = AdSpec.parse(readJson(join(ROOT, "ads", ad, "ad.json")));
  const format = (typeof args.format === "string" ? args.format : spec.formats[0]) as FormatId;
  const length = typeof args.length === "string" ? Number(args.length) : spec.lengths[0];
  if (!spec.formats.includes(format)) throw new Error(`${ad} does not list format ${format}`);
  if (!spec.lengths.includes(length)) throw new Error(`${ad} does not list length ${length}`);
  const composition = compositionId(ad, format, length);
  const extra = typeof args.props === "string" ? (JSON.parse(args.props) as Record<string, unknown>) : {};
  const run = `${ad}-${Date.now().toString(36)}`;
  const t0 = Date.now();
  const serveUrl = deploy(ad);
  const tDeploy = Date.now() - t0;
  const map = await media(ad, run, spec.assets);
  const inputProps = { ...extra, __media: map };
  const tMedia = Date.now() - t0 - tDeploy;
  console.log(`site ready in ${(tDeploy / 1000).toFixed(0)} s; ${Object.keys(map).length} media files staged privately in ${(tMedia / 1000).toFixed(0)} s`);
  try {
    if (args.stills) {
      const frames = list(args.stills).flatMap((s) => s.split(",")).map(Number);
      const outDir = typeof args.out === "string" ? join(ROOT, args.out) : join(ROOT, "ads", ad, "out", "stills");
      mkdirSync(outDir, { recursive: true });
      const scale = typeof args.scale === "string" ? Number(args.scale) : 1;
      await Promise.all(
        frames.map(async (frame) => {
          const s0 = Date.now();
          const r = await renderStillOnLambda({ region: CFG.region, functionName: CFG.functionName, serveUrl, composition, inputProps, frame, imageFormat: "png", scale, privacy: "private", maxRetries: 2, chromiumOptions: { gl: gl() }, logLevel: "warn" });
          const out = join(outDir, `${ad}_${format}_f${String(frame).padStart(4, "0")}.png`);
          sh("aws", ["s3", "cp", `s3://${r.bucketName}/${r.outKey}`, out, "--only-show-errors"]);
          const ms = Date.now() - s0;
          console.log(`still f${frame}: ${(ms / 1000).toFixed(1)} s, $${r.estimatedPrice.accruedSoFar.toFixed(4)} → ${relative(ROOT, out)}`);
          log({ at: new Date().toISOString(), kind: "still", ad, composition, frame, frames: 1, scale, ms, usd: r.estimatedPrice.accruedSoFar, out: relative(ROOT, out), ok: true });
        }),
      );
    } else {
      const channel = typeof args.channel === "string" ? args.channel : (spec.channels.find((c) => CHANNEL_FORMAT[c] === format) ?? "master");
      const frames = typeof args.frames === "string" ? args.frames : undefined;
      if (frames && !/^\d+-\d+$/.test(frames)) throw new Error("--frames must be a-b");
      const name = typeof args.name === "string" ? args.name : frames ? `f${frames}` : undefined;
      const out = nextVersion(ad, channel, format, length, name);
      const draft = !!args.draft;
      // 8 measured fastest for the 4K header (2026-10-24): 92 s on 113 Lambdas vs 153 s on Remotion's default 45
      const fpl = typeof args["frames-per-lambda"] === "string" ? Number(args["frames-per-lambda"]) : 8;
      const r0 = Date.now();
      const { renderId, bucketName } = await renderMediaOnLambda({
        region: CFG.region, functionName: CFG.functionName, serveUrl, composition, inputProps, codec: "h264",
        imageFormat: "jpeg", crf: draft ? 30 : 18, scale: draft ? 0.5 : 1, privacy: "private", maxRetries: 2,
        chromiumOptions: { gl: gl() }, logLevel: "warn",
        framesPerLambda: fpl,
        ...(frames ? { frameRange: frames.split("-").map(Number) as [number, number] } : {}),
      });
      let p = await getRenderProgress({ renderId, bucketName, functionName: CFG.functionName, region: CFG.region });
      while (!p.done && !p.fatalErrorEncountered) {
        await new Promise((res) => setTimeout(res, 2000));
        p = await getRenderProgress({ renderId, bucketName, functionName: CFG.functionName, region: CFG.region });
        process.stdout.write(`\r${Math.round(p.overallProgress * 100)}%  ${p.framesRendered} frames  ${p.lambdasInvoked} Lambdas  $${p.costs.accruedSoFar.toFixed(3)}   `);
      }
      process.stdout.write("\n");
      if (p.fatalErrorEncountered) throw new Error(`render failed: ${p.errors.map((e) => e.message).join(" | ").slice(0, 600)}`);
      mkdirSync(dirname(join(ROOT, out)), { recursive: true });
      await downloadMedia({ region: CFG.region, bucketName, renderId, outPath: join(ROOT, out) });
      const ms = Date.now() - r0;
      console.log(`film: ${(ms / 1000).toFixed(0)} s on Lambda, ${p.costs.displayCost} → ${out}`);
      log({ at: new Date().toISOString(), kind: "film", ad, composition, format, length, draft, frames: p.framesRendered, lambdas: p.lambdasInvoked, ms, usd: p.costs.accruedSoFar, out, renderId, ok: true });
    }
  } finally {
    cleanup(run);
  }
};

main().catch((e) => {
  console.log(`ERROR ${(e as Error).message}`);
  process.exit(1);
});
