#!/usr/bin/env node
// tools/photo3d register: put a photo's 2.5D layers (tools/photo3d → .cache/photo3d/<photo>/) into the catalog as
// DERIVED assets of that photo (source.type "derived", source.from = the photo id, licence ai-owned, status draft).
//
//   tools/photo3d register <photo-id> [--part jacket …] [--under jacket=<file> --under-prompt <prompt-id>]
//                          [--redo] [--no-push] [--by <agent>]
//
// Ids, from photo.emma.<p>.v1:
//   photo.emma.<p>-depth.v1           the whole photo's depth (rg16 PNG)                Depth Anything V2 Small, Apache-2.0
//   photo.emma.<p>-cutout.v1          her, RGBA (original) + her layer's depth (depth)  BiRefNet-portrait + pymatting, MIT
//   photo.emma.<p>-plate.v1           the photo without her (original) + depth           big-lama, Apache-2.0
//   photo.emma.<p>-<part>.v1          a piece she wears, whole, RGBA + depth             SAM 2.1 hiera-small, Apache-2.0 (+ LaMa for hair notches)
//   photo.emma.<p>-under-<part>.v1    her with that piece off (RGBA) + depth             LaMa, or tools/genfill (SDXL Inpainting, OpenRAIL++-M)
// --redo hard-deletes those ids first when they are drafts (an approved layer is never touched: make v2).
// Derived layers stay out of her simulator's Photos (tools/persona roll skips source.type "derived").
import { existsSync } from "node:fs";
import { join } from "node:path";
import { list, parseArgs, readJson, ROOT, writeJson } from "./lib/core.ts";
import { addAsset, loadIndex, removeAsset } from "./lib/catalog.ts";
import { linkOutputs } from "./lib/prompts.ts";

const args = parseArgs(process.argv.slice(2));
const photoId = String(args._[0] ?? "");
const by = typeof args.by === "string" ? args.by : (process.env.CURATE_AGENT ?? "claude-code (photo3d)");
const push = !args["no-push"];
const idx = loadIndex();
const photo = idx.assets.find((a) => a.id === photoId);
if (!photo || photo.kind !== "photo") {
  console.log("usage: tools/photo3d register <photo-id> [--part <name> …] [--under <name>=<file> --under-prompt <prompt-id>] [--redo] [--no-push]");
  process.exit(1);
}
const m = /^photo\.([a-z0-9-]+)\.([a-z0-9-]+)\.v(\d+)$/.exec(photoId)!;
const [scope, stem] = [m[1], m[2]];
const dir = join(ROOT, ".cache", "photo3d", stem);
const meta = readJson<{ models: Record<string, { repo: string; licence: string }>; parts: { name: string }[] }>(join(dir, "layers.json"));
const P = photo.asset as { title?: string; place?: string; framing?: string; wearing?: string[] };
const title = photo.title;
const model = (k: string) => `${meta.models[k].repo} (${meta.models[k].licence})`;
const parts = list(args.part);
const unders = Object.fromEntries(list(args.under).map((s) => s.split("=") as [string, string]));

type L = { name: string; title: string; file: string; depth?: string; from: string[]; model: string; tool: string; wearing?: string[]; promptId?: string; note: string };
const layers: L[] = [
  { name: `${stem}-depth`, title: `${title}: depth map`, file: "depth.png", from: [photoId], model: model("depth"), tool: "tools/depth (tools/photo3d.py), flip-averaged at 770 px", note: "rg16: 16-bit disparity packed in RGB (R high byte, G low byte), 65535 = nearest" },
  { name: `${stem}-cutout`, title: `${title}: her cut-out`, file: "person.png", depth: "person-depth.png", from: [photoId], model: `${model("matte")} + ${model("foreground")}`, tool: "tools/cutout-person (tools/photo3d.py)", wearing: P.wearing, note: "RGBA, edge colours un-mixed from the background; depth = her own, pushed past her edge" },
  { name: `${stem}-plate`, title: `${title}: the background without her`, file: "plate.jpg", depth: "plate-depth.png", from: [photoId], model: model("inpaint"), tool: "tools/inpaint at 512 px (tools/photo3d.py)", note: "only its fringe next to her is ever seen; depth = the background carried on behind her" },
  ...parts.map((p): L => ({ name: `${stem}-${p}`, title: `${title}: the ${p} she wears`, file: `${p}.png`, depth: `${p}-depth.png`, from: [photoId], model: `${model("parts")} + ${model("inpaint")}`, tool: "tools/cutout-person part (tools/photo3d.py)", wearing: (P.wearing ?? []).filter((w) => w.includes(p)), note: "the whole piece: hair notches filled from its own fabric" })),
  ...Object.entries(unders).map(([p, f]): L => ({ name: `${stem}-under-${p}`, title: `${title}: her with the ${p} off`, file: f, depth: "person-depth.png", from: [photoId], model: args["under-prompt"] ? "diffusers/stable-diffusion-xl-1.0-inpainting-0.1 (CreativeML OpenRAIL++-M)" : model("inpaint"), tool: args["under-prompt"] ? "tools/genfill (SDXL Inpainting on MPS)" : "tools/photo3d.py", wearing: (P.wearing ?? []).filter((w) => !w.includes(p)), promptId: typeof args["under-prompt"] === "string" ? args["under-prompt"] : undefined, note: "for a peel: the piece's area painted as what is under it" })),
];

const out: string[] = [];
for (const l of layers) {
  const id = `photo.${scope}.${l.name}.v1`;
  const file = l.file.startsWith("/") ? l.file : join(dir, l.file);
  if (!existsSync(file)) throw new Error(`missing ${file}: run tools/photo3d ${photoId} first`);
  const have = idx.assets.find((a) => a.id === id);
  if (have) {
    if (!args.redo) {
      out.push(`${id}  (exists; --redo to replace a draft)`);
      continue;
    }
    removeAsset(id, { force: true });
  }
  const r = addAsset({
    file,
    kind: "photo",
    id,
    title: l.title,
    licence: "ai-owned",
    tags: ["layer:" + l.name.slice(stem.length + 1), "derived", "photo3d"],
    fields: { ...(P.place ? { place: P.place } : {}), ...(P.framing ? { framing: P.framing } : {}) },
    extras: l.depth ? [{ role: "depth", file: join(dir, l.depth) }] : [],
    source: { type: "derived", from: l.from, model: l.model, tool: l.tool, ...(l.promptId ? { promptId: l.promptId } : {}) },
    costUsd: 0,
    costCalls: 0,
    aiGenerated: true,
    by,
    push,
  });
  if (l.wearing?.length) {
    // wearing is an array field: set it on the manifest entry (the CLI's --set is scalar)
    const mp = join(ROOT, r.manifest);
    const man = readJson<{ assets: { id: string; wearing?: string[]; description?: string }[] }>(mp);
    const e = man.assets.find((a) => a.id === id)!;
    e.wearing = l.wearing;
    e.description = l.note;
    writeJson(mp, man);
  }
  if (l.promptId) linkOutputs(l.promptId, [id]);
  out.push(`${id}  ${r.files.join(", ")}${r.pushed ? "  (uploaded)" : ""}`);
}
const { rebuild } = await import("./lib/catalog.ts");
rebuild();
console.log(out.join("\n"));
