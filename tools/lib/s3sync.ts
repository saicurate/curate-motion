// S3 transfer by manifest, shared by tools/sync, tools/catalog (add/replace push) and tools/library-ui.
// library/<path> <-> s3://BUCKET/library/<path>. Objects carry x-amz-meta-sha256 + an S3 SHA256 checksum.
import { existsSync, mkdirSync, renameSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { aws, BUCKET, INDEX_PATH, LIB, readJson, s3KeyFor, sha256File, treeSha } from "./core.ts";

export type FileE = { role: string; path: string; sha256: string; bytes: number; s3Key?: string };
export type Entry = { id: string; kind: string; status: string; files: FileE[]; asset: { frames?: { dir: string; count: number; treeSha256: string } } };

export const TREE = "_tree.sha256"; // marker object holding a frame folder's treeSha256

export const indexEntries = (): Entry[] => {
  if (!existsSync(INDEX_PATH)) throw new Error("catalog/index.json missing: run tools/catalog build");
  return readJson<{ assets: Entry[] }>(INDEX_PATH).assets;
};

export const remoteSha = (key: string): string | null => {
  const o = aws(["s3api", "head-object", "--bucket", BUCKET, "--key", key, "--query", "Metadata.sha256", "--output", "text"], true);
  return o && o.trim() !== "None" ? o.trim() : null;
};

const log = (quiet: boolean, s: string) => {
  if (!quiet) console.log(s);
};

/** Upload every local file of these entries whose bytes match the manifest and aren't in S3 yet. */
export const pushEntries = (es: Entry[], o: { dry?: boolean; quiet?: boolean } = {}) => {
  let sent = 0;
  let same = 0;
  for (const e of es) {
    for (const f of e.files) {
      const p = join(LIB, f.path);
      if (!existsSync(p)) continue;
      if (sha256File(p) !== f.sha256) throw new Error(`${e.id}: ${f.path} differs from its manifest sha256. Refusing to push. A changed file is a new version (tools/catalog replace).`);
      const key = s3KeyFor(f.path);
      if (remoteSha(key) === f.sha256) {
        same++;
        continue;
      }
      log(!!o.quiet, `${o.dry ? "would push" : "push"}  ${e.id}  ${f.path}`);
      if (o.dry) continue;
      aws(["s3", "cp", p, `s3://${BUCKET}/${key}`, "--metadata", `sha256=${f.sha256},asset-id=${e.id}`, "--checksum-algorithm", "SHA256", "--only-show-errors"]);
      sent++;
    }
    const fr = e.asset.frames;
    if (fr) {
      const d = join(LIB, fr.dir);
      if (!existsSync(d)) continue;
      if (treeSha(d).sha256 !== fr.treeSha256) throw new Error(`${e.id}: frames in ${fr.dir} differ from the manifest. Refusing to push.`);
      const marker = s3KeyFor(`${fr.dir.replace(/\/$/, "")}/${TREE}`);
      if (remoteSha(marker) === fr.treeSha256) {
        same++;
        continue;
      }
      log(!!o.quiet, `${o.dry ? "would push" : "push"}  ${e.id}  ${fr.dir} (${fr.count} frames)`);
      if (o.dry) continue;
      aws(["s3", "sync", d, `s3://${BUCKET}/${s3KeyFor(fr.dir)}`, "--metadata", `asset-id=${e.id}`, "--only-show-errors"]);
      aws(["s3api", "put-object", "--bucket", BUCKET, "--key", marker, "--body", "/dev/null", "--metadata", `sha256=${fr.treeSha256}`, "--output", "text", "--query", "ETag"]);
      sent++;
    }
  }
  return { sent, same };
};

/** Download every file of these entries that is missing locally or doesn't match; re-hash before keeping it. */
export const pullEntries = (es: Entry[], o: { dry?: boolean; quiet?: boolean } = {}) => {
  let got = 0;
  let here = 0;
  for (const e of es) {
    for (const f of e.files) {
      const dst = join(LIB, f.path);
      if (existsSync(dst) && sha256File(dst) === f.sha256) {
        here++;
        continue;
      }
      log(!!o.quiet, `${o.dry ? "would pull" : "pull"}  ${e.id}  ${f.path}`);
      if (o.dry) continue;
      mkdirSync(dirname(dst), { recursive: true });
      const tmp = `${dst}.part`;
      aws(["s3api", "get-object", "--bucket", BUCKET, "--key", s3KeyFor(f.path), "--checksum-mode", "ENABLED", tmp, "--output", "text", "--query", "ContentLength"]);
      if (sha256File(tmp) !== f.sha256) {
        rmSync(tmp);
        throw new Error(`${f.path}: downloaded bytes do not match the manifest sha256. Not written.`);
      }
      renameSync(tmp, dst);
      got++;
    }
    const fr = e.asset.frames;
    if (fr) {
      const d = join(LIB, fr.dir);
      if (existsSync(d) && treeSha(d).sha256 === fr.treeSha256) {
        here++;
        continue;
      }
      log(!!o.quiet, `${o.dry ? "would pull" : "pull"}  ${e.id}  ${fr.dir} (${fr.count} frames)`);
      if (o.dry) continue;
      mkdirSync(d, { recursive: true });
      aws(["s3", "sync", `s3://${BUCKET}/${s3KeyFor(fr.dir)}`, d, "--exclude", TREE, "--only-show-errors"]);
      if (treeSha(d).sha256 !== fr.treeSha256) throw new Error(`${fr.dir}: frames pulled but the tree hash does not match the manifest.`);
      got++;
    }
  }
  return { got, here };
};

/** Remove a draft's objects from S3 (versioning keeps the bytes 90 more days, then they expire). */
export const deleteRemote = (e: Entry) => {
  // only delete what is there (a delete on a missing key would still leave a delete marker)
  for (const f of e.files) if (remoteSha(s3KeyFor(f.path)) !== null) aws(["s3api", "delete-object", "--bucket", BUCKET, "--key", s3KeyFor(f.path)], true);
  const fr = e.asset.frames;
  if (fr) aws(["s3", "rm", `s3://${BUCKET}/${s3KeyFor(fr.dir)}`, "--recursive", "--only-show-errors"], true);
};
