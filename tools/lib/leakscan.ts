// Secret scan for text the prompt library and inspo board write (prompts are pasted from chats and
// sessions, where keys get pasted too). It reports WHAT kind of secret and WHERE (line), never the
// value. tools/prompts and tools/inspo refuse to write a file with a finding; tools/catalog validate
// fails on one; the pre-commit hook and CI scan again.

export type Finding = { kind: string; line: number };

/** Patterns for secret VALUES. A match blocks the write. */
const VALUE_PATTERNS: [string, RegExp][] = [
  ["AWS access key", /\b(AKIA|ASIA)[0-9A-Z]{16}\b/],
  // Built from parts so this file never trips the pre-commit hook it mirrors.
  ["AWS secret", new RegExp(["aws", "secret", "access", "key"].join("_") + "\\s*[:=]", "i")],
  ["private key", /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
  ["OpenAI-style key (sk-)", /(?<![A-Za-z0-9])sk-[A-Za-z0-9_-]{20,}/],
  ["ElevenLabs-style key (sk_)", /(?<![A-Za-z0-9])sk_[A-Za-z0-9]{20,}/],
  ["Anthropic key", /(?<![A-Za-z0-9])sk-ant-[A-Za-z0-9_-]{10,}/],
  ["Google API key (AIza)", /AIza[0-9A-Za-z_-]{30,}/],
  ["GitHub token", /\b(ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}/],
  ["Slack token", /\bxox[abprs]-[A-Za-z0-9-]{10,}/],
  ["JSON web token", /\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/],
  ["password/token assignment", /\b(password|passwd|pwd|secret|token|api[_-]?key|apikey|access[_-]?key)\b["']?\s*[:=]\s*["']?(?=[^\s"']*[0-9])(?=[^\s"']*[A-Za-z])[^\s"'<>{}]{10,}/i],
  ["long hex string", /(?<![A-Za-z0-9])[A-Fa-f0-9]{40,}(?![A-Za-z0-9])/],
];

/** A long run of base64-ish characters with upper, lower and digits (a token, not a word or a path). */
const B64 = /[A-Za-z0-9+/_=-]{40,}/g;
const looksLikeToken = (w: string) => (w.match(/\//g) ?? []).length < 2 && /[0-9]/.test(w) && /[A-Z]/.test(w) && /[a-z]/.test(w) && !/(?:^|-)[a-z]+-[a-z]+(?:-|$)/.test(w);

/** Every secret-looking value in `text` (kind + 1-based line, never the value). */
export const scanSecrets = (text: string): Finding[] => {
  const out: Finding[] = [];
  text.split("\n").forEach((line, i) => {
    for (const [kind, re] of VALUE_PATTERNS) if (re.test(line)) out.push({ kind, line: i + 1 });
    for (const m of line.matchAll(B64)) if (looksLikeToken(m[0])) out.push({ kind: "token-like string", line: i + 1 });
  });
  return out;
};

/** Words that often sit next to a secret. Not blocking; `tools/prompts scan` lists them for a human look. */
export const scanMentions = (text: string): Finding[] => {
  const out: Finding[] = [];
  text.split("\n").forEach((line, i) => {
    const m = /\b(api[ _-]?key|token|password|secret|credential)s?\b/i.exec(line);
    if (m) out.push({ kind: `mentions "${m[1].toLowerCase()}"`, line: i + 1 });
  });
  return out;
};

/** Throw (naming the kinds and lines, never the value) if `text` holds a secret. */
export const assertNoSecrets = (text: string, where: string) => {
  const f = scanSecrets(text);
  if (f.length) throw new Error(`${where}: refused, it looks like it contains a secret (${f.map((x) => `${x.kind} on line ${x.line}`).join("; ")}). Remove it (keys go in AWS SSM; write only the parameter NAME) and try again.`);
};
