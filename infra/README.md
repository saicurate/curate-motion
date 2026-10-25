# infra/

The bucket's settings as files. `infra/s3/setup.sh` creates `curate-motion-library-<account-id>`
(us-east-1) or re-applies everything, idempotently, then prints the live settings.

- `public-access-block.json` (all four on), `encryption.json` (SSE-S3, bucket key),
  `lifecycle.json` (non-current versions expire after 90 days; abort multipart after 7),
  `policy.template.json` (deny non-TLS). Versioning on and tags project=curate-motion are set by the script.
- `remotion-lambda/`: the Remotion Lambda setup (function, role, policy, bucket, costs log); see its README.
- **Doesn't go here:** credentials, account secrets.
- **Example:** `infra/s3/setup.sh` after changing `lifecycle.json`.
