# Changelog

Newest first. One entry per change that another agent should know about. Asset additions are
in the manifests' git history; list only notable ones here.

## 2026-10-15: scaffold (0.1.0)
- Repo created (private, saicurate/curate-motion) and the S3 bucket `curate-motion-library-276451918677`
  (private, SSE-S3, versioned, non-current versions expire after 90 days, TLS only).
- Schemas: one zod schema per asset kind (13 kinds), ad.json, persona account + account-state;
  JSON Schemas generated into catalog/schemas/.
- Tools: `catalog` (list, search, show, add, replace, tag, retire, remove, approve, build, validate),
  `sync` (S3 pull/push by manifest with sha256 checks), `render` (queue, staged public dir),
  `persona` (desired-state sync of Emma's account and simulator photos), `library-ui` (local page),
  `capture.sh` (simulator footage → footage asset), `migrate/import-legacy.ts`.
- motion/: PhoneFrame, ZeeActor, KineticType (Words, Slam, TypeOn), BeatClock, PopOut, TitleBehind,
  FlashPrint, ScanTrace, Ellipse, StrokeFrame, WhipPan, ClosetReveal, Piece/Look, Ground/Track/Star/Logo/EndCard,
  formats + length presets, ported from the marketing/videos motion tests.
- First ad: `meet-zee` (from motion test c2), 9x16 / 4x5 / 1x1 at 6 and 15 s.
- Agent guides: AGENTS.md (canonical), CLAUDE.md, GEMINI.md, .cursor/rules, copilot-instructions.
- CI (GitHub Action) + pre-commit hook: no media or secrets in git; schemas, licences, ids, index freshness.
- Not yet: the migration of marketing/videos (ARCHITECTURE.md › 10). The library is empty until then.
