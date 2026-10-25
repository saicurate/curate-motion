# captures/

Shot lists for recording the Curate app, one file per app build: `b<build>.json`. `tools/take` reads one,
builds the curate-app `lib/dev` probe apps it names (every server call faked: nothing paid), records each
shot on our own simulator and adds the takes to the library as drafts (`footage.emma.b<build>-<shot>.vN`,
`screenshot.emma.b<build>-<still>.vN`). Then `tools/export-media --build <build>` refreshes the plain copy
in `../app-media/b<build>/`.

```bash
tools/take build captures/b284.json --app tabs     # once per app (and after the probe changes)
tools/take captures/b284.json --only today-landing # one shot; no --only: all of them
tools/export-media --build 284
```

- **apps:** a probe (`target`), its dart-defines (`$CACHE` = this repo's `.cache/`), its control file name and
  the `setup` lines every shot starts with (first-time tips done, so none covers a shot).
- **shots:** `id` (the moment, as in `library/footage/INVENTORY-b<build>.md`), `app`, `area` (today, wardrobe,
  studio, chat, profile, first-run: the export's folders), `title`, `setup` (lines the probe does before the
  recording, each waited for), `steps` (`[seconds, line]` while recording), `end`, `stills` (screenshots at
  given seconds).
- Control lines are the probe's own (see the top of `lib/dev/new_look_probe.dart`): a location (`/studio`),
  `today:<state>`, `tap:<widget key>`, `drag:x,y,dx,dy,ms` (points on a 440 × 956 screen), `extract:<stage>`…
  The probe ignores a line equal to the one before it.
- **Goes here:** shot lists. **Doesn't:** the takes (`.cache/takes/`, then the library), probe code (curate-app).
- **Before a new build:** read the app inventory first; only `lib/dev` probes that draw the new look are valid
  (an old probe's footage is tagged `look:v1` and left out of the export).
