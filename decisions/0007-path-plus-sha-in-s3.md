# 0007: S3 keys mirror library paths (path + sha), not content addresses

2026-10-15

**Decision.** `library/<path>` ↔ `s3://<bucket>/library/<path>`; integrity from the manifest's
sha256, stored on each object as `x-amz-meta-sha256` and checked on every push and pull.

**Why.** The id already versions the asset, so a path never changes meaning; a browsable bucket is
easier for people; versioning covers accidental overwrites.

**Consequences.** Never overwrite a path with different bytes: `tools/sync push` refuses, and
`tools/catalog replace` makes a new path.
