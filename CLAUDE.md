# CLAUDE.md

Read and follow **[AGENTS.md](AGENTS.md)**: it is the canonical guide for this repo (what it is, the
folder map, the catalog CLI, how to make and render an ad, how to add an asset, the rules, and what
not to do).

Claude Code specifics:
- Use the Remotion skills (`remotion:remotion-best-practices` and friends) for Remotion API questions.
- Query assets with `tools/catalog search …` (Bash) instead of globbing `library/`.
- No paid model calls (image, video or audio generation) without the founder's explicit OK.
