#!/usr/bin/env node
// tools/voice: the voiceover. Which voice an ad uses is CONFIG (config/voice.json › mode,
// ad.json › voice, tools/render --voice); this tool makes and registers the audio.
//
//   tools/voice plan <ad> [--voice captions|human|tts] [--tts <profile>] [--length 30]
//        the resolved voice and every line's time; which lines still need audio
//   tools/voice generate <ad> [--profile <name>] [--provider openai|elevenlabs|say] [--voice <name>] [--speed 1] [--style "…"]
//        [--lines l01,l02] [--dry-run] [--yes] [--no-push]
//        synthesise each line to a `voice` asset (cached by hash of text + voice + settings).
//        DRY RUN IS THE DEFAULT: it prints characters and the estimated cost. Generating needs --yes,
//        and anything paid also needs tts.spendCapUsd in config/voice.json above spent + estimate.
//   tools/voice import <ad> <audio-file> [--line l03] [--marks "l01=0.4-3.5,l02=3.9-7.1"] [--marks-file labels.txt]
//        [--auto [--lines l01,l02…]] [--speaker <name>] [--release <path-or-url>] [--name take-1] [--dry-run]
//        register a human recording: one line (--line), or a whole take with line marks
//        (by hand, an Audacity label file, or --auto from the pauses). Records it in ad.json › voice.human.
//   tools/voice mark <take-id> --marks "…" | --marks-file <file> | --auto [--lines …]
//        set a draft take's line marks
//   tools/voice providers          adapters, prices, licences and whether their key exists (by NAME only)
//   tools/voice use <captions|human|tts> [--profile <name>] [--ad <ad>] [--burn-in on|off] [--dry-run]
//        CHOOSE the voice (the same fields as the library page's Voice panel): with no --ad it sets the
//        default in config/voice.json (mode, tts.use, captions.burnIn); with --ad it sets that ad's
//        override in ads/<ad>/ad.json › voice. `tools/voice use default --ad <ad>` clears the override.
//        `tools/voice use` alone prints what every ad's next render uses. Never touches the spend cap.
//   generate … --json              print the estimate (or result) as JSON on stdout (the page reads it)
import { join } from "node:path";
import { list, parseArgs, readJson, ROOT } from "./lib/core.ts";
import { generate, importTake, markTake, parseMarks, planFor, PROVIDER_LABEL, PROVIDERS, readMarksFile, secretExists, speechSegments, spentUsd, loadConfig } from "./lib/voice.ts";
import { loadIndex } from "./lib/catalog.ts";
import { applyVoiceChange, describeNext, listAds, type VoiceChange } from "./lib/voice-settings.ts";
import { VOICE_MODES, type VoiceMode } from "../schemas/voice.ts";

const args = parseArgs(process.argv.slice(2));
const cmd = args._[0] ?? "help";
const by = typeof args.by === "string" ? args.by : (process.env.CURATE_AGENT ?? "unknown-agent");
const csv = (v: unknown) => list(v).flatMap((s) => s.split(",")).map((s) => s.trim()).filter(Boolean);
const str = (k: string) => (typeof args[k] === "string" ? (args[k] as string) : undefined);

/** --voice / --tts → the same override shape tools/render uses. */
export const overrideFromArgs = () => ({
  ...(str("voice") ? { mode: str("voice") as "captions" | "human" | "tts" } : {}),
  ...(str("tts") ? { tts: { use: str("tts") } } : {}),
});

const sec = (f: number, fps: number) => (f / fps).toFixed(2).padStart(6);

