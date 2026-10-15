#!/usr/bin/env python3
"""Tiny helper that keeps tracker/status.js in sync with tools/state.json.

Usage:
  status.py log "text"
  status.py phase "text" [overall]
  status.py overall N
  status.py concept ID key=value ...        (status, progress, title, idea, hook ...)
  status.py step ID "text" done|running|todo
  status.py file ID path label
  status.py addconcept '<json>'
  status.py music '<json>'                  (append one track)
  status.py set KEY '<json>'                (any top-level key)
"""
import json, os, sys, datetime, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
STATE = os.path.join(HERE, "state.json")
OUT = os.path.join(HERE, "..", "tracker", "status.js")


def now():
    return datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def load():
    with open(STATE) as f:
        return json.load(f)


def save(s):
    s["updated"] = now()
    with open(STATE + ".tmp", "w") as f:
        json.dump(s, f, indent=2)
    os.replace(STATE + ".tmp", STATE)
    body = (
        "// Written by the video agents; the tracker page re-reads this file every few seconds.\n"
        "// Shape: window.CURATE_VIDEOS = { updated, phase, overall, concepts:[...], music:[...], log:[...] }\n"
        "window.CURATE_VIDEOS = " + json.dumps(s, indent=2, ensure_ascii=False) + ";\n"
    )
    d = os.path.dirname(OUT)
    fd, tmp = tempfile.mkstemp(dir=d, prefix=".status.", suffix=".tmp")
    with os.fdopen(fd, "w") as f:
        f.write(body)
    os.chmod(tmp, 0o644)
    os.replace(tmp, OUT)


def concept(s, cid):
    for c in s["concepts"]:
        if c["id"] == cid:
            return c
    raise SystemExit("no concept " + cid)


def main(a):
    s = load()
    cmd = a[0]
    if cmd == "log":
        s["log"].append({"t": now(), "text": a[1]})
    elif cmd == "phase":
        s["phase"] = a[1]
        if len(a) > 2:
            s["overall"] = int(a[2])
    elif cmd == "overall":
        s["overall"] = int(a[1])
    elif cmd == "concept":
        c = concept(s, a[1])
        for kv in a[2:]:
            k, v = kv.split("=", 1)
            c[k] = int(v) if v.isdigit() else v
    elif cmd == "step":
        c = concept(s, a[1])
        state = a[3] if len(a) > 3 else "todo"
        st = next((x for x in c["steps"] if x["text"] == a[2]), None)
        if st is None:
            st = {"text": a[2]}
            c["steps"].append(st)
        st["done"] = state == "done"
        st["running"] = state == "running"
    elif cmd == "file":
        c = concept(s, a[1])
        c["files"] = [f for f in c["files"] if f["path"] != a[2]]
        c["files"].append({"path": a[2], "label": a[3]})
    elif cmd == "addconcept":
        obj = json.loads(a[1])
        s["concepts"] = [c for c in s["concepts"] if c["id"] != obj["id"]] + [obj]
    elif cmd == "music":
        obj = json.loads(a[1])
        s["music"] = [m for m in s["music"] if m["title"] != obj["title"]] + [obj]
    elif cmd == "set":
        s[a[1]] = json.loads(a[2])
    else:
        raise SystemExit("bad cmd")
    # Several commands can be chained with "--"
    save(s)


if __name__ == "__main__":
    args = sys.argv[1:]
    groups, cur = [], []
    for x in args:
        if x == "--":
            groups.append(cur); cur = []
        else:
            cur.append(x)
    groups.append(cur)
    for g in groups:
        if g:
            main(g)
