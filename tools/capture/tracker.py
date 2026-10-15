#!/usr/bin/env python3
"""tracker.py: rebuild marketing/videos/tracker/captures.js from cap/state.json, atomically.
   tracker.py log "text"   -> append a log line and rewrite
   tracker.py              -> rewrite"""
import json, os, sys, datetime, tempfile
C = os.path.dirname(os.path.abspath(__file__))
ST = os.path.join(C, 'state.json')
OUT = '/Users/saikumar/Desktop/Curate/marketing/videos/tracker/captures.js'
now = lambda: datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
s = json.load(open(ST)) if os.path.exists(ST) else {'phase': 'Starting', 'total': 0, 'sections': [], 'log': []}
if len(sys.argv) > 2 and sys.argv[1] == 'log':
    s['log'].insert(0, {'t': now(), 'text': sys.argv[2]})
if len(sys.argv) > 2 and sys.argv[1] == 'phase':
    s['phase'] = sys.argv[2]
s['done'] = sum(len(x['items']) for x in s['sections'] if not x.get('isTake'))
s['done'] = len({i.get('moment', i['path']) for x in s['sections'] if not x.get('isTake') for i in x['items']})
inv = os.path.join(C, 'inventory.json')
if os.path.exists(inv):
    j = json.load(open(inv)); s['done'] = j['counts']['app'] + j['counts']['probe']; s['total'] = j['total']
s['updated'] = now()
json.dump(s, open(ST + '.tmp', 'w'), indent=1); os.replace(ST + '.tmp', ST)
pub = {k: s[k] for k in ('updated', 'phase', 'done', 'total', 'sections', 'log')}
pub['sections'] = [{'title': x['title'], 'items': [{'path': i['path'], 'label': i['label']} for i in x['items']]} for x in s['sections']]
body = ("// Written by the app-footage capture agent; the tracker re-reads this file.\n"
        "// Shape: window.CURATE_CAPTURES = { updated, phase, done, total, sections:[{title,items:[{path,label}]}], log:[{t,text}] }\n"
        "window.CURATE_CAPTURES = " + json.dumps(pub, indent=1, ensure_ascii=False) + ";\n")
fd, tmp = tempfile.mkstemp(dir=os.path.dirname(OUT), prefix='.captures.', suffix='.tmp')
with os.fdopen(fd, 'w') as f: f.write(body)
os.replace(tmp, OUT)
print('captures.js', s['done'], '/', s['total'])
