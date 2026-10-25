# infra/remotion-lambda/

Remotion Lambda for curate-motion: renders on AWS instead of this Mac (founder OK 2026-10-24: "Yep,
let's go with AWS. That's fine."). Account 276451918677, us-east-1, everything tagged project=curate-motion.

| What | Name |
|---|---|
| Function | `remotion-render-4-0-535-mem6144mb-disk10240mb-900sec` (arm64, 6144 MB, 10 GB disk, 900 s) |
| Role | `arn:aws:iam::276451918677:role/remotion-lambda-role` (trust: `trust.json`) |
| Policy | `arn:aws:iam::276451918677:policy/remotion-lambda-policy` (`role-policy.json`, from `npx remotion lambda policies role`; Remotion's own buckets only) |
| Bucket | `remotionlambda-useast1-hh2gu2n01z` (Remotion's; sites, renders, and the private `media/` prefix) |
| Sites | `<siteBase>-<ad>` (one per ad, so two ads rendering at once never share a bundle); `config.json` |
| Deploying identity | the local AWS user (no extra IAM user or access key was made) |

**Use it:** `tools/render-lambda` (AGENTS.md › Render in the cloud).

**Privacy.** Remotion's Chrome loads the site from a plain URL, so a site cannot be private
(remotion.dev/docs/lambda/faq). So the site is code only: `public-site/` (a `robots.txt` that disallows
everything) is its public dir, and the tool deletes the source maps after each deploy. Media never goes
in it: each render uploads the ad's staged files to `media/<run>/` (no ACL, private), passes each one's
presigned URL (6 h) in `props.__media`, and `motion/assets.ts` uses them; same host as the site, so fonts
and WebGL textures load without CORS. The prefix is deleted when the render ends. The library bucket
(`curate-motion-library-…`) is untouched: Lambda never reads it. Public by URL: the minified code and
`catalog/index.json` (asset ids, titles, paths; no media).

**Code changes.** Each run redeploys the ad's site (about 10–20 s). `--no-deploy` reuses the last one;
only when nothing in `motion/`, `ads/` or `catalog/` changed.

**Costs** (Remotion's own estimate, logged per render to `costs.jsonl` and to `~/.curate-cost/laptop.log`
as an AICOST receipt, provider aws / api remotion-lambda, `usd` field):

| 2026-10-24, app-store-header roll | Lambda | This Mac (M5 Pro, idle) |
|---|---|---|
| a 3840 × 1646 still | 7–9 s, about $0.0005 | about 2 s |
| the 15 s film, 900 frames at 60 fps, 3840 × 1646 | 92 s on 113 Lambdas, $0.19 (153 s on 45 Lambdas, $0.14) | 83 s |

An idle Mac is about as fast for one film; Lambda wins when several agents render at once (the Mac
slows for everyone) or for many renders in parallel. The account allows 1,000 concurrent Lambdas.

**Teardown** (only on the founder's word):
`npx remotion lambda functions rmall --region us-east-1 -y`, `npx remotion lambda sites rmall --region us-east-1 -y`,
then `aws iam detach-role-policy` / `delete-role` / `delete-policy` for the two IAM names above, and empty and
delete the bucket.

**Licence.** Remotion's Free License covers for-profit companies of up to 3 employees, Lambda included;
above that a Company License is needed (remotion.pro; RULES.md › 7).
