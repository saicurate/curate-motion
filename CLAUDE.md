# CLAUDE.md

New here to make Curate videos? Read **[START-HERE.md](START-HERE.md)** first: where every asset is, how to
make and hand back a video, and what needs the founder.

Read and follow **[AGENTS.md](AGENTS.md)**: it is the canonical guide for this repo (what it is, the
folder map, the catalog CLI, how to make and render an ad, how to add an asset, the rules, and what
not to do).

Claude Code specifics:
- Making a motion film (an ad, a reel): the project skill **`/motion-reel`** (`.claude/skills/motion-reel/SKILL.md`), PROPOSED until the founder's OK after Pop out v3.
- Use the Remotion skills (`remotion:remotion-best-practices` and friends) for Remotion API questions.
- Query assets with `tools/catalog search …` (Bash) instead of globbing `library/`.
- No paid model calls (image, video or audio generation) without the founder's explicit OK.
- Prompts: `tools/prompts search` before writing an image/video/voice prompt; log every prompt you use
  with its outcome (`tools/prompts add | use | rate`). Inspo is `tools/inspo`; never put a reference in an ad.
