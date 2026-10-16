#!/usr/bin/env node
// Render the device study (ads/_demos/device-study): every option as a 6 s 1080x1920 60 fps clip and as
// stills, into ads/_demos/device-study/out/ (local only). Free: local Remotion + WebGL on the GPU.
//
//   node ads/_demos/device-study/render.ts              everything
//   node ads/_demos/device-study/render.ts 3d-orbit     one job (by name; see JOBS)
//   node ads/_demos/device-study/render.ts --stills     stills only
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { stage } from "../../../tools/lib/stage.ts";

const ROOT = join(import.meta.dirname, "..", "..", "..");
const HERE = join(ROOT, "ads", "_demos", "device-study");
const OUT = join(HERE, "out");
mkdirSync(OUT, { recursive: true });
const spec = JSON.parse(readFileSync(join(HERE, "ad.json"), "utf8"));
const COMP = `${spec.id}--9x16--6s`;
const WARDROBE = "screenshot.emma.wardrobe-top.v1";
const SCAN = "footage.emma.scan-roll.v1";

type Job = { name: string; still?: boolean; props: Record<string, unknown> };
const JOBS: Job[] = [
  // clips (the real scan-roll footage playing inside)
  { name: "current-push", props: { option: "current", screen: SCAN } },
  { name: "bezel-17pm-silver-push", props: { option: "bezel", model: "iphone-17-pro-max", color: "silver", screen: SCAN } },
  { name: "3d-graphite-orbit", props: { option: "3d", color: "graphite", screen: SCAN } },
  // stills (Emma's Wardrobe tab)
  { name: "still-current", still: true, props: { option: "current", screen: WARDROBE, still: true } },
  ...["silver", "deep-blue", "cosmic-orange"].map((c) => ({ name: `still-bezel-17pm-${c}`, still: true, props: { option: "bezel", model: "iphone-17-pro-max", color: c, screen: WARDROBE, still: true } })),
  ...["silver", "black", "burgundy", "glacier"].map((c) => ({ name: `still-bezel-18pm-${c}`, still: true, props: { option: "bezel", model: "iphone-18-pro-max", color: c, screen: WARDROBE, still: true } })),
  { name: "still-3d-graphite", still: true, props: { option: "3d", color: "graphite", screen: WARDROBE, still: true, pose: { x: 7, y: -20, z: 0 } } },
  { name: "still-3d-silver", still: true, props: { option: "3d", color: "silver", screen: WARDROBE, still: true, pose: { x: 7, y: -20, z: 0 } } },
  { name: "still-3d-front", still: true, props: { option: "3d", color: "graphite", screen: WARDROBE, still: true, pose: { x: 0, y: 0, z: 0 } } },
];

const args = process.argv.slice(2);
const only = args.filter((a) => !a.startsWith("--"));
const stillsOnly = args.includes("--stills");
const pub = stage(spec.id, spec.assets, "_demos-device-study");
const run = (a: string[]) => {
  const r = spawnSync("npx", a, { cwd: ROOT, stdio: "inherit" });
  if (r.status !== 0) throw new Error(`npx ${a.slice(0, 4).join(" ")} failed`);
};
for (const j of JOBS.filter((x) => (!only.length || only.includes(x.name)) && (!stillsOnly || x.still))) {
  const props = JSON.stringify(j.props);
  const common = [`--public-dir=${pub}`, `--props=${props}`, "--gl=angle"];
  if (j.still) run(["remotion", "still", COMP, join(OUT, `${j.name}.png`), "--frame=0", ...common]);
  else run(["remotion", "render", COMP, join(OUT, `${j.name}.mp4`), "--codec=h264", "--crf=14", "--x264-preset=slow", "--concurrency=2", ...common]);
  console.log(`wrote ${j.name}`);
}
