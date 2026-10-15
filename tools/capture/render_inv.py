#!/usr/bin/env python3
import json, os, sys, datetime
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from inventory import ROWS
OUT = '/Users/saikumar/Desktop/Curate/curate-motion/library/footage/INVENTORY.md'
IDX = json.load(open('/Users/saikumar/Desktop/Curate/curate-motion/catalog/index.json'))
have = {a['id'] for a in IDX['assets']}
S = {'app': 'captured (her account)', 'probe': 'captured (probe)', 'no': 'not possible', 'pending': 'not captured yet'}
rows = []
for scr, m, code, what, st, clips, note in ROWS:
    ids = [f'footage.emma.{c}' for c in clips]
    missing = [i for i in ids if i not in have]
    if st in ('app', 'probe') and (not ids or missing):
        if not ids and st == 'app': st = 'no'
        elif missing and len(missing) == len(ids): st = 'pending'
    rows.append(dict(screen=scr, moment=m, code=code, what=what, status=st, clips=[i for i in ids if i in have], note=note))
cnt = {k: sum(1 for r in rows if r['status'] == k) for k in S}
total = len(rows)
md = [f'# App animation inventory: Curate 1.5.0 (262)', '',
      f'Every animation and motion moment in build 262 (release/1.5.0-262 @5aff9592), read from the code, with the footage',
      f'clip(s) that show it. Code paths are relative to `lib/` in curate-app. Generated {datetime.date.today()} by the',
      'app-footage capture agent (scratchpad `inventory.py`); regenerate rather than hand-edit.', '',
      f'**{total} moments: {cnt["app"]} captured from Emma\'s real account, {cnt["probe"]} captured through a lib/dev probe with her real',
      f'assets, {cnt["no"]} not possible, {cnt["pending"]} not captured yet.**', '',
      'Sources: `app` = recorded on simulator "Emma Marketing 17PM" from her live account (or cut from the earlier',
      'clean takes photo-scan-v1, onboarding-v1, signup-v1). `probe` = `lib/dev/*_probe.dart` from build 262 run on a',
      'separate probe simulator, with her selfie, camera-roll photos and real wardrobe pieces swapped in for the probe\'s',
      'stand-ins and Zee pack zee-sharp-v1 (the pack her phone has cached). Every clip id below is a draft footage asset.', '']
cur = None
for r in rows:
    if r['screen'] != cur:
        cur = r['screen']; md += ['', f'## {cur}', '', '| Moment | Code | What moves | Status | Clips | Note |', '|---|---|---|---|---|---|']
    md.append(f"| `{r['moment']}` | `{r['code']}` | {r['what']} | {S[r['status']]} | {', '.join('`'+c+'`' for c in r['clips']) or '–'} | {r['note']} |")
os.makedirs(os.path.dirname(OUT), exist_ok=True)
open(OUT, 'w').write('\n'.join(md) + '\n')
json.dump({'counts': cnt, 'total': total, 'rows': rows}, open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'inventory.json'), 'w'), indent=1, ensure_ascii=False)
st = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'state.json')))
st['total'] = total
json.dump(st, open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'state.json'), 'w'), indent=1)
print(total, cnt)
