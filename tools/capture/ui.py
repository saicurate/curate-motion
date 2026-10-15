import json,subprocess,sys
U=open(sys.argv[0].rsplit('/',1)[0]+'/emma_udid').read().strip()
d=json.loads(subprocess.run(['axe','describe-ui','--udid',U],capture_output=True,text=True).stdout)
def walk(n,dep=0):
    lab=n.get('AXLabel'); val=n.get('AXValue'); t=n.get('type'); f=n.get('frame') or {}
    if lab or val or t in ('Button','TextField','SecureTextField'):
        print(f"{t:10} {str(lab)[:60]!r:62} v={str(val)[:30]!r} @({f.get('x',0):.0f},{f.get('y',0):.0f},{f.get('width',0):.0f}x{f.get('height',0):.0f})")
    for c in n.get('children',[]) or []: walk(c,dep+1)
for n in d: walk(n)
