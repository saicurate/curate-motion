import json,subprocess,os
U=os.environ.get('SIMU','B0202502-C8FB-4DAA-8E29-EAE4866B0C14')
d=json.loads(subprocess.run(['axe','describe-ui','--udid',U],capture_output=True,text=True).stdout)
def walk(n):
    lab=n.get('AXLabel'); val=n.get('AXValue'); t=n.get('type'); f=n.get('frame') or {}
    if lab or val or t in ('Button','TextField','SecureTextField'):
        print(f"{t:10} {str(lab)[:70]!r:72} v={str(val)[:30]!r} @({f.get('x',0):.0f},{f.get('y',0):.0f},{f.get('width',0):.0f}x{f.get('height',0):.0f})")
    for c in n.get('children',[]) or []: walk(c)
for n in d: walk(n)