const main = async () => {
  switch (cmd) {
    case "plan": {
      const ad = args._[1];
      const p = planFor(ad, { override: overrideFromArgs(), length: args.length ? Number(args.length) : undefined });
      const v = p.voice;
      console.log(`${ad}: mode ${v.mode} (from ${v.from.mode})  captions ${v.captions.burnIn ? "burned in" : "not burned in"}${v.captions.sidecar.length ? ` + sidecar ${v.captions.sidecar.join("/")}` : ""} (${v.captions.preset})`);
      if (v.mode === "tts") console.log(`tts profile ${v.tts.use}: ${v.tts.profile.provider}${v.tts.profile.model ? `/${v.tts.profile.model}` : ""} "${v.tts.profile.voice}"${v.tts.profile.previewOnly ? "  PREVIEW ONLY" : ""}`);
      if (v.mode === "human") console.log(`human: take ${v.human.take ?? "(none)"}; per-line ${Object.keys(v.human.lines).length}`);
      for (const s of p.scenes) {
        console.log(`scene ${s.key.padEnd(12)} ${sec(s.from, p.fps)}s → ${sec(s.from + s.durationInFrames, p.fps)}s`);
        for (const l of p.lines.filter((x) => x.scene === s.key)) console.log(`   ${l.id} ${sec(l.from, p.fps)}s +${(l.durationInFrames / p.fps).toFixed(2)}s  ${l.audio ? l.audio.id : v.mode === "captions" ? "(caption)" : "MISSING AUDIO"}  ${l.text}`);
      }
      console.log(`total ${(p.totalFrames / p.fps).toFixed(2)} s${p.missing.length ? `  ·  ${p.missing.length} lines need audio: tools/voice ${v.mode === "tts" ? "generate" : "import"} ${ad}` : ""}${p.previewOnly ? "  ·  PREVIEW VOICE: not for release" : ""}`);
      break;
    }
    case "generate": {
      const ad = args._[1];
      if (!ad) throw new Error("usage: tools/voice generate <ad> [--profile …] [--provider …] [--voice …] [--dry-run] [--yes]");
      const json = !!args.json;
      const log = console.log;
      if (json) console.log = (...a: unknown[]) => console.error(...a);
      const out = await generate(ad, {
        profile: str("profile"),
        provider: str("provider"),
        voice: str("voice"),
        speed: args.speed !== undefined ? Number(args.speed) : undefined,
        style: str("style"),
        lines: csv(args.lines),
        yes: !!args.yes && !args["dry-run"],
        push: !args["no-push"],
        by,
      }).finally(() => {
        console.log = log;
      });
      if (json) process.stdout.write(JSON.stringify(out) + "\n");
      break;
    }
    case "use": {
      const word = args._[1];
      if (!word) {
        for (const ad of listAds()) console.log(describeNext(ad).replace(/^n/, "N"));
        break;
      }
      const ad = str("ad");
      const profile = str("profile");
      const burn = str("burn-in");
      if (word !== "default" && !(VOICE_MODES as readonly string[]).includes(word)) throw new Error(`usage: tools/voice use <${VOICE_MODES.join("|")}> [--profile <name>] [--ad <ad>] [--burn-in on|off]   (or: use default --ad <ad>)`);
      if (burn !== undefined && !["on", "off"].includes(burn)) throw new Error("--burn-in takes on or off");
      const ch: VoiceChange = {};
      if (ad) {
        if (burn !== undefined) throw new Error("--burn-in is the default for every ad (config/voice.json); leave out --ad");
        if (word === "default") {
          if (profile) throw new Error("use default --ad clears the ad's own setting; --profile doesn't apply");
          ch.ads = { [ad]: null };
        } else {
          if (profile && word !== "tts") throw new Error("--profile is an AI voice: it only applies with tts");
          ch.ads = { [ad]: { mode: word as VoiceMode, ...(profile ? { use: profile } : {}) } };
        }
      } else {
        if (word === "default") throw new Error("use default needs --ad <ad> (it clears that ad's own setting)");
        ch.global = { mode: word as VoiceMode, ...(profile ? { use: profile } : {}), ...(burn ? { burnIn: burn === "on" } : {}) };
      }
      const r = applyVoiceChange(ch, { dryRun: !!args["dry-run"] });
      if (r.dryRun) console.log(`dry run: valid; would change ${r.changed.join(", ") || "nothing"}`);
      else {
        console.log(r.message);
        for (const l of r.next) console.log(`  ${l.replace(/^n/, "N")}`);
      }
      break;
    }
    case "import": {
      const [ad, file] = [args._[1], args._[2]];
      if (!ad || !file) throw new Error("usage: tools/voice import <ad> <audio-file> [--line l03 | --marks … | --marks-file … | --auto] [--speaker …] [--release …]");
      const r = importTake(ad, file, {
        line: str("line"),
        lines: csv(args.lines),
        marks: str("marks") ? parseMarks(str("marks")!) : str("marks-file") ? readMarksFile(str("marks-file")!) : undefined,
        auto: !!args.auto,
        speaker: str("speaker"),
        release: str("release"),
        name: str("name"),
        dryRun: !!args["dry-run"],
        push: !args["no-push"],
        by,
      });
      if (!args["dry-run"]) {
        console.log(`registered ${r.id}; recorded in ads/${ad}/ad.json › voice.human (the mode is unchanged).`);
        console.log(`switch this ad to it: in ads/${ad}/ad.json set  "voice": { "mode": "human", … }   or everything: config/voice.json  "mode": "human"`);
        console.log(`check the timing: tools/voice plan ${ad} --voice human`);
      }
      break;
    }
    case "mark": {
      const id = args._[1];
      let marks = str("marks") ? parseMarks(str("marks")!) : str("marks-file") ? readMarksFile(str("marks-file")!) : [];
      if (args.auto) {
        const e = loadIndex().assets.find((a) => a.id === id);
        if (!e) throw new Error(`no asset ${id}`);
        const segs = speechSegments(join(ROOT, "library", e.files[0].path));
        const order = csv(args.lines).length ? csv(args.lines) : (readJson<{ lines: { id: string }[] }>(join(ROOT, "ads", String(e.asset.ad), "script.json")).lines.map((l) => l.id));
        segs.forEach((s, i) => console.log(`  ${order[i] ?? "(extra)"}=${s.startSec}-${s.endSec}`));
        if (segs.length !== order.length) throw new Error(`${segs.length} speech segments for ${order.length} lines: mark by hand with --marks`);
        marks = segs.map((s, i) => ({ line: order[i], ...s }));
      }
      if (!marks.length) throw new Error("give --marks \"l01=0.4-3.5,…\", --marks-file <file> or --auto");
      console.log(JSON.stringify(markTake(id, marks), null, 2));
      break;
    }
    case "providers": {
      const cfg = loadConfig();
      for (const a of Object.values(PROVIDERS)) {
        console.log(`${a.name}${a.previewOnly ? "  (PREVIEW ONLY, not for release)" : ""}`);
        console.log(`  price    ${a.priceNote}  [${a.priceSource}, ${a.pricedAt}]`);
        console.log(`  licence  ${a.licence.name}; commercial: ${a.licence.commercial}; restrictions: ${a.licence.restrictions.join(", ") || "none"}`);
        if (a.secretName) console.log(secretExists(a.secretName) ? `  key      SSM ${a.secretName}: exists (name only; never printed)` : `  key      ${PROVIDER_LABEL[a.name] ?? a.name}: key not set up (no SSM ${a.secretName}; see AGENTS.md › "How to change the voice")`);
      }
      console.log(`profiles: ${Object.entries(cfg.tts.profiles).map(([k, p]) => `${k} (${p.provider} ${p.voice})`).join(", ")}; in use: ${cfg.tts.use}`);
      console.log(`spend cap $${cfg.tts.spendCapUsd.toFixed(2)}; paid TTS so far $${spentUsd().toFixed(4)}`);
      break;
    }
    default:
      console.log((await import("node:child_process")).execFileSync("sed", ["-n", "2,24p", join(ROOT, "tools", "voice.ts")], { encoding: "utf8" }).replace(/^\/\/ ?/gm, ""));
  }
};

main().catch((e) => {
  if (args.json) process.stdout.write(JSON.stringify({ error: (e as Error).message }) + "\n");
  else console.log(`ERROR ${(e as Error).message}`);
  process.exit(1);
});
