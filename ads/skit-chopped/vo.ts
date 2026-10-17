#!/usr/bin/env node
// Skit "you're chopped": Jake's voiceover as one track on the picture's clock. Each ElevenLabs clip (voice.skit-chopped.lNN-
// eleven-will-v4.v1) is trimmed to its speech (+0.12 s), sped up to RATE with ffmpeg atempo (the pitch is kept) and placed
// at LINE_AT. Free and local; the same inputs give the same bytes.
//
//   node ads/skit-chopped/vo.ts [out.wav]      (default: .cache/skit-chopped-vo.wav)
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { CLIP, LINE_AT, RATE, TOTAL_SEC, type LineId } from "./timeline.ts";

const ROOT = join(import.meta.dirname, "..", "..");
const out = process.argv[2] ?? join(ROOT, ".cache", "skit-chopped-vo.wav");
const voice = JSON.parse(readFileSync(join(ROOT, "library", "voice", "manifest.json"), "utf8")) as { assets: { id: string; files: { path: string }[] }[] };
const ids = Object.keys(CLIP) as LineId[];
const inputs: string[] = [];
const chains: string[] = [];
ids.forEach((l, i) => {
  const a = voice.assets.find((x) => x.id === `voice.skit-chopped.${l}-eleven-will-v4.v1`);
  if (!a) throw new Error(`no voice clip for ${l}`);
  inputs.push("-i", join(ROOT, "library", a.files[0].path));
  const ms = Math.round(LINE_AT[l] * 1000);
  chains.push(`[${i}:a]aresample=48000,atrim=0:${(CLIP[l].end + 0.12).toFixed(3)},afade=t=out:st=${(CLIP[l].end + 0.04).toFixed(3)}:d=0.08,atempo=${RATE},adelay=${ms}|${ms},apad[a${i}]`);
});
const mix = `${ids.map((_, i) => `[a${i}]`).join("")}amix=inputs=${ids.length}:normalize=0:duration=longest,atrim=0:${TOTAL_SEC},aformat=sample_fmts=s16:channel_layouts=stereo[out]`;
mkdirSync(dirname(out), { recursive: true });
execFileSync("ffmpeg", ["-y", "-v", "error", ...inputs, "-filter_complex", [...chains, mix].join(";"), "-map", "[out]", "-ar", "48000", out]);
console.log(`wrote ${out}: ${ids.length} lines at ×${RATE}, ${TOTAL_SEC} s`);
