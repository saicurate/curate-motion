# reg.py: register every screenshot (and the App Store variants of the heroes) as draft `screenshot` assets.
import json, subprocess, os, sys
D = os.path.dirname(os.path.abspath(__file__)); R = '/Users/saikumar/Desktop/Curate/curate-motion'
APP = json.dumps({"build": 262, "version": "1.5.0", "commit": "5aff9592", "env": "prod"})
done = set(json.load(open(f'{D}/registered.json'))) if os.path.exists(f'{D}/registered.json') else set()
def add(e, file, aid, variant, size):
    if aid in done: return
    probe = e['origin'] == 'probe'
    dev = ('Emma Probe 17PM' if probe else 'Emma Marketing 17PM') + ' (iPhone 17 Pro Max simulator, iOS 26.5)'
    if e['capture'] == 'screenshot':
        tool = "xcrun simctl io screenshot on Emma's phone, clean status bar (9:41, full battery and signal, no carrier); Dynamic Island redrawn from its measured mask when simctl dropped it"
    else:
        tool = (f"frame at {e['frameSec']}s of " + (e.get('fromFootage') or f"take {e.get('fromTake')}") + " (native 1320x2868 recording)"
                + ("; lib/dev probe with Emma's real assets on a separate simulator" if probe else ''))
    if e['patched']: tool += "; the take's status bar showed a charging battery: the battery glyph alone was replaced with the plain full one"
    if variant != 'native': tool += "; resized to 1290x2796 for App Store Connect (Lanczos, 3+4 px trimmed top/bottom)"
    tags = f"persona=emma,appBuild=262,screen={e['screen']},state={e['state']},source={e['origin']},size={size}" + (',hero' if e['hero'] else '')
    sets = [f"screen={e['screen']}", f"state={e['state']}", f"app={APP}", "account=emma", f"device={dev}", "cleanStatusBar=true",
            f"capture={e['capture']}", f"origin={e['origin']}", f"variant={variant}", f"hero={'true' if e['hero'] else 'false'}"]
    if e.get('fromFootage'): sets.append(f"fromFootage={e['fromFootage']}")
    if e.get('fromTake'): sets.append(f"fromTake={e['fromTake']}")
    if e.get('frameSec') is not None: sets.append(f"frameSec={e['frameSec']}")
    if variant != 'native': sets.append(f"variantOf=screenshot.emma.{e['name']}.v1")
    title = e['label'] + (' (App Store 6.9")' if variant != 'native' else '')
    cmd = ['tools/catalog', 'add', file, '--kind', 'screenshot', '--id', aid, '--licence', 'curate', '--ai', 'false', '--title', title,
           '--source-tool', tool, '--tags', tags, '--by', 'claude-code-screenshot-agent', '--no-push']
    for s in sets: cmd += ['--set', s]
    r = subprocess.run(cmd, cwd=R, capture_output=True, text=True)
    if r.returncode: print('FAIL', aid, r.stderr[-600:]); sys.exit(1)
    done.add(aid); json.dump(sorted(done), open(f'{D}/registered.json', 'w'))
    print('added', aid)
for e in json.load(open(f'{D}/spec.json')):
    add(e, f"{D}/named/{e['name']}.png", f"screenshot.emma.{e['name']}.v1", 'native', '1320x2868')
    if e['hero']: add(e, f"{D}/as/{e['name']}-appstore.png", f"screenshot.emma.{e['name']}-appstore.v1", 'appstore-6.9', '1290x2796')
print(len(done), 'registered')
