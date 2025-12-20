#!/usr/bin/env python3
import json, sys
from collections import Counter

AXES = ["state","alphabet","left","right","delta","start","accept","reject"]

# Canonical Fano lines (the ONLY legal triads)
FANO_LINES = [
    {"state","alphabet","delta"},
    {"state","left","start"},
    {"state","right","accept"},
    {"alphabet","left","accept"},
    {"alphabet","right","start"},
    {"delta","left","right"},
    {"delta","start","accept"},
]

def is_fano_triad(a,b,c):
    s = {a,b,c}
    return any(s == line for line in FANO_LINES)

def read_trace(path):
    triads = []
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            line=line.strip()
            if not line: 
                continue
            ev = json.loads(line)
            if ev.get("op") != "TRIAD":
                continue
            a,b,c = ev.get("a"), ev.get("b"), ev.get("c")
            if a not in AXES or b not in AXES or c not in AXES:
                continue
            result = ev.get("result","accept")
            triads.append((a,b,c,result,ev))
    return triads

def base_nodes():
    # Layout matching the earlier canonical canvas
    return [
        {"id":"state","type":"text","x":0,"y":-300,"width":180,"height":120,
         "text":"# state
Invariant memory
Canonical form"},
        {"id":"alphabet","type":"text","x":-260,"y":-120,"width":180,"height":120,
         "text":"# alphabet
Symbols
Opcodes"},
        {"id":"left","type":"text","x":-160,"y":220,"width":180,"height":120,
         "text":"# left
Knowledge
Proof"},
        {"id":"right","type":"text","x":160,"y":220,"width":180,"height":120,
         "text":"# right
Experience
Runtime"},
        {"id":"delta","type":"text","x":260,"y":-120,"width":180,"height":120,
         "text":"# delta
Transform
Fold"},
        {"id":"start","type":"text","x":-60,"y":40,"width":180,"height":120,
         "text":"# start
Initialization
Genesis"},
        {"id":"accept","type":"text","x":60,"y":40,"width":180,"height":120,
         "text":"# accept
Validation
Gate"},
        {"id":"reject","type":"text","x":0,"y":420,"width":220,"height":120,
         "text":"# reject (⊥)
Non-incidence
Propagation forbidden"},
    ]

def mk_edge(eid, frm, to, label):
    return {"id":eid, "fromNode":frm, "toNode":to, "label":label}

def emit_canvas(triads):
    # Count observed triads to weight labels
    counts = Counter()
    routed = []

    for a,b,c,result,ev in triads:
        ok = is_fano_triad(a,b,c)
        if not ok:
            result = "reject"  # hard route
        counts[(a,b,c,result)] += 1
        routed.append((a,b,c,result,ok,ev))

    edges = []
    seen = set()
    i = 0

    # For each observed triad, draw a 3-cycle to show closure
    for (a,b,c,result,ok,ev) in routed:
        tri = tuple(sorted([a,b,c]))
        # de-dup per triad set + result so canvas doesn't explode
        key = (tri, result)
        if key in seen:
            continue
        seen.add(key)

        n = counts[(a,b,c,result)]
        label = "FANO" if ok else "NON-FANO"
        lbl = f"{label} ×{n} → {result}"

        # route invalid or rejected triads through reject
        if result == "reject":
            # show the failed attempt converging into ⊥
            edges.append(mk_edge(f"e{i}", a, "reject", lbl)); i+=1
            edges.append(mk_edge(f"e{i}", b, "reject", lbl)); i+=1
            edges.append(mk_edge(f"e{i}", c, "reject", lbl)); i+=1
        else:
            # accepted triad: show cyclic closure among the three axes
            edges.append(mk_edge(f"e{i}", a, b, lbl)); i+=1
            edges.append(mk_edge(f"e{i}", b, c, lbl)); i+=1
            edges.append(mk_edge(f"e{i}", c, a, lbl)); i+=1

    return {"nodes": base_nodes(), "edges": edges}

def main():
    if len(sys.argv) != 3:
        print("Usage: gen_fano_canvas.py trace.jsonl out.canvas", file=sys.stderr)
        sys.exit(2)

    triads = read_trace(sys.argv[1])
    canvas = emit_canvas(triads)

    with open(sys.argv[2], "w", encoding="utf-8") as f:
        json.dump(canvas, f, ensure_ascii=False, indent=2)

    print(f"Wrote {sys.argv[2]} with {len(canvas['nodes'])} nodes and {len(canvas['edges'])} edges")

if __name__ == "__main__":
    main()