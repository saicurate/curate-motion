# GEMINI.md

Read and follow **[AGENTS.md](AGENTS.md)**: it is the canonical guide for this repo (what it is, the
folder map, the catalog CLI, how to make and render an ad, how to add an asset, the rules, and what
not to do).

Gemini CLI specifics: run shell commands from the repo root; query assets with
`tools/catalog search …` rather than listing `library/`. No paid generation without the founder's OK.

Before writing any image, video or voice prompt, run `tools/prompts search`; after using one, log it
with its outcome (`tools/prompts add | use | rate`). Inspo (`inspo/`, `reference` assets) is never shipped.
