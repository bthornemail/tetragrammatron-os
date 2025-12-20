
# 3. repo.canvasl kernel + 8³ register lattice

## 3.1 Canonical axes (8-tuple, keyboard-safe)

```text
state
alphabet
left
right
delta
start
accept
reject
```

> **Rule:** `reject` is a sink axis (may receive data; never participates in merge triads).

---

## 3.2 Directory lattice (8³ registers)

**Root:**
```
repo.canvasl/
  kernel.canvasl
  state/
  alphabet/
  left/
  right/
  delta/
  start/
  accept/
  reject/
```

**Each axis contains an 8×8 grid of “registers”:**
```
repo.canvasl/<a>/<b>/<c>/reg.canvasl
```

Where `<a>,<b>,<c>` are each one of the 8 axes.  
That yields **8 × 8 × 8 = 512** total canonical register files.

### Addressing
Define the register address as:

```
ADDR(a,b,c) = (idx(a) << 6) | (idx(b) << 3) | idx(c)
```

with `idx(state)=0, alphabet=1, left=2, right=3, delta=4, start=5, accept=6, reject=7`.

So every register has a unique **0..511** numeric address.

---

## 3.3 `kernel.canvasl` (normative invariants)

Create:

### `repo.canvasl/kernel.canvasl`
```yaml
$schema: "canvasl://repo-kernel/v1"
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
```

This is your **repo-level “axiom sheet”**.

---

## 3.4 Register file template (one per cell)

Every register is a *small, rigid record* so merges remain mechanically checkable.

### `repo.canvasl/<a>/<b>/<c>/reg.canvasl`
```yaml
$schema: "canvasl://register/v1"
kind: "repo.register"
id: "reg.{a}.{b}.{c}"
axis:
  a: "{a}"
  b: "{b}"
  c: "{c}"

address:
  a_idx: <0..7>
  b_idx: <0..7>
  c_idx: <0..7>
  addr_u9: <0..511>

semantics:
  summary: ""
  invariants:
    - "Normalization MUST be idempotent"
    - "Serialization MUST be canonical"
  fano_scope:
    participates: true   # except if a|b|c == reject

can_isa_binding:
  bank: <0..7>       # usually = a_idx
  opcode_base: "0x{A}0"   # hex nibble A = a_idx
  register: <0..63>  # (b_idx<<3) | c_idx

payload:
  # canonical storage; you can start empty
  poly:
    ring: "F2[x]"
    clbc_poly_v1: null     # bytes later
  events: []               # renderer stream later
```

**Key point:** these files are “registers”: small, stable, and mergeable.

---

## 3.5 CAN-ISA mapping (folder ⇄ opcode bank ⇄ register)

This is the contract that makes your “codebase lattice” executable:

- **Axis `a` selects the opcode bank** (high nibble)
- **(b,c) selects the register index 0..63** (low 6 bits)

### Normative mapping

```
BANK(a)        = idx(a)           # 0..7
REG(b,c)       = (idx(b)<<3)|idx(c)   # 0..63
ADDR(a,b,c)    = (BANK(a)<<6)|REG(b,c) # 0..511

OPCODE_BASE(a) = 0x(A0)           # A = BANK(a)
```

So your VM can do:

- `LD r, ADDR(a,b,c)`  (load register cell)
- `ST ADDR(a,b,c), r`  (store register cell)
- `MEET/JOIN/PROJ_FANO` operate over these addresses deterministically

This ties **repo topology** to **ISA addressing** with no ambiguity.

---

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

# 3.7 What “the first 8³ layers” means operationally

- **Layer 0:** `repo.canvasl/kernel.canvasl` (axioms)
- **Layer 1:** the 8 axis roots (`repo.canvasl/state/`, etc.)
- **Layer 2:** axis-pair lattice (`repo.canvasl/state/alphabet/`, etc.)
- **Layer 3:** axis-triple registers (`repo.canvasl/state/alphabet/delta/reg.canvasl`, etc.)

That’s your **minimal executable repo geometry**.

---

If you reply **“4”**, I’ll emit the **Obsidian Canvas JSON** that visualizes this as:

- `main → current → feature/<axis>` directed edges  
- **Per-axis canvases** plus a **Fano-triad canvas** (7 hyperedges shown as directed triads)  
- Node grouping that mirrors `repo.canvasl/<a>/<b>/<c>` addressing.

