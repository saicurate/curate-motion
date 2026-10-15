#!/usr/bin/env python3
"""st.py: live tracker for the screenshot pass -> marketing/videos/tracker/screens.js (atomic).
  st.py phase "text" | st.py log "text" | st.py total N | st.py add "Section" NAME "label" (thumb from raw/NAME.png) | st.py rm NAME"""
import json, os, sys, datetime, tempfile, subprocess
D = os.path.dirname(os.path.abspath(__file__)); ST = f'{D}/st.json'
OUT = '/Users/saikumar/Desktop/Curate/marketing/videos/tracker/screens.js'
TH = '/Users/saikumar/Desktop/Curate/marketing/videos/footage/_screens'
now = lambda: datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
s = json.load(open(ST)) if os.path.exists(ST) else {'phase': 'Starting', 'total': 0, 'sections': [], 'log': []}
a = sys.argv[1:]
if a and a[0] == 'phase': s['phase'] = a[1]; s['log'].insert(0, {'t': now(), 'text': a[1]})
if a and a[0] == 'log': s['log'].insert(0, {'t': now(), 'text': a[1]})
if a and a[0] == 'total': s['total'] = int(a[1])
if a and a[0] == 'add':
    sec, name, label = a[1], a[2], a[3]
    subprocess.run(['sips', '-Z', '420', '-s', 'format', 'jpeg', '-s', 'formatOptions', '70', f'{D}/raw/{name}.png', '--out', f'{TH}/{name}.jpg'], capture_output=True)
    for x in s['sections']:
        x['items'] = [i for i in x['items'] if i['name'] != name]
    sx = next((x for x in s['sections'] if x['title'] == sec), None)
    if not sx: sx = {'title': sec, 'items': []}; s['sections'].append(sx)
    sx['items'].append({'name': name, 'path': f'../footage/_screens/{name}.jpg', 'label': label})
if a and a[0] == 'rm':
    for x in s['sections']: x['items'] = [i for i in x['items'] if i['name'] != a[1]]
s['sections'] = [x for x in s['sections'] if x['items']]
s['done'] = sum(len(x['items']) for x in s['sections']); s['updated'] = now(); s['log'] = s['log'][:60]
json.dump(s, open(ST + '.tmp', 'w'), indent=1); os.replace(ST + '.tmp', ST)
pub = {'updated': s['updated'], 'phase': s['phase'], 'done': s['done'], 'total': max(s['total'], s['done']),
       'sections': [{'title': x['title'], 'items': [{'path': i['path'], 'label': i['label']} for i in x['items']]} for x in s['sections']], 'log': s['log']}
body = ("// Written by the screenshot capture agent (Curate 1.5.0 build 262, Emma).\n"
        "// Shape: window.CURATE_SCREENS = { updated, phase, done, total, sections:[{title,items:[{path,label}]}], log:[{t,text}] }\n"
        "window.CURATE_SCREENS = " + json.dumps(pub, indent=1, ensure_ascii=False) + ";\n")
fd, tmp = tempfile.mkstemp(dir=os.path.dirname(OUT), prefix='.screens.', suffix='.tmp')
with os.fdopen(fd, 'w') as f: f.write(body)
os.replace(tmp, OUT); print('screens.js', s['done'], '/', pub['total'])
