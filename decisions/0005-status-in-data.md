# 0005: Status and approvals live in data

2026-10-15 · founder requirement (many agents will use the repo)

**Decision.** Assets carry `status` (draft / approved / retired) with `approvedBy` / `approvedAt`;
ads carry their own status in `ad.json`. Approved assets are immutable. Remove = retire by default;
only drafts can be hard-deleted (`--force`). Only the founder approves.

**Why.** Agents need a machine-checkable answer to "is this safe to use?", and a way to change
things without destroying what was signed off.

**Consequences.** `tools/catalog validate` and CI enforce it: approved files can't change, live ads
can't use drafts, retired ids fail at render.
