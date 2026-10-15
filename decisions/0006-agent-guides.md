# 0006: AGENTS.md is the one guide; tool files point to it

2026-10-15 · founder requirement: the repo is used by Claude Code, Cursor, Codex, Copilot, Gemini and others

**Decision.** AGENTS.md is canonical. CLAUDE.md, GEMINI.md, `.cursor/rules/curate-motion.mdc` and
`.github/copilot-instructions.md` only point to it (plus tool-specific notes). Every top-level
folder has a README; every ad has `ad.json` + README; `catalog/index.json` is the machine-readable index.

**Why.** One source of truth can't drift; every tool finds its own entry file.

**Consequences.** Change the rules in AGENTS.md (and RULES.md), never only in a pointer file.
