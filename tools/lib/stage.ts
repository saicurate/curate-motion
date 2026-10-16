// Staging: hard-link ONLY an ad's assets from library/ into .stage/<ad>/, so a render's public dir
// holds exactly what the ad lists (never the whole library, never a reference). Shared by
// tools/render, tools/stills and tools/critic.
import { copyFileSync, existsSync, linkSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { INDEX_PATH, LIB, readJson, ROOT } from "./core.ts";

export const stage = (ad: string, ids: string[], dirName: string = ad) => {
  const idx = readJson<{ assets: { id: string; kind: string; files: { path: string }[]; asset: { frames?: { dir: string }; licence?: { restrictions?: string[] } } }[] }>(INDEX_PATH).assets;
  const dir = join(ROOT, ".stage", dirName);
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
    // references (the inspo board's media) are study only: never in a render (RULES.md › 9)
    if (e.kind === "reference" || e.asset.licence?.restrictions?.includes("never-ship")) throw new Error(`${ad}: ${id} is a reference (inspo, study only) and is never shipped in an ad (RULES.md › 9). Remove it from ads/${ad}/ad.json › assets.`);
    for (const f of e.files) put(f.path);
    const fr = e.asset.frames;
    if (fr && existsSync(join(LIB, fr.dir))) for (const n of readdirSync(join(LIB, fr.dir))) put(`${fr.dir.replace(/\/$/, "")}/${n}`);
    else if (fr) missing.push(fr.dir);
  }
  if (missing.length) throw new Error(`${ad}: ${missing.length} files not on disk (first: ${missing[0]}). Run: tools/sync pull --ad ${ad}`);
  return dir;
};

