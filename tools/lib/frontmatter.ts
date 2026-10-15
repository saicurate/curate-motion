// Markdown files with YAML front matter (prompts/, inspo/), read and written without a YAML
// dependency. The writer emits a small, predictable YAML subset; the reader accepts that subset and
// the usual hand-written forms:
//
//   ---
//   id: prompt.image-gen.garment-product-shot.v1      plain scalar
//   title: "Garment product shot: template"           double-quoted (JSON string rules)
//   rating: 4                                         number / true / false / null
//   tags: [logo-free, template]                       flow list (quoted or not)
//   outputs:                                          block list
//     - garment.emma.tee-white.v1
//   techniques:                                       one level of nested map
//     transitions: [pop-out-return, match-cut]
//   ---
//   The body (the prompt text, or notes) follows.
//
// Keep every value on ONE line. Multi-line YAML (`|`, `>`) is not supported: put long text in the body.
type V = unknown;

const unquoteSingle = (s: string) => s.slice(1, -1).replace(/''/g, "'");

const scalar = (raw: string): V => {
  const s = raw.trim();
  if (s === "" || s === "~" || s === "null") return null;
  if (s === "true") return true;
  if (s === "false") return false;
  if (/^-?\d+(\.\d+)?$/.test(s)) return Number(s);
  if (s.startsWith('"')) return JSON.parse(s);
  if (s.startsWith("'") && s.endsWith("'")) return unquoteSingle(s);
  if (s.startsWith("{")) return JSON.parse(s);
  if (s.startsWith("[")) {
    try {
      return JSON.parse(s);
    } catch {
      const inner = s.slice(1, -1).trim();
      if (!inner) return [];
      return inner.split(",").map((x) => scalar(x));
    }
  }
  // a plain scalar may end in a comment (" # …")
  return s.replace(/\s+#.*$/, "");
};

/** Split a file into its front matter (parsed) and body. Throws with the line number on anything it can't read. */
export const parseFrontMatter = (text: string): { meta: Record<string, V>; body: string } => {
  const src = text.replace(/^﻿/, "").replace(/\r\n/g, "\n");
  if (!src.startsWith("---\n")) throw new Error("no front matter: the file must start with a line '---'");
  const end = src.indexOf("\n---", 4);
  if (end < 0 || (src[end + 4] !== "\n" && src[end + 4] !== undefined)) throw new Error("front matter not closed: add a line '---' after it");
  const lines = src.slice(4, end).split("\n");
  const body = src.slice(end + 4).replace(/^\n/, "");
  const meta: Record<string, V> = {};
  let open: { key: string; sub?: string } | null = null; // the key whose block list / map is being read
  lines.forEach((line, i) => {
    const at = `front matter line ${i + 2}`;
    if (!line.trim() || line.trimStart().startsWith("#")) return;
    const indent = line.length - line.trimStart().length;
    const t = line.trim();
    if (t.startsWith("- ") || t === "-") {
      if (!open) throw new Error(`${at}: a list item with no key above it`);
      const item = scalar(t.slice(1));
      const host = open.sub ? (meta[open.key] as Record<string, V>) : meta;
      const k = open.sub ?? open.key;
      if (host[k] === null || host[k] === undefined) host[k] = [];
      if (!Array.isArray(host[k])) throw new Error(`${at}: "${k}" already has a value`);
      (host[k] as V[]).push(item);
      return;
    }
    const m = /^([A-Za-z_$][\w$-]*):(?:\s+(.*))?$/.exec(t);
    if (!m) throw new Error(`${at}: expected "key: value" (keep each value on one line)`);
    const [, key, rest = ""] = m;
    if (rest.trim() === "|" || rest.trim() === ">" || rest.trim().startsWith("|") || rest.trim().startsWith(">")) throw new Error(`${at}: multi-line values are not supported; put long text in the body`);
    if (indent > 0) {
      if (!open || open.sub === undefined && typeof meta[open.key] !== "object") throw new Error(`${at}: indented key "${key}" outside a map`);
      const parent = open.key;
      if (meta[parent] === null || Array.isArray(meta[parent])) meta[parent] = {};
      (meta[parent] as Record<string, V>)[key] = rest.trim() === "" ? null : scalar(rest);
      open = { key: parent, sub: key };
      return;
    }
    meta[key] = rest.trim() === "" ? null : scalar(rest);
    open = { key };
  });
  return { meta, body };
};

const PLAIN = /^[A-Za-z0-9][A-Za-z0-9 ._/@()+-]*$/;
const RESERVED = new Set(["true", "false", "null", "yes", "no", "on", "off", "~"]);
const str = (s: string) => (PLAIN.test(s) && !RESERVED.has(s.toLowerCase()) && !/^-?\d+(\.\d+)?$/.test(s) && !s.endsWith(" ") ? s : JSON.stringify(s));
const val = (v: V): string => (typeof v === "string" ? str(v) : JSON.stringify(v));
const inlineList = (a: V[]) => `[${a.map(val).join(", ")}]`;
const shortList = (a: V[]) => a.length <= 4 && a.every((x) => typeof x !== "object" && String(x).length <= 48) && inlineList(a).length <= 100;

/** Write front matter + body. Key order is the object's order; undefined values are left out. */
export const stringifyFrontMatter = (meta: Record<string, V>, body: string): string => {
  const out: string[] = ["---"];
  for (const [k, v] of Object.entries(meta)) {
    if (v === undefined) continue;
    if (Array.isArray(v)) {
      if (!v.length || shortList(v)) out.push(`${k}: ${inlineList(v)}`);
      else {
        out.push(`${k}:`);
        for (const x of v) out.push(`  - ${val(x)}`);
      }
    } else if (v && typeof v === "object") {
      out.push(`${k}:`);
      for (const [sk, sv] of Object.entries(v as Record<string, V>)) {
        if (sv === undefined) continue;
        if (Array.isArray(sv) && sv.length && !shortList(sv)) {
          out.push(`  ${sk}:`);
          for (const x of sv) out.push(`    - ${val(x)}`);
        } else out.push(`  ${sk}: ${Array.isArray(sv) ? inlineList(sv) : val(sv)}`);
      }
    } else out.push(`${k}: ${val(v)}`);
  }
  out.push("---", "");
  return `${out.join("\n")}${body.replace(/\s+$/, "")}\n`;
};
