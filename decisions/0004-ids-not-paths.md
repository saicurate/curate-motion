# 0004: Assets are referenced by versioned id, never by path

2026-10-15

**Decision.** Every asset has an id `<kind>.<scope>.<name>.v<N>`; ads and components reach media
only through `motion/assets.ts` by id. Files are named from the id.

**Why.** Paths change, ids don't; the catalog can say whether an id is approved, retired or
licensed before a render; any agent can find assets by searching tags instead of reading folders.

**Consequences.** A new asset must be in a manifest before an ad can use it. Changing a file means
a new version (`replace`), so approved work is never silently altered.
