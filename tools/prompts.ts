#!/usr/bin/env node
// tools/prompts: the prompt library CLI. Every prompt that worked (and didn't), the founder's and
// the agents', one Markdown file each in prompts/<area>/<name>.v<N>.md. Search before you write a
// new image / video / voice prompt; log what you used and how it went.
//
// Find
//   tools/prompts search [--area image-gen] [--outcome worked] [--tag logo-free] [--min-rating 4]
//                        [--text "ghost mannequin"] [--author founder|agent] [--target "Nano Banana"] [--json]
//   tools/prompts list   [--area …] [--json]
//   tools/prompts show   <id> [--json]                      the front matter and the text (copy-paste ready with --text-only)
// Add / change
//   tools/prompts add    [<file> | -] --title "…" --area <area> --target "<model or tool>" --author founder|agent:<name>|other
//                        [--name kebab-name] [--outcome worked|didn't|mixed|untested] [--rating 1-5] [--why "…"]
//                        [--inputs id,id] [--outputs id,id] [--tags a,b] [--parents id,id] [--template] [--source "…"] [--cost-usd 0.06]
//                        (a file with front matter supplies its own fields; flags win. No file: the text comes from stdin.)
//   tools/prompts rate   <id> <1-5> [--outcome worked|didn't|mixed] [--why "…"]
//   tools/prompts use    <id> [--output <asset-id> …] [--cost-usd 0.14]       log a use (and what it made)
//   tools/prompts link   <id> <asset-id…> [--force]                           prompt.outputs + the asset's source.promptId
//   tools/prompts revise <id> [<file> | -] [--title …]                        a changed text = vN+1, parents [<id>]
//   tools/prompts remix  <id> <id> [<id>…] --title "…" [--name …] [--area …] [--target …] [--print]
//                        a hybrid: a new prompt with parents set and the texts stacked for you to edit (--print: show, don't save)
// Maintain
//   tools/prompts build                                  rebuild catalog/prompts.json (tools/catalog build does it too)
//   tools/prompts validate                               the same checks as tools/catalog validate, prompts and inspo only
//   tools/prompts scan [<file>]                          secret scan (never prints a value); no file = every prompt
//
// areas: image-gen video-gen voice music copy motion-brief agent-brief research other
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { list, parseArgs, ROOT } from "./lib/core.ts";
import { parseFrontMatter } from "./lib/frontmatter.ts";
import { findPrompt, loadPrompts, validateBoards, writeBoardIndexes } from "./lib/boards.ts";
import { addPrompt, linkOutputs, ratePrompt, remixDraft, remixPrompts, revisePrompt, searchPrompts, usePrompt } from "./lib/prompts.ts";
import { loadIndex } from "./lib/catalog.ts";
import { scanMentions, scanSecrets } from "./lib/leakscan.ts";

const args = parseArgs(process.argv.slice(2));
const cmd = args._[0] ?? "help";
const by = typeof args.by === "string" ? args.by : (process.env.CURATE_AGENT ?? undefined);
const str = (k: string) => (typeof args[k] === "string" ? (args[k] as string) : undefined);
const csv = (k: string) => list(args[k]).flatMap((x) => x.split(",")).map((s) => s.trim()).filter(Boolean);
const out = (o: unknown) => console.log(typeof o === "string" ? o : JSON.stringify(o, null, 2));
const stars = (r?: number | null) => (r ? "★".repeat(r) + "☆".repeat(5 - r) : "unrated");

/** The text: a file, "-" for stdin, or stdin when nothing is given and it isn't a terminal. */
const readText = (f?: string) => {
  if (f && f !== "-") return readFileSync(f, "utf8");
  if (f === "-" || !process.stdin.isTTY) return readFileSync(0, "utf8");
  throw new Error("give the prompt text as a file, or pipe it in (… | tools/prompts add - --title …)");
};

const rows = (ps: ReturnType<typeof searchPrompts>) => {
  if (args.json) return out(ps.map(({ meta, body, path }) => ({ ...meta, path, body })));
  for (const { meta: m } of ps) console.log(`${m.id.padEnd(58)} ${m.outcome.padEnd(8)} ${stars(m.rating).padEnd(7)} ${m.title}`);
  console.log(`(${ps.length})`);
};

