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
