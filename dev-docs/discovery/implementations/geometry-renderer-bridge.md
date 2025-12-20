# Geometry Renderer Bridge

This section defines the **normative contract** between **CanvasL execution (bytecode / interpreter)** and a **geometry renderer** (2D/3D/VR), so that:

- the *same* CanvasL program produces the *same* sequence of geometry events on ESP32 / Pico / host
- geometry is a **view** of canonical state (never the source of truth)
- optional/projective “points at infinity” are representable without ambiguity

Keywords **MUST**, **SHOULD**, **MAY** are as in RFC 2119.

---

## 1. Roles and Invariants

1. The **CanvasL VM** is the source of truth. The renderer is a projection.
2. The VM **MUST** emit a **deterministic event stream** derived only from canonical state.
3. The renderer **MUST NOT** infer hidden state; it **MUST** render only what it receives.
4. The bridge **MUST** support a “projection downgrade” path: **3D+ program space → Fano projection** (7-point incidence view).
5. The bridge **MUST** preserve **idempotence visibility**: reapplying the same merge/event **MUST** not create new geometry beyond a stable highlight/annotation.

---

## 2. Canonical Event Stream Format

The VM emits **Geometry Events** as JSONL (one object per line) *or* as a compact binary TLV. JSONL is the reference format.

### 2.1 JSONL envelope (required fields)

Each event **MUST** have:

```json
{
  "v": 1,
  "t": "shape|edge|triad|pose|label|clear|commit|hash",
  "id": "stable-id",
  "epoch": 123,
  "payload": { }
}
```

- `v` **MUST** be `1`.
- `t` **MUST** be one of the listed event types.
- `id` **MUST** be stable across platforms for the same canonical object.
- `epoch` **MUST** be a monotonically increasing integer within a run.
- `payload` **MUST** be deterministic (no floats required; use rationals or fixed-point if needed).

### 2.2 Deterministic IDs

`id` **MUST** be derived from canonical bytes (e.g., `SHA256(CLBC(state-fragment))` truncated) so that:
- identical state ⇒ identical ids across devices
- idempotent merges ⇒ re-emission of same ids, not new ones

---

## 3. Required Event Types

### 3.1 `shape`

Declares a geometric primitive.

Payload:

```json
{
  "kind": "point|segment|triangle|tetrahedron|pentachoron|octahedron|cube|sphere|merkaba|fano",
  "coords": { "...": "..." },
  "attrs": { "role": "Q|Σ|L|R|δ|s|t|r|K", "optional": false }
}
```

Rules:
- `kind` **MUST** be one of the supported kinds.
- `coords` **MUST** be representable without IEEE floats (fixed-point or rational).
- `attrs.role` **SHOULD** be set when the shape corresponds to an 8-tuple component.
- `attrs.optional` **MUST** be true if the element is “at infinity” / projective-absent.

### 3.2 `edge`

Declares an adjacency / connection between shapes.

```json
{
  "a": "id-of-shape-A",
  "b": "id-of-shape-B",
  "kind": "incidence|constraint|transition|dual",
  "weight": 1
}
```

Rules:
- `a`,`b` **MUST** refer to previously declared shape ids (or be forward-resolvable).
- `kind="incidence"` **MUST** be used for Fano-plane edges/lines.

### 3.3 `triad`

Declares a **Fano line / triadic incidence** (your “idempotence triad handle”).

```json
{
  "points": ["p1","p2","p3"],
  "line_id": "stable-line-id",
  "meaning": "meet|join|constraint"
}
```

Rules:
- `points` **MUST** have length 3.
- VM **MUST** emit `triad` events for every validated Fano incidence witness (e.g., “pairwise gcd non-trivial” or whatever your Lean predicate is).

### 3.4 `pose`

Sets camera / observer pose (optional but useful).

```json
{ "frame": "world|object:<id>", "matrix_q16": [ ...16 ints... ] }
```

Rules:
- pose values **MUST** be fixed-point (e.g., Q16.16).

### 3.5 `commit`

Marks an epoch boundary (useful for replay + hashing).