try {
  switch (cmd) {
    case "search":
    case "list":
      rows(searchPrompts({ area: str("area"), outcome: str("outcome"), tags: csv("tag").concat(csv("tags")), minRating: args["min-rating"] !== undefined ? Number(args["min-rating"]) : undefined, text: str("text"), author: str("author"), target: str("target"), template: args.template ? true : undefined }));
      break;
    case "show": {
      const p = findPrompt(args._[1]);
      if (args["text-only"]) {
        process.stdout.write(p.body);
        break;
      }
      const e = (() => {
        try {
          return (JSON.parse(readFileSync(join(ROOT, "catalog", "prompts.json"), "utf8")) as { prompts: { id: string; children: string[] }[] }).prompts.find((x) => x.id === p.meta.id);
        } catch {
          return undefined;
        }
      })();
      if (args.json) out({ ...p.meta, children: e?.children ?? [], path: p.path, body: p.body });
      else {
        out({ ...p.meta, children: e?.children ?? [], path: p.path });
        console.log(`\n----- text (${p.body.length} chars; copy with: tools/prompts show ${p.meta.id} --text-only | pbcopy) -----\n`);
        console.log(p.body.trimEnd());
      }
      break;
    }
    case "add": {
      const raw = readText(args._[1]);
      let meta: Record<string, unknown> = {};
      let body = raw;
      if (raw.startsWith("---\n")) ({ meta, body } = parseFrontMatter(raw));
      const pick = <T>(flag: T | undefined, key: string) => (flag !== undefined && flag !== "" && !(Array.isArray(flag) && !flag.length) ? flag : (meta[key] as T | undefined));
      const p = addPrompt({
        body,
        title: pick(str("title"), "title")!,
        area: pick(str("area"), "area")!,
        name: pick(str("name"), "name"),
        author: pick(str("author"), "author") ?? (by ? `agent:${by.toLowerCase().replace(/[^a-z0-9._-]+/g, "-")}` : (undefined as unknown as string)),
        target: pick(str("target"), "target")!,
        inputs: pick(csv("inputs"), "inputs"),
        outputs: pick(csv("outputs"), "outputs"),
        outcome: pick(str("outcome"), "outcome"),
        rating: pick(str("rating"), "rating"),
        why: pick(str("why"), "why"),
        tags: pick(csv("tags").concat(csv("tag")), "tags"),
        parents: pick(csv("parents"), "parents"),
        template: args.template ? true : (meta.template as boolean | undefined),
        source: pick(str("source"), "source"),
        costUsd: args["cost-usd"] !== undefined ? Number(args["cost-usd"]) : (meta.costUsd as number | undefined),
        createdAt: meta.createdAt as string | undefined,
        usedAt: meta.usedAt as string[] | undefined,
        addedBy: by,
      });
      out({ id: p.meta.id, path: p.path, outcome: p.meta.outcome, outputs: p.meta.outputs.length });
      break;
    }
    case "rate":
      out(ratePrompt(args._[1], args._[2], { outcome: str("outcome"), why: str("why") }));
      break;
    case "use":
      out(usePrompt(args._[1], { outputs: csv("output").concat(csv("outputs")), costUsd: args["cost-usd"] !== undefined ? Number(args["cost-usd"]) : undefined }));
      break;
    case "link":
      out(linkOutputs(args._[1], args._.slice(2).flatMap((x) => x.split(",")), { force: !!args.force }));
      break;
    case "revise": {
      const p = revisePrompt(args._[1], readText(args._[2]), { title: str("title"), target: str("target"), by, author: str("author") ?? (by ? `agent:${by.toLowerCase().replace(/[^a-z0-9._-]+/g, "-")}` : undefined) });
      out({ id: p.meta.id, path: p.path, parents: p.meta.parents, note: "outcome untested: use it, then tools/prompts rate" });
      break;
    }
    case "remix": {
      const ids = args._.slice(1).flatMap((x) => x.split(","));
      if (args.print) {
        const d = remixDraft(ids, { title: str("title") });
        console.log(d.body);
        break;
      }
      const author = str("author") ?? (by ? `agent:${by.toLowerCase().replace(/[^a-z0-9._-]+/g, "-")}` : undefined);
      if (!author) throw new Error("remix needs --author founder | agent:<name> (or --by <agent>)");
      const p = remixPrompts(ids, { title: str("title"), name: str("name"), area: str("area"), target: str("target"), author, by });
      out({ id: p.meta.id, path: p.path, parents: p.meta.parents, next: `edit ${p.path} into one prompt (delete the <!-- … --> lines), use it, then tools/prompts rate ${p.meta.id} <1-5> --outcome …` });
      break;
    }
    case "build":
    case "index": {
      const r = writeBoardIndexes();
      out(`catalog/prompts.json ${r.prompts ? "rebuilt" : "unchanged"}; catalog/inspo.json ${r.inspo ? "rebuilt" : "unchanged"}`);
      break;
    }
    case "validate": {
      const assets = new Map(loadIndex().assets.map((a) => [a.id, { id: a.id, kind: a.kind, source: a.asset.source as { promptId?: string } }]));
      const r = validateBoards(assets, { checkIndex: true });
      for (const w of r.warnings) console.log(`warn  ${w}`);
      for (const e of r.errors) console.log(`ERROR ${e}`);
      console.log(`${r.errors.length ? "FAILED" : "ok"}: ${r.prompts} prompts, ${r.inspo} inspo entries, ${r.warnings.length} warnings, ${r.errors.length} errors`);
      process.exit(r.errors.length ? 1 : 0);
      break;
    }
    case "scan": {
      const files = args._[1] ? [args._[1]] : loadPrompts().ok.map((p) => join(ROOT, p.path));
      let bad = 0;
      for (const f of files) {
        const t = readFileSync(f, "utf8");
        const s = scanSecrets(t);
        bad += s.length;
        for (const x of s) console.log(`SECRET? ${f.replace(`${ROOT}/`, "")}:${x.line}  ${x.kind} (value not shown)`);
        if (args.mentions) for (const x of scanMentions(t)) console.log(`look    ${f.replace(`${ROOT}/`, "")}:${x.line}  ${x.kind}`);
      }
      console.log(`${bad ? "FAILED" : "ok"}: ${files.length} files scanned, ${bad} secret-looking values${args.mentions ? "" : " (--mentions also lists lines that talk about keys/tokens, for a look)"}`);
      process.exit(bad ? 1 : 0);
      break;
    }
    default:
      console.log(execFileSync("sed", ["-n", "2,32p", join(ROOT, "tools", "prompts.ts")], { encoding: "utf8" }).replace(/^\/\/ ?/gm, ""));
  }
} catch (e) {
  console.log(`ERROR ${(e as Error).message}`);
  process.exit(1);
}
