#!/usr/bin/env node
// tools/inspo: the inspo board CLI. Videos, images, links, ads, reels, competitors' app screens,
// typefaces and colour ideas we want to refer back to. One entry per inspiration in inspo/<id>.md;
// the media goes into the library as kind `reference` (S3; never shipped in an ad).
//
//   tools/inspo add <file | url> --title "…" [--love "…" --love "…"] [--tags a,b] [--use-for concept:c14,ad:pop-out]
//                   [--url <link> (with a file)] [--kind video|image|link|audio|app-screen|ad|other]
//                   [--source creator|competitor|founder|tiktok|…] [--name kebab-name] [--from "the founder, on WhatsApp"]
//                   [--transition pop-out-return --pacing "…" --type "…" --colour "…"] [--notes "…" | --notes-file f.md]
//                   [--link "Breakdown=https://…"] [--by …] [--no-push]
//   tools/inspo add --asset reference.<source>.<name>.v1 --title "…"     an entry for a reference already in the library
//   tools/inspo search [--text "pop out"] [--tag …] [--kind video] [--use-for c14] [--technique whip-pan] [--status active|archived|all] [--json]
//   tools/inspo show <id> [--json]
//   tools/inspo edit <id> [--love … (replaces)] [--add-love …] [--transition …] [--pacing …] [--type …] [--colour …] [--use-for …] [--tags …] [--title …]
//   tools/inspo breakdown <id> [--sheet] [--threshold 0.3]    technique breakdown with free local tools (ffprobe/ffmpeg); no paid calls
//   tools/inspo archive <id> [--undo]
//   tools/inspo build                                          rebuild catalog/inspo.json (tools/catalog build does it too)
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { readFileSync } from "node:fs";
import { list, parseArgs, ROOT } from "./lib/core.ts";
import { findInspo, writeBoardIndexes } from "./lib/boards.ts";
import { addInspo, archiveInspo, breakdownInspo, editInspo, isUrl, searchInspo } from "./lib/inspo.ts";

const args = parseArgs(process.argv.slice(2));
const cmd = args._[0] ?? "help";
const by = typeof args.by === "string" ? args.by : (process.env.CURATE_AGENT ?? "unknown-agent");
const str = (k: string) => (typeof args[k] === "string" ? (args[k] as string) : undefined);
const many = (k: string) => list(args[k]).map((s) => s.trim()).filter(Boolean);
const csv = (k: string) => many(k).flatMap((x) => x.split(",")).map((s) => s.trim()).filter(Boolean);
const out = (o: unknown) => console.log(typeof o === "string" ? o : JSON.stringify(o, null, 2));
const links = () => many("link").map((l) => {
  const i = l.indexOf("=http");
  if (i < 1) throw new Error(`--link is "Label=https://…", got: ${l}`);
  return { label: l.slice(0, i).trim(), url: l.slice(i + 1).trim() };
});
const notes = () => (str("notes-file") ? readFileSync(str("notes-file")!, "utf8") : str("notes"));
const techniques = () => {
  const t = { transitions: many("transition"), pacing: many("pacing"), type: many("type"), colour: many("colour").concat(many("color")), other: many("technique") };
  return Object.values(t).some((v) => v.length) ? t : undefined;
};

try {
  switch (cmd) {
    case "add": {
      const first = args._[1];
      const x = addInspo({
        file: first && !isUrl(first) ? first : undefined,
        url: first && isUrl(first) ? first : str("url"),
        asset: str("asset"),
        title: str("title")!,
        kind: str("kind"),
        source: str("source"),
        name: str("name"),
        love: many("love"),
        tags: csv("tags").concat(csv("tag")),
        useFor: csv("use-for"),
        techniques: techniques(),
        sourceNote: str("from"),
        links: links(),
        notes: notes(),
        by,
        push: !args["no-push"],
      });
      out({ id: x.meta.id, path: x.path, asset: x.meta.asset ?? null, next: x.meta.asset ? `tools/inspo breakdown ${x.meta.id}` : "a link: add the media too if you can save it" });
      break;
    }
    case "search":
    case "list": {
      const xs = searchInspo({ text: str("text"), tags: csv("tag").concat(csv("tags")), kind: str("kind"), status: str("status"), useFor: str("use-for"), technique: str("technique") });
      if (args.json) out(xs.map(({ meta, body, path }) => ({ ...meta, path, body })));
      else {
        for (const { meta: m } of xs) console.log(`${m.id.padEnd(44)} ${m.kind.padEnd(10)} ${m.status.padEnd(8)} ${m.title}`);
        console.log(`(${xs.length})`);
      }
      break;
    }
    case "show": {
      const x = findInspo(args._[1]);
      if (args.json) out({ ...x.meta, path: x.path, body: x.body });
      else {
        out({ ...x.meta, path: x.path });
        console.log(`\n----- notes -----\n\n${x.body.trimEnd()}`);
      }
      break;
    }
    case "edit": {
      const id = args._[1];
      const cur = findInspo(id);
      const love = many("love").length ? many("love") : many("add-love").length ? [...cur.meta.love, ...many("add-love")] : undefined;
      const t = techniques();
      const merged = t ? Object.fromEntries(Object.entries(t).filter(([, v]) => v.length).map(([k, v]) => [k, [...new Set([...((cur.meta.techniques as Record<string, string[]>)[k] ?? []), ...v])]])) : undefined;
      const w = editInspo(id, { title: str("title"), love, useFor: csv("use-for").length ? [...new Set([...cur.meta.useFor, ...csv("use-for")])] : undefined, tags: csv("tags").length ? [...new Set([...cur.meta.tags, ...csv("tags")])] : undefined, techniques: merged, notes: notes(), links: many("link").length ? [...cur.meta.links, ...links()] : undefined });
      out({ id: w.meta.id, love: w.meta.love.length, techniques: w.meta.techniques, useFor: w.meta.useFor });
      break;
    }
    case "breakdown":
      out(breakdownInspo(args._[1], { by, sheet: !!args.sheet, push: !args["no-push"], threshold: args.threshold !== undefined ? Number(args.threshold) : undefined }));
      break;
    case "archive":
      out(archiveInspo(args._[1], { unarchive: !!args.undo }));
      break;
    case "build":
    case "index": {
      const r = writeBoardIndexes();
      out(`catalog/inspo.json ${r.inspo ? "rebuilt" : "unchanged"}; catalog/prompts.json ${r.prompts ? "rebuilt" : "unchanged"}`);
      break;
    }
    default:
      console.log(execFileSync("sed", ["-n", "2,20p", join(ROOT, "tools", "inspo.ts")], { encoding: "utf8" }).replace(/^\/\/ ?/gm, ""));
  }
} catch (e) {
  console.log(`ERROR ${(e as Error).message}`);
  process.exit(1);
}
