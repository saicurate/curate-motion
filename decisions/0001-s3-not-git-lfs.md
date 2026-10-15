# 0001: Media in S3 with manifests in git, not Git LFS

2026-10-15 · approved by the founder ("code and lists on GitHub, private; big media in a private S3 bucket with a one-command sync")

**Context.** Hundreds of MB now (328 MB at migration), GBs later (footage, renders). Many agents and tools clone the repo.

**Decision.** Git holds code and manifests (ids, sha256, licence). Media bytes live in a private,
versioned S3 bucket at `library/<path>`; `tools/sync` moves them by manifest.

**Why.** LFS bills bandwidth and storage per GitHub plan, pulls everything on clone, shows pointer
files to tools without LFS, and can't fetch per ad. S3 is cheap, versioned with lifecycle rules,
uses the AWS account Curate already runs on, and `pull --ad` fetches only what one ad needs.
The manifest sha256 gives the same integrity check.

**Consequences.** You need AWS credentials to get media. A file that changes is a new version
(new id), never an overwrite. The bucket is private; nothing is served publicly from it.
