# curate-motion

Curate's motion-graphics marketing videos. One library of assets (Zee, the persona Emma and her
wardrobe and camera roll, app footage, music, brand), reusable Remotion components, and ads
assembled from both. Nothing is regenerated.

- **Agents and people: read [AGENTS.md](AGENTS.md) first.**
- The design: [ARCHITECTURE.md](ARCHITECTURE.md). The rules: [RULES.md](RULES.md).
- Why things are this way: [decisions/](decisions/). What changed: [CHANGELOG.md](CHANGELOG.md).

## Quick start

```bash
npm install                     # Node 23.6+; also turns on the pre-commit hook
tools/sync pull --ad meet-zee   # media for one ad from the private S3 bucket (needs AWS credentials)
npm run dev                     # Remotion Studio
tools/render meet-zee --format 9x16 --length 15 --draft
```

## The library

```bash
tools/library-ui                # the founder's page: http://127.0.0.1:4317 (browse, drag-and-drop add, approve, retire)
tools/catalog search --kind garment --tag colour:black
tools/catalog add <file> --kind photo --licence ai-owned --tags persona=emma
tools/catalog retire <id>       # or: remove <id> --force (drafts only)
tools/prompts search --area image-gen --outcome worked   # the prompt library: what worked, before you write a new one
tools/inspo search --use-for c14                         # the inspo board (study only, never shipped)
tools/persona sync emma --dry-run   # what Emma's real account would gain / lose
```

Code and manifests live here (private GitHub repo). Media lives in the private S3 bucket
`curate-motion-library-276451918677` (us-east-1) and moves with `tools/sync`. Never commit media
or secrets: the pre-commit hook and CI block them.
