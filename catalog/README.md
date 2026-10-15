# catalog/

Generated, machine-readable views of the library. **Never hand-edit**; run `tools/catalog build`.

- `index.json`: every asset from every `library/**/manifest.json` in one list (id, kind, status,
  title, files with S3 keys and sha256, flat `key:value` tags, licence, the full record). Committed;
  CI fails if it is stale.
- `schemas/`: JSON Schemas generated from `schemas/*.ts`: `asset.<kind>.schema.json` for each kind,
  `asset`, `manifest`, `index`, `ad`, `account`, `account-state`.
- **Doesn't go here:** media, hand-written files.
- **Example:** `jq '.assets[] | select(.kind=="music") | .id' catalog/index.json`, or better
  `tools/catalog search --kind music`.
