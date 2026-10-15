# renders/

Rendered videos (gitignored; mirrored to `s3://curate-motion-library-<account>/renders/` with
`tools/sync renders push`). Written only by `tools/render`.

`renders/<ad>/<channel>/<length>s/<ad>_<channel>_<format>_<length>s_v<N>.mp4`, never overwritten.
`queue.json` is the render queue the library page shows.

- **Goes here:** outputs.
- **Doesn't:** source media (→ `library/`), hand-made edits.
- **Example:** `renders/meet-zee/tiktok/15s/meet-zee_tiktok_9x16_15s_v1.mp4`.