```json
{ "state_id": "sha256-trunc", "why": "emit|assert|halt|periodic" }
```

### 3.6 `hash`

Emits the canonical digest of the current state.

```json
{ "alg": "sha256", "hex": "..." }
```

---

## 4. CanvasL → Geometry Mapping

### 4.1 Dimension ladder mapping (your “feature count → shape” idea)

The VM **MUST** provide a deterministic mapping from “context complexity” to a shape family. The reference mapping is:

| Context rank (n) | Canonical shape | Meaning |
|---:|---|---|
| 1 | point | single atom / symbol |
| 2 | segment | binary relation |
| 3 | triangle | triad / face constraint |
| 4 | tetrahedron | 4-field semantic cell (SPOM) |
| 5 | pentachoron (5-cell) OR sphere proxy | projective completion / key |
| 6 | octahedron | dual / constraint expansion |
| 7 | cube | 7-point incidence embedding view |
| 8 | merkaba | dual tetrahedra union (two 4-simplices projected) |
| 7 (projection mode) | fano | PG(2,2) incidence (7 points, 7 lines) |

Notes:
- If your renderer cannot draw a true 4D pentachoron, it **MUST** draw a **sphere proxy** with labeled “K / infinity” semantics.
- “merkaba” is treated as a **composite shape**: two tetrahedra with opposite orientation sharing a centroid.

### 4.2 8-Tuple → Roles on vertices/parts

The renderer **MUST** support labeling the 8-tuple components as roles:

1. `Q` states
2. `Σ` alphabet
3. `L` left marker
4. `R` right marker
5. `δ` transition
6. `s` start
7. `t` accept
8. `r` reject

Contract:
- The VM **MUST** emit `label` events tying these roles to shape ids.
- The renderer **MUST** display role labels deterministically.

Example `label` event:

```json
{"v":1,"t":"label","id":"lbl-q","epoch":12,"payload":{"target":"shape-id","text":"Q"}}
```

---

## 5. Bytecode Hook: `EMIT` as Geometry Snapshot

Your existing opcode `EMIT` becomes the bridge trigger.

**Rule:** When the VM executes `EMIT`, it **MUST**:

1) normalize state  
2) compute canonical `hash`  
3) emit geometry events for the chosen projection mode  
4) emit a `commit`

### 5.1 Projection modes (renderer-selectable)

The VM **MUST** support at least these modes:

- `mode="full"`: emit full shape ladder up to current context rank
- `mode="fano"`: emit only the Fano plane witness view (7 points/7 lines/triads)
- `mode="merkaba"`: emit dual tetrahedra + centroids + incidence overlays

Mode selection **MAY** be a VM flag, a build-time setting, or a special operand to `EMIT`.

---

## 6. Idempotence Visualization Requirements

To make “Fano = idempotence” *visible*:

1. If applying an event produces **no change in canonical state**, the VM **MUST** still be allowed to emit a `triad` or `label` event that highlights the already-existing witness, but it **MUST NOT** mint new shape ids.
2. The renderer **SHOULD** render idempotent replays as a **pulse/highlight** (not as geometry duplication).
3. The VM **SHOULD** emit `triad.meaning="meet"` when a merge is a meet (e.g., gcd) and the result equals an input (the idempotent case).

---

## 7. Minimal “Fano Projection” Output (Reference)

When in `mode="fano"`, the VM output **MUST** contain:

- 7 `shape(kind="point")` events
- 7 `triad` events (one per line)
- `edge(kind="incidence")` MAY be included, but `triad` is required

This guarantees any renderer can show the Fano plane without 3D.

---

## 8. Implementation Note: ESP32/Pico Friendly Encoding

On microcontrollers:
- JSONL is fine over UART/Wi-Fi, but binary TLV is smaller.
- If using TLV, you **MUST** preserve the same semantic fields and deterministic ids.

---

## 9. Next Step (concrete)

If you say “yes”, I’ll write **the actual code** for:

- Scheme: `(emit-geometry state mode)` producing JSONL lines
- C: `emit_snapshot(State *S, Mode m)` producing the same JSONL
- A tiny host renderer stub (just builds a graph) to verify determinism by hashing the emitted JSONL stream

