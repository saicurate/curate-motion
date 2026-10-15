#!/usr/bin/env node
// tools/catalog: the asset catalog CLI. Any agent (or the founder) queries and changes assets here.
// Every write validates, updates catalog/index.json, and (add/replace) uploads to S3.
//
// Find
//   tools/catalog list    [--kind garment] [--status approved] [--json]
//   tools/catalog search  [--tag persona:emma --tag colour:black] [--kind …] [--status …] [--text "jeans"] [--json]
//   tools/catalog show    <id>
// Add / change / remove
//   tools/catalog add <file> --kind <kind> --licence <preset> [--scope emma] [--name jeans-straight-light-wash]
//        [--title "…"] [--tags persona=emma,colour=black] [--set key=value …] [--extra cutout:<file> --extra thumb:<file>]
//        [--frames <dir>] [--source-model … --source-author … --source-url …] [--cost-usd 0.06] [--by <agent>] [--no-push]
//        licence presets: ai-owned, curate, unsplash, pexels, mixkit, ofl, reference
//   tools/catalog replace <id> <file> [--extra cutout:<file>] [--by …]   new version vN+1 (supersedes <id>)
//   tools/catalog tag     <id> [--add colour=navy …] [--remove mood=calm …]
//   tools/catalog retire  <id> [--for <new-id>]                           never used in new ads again
//   tools/catalog remove  <id> [--force]          retires; --force hard-deletes a DRAFT (never an approved asset)
//   tools/catalog approve <id…> --by <name>       founder sign-off (retires what it supersedes)
// Maintain
//   tools/catalog build                           rebuild catalog/index.json + catalog/schemas/*.json
//   tools/catalog validate [--sha auto|local|s3|none] [--immutable-against <git-ref>] [--check-index]
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { list, parseArgs, ROOT } from "./lib/core.ts";
import { addAsset, approveAsset, loadIndex, rebuild, removeAsset, replaceAsset, retireAsset, search, tagAsset, validate, type IndexEntry } from "./lib/catalog.ts";

const args = parseArgs(process.argv.slice(2));
const cmd = args._[0] ?? "help";
const by = typeof args.by === "string" ? args.by : (process.env.CURATE_AGENT ?? "unknown-agent");
const byType = args.human ? "human" : "agent";

const rows = (rs: IndexEntry[]) => {
  if (args.json) return console.log(JSON.stringify(rs.map(({ asset: _a, ...r }) => r), null, 2));
  for (const r of rs) console.log(`${r.id.padEnd(52)} ${r.status.padEnd(9)} ${r.title}`);
  console.log(`(${rs.length})`);
};
const extras = () => list(args.extra).map((x) => ({ role: x.slice(0, x.indexOf(":")), file: x.slice(x.indexOf(":") + 1) }));
const sets = () => Object.fromEntries(list(args.set).map((kv) => [kv.slice(0, kv.indexOf("=")), kv.slice(kv.indexOf("=") + 1)]));
const tagsArg = () => list(args.tags).flatMap((t) => t.split(",")).concat(list(args.tag)).map((s) => s.trim()).filter(Boolean);
const out = (o: unknown) => console.log(typeof o === "string" ? o : JSON.stringify(o, null, 2));

try {
  switch (cmd) {
    case "list":
    case "search":
      rows(search({ kind: args.kind as string, status: args.status as string, tags: list(args.tag), text: typeof args.text === "string" ? args.text : undefined }));
      break;
    case "show": {
      const e = loadIndex().assets.find((a) => a.id === args._[1]);
      if (!e) throw new Error(`no asset ${args._[1]}. Try: tools/catalog search --text "${(args._[1] ?? "").split(".")[2] ?? ""}"`);
      out(e);
      break;
    }
    case "add": {
      const file = args._[1] ?? (args.file as string);
      if (!file || typeof args.kind !== "string" || !args.licence) throw new Error("usage: tools/catalog add <file> --kind <kind> --licence <preset> [--scope …] [--name …] [--tags …] [--set k=v]");
      out(
        addAsset({
          file,
          kind: args.kind,
          id: args.id as string | undefined,
          scope: args.scope as string | undefined,
          name: args.name as string | undefined,
          title: args.title as string | undefined,
          licence: String(args.licence).startsWith("{") ? JSON.parse(String(args.licence)) : String(args.licence),
          tags: tagsArg(),
          fields: sets(),
          extras: extras(),
          frames: args.frames as string | undefined,
          source: Object.fromEntries(["model", "author", "url", "tool", "prompt"].filter((k) => typeof args[`source-${k}`] === "string").map((k) => [k, args[`source-${k}`]])),
          costUsd: args["cost-usd"] !== undefined ? Number(args["cost-usd"]) : undefined,
          costCalls: args["cost-calls"] !== undefined ? Number(args["cost-calls"]) : undefined,
          aiGenerated: args.ai === undefined ? undefined : String(args.ai) === "true",
          by,
          byType,
          push: !args["no-push"],
        }),
      );
      break;
    }
    case "replace":
      out(replaceAsset(args._[1], args._[2], { by, byType, extras: extras(), push: !args["no-push"], costUsd: args["cost-usd"] !== undefined ? Number(args["cost-usd"]) : undefined }));
      break;
    case "tag":
      out(tagAsset(args._[1], list(args.add), list(args.remove)));
      break;
    case "retire":
      for (const id of args._.slice(1)) out(retireAsset(id, { for: args.for as string | undefined }));
      break;
    case "remove":
      for (const id of args._.slice(1)) out(removeAsset(id, { force: !!args.force }));
      break;
    case "approve":
      if (typeof args.by !== "string") throw new Error("approve needs --by <who approved> (only the founder, or someone they named, approves)");
      for (const id of args._.slice(1)) out(approveAsset(id, args.by));
      break;
    case "build":
    case "index": {
      const r = rebuild();
      out(`catalog/index.json ${r.changed ? "rebuilt" : "unchanged"}: ${r.count} assets; schemas in catalog/schemas/`);
      break;
    }
    case "validate": {
      const r = validate({ sha: args.sha as string | undefined, immutableAgainst: args["immutable-against"] as string | undefined, checkIndex: !!args["check-index"] });
      for (const w of r.warnings) console.log(`warn  ${w}`);
      for (const e of r.errors) console.log(`ERROR ${e}`);
      console.log(`${r.errors.length ? "FAILED" : "ok"}: ${r.assets} assets in ${r.manifests} manifests, ${r.ads} ads, ${r.checked} shas checked (${args.sha ?? "auto"}), ${r.warnings.length} warnings, ${r.errors.length} errors`);
      process.exit(r.errors.length ? 1 : 0);
      break;
    }
    default:
      console.log(execFileSync("sed", ["-n", "2,25p", join(ROOT, "tools", "catalog.ts")], { encoding: "utf8" }).replace(/^\/\/ ?/gm, ""));
  }
} catch (e) {
  console.log(`ERROR ${(e as Error).message}`);
  process.exit(1);
}