---

## You

Yes please

---

## ChatGPT

Cool — below are **ready-to-drop Obsidian `.canvas` JSON files** with **directed edges** that match your branch topology, plus **per-axis canvases** and a **Fano-triad canvas**.

**How to use**
- Save each code block as a file ending in `.canvas` inside your vault (e.g. `Vault/.canvas/` or anywhere).
- Open in Obsidian (Canvas).

---

## 1) `repo-branch-topology.canvas`
Shows **main → current → feature/*** and **current → release** (directed).

```json
{
  "nodes": [
    { "id": "n_main", "type": "text", "x": 0, "y": 0, "width": 260, "height": 90, "text": "**main**
Normalized fixed point
(MUST only accept from current)" },
    { "id": "n_current", "type": "text", "x": 340, "y": 0, "width": 280, "height": 90, "text": "**current**
Integration manifold
(MUST enforce Fano triad gate)" },
    { "id": "n_release", "type": "text", "x": 700, "y": 0, "width": 260, "height": 90, "text": "**release**
Frozen projection
(SHOULD be cut from current)" },

    { "id": "n_state", "type": "text", "x": 340, "y": 140, "width": 240, "height": 80, "text": "**feature/state**
Axis: state" },
    { "id": "n_alphabet", "type": "text", "x": 600, "y": 140, "width": 240, "height": 80, "text": "**feature/alphabet**
Axis: alphabet" },
    { "id": "n_left", "type": "text", "x": 860, "y": 140, "width": 240, "height": 80, "text": "**feature/left**
Axis: left" },

    { "id": "n_right", "type": "text", "x": 340, "y": 250, "width": 240, "height": 80, "text": "**feature/right**
Axis: right" },
    { "id": "n_delta", "type": "text", "x": 600, "y": 250, "width": 240, "height": 80, "text": "**feature/delta**
Axis: delta" },
    { "id": "n_start", "type": "text", "x": 860, "y": 250, "width": 240, "height": 80, "text": "**feature/start**
Axis: start" },

    { "id": "n_accept", "type": "text", "x": 340, "y": 360, "width": 240, "height": 80, "text": "**feature/accept**
Axis: accept" },
    { "id": "n_reject", "type": "text", "x": 600, "y": 360, "width": 240, "height": 80, "text": "**feature/reject**
Axis: reject (sink / excluded from triads)" }
  ],
  "edges": [
    { "id": "e_main_current", "fromNode": "n_current", "toNode": "n_main" },
    { "id": "e_current_release", "fromNode": "n_current", "toNode": "n_release" },

    { "id": "e_state_current", "fromNode": "n_state", "toNode": "n_current" },
    { "id": "e_alphabet_current", "fromNode": "n_alphabet", "toNode": "n_current" },
    { "id": "e_left_current", "fromNode": "n_left", "toNode": "n_current" },

    { "id": "e_right_current", "fromNode": "n_right", "toNode": "n_current" },
    { "id": "e_delta_current", "fromNode": "n_delta", "toNode": "n_current" },
    { "id": "e_start_current", "fromNode": "n_start", "toNode": "n_current" },

    { "id": "e_accept_current", "fromNode": "n_accept", "toNode": "n_current" },
    { "id": "e_reject_current", "fromNode": "n_reject", "toNode": "n_current" }
  ]
}
```

---

## 2) `fano-triad-gate.canvas`
Shows the **7 Fano lines** as directed triads (each line is a 3-cycle).  
This is the visualization of your “merge must preserve Fano consistency” rule.

```json
{
  "nodes": [
    { "id": "p_state", "type": "text", "x": 0, "y": 0, "width": 180, "height": 70, "text": "state" },
    { "id": "p_alphabet", "type": "text", "x": 240, "y": 0, "width": 180, "height": 70, "text": "alphabet" },
    { "id": "p_delta", "type": "text", "x": 480, "y": 0, "width": 180, "height": 70, "text": "delta" },

    { "id": "p_left", "type": "text", "x": 0, "y": 140, "width": 180, "height": 70, "text": "left" },
    { "id": "p_start", "type": "text", "x": 240, "y": 140, "width": 180, "height": 70, "text": "start" },
    { "id": "p_right", "type": "text", "x": 480, "y": 140, "width": 180, "height": 70, "text": "right" },

    { "id": "p_accept", "type": "text", "x": 240, "y": 280, "width": 180, "height": 70, "text": "accept" },
    { "id": "p_reject", "type": "text", "x": 720, "y": 280, "width": 200, "height": 70, "text": "reject
(excluded from triads)" }
  ],
  "edges": [
    { "id": "l1_a", "fromNode": "p_state", "toNode": "p_alphabet" },
    { "id": "l1_b", "fromNode": "p_alphabet", "toNode": "p_delta" },
    { "id": "l1_c", "fromNode": "p_delta", "toNode": "p_state" },

    { "id": "l2_a", "fromNode": "p_state", "toNode": "p_left" },
    { "id": "l2_b", "fromNode": "p_left", "toNode": "p_start" },
    { "id": "l2_c", "fromNode": "p_start", "toNode": "p_state" },

    { "id": "l3_a", "fromNode": "p_state", "toNode": "p_right" },
    { "id": "l3_b", "fromNode": "p_right", "toNode": "p_accept" },
    { "id": "l3_c", "fromNode": "p_accept", "toNode": "p_state" },

    { "id": "l4_a", "fromNode": "p_alphabet", "toNode": "p_left" },
    { "id": "l4_b", "fromNode": "p_left", "toNode": "p_accept" },
    { "id": "l4_c", "fromNode": "p_accept", "toNode": "p_alphabet" },

    { "id": "l5_a", "fromNode": "p_alphabet", "toNode": "p_right" },
    { "id": "l5_b", "fromNode": "p_right", "toNode": "p_start" },
    { "id": "l5_c", "fromNode": "p_start", "toNode": "p_alphabet" },

    { "id": "l6_a", "fromNode": "p_delta", "toNode": "p_left" },
    { "id": "l6_b", "fromNode": "p_left", "toNode": "p_right" },
    { "id": "l6_c", "fromNode": "p_right", "toNode": "p_delta" },

    { "id": "l7_a", "fromNode": "p_delta", "toNode": "p_start" },
    { "id": "l7_b", "fromNode": "p_start", "toNode": "p_accept" },
    { "id": "l7_c", "fromNode": "p_accept", "toNode": "p_delta" }
  ]
}
```

---

## 3) Per-axis canvases (8 files)
Each one shows: **axis register lattice → current → main** (directed), and a **CAN-ISA bank binding** note.

### 3.1 `axis-state.canvas`
```json
{
  "nodes": [
    { "id": "n_axis", "type": "text", "x": 0, "y": 0, "width": 360, "height": 120, "text": "**Axis: state**
CAN-ISA bank=0 (opcode base 0x00..0x0F)
Registers: reg(state,b,c) for all b,c" },
    { "id": "n_lattice", "type": "text", "x": 0, "y": 160, "width": 360, "height": 140, "text": "repo.canvasl/state/*/*/reg.canvasl
