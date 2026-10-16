#!/usr/bin/env node
// tools/stills: render single frames of an ad (cheap: no video, no audio), and the determinism check.
//
//   tools/stills <ad> --frames 0,120,450 [--format 9x16] [--length 15] [--out dir] [--scale 1] [--props '<json>']
//   tools/stills <ad> --times 0.5,2.25 …           the same, by seconds (× the ad's fps)
//   tools/stills <ad> --shots                       one still per shot, at each shot's key moment,
//                                                   from ads/<ad>/shots.ts (export SHOTS: { id, key }[])
//   tools/stills <ad> --determinism [--frame N]     render frame N twice (two fresh browsers, the
//                                                   second after an out-of-order frame) and compare
//                                                   their sha256; exit 1 if they differ
//
// Output: ads/<ad>/out/stills/<ad>_<format>_f<frame>.png (or --out). Bundles once, stages only the
// ad's assets (tools/lib/stage.ts), renders with the installed Chrome when present (the bundled
// headless shell never fires requestAnimationFrame on the founder's Mac).
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { bundle } from "@remotion/bundler";
import { openBrowser, renderStill, selectComposition } from "@remotion/renderer";
import { AdSpec, compositionId, type FormatId } from "../schemas/ad.ts";
import { list, parseArgs, readJson, ROOT } from "./lib/core.ts";
import { stage } from "./lib/stage.ts";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const browserExecutable = existsSync(CHROME) ? CHROME : null;
const sha = (p: string) => createHash("sha256").update(readFileSync(p)).digest("hex");

export type StillJob = { frame: number; out: string };

/** Bundle the project once with the ad's assets staged; return a renderer for frames. */
export const stillRenderer = async (ad: string, o: { format?: FormatId; length?: number; props?: Record<string, unknown> } = {}) => {
  const spec = AdSpec.parse(readJson(join(ROOT, "ads", ad, "ad.json")));
  const format = o.format ?? spec.formats[0];
  const length = o.length ?? spec.lengths[0];
  const pub = stage(ad, spec.assets, `${ad}--stills`);
  const serveUrl = await bundle({ entryPoint: join(ROOT, "ads", "index.ts"), publicDir: pub, rspack: true, enableCaching: true });
  const id = compositionId(ad, format, length);
  const inputProps = o.props ?? {};
  const gl = (process.env.CURATE_GL ?? null) as "angle" | "swangle" | "swiftshader" | "egl" | "vulkan" | "angle-egl" | null;
  const open = () => openBrowser("chrome", { browserExecutable, chromiumOptions: gl ? { gl } : {} });
  let browser = await open();
  const composition = await selectComposition({ serveUrl, id, inputProps, browserExecutable, puppeteerInstance: browser, chromiumOptions: gl ? { gl } : {} });
  return {
    spec,
    format,
    length,
    composition,
    /** Render one frame to a PNG. fresh = in a new browser (for the determinism check). */
    render: async (frame: number, out: string, scale = 1, fresh = false) => {
      if (fresh) {
        await browser.close({ silent: true });
        browser = await open();
      }
      await renderStill({ serveUrl, composition, frame, output: out, imageFormat: "png", scale, inputProps, browserExecutable, puppeteerInstance: browser, overwrite: true, chromiumOptions: gl ? { gl } : {} });
      return out;
    },
    close: () => browser.close({ silent: true }),
  };
};

/** Render frame N twice (fresh browsers; the second after an out-of-order frame). Pure ⇒ equal hashes. */
export const determinism = async (ad: string, frame: number, dir: string, o: { format?: FormatId; length?: number; props?: Record<string, unknown> } = {}) => {
  mkdirSync(dir, { recursive: true });
  const r = await stillRenderer(ad, o);
  const a = await r.render(frame, join(dir, `det_f${frame}_a.png`), 1, true);
  const other = Math.max(0, frame - 17);
  await r.render(other, join(dir, `det_f${other}_warm.png`), 1, true);
  const b = await r.render(frame, join(dir, `det_f${frame}_b.png`));
  await r.close();
  const ha = sha(a);
  const hb = sha(b);
  return { ad, frame, composition: r.composition.id, fps: r.composition.fps, a, b, shaA: ha, shaB: hb, equal: ha === hb };
};

const main = async () => {
  const args = parseArgs(process.argv.slice(2));
  const ad = args._[0];
  if (!ad) {
    console.log("usage: tools/stills <ad> --frames 0,120 | --times 0.5,2 | --shots | --determinism [--frame N]  [--format 9x16] [--length 15] [--out dir] [--scale 1]");
    process.exit(1);
  }
  const format = typeof args.format === "string" ? (args.format as FormatId) : undefined;
  const length = args.length ? Number(args.length) : undefined;
  const props = typeof args.props === "string" ? (JSON.parse(args.props) as Record<string, unknown>) : undefined;
  const outDir = typeof args.out === "string" ? join(ROOT, args.out) : join(ROOT, "ads", ad, "out", "stills");
  mkdirSync(outDir, { recursive: true });

  if (args.determinism) {
    const spec = AdSpec.parse(readJson(join(ROOT, "ads", ad, "ad.json")));
    const frame = args.frame !== undefined ? Number(args.frame) : Math.round((length ?? spec.lengths[0]) * spec.fps * 0.37);
    const d = await determinism(ad, frame, join(outDir, "determinism"), { format, length, props });
    console.log(`${d.composition} frame ${d.frame}: ${d.shaA.slice(0, 16)}… vs ${d.shaB.slice(0, 16)}… ${d.equal ? "EQUAL (deterministic)" : "DIFFERENT (not frame-pure)"}`);
    console.log(JSON.stringify(d));
    process.exit(d.equal ? 0 : 1);
  }

  const r = await stillRenderer(ad, { format, length, props });
  const fps = r.composition.fps;
  let jobs: { frame: number; name: string }[] = [];
  if (args.shots) {
    const mod = (await import(pathToFileURL(join(ROOT, "ads", ad, "shots.ts")).href)) as { SHOTS: { id: string; key: number }[] };
    jobs = mod.SHOTS.map((s) => ({ frame: Math.round(s.key * fps), name: `${ad}_${r.format}_${s.id}` }));
  } else {
    const csv = (v: unknown) => list(v).flatMap((x) => x.split(",")).filter(Boolean);
    const frames = csv(args.frames).map(Number);
    const times = csv(args.times).map((t) => Math.round(Number(t) * fps));
    if ([...frames, ...times].some((f) => !Number.isFinite(f))) throw new Error("--frames / --times: numbers, comma-separated");
    jobs = [...frames, ...times].map((f) => ({ frame: f, name: `${ad}_${r.format}_f${String(f).padStart(4, "0")}` }));
  }
  if (!jobs.length) throw new Error("nothing to render: pass --frames, --times or --shots");
  const scale = args.scale ? Number(args.scale) : 1;
  for (const j of jobs) {
    const t0 = Date.now();
    const out = await r.render(j.frame, join(outDir, `${j.name}.png`), scale);
    console.log(`still  f${j.frame} (${(j.frame / fps).toFixed(2)} s)  ${out.slice(ROOT.length + 1)}  ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  }
  await r.close();
};

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => {
    console.log(`ERROR ${(e as Error).message}`);
    process.exit(1);
  });
}
