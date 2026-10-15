# ads/

One folder per ad. Each ad is assembled from library asset ids + `motion/` components + one track.

```
ads/<ad-id>/
  ad.json     the ad as data (schemas/ad.ts): brief, hook, channels, formats, lengths, track, asset ids, status, approval
  README.md   what it is, how it's built, what's reusable
  index.tsx   the component, its zod props schema and defaults
```

`registry.ts` lists the ads; `Root.tsx` registers `<ad>--<format>--<length>s` for every format × length.
`_template/` is the starting point; `_legacy/` (after the migration) holds the old motion tests for reference only.

- **Goes here:** ads.
- **Doesn't:** reusable components (→ `motion/`), media (→ `library/`), renders (→ `renders/`).
- **Example:** `ads/meet-zee/` (Zee flips moods on the beat; 9x16/4x5/1x1 at 6 and 15 s).
New ad: AGENTS.md › "Make a new ad, step by step".
