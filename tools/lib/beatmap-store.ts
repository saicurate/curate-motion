#!/usr/bin/env node
// Stores measured beat maps (tools/beats --write) as each track's `beatMap` in its manifest.
//   node tools/lib/beatmap-store.ts <id>.beats.json …   (the file name is the music asset id)
// Validates the map (schemas/asset.ts › BeatMap) and the whole manifest, then rebuilds the index.
// Only metadata changes: an approved track's files (and its bpm/offsetSec, which existing ads were
// cut to) are left alone.
import { basename, join } from "node:path";
import { BeatMap, Manifest } from "../../schemas/asset.ts";
import { findManifests, readJson, ROOT, writeJson } from "./core.ts";
import { rebuild } from "./catalog.ts";

const files = process.argv.slice(2);
if (!files.length) {
  console.log("usage: node tools/lib/beatmap-store.ts <music-id>.beats.json …");
  process.exit(1);
}
const manifests = findManifests().map((m) => ({ path: m, data: readJson<{ assets: { id: string; kind: string; beatMap?: unknown }[] }>(join(ROOT, m)) }));
const dirty = new Set<string>();
for (const f of files) {
  const id = basename(f).replace(/\.beats\.json$/, "");
  const map = BeatMap.parse(readJson(f));
  const m = manifests.find((x) => x.data.assets.some((a) => a.id === id));
  if (!m) throw new Error(`${id}: not in any manifest`);
  const a = m.data.assets.find((x) => x.id === id)!;
  if (a.kind !== "music") throw new Error(`${id}: is ${a.kind}, not music`);
  a.beatMap = map;
  dirty.add(m.path);
  console.log(`beatMap  ${id}  (${map.bpm} BPM, ${map.beats.length} beats, ${map.downbeats.length} bars, ${map.hits.length} hits)`);
}
for (const m of manifests.filter((x) => dirty.has(x.path))) {
  Manifest.parse(m.data);
  writeJson(join(ROOT, m.path), m.data);
}
const r = rebuild();
console.log(`index ${r.changed ? "rebuilt" : "unchanged"} (${r.count} assets)`);
