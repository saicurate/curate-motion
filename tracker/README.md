# tracker/

The library page: every asset (search, filters, previews), people and accounts, the render queue.

- `tools/library-ui` serves it at http://127.0.0.1:4317 with **editing**: drag and drop files to
  add, Approve / Retire / Delete (drafts) / Tag / New version per card. Localhost only, per-run token.
- Opened from disk (`tracker/index.html`) it is **read-only**, reading `data/catalog.js` and
  `data/queue.js` (generated, gitignored) every 3 s.
- **Doesn't go here:** status prose (use CHANGELOG.md) or media.
- **Example:** `tools/library-ui`, then drop `navy-skirt.jpg`, pick kind garment, licence ai-owned.
