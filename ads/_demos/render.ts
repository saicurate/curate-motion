#!/usr/bin/env node
// Render the concept animatics (gate "explore"): 540×960, 30 fps, music in the render, the designed
// sound (ads/_demos/sound.ts) mixed in afterwards (loudness-normalised to −14 LUFS), into marketing/videos/cuts/demo-<n>-<slug>-v<N>.mp4.
//
//   node ads/_demos/render.ts                 every demo
//   node ads/_demos/render.ts zee-critic      one (by slug)
//
// Stages only each demo's own assets (tools/lib/stage.ts), like tools/render. Free and local.
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { stage } from "../../tools/lib/stage.ts";
import { DEMOS } from "./concepts.ts";

const ROOT = join(import.meta.dirname, "..", "..");
const CUTS = join(ROOT, "..", "marketing", "videos", "cuts");
const want = process.argv.slice(2);
mkdirSync(CUTS, { recursive: true });

const run = (cmd: string, args: string[]) => {
  const r = spawnSync(cmd, args, { cwd: ROOT, stdio: "inherit" });
  if (r.status !== 0) throw new Error(`${cmd} ${args.slice(0, 3).join(" ")} failed`);
};

for (const d of DEMOS.filter((x) => !want.length || want.includes(x.slug))) {
  const spec = JSON.parse(readFileSync(join(ROOT, "ads", "_demos", d.slug, "ad.json"), "utf8"));
  const pub = stage(spec.id, spec.assets, `_demos-${d.slug}`);
  const tmp = join(ROOT, "ads", "_demos", d.slug, "out");
  mkdirSync(tmp, { recursive: true });
  const silent = join(tmp, "picture+music.mp4");
  run("npx", ["remotion", "render", `${spec.id}--9x16--15s`, silent, `--public-dir=${pub}`, "--codec=h264", "--scale=0.5", "--crf=26", "--concurrency=4"]);
  const wav = join(tmp, "sound.wav");
  run("node", [join(ROOT, "ads", "_demos", "sound.ts"), d.slug, wav]);
  let v = 1;
  while (existsSync(join(CUTS, `demo-${d.n}-${d.slug}-v${v}.mp4`))) v++;
  const out = join(CUTS, `demo-${d.n}-${d.slug}-v${v}.mp4`);
  run("ffmpeg", ["-loglevel", "error", "-y", "-i", silent, "-i", wav, "-filter_complex", `[1:a]volume=${d.sfxGain ?? 0.9}[s];[0:a][s]amix=inputs=2:duration=first:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000[a]`, "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "160k", out]);
  console.log(`wrote ${out}`);
}
