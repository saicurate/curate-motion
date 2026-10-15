#!/usr/bin/env node
// tools/sync: move library media between this checkout and the private S3 bucket, by manifest.
// Git holds the manifests (ids + sha256); S3 holds the bytes at s3://<bucket>/library/<path>.
//
//   tools/sync status [--remote]                 what is local / missing / mismatched
//   tools/sync pull [--only <id-glob>] [--ad <ad-id>] [--kind music] [--dry-run]
//   tools/sync push [--only <id-glob>] [--kind …] [--dry-run]   upload local files whose sha matches the manifest
//   tools/sync renders [push|pull] [--dry-run]   mirror renders/ <-> s3://<bucket>/renders/
//
// Every pushed object carries x-amz-meta-sha256 and an S3 SHA256 checksum; every pulled file is
// re-hashed and rejected if it does not match the manifest. Sync never deletes remotely (only
// `tools/catalog remove --force` on a draft does); versioning keeps overwritten bytes 90 days.
import { existsSync } from "node:fs";
import { join } from "node:path";
import { aws, BUCKET, LIB, list, parseArgs, readJson, ROOT, sha256File, treeSha } from "./lib/core.ts";
import { indexEntries, pullEntries, pushEntries, remoteSha, type Entry } from "./lib/s3sync.ts";

const args = parseArgs(process.argv.slice(2));
const cmd = args._[0] ?? "status";
const dry = !!args["dry-run"];

const glob = (g: string) => new RegExp(`^${g.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*")}$`);

const selected = (): Entry[] => {
  let es = indexEntries();
  const only = list(args.only).map(glob);
  if (only.length) es = es.filter((e) => only.some((r) => r.test(e.id)));
  if (typeof args.kind === "string") es = es.filter((e) => e.kind === args.kind);
  if (typeof args.ad === "string") {
    const ad = readJson<{ assets: string[] }>(join(ROOT, "ads", args.ad, "ad.json"));
    es = es.filter((e) => ad.assets.includes(e.id));
  }
  return es;
};

const status = () => {
  let ok = 0;
  const missing: string[] = [];
  const bad: string[] = [];
  for (const e of selected()) {
    for (const f of e.files) {
      const p = join(LIB, f.path);
      if (!existsSync(p)) missing.push(`${e.id}  ${f.path}`);
      else if (sha256File(p) !== f.sha256) bad.push(`${e.id}  ${f.path}`);
      else ok++;
    }
    const fr = e.asset.frames;
    if (fr) {
      const d = join(LIB, fr.dir);
      if (!existsSync(d)) missing.push(`${e.id}  ${fr.dir} (${fr.count} frames)`);
      else if (treeSha(d).sha256 !== fr.treeSha256) bad.push(`${e.id}  ${fr.dir} (frames)`);
      else ok++;
    }
  }
  for (const m of missing) console.log(`missing   ${m}`);
  for (const b of bad) console.log(`MISMATCH  ${b}`);
  console.log(`${ok} ok, ${missing.length} missing (tools/sync pull), ${bad.length} mismatched (a changed file is a new version: tools/catalog replace)`);
  if (args.remote) {
    const n = selected().flatMap((e) => e.files).filter((f) => remoteSha(`library/${f.path}`) !== f.sha256).length;
    console.log(`remote: ${n} files not in s3://${BUCKET} at the manifest's sha (tools/sync push)`);
  }
};

const renders = () => {
  const dir = args._[1] ?? "push";
  const local = join(ROOT, "renders");
  const remote = `s3://${BUCKET}/renders`;
  const [from, to] = dir === "pull" ? [remote, local] : [local, remote];
  console.log(aws(["s3", "sync", from, to, "--exclude", "*.md", "--exclude", ".gitkeep", "--exclude", "queue.json", ...(dry ? ["--dryrun"] : [])]) ?? "");
};

try {
  if (cmd === "status") status();
  else if (cmd === "pull") {
    const r = pullEntries(selected(), { dry });
    console.log(`${dry ? "dry run: " : ""}${r.got} pulled, ${r.here} already here`);
  } else if (cmd === "push") {
    const r = pushEntries(selected(), { dry });
    console.log(`${dry ? "dry run: " : ""}${r.sent} pushed, ${r.same} already in s3://${BUCKET}`);
  } else if (cmd === "renders") renders();
  else console.log("usage: tools/sync status|pull|push|renders  (see the header of tools/sync.ts)");
} catch (e) {
  console.log(`ERROR ${(e as Error).message}`);
  process.exit(1);
}