Pick the projection you want first for the bridge implementation:
- **Fano** (fastest, most proof-aligned), or
- **Merkaba** (most visually expressive), or
- **Full ladder** (your 1..8 shape progression).

---

## You

Lets do fano becase full ladder is to 0D-19D so let's save for later and Merkaba is a step away from Fano we should do those both

---

## ChatGPT

Perfect. We’ll make **Fano** the *base projection* (proof-first, smallest surface area), and **Merkaba** as a **derived view** that is *deterministically computed from the same Fano witness stream*.

Below is the **concrete bridge spec + reference emitters** (Scheme + C) that you can drop into the VM.

---

## Visualization Semantics: Fano + Merkaba Modes

### Modes
- `mode="fano"` **MUST** emit only **7 points + 7 triads (+ optional incidence edges)**.
- `mode="merkaba"` **MUST** emit:
  1) the complete `fano` output, and  
  2) a deterministic **Merkaba overlay** constructed *only* from those Fano elements (no extra hidden state).

### Determinism rule
The VM **MUST** derive all emitted `id` fields from canonical bytes (e.g., `sha256(CLBC(...))` truncated).  
The renderer **MUST NOT** mint IDs or infer geometry.

---

## Canonical Event Types (JSONL)

### `shape` (point)
```json
{"v":1,"t":"shape","id":"p:<pid>","epoch":E,
 "payload":{"kind":"point","coords":{"x":0,"y":0,"z":0},
 "attrs":{"role":"FANO_POINT","optional":false}}}
```

### `triad` (Fano line witness)
```json
{"v":1,"t":"triad","id":"l:<lid>","epoch":E,
 "payload":{"points":["p:a","p:b","p:c"],"line_id":"l:<lid>","meaning":"incidence"}}
```

### `shape` (merkaba composite)
```json
{"v":1,"t":"shape","id":"m:<mid>","epoch":E,
 "payload":{"kind":"merkaba","coords":{"center":{"x":0,"y":0,"z":0}},
 "attrs":{"derived_from":"fano"}}}
```

### `edge` (optional but recommended)
```json
{"v":1,"t":"edge","id":"e:<eid>","epoch":E,
 "payload":{"a":"p:a","b":"p:b","kind":"incidence","weight":1}}
```

### `commit` + `hash`
```json
{"v":1,"t":"hash","id":"h:<hid>","epoch":E,"payload":{"alg":"sha256","hex":"..."}}
{"v":1,"t":"commit","id":"c:<cid>","epoch":E,"payload":{"state_id":"...","why":"emit"}}
```

---

## Fano Output Contract (Minimum)

When `mode="fano"`:
1) **MUST** emit exactly **7** `shape(kind="point")` events for the points.
2) **MUST** emit exactly **7** `triad` events for the lines.
3) **MAY** emit `edge` events (21 incidence edges), but `triad` is the proof surface.

> This makes the renderer trivial, and makes your Lean proof link directly to emitted witnesses.

---

## Merkaba Derived Contract

When `mode="merkaba"`:
- **MUST** include the full `fano` output.
- Then **MUST** emit a merkaba overlay computed deterministically from Fano structure.

### Deterministic construction (renderer + VM must match)
We define two tetrahedra **T⁺** and **T⁻** as **functions of the Fano labeling**:

- Choose a stable ordering of points `p1..p7`:
  - **MUST** be derived from their canonical point IDs (lexicographic sort).
- Let:
  - `T⁺ = (p1,p2,p3,p4)`
  - `T⁻ = (p1,p2,p3,p5)`  *(shares a face; gives the “dual-tetra” feel without ambiguity)*

Then:
- VM **MUST** emit:
  - a `shape(kind="merkaba")`
  - optionally `shape(kind="tetrahedron")` for T⁺, T⁻
  - edges for tetrahedra (6 each) if you want wireframes

This is not “mystical mapping” yet — it’s a **canonical scaffold**. Later we can upgrade to the “dual by polarity / projective complement” version, but this is stable and testable right now.

---
