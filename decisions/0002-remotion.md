# 0002: Remotion for every video

2026-10-15 · the founder picked Remotion for the marketing videos ("from the app's own animations")

**Decision.** Ads are React compositions in Remotion 4.0.535, rendered locally with the installed Chrome.

**Why.** Code means agents can build, diff and reuse animation; one ad renders to every format
and length from props; no per-render fees; frame-exact beat sync; the app's brand tokens and fonts
drop straight in.

**Consequences.** Remotion's licence is free for teams of 3 or fewer; a company licence is needed
beyond that (RULES.md 7). The bundled headless shell doesn't fire requestAnimationFrame on the
founder's Mac, so `remotion.config.ts` uses the installed Chrome when present.
