# 0010: Prompts and inspo are first-class, as text in git

2026-10-15 · founder: "create a new place where we store all the prompts that worked for us.. worked
not worked the ones you use and the ones i give so we can mix and do hybrid… and also a place where we
can give our inspos so that we can refere them whenever we want"

**Context.** The prompts behind Emma's assets lived inside Python scripts in `marketing/videos/`; the
founder's asks and the agents' briefs lived only in a session transcript; what failed and why (the
iMac logo, the deli sign) lived in nobody's memory. Every new agent rewrote prompts from scratch. The
reference reel the founder sent sat in `library/references/` with one line of notes.

**Decision.**
- **`prompts/`**: one Markdown file per prompt, `prompts/<area>/<name>.v<N>.md`, YAML front matter
  validated by zod (`schemas/prompt.ts`), the prompt text as the body. It records the author (founder,
  agent, other), target, inputs, outputs, outcome, a 1–5 rating, why, parents (hybrids, remakes,
  templates) and every use. `tools/prompts`; the library page's Prompts tab; `catalog/prompts.json`.
- **`inspo/`**: one Markdown file per inspiration, `inspo/<id>.md` (`schemas/inspo.ts`): what we
  love, techniques, use-for, status. Its media goes through the library as kind `reference` (S3,
  licence "Third-party content, reference only", never shipped). `tools/inspo`, with a free local
  breakdown (ffprobe/ffmpeg); the Inspo tab; `catalog/inspo.json`.
- **Linked both ways:** a prompt lists its outputs (asset ids); each asset's `source.promptId` points
  back. `tools/catalog validate` (and CI) checks both, plus parents, inputs, secrets and index freshness.
- **Agents must** search prompts before writing a new image, video or voice prompt, and log every
  prompt they use with its outcome (AGENTS.md).

**Why text in git, not S3 or a database.** Prompts are small text: git gives diffs, history and review
for free, every agent tool can read Markdown, and a prompt is reviewed in the same commit as the
asset it made. One file per prompt avoids merge conflicts between agents working at the same time.
Front matter keeps the data machine-readable without a second file. Media stays in S3 like all media.

**Consequences.**
- A prompt's text is immutable once it was used or rated (validate checks against the previous
  commit): a changed text is `tools/prompts revise` → vN+1 with the old one as parent.
- Writes refuse anything that looks like a secret and never print it; the pre-commit hook and CI also
  look for `sk_` keys now.
- `rebuild()` keeps working when a prompt or inspo file is broken (it warns and leaves that index), so
  one bad file never blocks asset work; validate fails until it is fixed.
- Inspo can never reach a render: validate fails an ad listing a `reference`, and `tools/render`
  refuses to stage one (RULES.md › 9).
- The front matter is a YAML subset (one line per value; no `|` or `>` blocks), read without a YAML
  dependency (`tools/lib/frontmatter.ts`). Long text belongs in the body.