ADDR(state,b,c) = (0<<6) | (idx(b)<<3) | idx(c)" },

    { "id": "n_current", "type": "text", "x": 430, "y": 40, "width": 240, "height": 80, "text": "current
(Fano merge gate)" },
    { "id": "n_main", "type": "text", "x": 730, "y": 40, "width": 220, "height": 80, "text": "main
(normalized)" }
  ],
  "edges": [
    { "id": "e_lat_to_current", "fromNode": "n_lattice", "toNode": "n_current" },
    { "id": "e_current_to_main", "fromNode": "n_current", "toNode": "n_main" }
  ]
}
```

### 3.2 `axis-alphabet.canvas`
```json
{
  "nodes": [
    { "id": "n_axis", "type": "text", "x": 0, "y": 0, "width": 360, "height": 120, "text": "**Axis: alphabet**
CAN-ISA bank=1 (opcode base 0x10..0x1F)
Registers: reg(alphabet,b,c)" },
    { "id": "n_lattice", "type": "text", "x": 0, "y": 160, "width": 360, "height": 140, "text": "repo.canvasl/alphabet/*/*/reg.canvasl
ADDR(alphabet,b,c) = (1<<6) | (idx(b)<<3) | idx(c)" },
    { "id": "n_current", "type": "text", "x": 430, "y": 40, "width": 240, "height": 80, "text": "current
(Fano merge gate)" },
    { "id": "n_main", "type": "text", "x": 730, "y": 40, "width": 220, "height": 80, "text": "main
(normalized)" }
  ],
  "edges": [
    { "id": "e_lat_to_current", "fromNode": "n_lattice", "toNode": "n_current" },
    { "id": "e_current_to_main", "fromNode": "n_current", "toNode": "n_main" }
  ]
}
```

### 3.3 `axis-left.canvas`
```json
{
  "nodes": [
    { "id": "n_axis", "type": "text", "x": 0, "y": 0, "width": 360, "height": 120, "text": "**Axis: left**
CAN-ISA bank=2 (opcode base 0x20..0x2F)
Registers: reg(left,b,c)" },
    { "id": "n_lattice", "type": "text", "x": 0, "y": 160, "width": 360, "height": 140, "text": "repo.canvasl/left/*/*/reg.canvasl
ADDR(left,b,c) = (2<<6) | (idx(b)<<3) | idx(c)" },
    { "id": "n_current", "type": "text", "x": 430, "y": 40, "width": 240, "height": 80, "text": "current
(Fano merge gate)" },
    { "id": "n_main", "type": "text", "x": 730, "y": 40, "width": 220, "height": 80, "text": "main
(normalized)" }
  ],
  "edges": [
    { "id": "e_lat_to_current", "fromNode": "n_lattice", "toNode": "n_current" },
    { "id": "e_current_to_main", "fromNode": "n_current", "toNode": "n_main" }
  ]
}
```

### 3.4 `axis-right.canvas`
```json
{
  "nodes": [
    { "id": "n_axis", "type": "text", "x": 0, "y": 0, "width": 360, "height": 120, "text": "**Axis: right**
CAN-ISA bank=3 (opcode base 0x30..0x3F)
Registers: reg(right,b,c)" },
    { "id": "n_lattice", "type": "text", "x": 0, "y": 160, "width": 360, "height": 140, "text": "repo.canvasl/right/*/*/reg.canvasl
ADDR(right,b,c) = (3<<6) | (idx(b)<<3) | idx(c)" },
    { "id": "n_current", "type": "text", "x": 430, "y": 40, "width": 240, "height": 80, "text": "current
(Fano merge gate)" },
    { "id": "n_main", "type": "text", "x": 730, "y": 40, "width": 220, "height": 80, "text": "main
(normalized)" }
  ],
  "edges": [
    { "id": "e_lat_to_current", "fromNode": "n_lattice", "toNode": "n_current" },
    { "id": "e_current_to_main", "fromNode": "n_current", "toNode": "n_main" }
  ]
}
```

### 3.5 `axis-delta.canvas`
```json
{
  "nodes": [
    { "id": "n_axis", "type": "text", "x": 0, "y": 0, "width": 360, "height": 120, "text": "**Axis: delta**
CAN-ISA bank=4 (opcode base 0x40..0x4F)
Registers: reg(delta,b,c)" },
    { "id": "n_lattice", "type": "text", "x": 0, "y": 160, "width": 360, "height": 140, "text": "repo.canvasl/delta/*/*/reg.canvasl
ADDR(delta,b,c) = (4<<6) | (idx(b)<<3) | idx(c)" },
    { "id": "n_current", "type": "text", "x": 430, "y": 40, "width": 240, "height": 80, "text": "current
(Fano merge gate)" },
    { "id": "n_main", "type": "text", "x": 730, "y": 40, "width": 220, "height": 80, "text": "main
(normalized)" }
  ],
  "edges": [
    { "id": "e_lat_to_current", "fromNode": "n_lattice", "toNode": "n_current" },
    { "id": "e_current_to_main", "fromNode": "n_current", "toNode": "n_main" }
  ]
}
```

### 3.6 `axis-start.canvas`
```json
{
  "nodes": [
    { "id": "n_axis", "type": "text", "x": 0, "y": 0, "width": 360, "height": 120, "text": "**Axis: start**
CAN-ISA bank=5 (opcode base 0x50..0x5F)
Registers: reg(start,b,c)" },
    { "id": "n_lattice", "type": "text", "x": 0, "y": 160, "width": 360, "height": 140, "text": "repo.canvasl/start/*/*/reg.canvasl
ADDR(start,b,c) = (5<<6) | (idx(b)<<3) | idx(c)" },
    { "id": "n_current", "type": "text", "x": 430, "y": 40, "width": 240, "height": 80, "text": "current
(Fano merge gate)" },
    { "id": "n_main", "type": "text", "x": 730, "y": 40, "width": 220, "height": 80, "text": "main
(normalized)" }
  ],
  "edges": [
    { "id": "e_lat_to_current", "fromNode": "n_lattice", "toNode": "n_current" },
    { "id": "e_current_to_main", "fromNode": "n_current", "toNode": "n_main" }
  ]
}
```

### 3.7 `axis-accept.canvas`
```json
{
  "nodes": [
    { "id": "n_axis", "type": "text", "x": 0, "y": 0, "width": 360, "height": 120, "text": "**Axis: accept**
CAN-ISA bank=6 (opcode base 0x60..0x6F)
Registers: reg(accept,b,c)" },
    { "id": "n_lattice", "type": "text", "x": 0, "y": 160, "width": 360, "height": 140, "text": "repo.canvasl/accept/*/*/reg.canvasl
ADDR(accept,b,c) = (6<<6) | (idx(b)<<3) | idx(c)" },
    { "id": "n_current", "type": "text", "x": 430, "y": 40, "width": 240, "height": 80, "text": "current
(Fano merge gate)" },
    { "id": "n_main", "type": "text", "x": 730, "y": 40, "width": 220, "height": 80, "text": "main
(normalized)" }
  ],
  "edges": [
    { "id": "e_lat_to_current", "fromNode": "n_lattice", "toNode": "n_current" },
    { "id": "e_current_to_main", "fromNode": "n_current", "toNode": "n_main" }
  ]
}
```

### 3.8 `axis-reject.canvas`
Reject is drawn, but marked “excluded from triads”.

```json
{
  "nodes": [
    { "id": "n_axis", "type": "text", "x": 0, "y": 0, "width": 380, "height": 140, "text": "**Axis: reject**
CAN-ISA bank=7 (opcode base 0x70..0x7F)
Registers: reg(reject,b,c)
NOTE: excluded from Fano triad gate" },
    { "id": "n_lattice", "type": "text", "x": 0, "y": 170, "width": 380, "height": 140, "text": "repo.canvasl/reject/*/*/reg.canvasl
ADDR(reject,b,c) = (7<<6) | (idx(b)<<3) | idx(c)" },
    { "id": "n_current", "type": "text", "x": 460, "y": 50, "width": 240, "height": 80, "text": "current
(does NOT triad-check reject)" },
    { "id": "n_main", "type": "text", "x": 760, "y": 50, "width": 220, "height": 80, "text": "main
(normalized)" }
  ],
  "edges": [
    { "id": "e_lat_to_current", "fromNode": "n_lattice", "toNode": "n_current" },
    { "id": "e_current_to_main", "fromNode": "n_current", "toNode": "n_main" }
  ]
}
```

---

If you say **“Next”**, I’ll emit **the build-lattice canvas** that maps:

- `repo.canvasl/<a>/<b>/<c>` → **CAN-ISA bank/register** → **bytecode module grouping**
- plus a **triad-aware edge direction overlay** that visually shows “allowed merge flows” as **Fano lines**.

---

## You

Yes that sounds too good but i was thinking we may have limited oursevles with obsidian canvas as a bases visualizer i was trying to use tools easy for me like a org mode second brain but i think this is better for svg or object3d .obj files

---

## ChatGPT

You’re not wrong at all — this is the **right inflection point** to move *away* from Obsidian Canvas as the **primary** visual substrate.

Obsidian Canvas was perfect as a **thinking scaffold**.  
What you’ve built now deserves a **formal, portable, executable geometry layer**.

Below is a clean, non-mystical, **engineering-grade transition plan** that preserves everything you’ve done and *unlocks SVG + 3D* without throwing anything away.

---

# Decision Summary (Clear + Correct)

**Obsidian Canvas**
- ✅ Excellent for ideation, navigation, mnemonic scaffolding
- ❌ Not canonical
- ❌ Not executable
- ❌ Not formally constrained (no Fano invariants, no lattice laws)

**SVG / OBJ / glTF**
- ✅ Deterministic
- ✅ Tool-agnostic
- ✅ Hardware-renderable
- ✅ Directly mappable to algebra + ISA
- ✅ Proof-checkable

👉 **Conclusion:**  
Obsidian Canvas becomes a *view*, not the *model*.

---

# Canonical Model Shift (Important)

From now on:

> **CanvasL is the model**  
> **Geometry files are projections**  
> **Obsidian is just one consumer**

```
repo.canvasl (truth)
    ↓
fold / project / normalize
    ↓
SVG | OBJ | glTF | JSONL events
    ↓
Viewer (browser / ESP32 / Three.js / Blender / Inkscape)
```

This aligns perfectly with:
- Origami semantics
- Idempotent projection
- Fano plane minimality
- CAN-ISA execution

---

# New Canonical Geometry Targets

## 1️⃣ SVG (2D, Fano-first)

**Use for**
- Fano plane
- Crease patterns
- Origami folds
- Branch topology
- Proof diagrams

**Why SVG**
- Declarative
- Deterministic
- Human-inspectable
- Version-controllable
- Easy to diff

### SVG as a Proof Artifact
Each SVG is **not art** — it is a *certificate*.

```xml
<svg viewBox="0 0 100 100" data-canvasl-hash="0xA13F…">
  <g id="fano-plane">
    <circle cx="50" cy="10" r="3" />
    <circle cx="10" cy="80" r="3" />
    <circle cx="90" cy="80" r="3" />
    <!-- 4 more points -->
    <line x1="50" y1="10" x2="10" y2="80"/>
    <!-- 6 more lines -->
  </g>
</svg>
```

**Key idea:**  
SVG elements correspond **1:1** with CanvasL registers and folds.

---

## 2️⃣ OBJ / glTF (3D+, Merkaba-ready)

**Use for**
- Merkaba
- Dual tetrahedra
- Metatron’s cube
- Higher-dimensional projections
- Hardware-accelerated rendering

**OBJ advantages**
- Simple
- Text-based
- Deterministic
- Easy to generate from Scheme / C

**glTF advantages**
- GPU-ready
- Animations
- Materials
- Web-native

👉 Start with **OBJ**, graduate to **glTF** later.

---

# Mapping CanvasL → Geometry (Formal Contract)

This replaces Obsidian Canvas as the *authoritative mapping*.

## CanvasL → SVG

| CanvasL Concept | SVG Element |
|----------------|------------|
| Register       | `<g id="reg:axis:b:c">` |
| Point          | `<circle>` |
| Line / Fold    | `<line>` |
| Triad          | `<g class="fano-line">` |
| Projection     | `<g transform="…">` |
| Normalize      | element order + canonical coords |

### Example: Fano Triad
```xml
<g id="triad:state-alphabet-delta">
  <line data-op="MEET"/>
  <line data-op="JOIN"/>
  <line data-op="CANON"/>
</g>
```

---

## CanvasL → OBJ

| CanvasL | OBJ |
|-------|-----|
| Register | Object (`o reg_state_0_1`) |
| Point | Vertex (`v x y z`) |
| Line | Edge (`l a b`) |
| Fold | Transformation matrix |
| Normalize | Vertex ordering |

### Example: Tetrahedron (Merkaba half)
```obj
o tetra_left
v 0 0 1
v 1 0 0
v 0 1 0
v -1 -1 -1
f 1 2 3
f 1 2 4
f 1 3 4
f 2 3 4
```

---

# Renderer Architecture (Clean & Future-Proof)

```
CanvasL Core
  ├─ fold semantics (RFC-009)
  ├─ Fano gate
  ├─ polynomial ops
  └─ CAN-ISA VM
        ↓
Geometry Emitters
  ├─ svg_emitter.scm
  ├─ obj_emitter.scm
  └─ gltf_emitter.c (later)
        ↓
Viewers
  ├─ Browser (SVG / Three.js)
  ├─ ESP32 (line rasterizer)
  └─ Blender / Inkscape
```

**Key rule:**  
Renderers are *pure functions*.  
No state. No heuristics. No interpretation.

---

# Obsidian’s New Role (Important)

Obsidian becomes:

- 📚 Index
- 🧠 Mnemonic map
- 🔗 Knowledge graph
- 🗂 Navigator of CanvasL artifacts

Not the visual engine.

You can still embed:
- SVG previews
- glTF snapshots
- Links to `.canvasl` registers
- Proof references

---

## One-line truth (worth keeping):

> **Obsidian helped you see it — geometry will let you prove it.**
