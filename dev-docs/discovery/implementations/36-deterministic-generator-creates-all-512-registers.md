# 3.6 Deterministic generator (creates all 512 registers)

Save as `tools/gen_repo_canvasl.py`:

```python
#!/usr/bin/env python3
import os

AXES = ["state","alphabet","left","right","delta","start","accept","reject"]
IDX = {a:i for i,a in enumerate(AXES)}

KERNEL = """$schema: "canvasl://repo-kernel/v1"
kind: "repo.kernel"
id: "repo.kernel.v1"

axes:
  - state
  - alphabet
  - left
  - right
  - delta
  - start
  - accept
  - reject

axis_index:
  state: 0
  alphabet: 1
  left: 2
  right: 3
  delta: 4
  start: 5
  accept: 6
  reject: 7

fano_lines:
  - [state, alphabet, delta]
  - [state, left, start]
  - [state, right, accept]
  - [alphabet, left, accept]
  - [alphabet, right, start]
  - [delta, left, right]
  - [delta, start, accept]

merge_policy:
  main:
    accepts_from: [current]
    rule: "MUST satisfy fano_lines for any introduced triads"
  current:
    accepts_from: ["feature/*"]
    rule: "MUST satisfy fano_lines for any introduced triads"
  feature:
    rule: "SHOULD touch exactly one top-level axis folder"
  reject:
    rule: "MAY receive any changes; MUST be excluded from triad checks"

register_layout:
  path_template: "repo.canvasl/{a}/{b}/{c}/reg.canvasl"
  address_formula: "(idx(a)<<6) | (idx(b)<<3) | idx(c)"
"""

REG_TMPL = """$schema: "canvasl://register/v1"
kind: "repo.register"
id: "reg.{a}.{b}.{c}"
axis:
  a: "{a}"
  b: "{b}"
  c: "{c}"

address:
  a_idx: {ai}
  b_idx: {bi}
  c_idx: {ci}
  addr_u9: {addr}

semantics:
  summary: ""
  invariants:
    - "Normalization MUST be idempotent"
    - "Serialization MUST be canonical"
  fano_scope:
    participates: {participates}

can_isa_binding:
  bank: {ai}
  opcode_base: "0x{ai_hex}0"
  register: {reg}

payload:
  poly:
    ring: "F2[x]"
    clbc_poly_v1: null
  events: []
"""

def main():
    os.makedirs("repo.canvasl", exist_ok=True)
    with open("repo.canvasl/kernel.canvasl","w",encoding="utf-8") as f:
        f.write(KERNEL)

    for a in AXES:
        for b in AXES:
            for c in AXES:
                ai,bi,ci = IDX[a], IDX[b], IDX[c]
                addr = (ai<<6) | (bi<<3) | ci
                reg  = (bi<<3) | ci
                participates = not ("reject" in (a,b,c))
                path = os.path.join("repo.canvasl", a, b, c)
                os.makedirs(path, exist_ok=True)
                with open(os.path.join(path,"reg.canvasl"),"w",encoding="utf-8") as f:
                    f.write(REG_TMPL.format(
                        a=a,b=b,c=c,
                        ai=ai,bi=bi,ci=ci,
                        addr=addr, reg=reg,
                        participates=str(participates).lower(),
                        ai_hex=format(ai,"X")
                    ))

    print("✅ generated repo.canvasl kernel + 512 registers")

if __name__ == "__main__":
    main()
```

Run:

```bash
python3 tools/gen_repo_canvasl.py
```

---
