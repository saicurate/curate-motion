# 0008: The library is the desired state of the persona's real account

2026-10-15 · founder requirement

**Decision.** Approved garments in `library/wardrobe/<persona>/` are what her Curate account should
hold; `library/camera-roll/<persona>/` is what her test phone's Photos should hold. `tools/persona`
diffs and applies (wardrobe API as her; `simctl addmedia` with a photo-library reset for removals).
The actual state, mapped to library ids, is `account-state.json`.

**Why.** One place to change Emma's wardrobe; the footage always matches the library.

**Consequences.** Adds spend server AI (about $0.075 a piece), so applying needs `--yes` and the
founder's OK. Items the library doesn't know are reported, never deleted. Passwords stay in SSM.
