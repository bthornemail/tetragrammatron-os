# RFC-0004: CAN-ISA — Bytecode ISA for Canonical Algebraic Normalization

## 1. Design Goals

Implementations on ESP32-S3 and Pico 2 W **MUST**:
- produce **byte-identical canonical state encodings** for the same input program/data,
- avoid floating point entirely,
- make normalization a **first-class instruction**, not an emergent property.

This ISA is intentionally **not** a CPU ISA. It’s a **deterministic algebra VM ISA**.

---

## 2. Core Data Model (What the ISA Operates On)

### 2.1 Terms, Monomials, Polynomials
The runtime state is a polynomial:

- **Monomial**: `vars_bitset` (which features participate) + optional degree info if needed later.
- **Coefficient**: integer modulo `p` (default p=2 or p=2^32 wrap depending on mode).
- **Scale**: base-2 exponent `e` (signed int) stored separately from coefficient.

A **Term** in the VM is:

```
Term := (coeff, exp2, vars)
```

A **State** is a multiset/map from `(exp2, vars)` → `coeff` (sparse map).

### 2.2 Canonicalization Rule (RFC-0001 mapped)
Normalization is defined as two steps:

1) **Combine like terms**
- Same `(exp2, vars)` → add coefficients mod p.

2) **Scale normalization**
- Apply deterministic rewrite(s) so representation is unique.

The only “float-like” rule you need at first is the canonical exponent/coefficient shaping you choose. For F₂, exponent normalization is usually trivial; for general rings, you’ll want a canonical “no common factor of 2 in coeff” rule.

---

## 3. Bytecode Format

### 3.1 Endianness & determinism
All CAN-ISA bytecode **MUST** use **little-endian** encoding for multi-byte integers.
(ESP32 and RP2350 are little-endian, so this removes ambiguity.)

### 3.2 Instruction encoding
Fixed-width header + variable operands:

```
u8  opcode
u8  flags
u16 imm16   (optional, opcode-specific)
[operands...]
```

**flags** standard bits:
- bit0: SIGNED_IMM
- bit1: WIDE (operands use u32 instead of u16)
- bit2: RESERVED
- bit3: TRAP_ON_ERROR
- others reserved

---

## 4. Memory Model

### 4.1 Regions
The VM exposes three deterministic regions:

- **CONST**: read-only tables (string pool, feature dictionary, program metadata)
- **HEAP**: term/polynomial storage (arena allocator recommended)
- **STATE**: the canonical polynomial map (the thing you hash and compare across devices)

### 4.2 Handles (not pointers)
Bytecode refers to objects by **handles** (u32 IDs), never raw pointers.

That is mandatory for portability and emulator friendliness.

---

## 5. Instruction Set (Minimal, Deterministic, Algebra-First)

### 5.1 Program control (no hidden nondeterminism)
- `HALT` — stop
- `TRAP code` — deterministic failure
- `NOP`

### 5.2 Constants / feature dictionary
- `DEF_FEAT feat_id, string_id`
  - Registers a feature name → numeric id mapping.
  - **MUST** be identical across devices for the same program bundle.

- `DEF_MOD modulus_id, p`
  - Select arithmetic mode (F₂, F_p, Z/2^32 wrap).
  - **MUST** be set before term ops.

### 5.3 Term construction
- `TERM_NEW dst, coeff, exp2`
- `TERM_SET_VARS term, var_bitset_handle`
- `TERM_SET_VAR term, feat_id` (sets bit)
- `TERM_CLR_VAR term, feat_id`

### 5.4 State update (events)
- `STATE_ADD term`
  - Adds term into STATE (no normalization implied yet).

- `STATE_SUB term`
- `STATE_MUL term`
  - Optional; if enabled, multiplies every term in state by given term (useful for operators).

### 5.5 Normalization (the RFC’s keystone)
- `STATE_NORM mode`
  - Performs canonical reduction and ensures byte-identical serialization.
  - `mode=0`: combine-like-terms only (fast)
  - `mode=1`: full normalization (combine + scale canonical rules + sorted order)

**Conformance rule:** Any program that intends to be comparable across nodes **MUST** call `STATE_NORM(1)` at its defined “commit points”.

### 5.6 Merge (commutative deterministic merge)
- `STATE_MERGE src_state_handle`
  - Adds all terms from `src` into STATE (like union/add), then (optionally) normalize.
  - Recommended pattern:
    - `STATE_MERGE`
    - `STATE_NORM(1)`

### 5.7 Hash / compare (for cross-device proofs)
- `STATE_HASH algo_id, out_handle`
  - algo_id=1: SHA-256
- `STATE_SERIALIZE out_handle`
  - writes canonical binary form:
    - sorted by (vars, exp2)
    - var bitset in fixed width
    - coeff in fixed width
- `ASSERT_EQ handleA, handleB`
- `ASSERT_HASH_EQ expected_hash_handle`

### 5.8 Deterministic streaming I/O (for JSONL / CanvasL)
- `IO_READ_LINE dst_string` (hosted test harness; optional on bare metal)
- `IO_PARSE_JSONL_TERM dst_term, src_string`
- `IO_PARSE_CANVASL_EVENT dst_evt, src_string`
- `APPLY_EVENT evt_handle`
  - expands to term ops (STATE_ADD etc.) deterministically

On bare metal, you implement these as “ports”:
- UART RX line reader
- minimal JSON tokenizer
- or CBOR/protobuf if you want (but then that becomes part of the deterministic spec)

---

## 6. CanvasL → CAN-ISA Mapping (Direct)

### 6.1 CanvasL primitives → algebra
Your CanvasL JSON nodes/edges become **events** that create/update terms.

**Rule:** Each CanvasL element MUST compile to a sequence of CAN-ISA instructions that:
1) declares feature IDs deterministically,
2) emits terms,
3) adds them to STATE,
4) normalizes at commit boundaries.

### 6.2 Minimal mapping table
| CanvasL element | Meaning | CAN-ISA compilation |
|---|---|---|
| `node(id, type, props…)` | introduce feature bundle | `DEF_FEAT` for stable ids; `TERM_NEW`; `TERM_SET_VAR`(node-id feature); `STATE_ADD` |
| `edge(a,b, rel)` | pairwise interaction | create monomial vars = {a,b,rel}; `STATE_ADD` |
| `optional(field missing)` | projective “at infinity” | encode as reserved feature bit `FEAT_INFINITY(field_id)` OR encode exp2 sentinel; then normalize |
| `commit` | stable compare point | `STATE_NORM(1)`; `STATE_HASH(SHA256)` |

**Conformance:** The compiler **MUST** produce stable feature IDs. IDs **MUST NOT** depend on hash maps or iteration order. Use sorted lists or a fixed dictionary section.

---

## 7. Geometry Renderer Contract (Bytecode-level hook)

Even if you don’t render on MCU, you want the ISA to emit a deterministic “geometry trace”.

### 7.1 Trace buffer
- `TRACE_EMIT tag, payload_handle`
- `TRACE_FLUSH`

### 7.2 Canonical geometry contract
Renderer receives canonical snapshots:

- `STATE_SERIALIZE` output → geometry engine input
- geometry engine MUST interpret:
  - term degree / feature count → simplex dimension
  - specific feature groups → Fano/tetra/merkaba projections (your higher-level mapping)

So the VM doesn’t “draw a tetrahedron”; it emits the canonical algebra and a renderer deterministically projects it.

---

## 8. ESP32-S3 vs Pico 2 W Implementation Notes (Still ISA-true)

### 8.1 Deterministic integer arithmetic
- Use `uint32_t` operations for coeffs (or bitsets for F₂).
- No `float`, no `double`.

### 8.2 Memory constraints & streaming
- Pico has tighter RAM; therefore STATE should be a **streamable sparse map**:
  - open addressing hash table with deterministic probing
  - or sorted vector + binary search with periodic compaction
- ESP32 can cache more but MUST NOT change semantics.

### 8.3 Test harness requirement
A “golden JSONL program” MUST execute identically on:
- ESP32-S3 board #1/#2/#3
- Pico 2 W

and yield identical `STATE_HASH`.

---

## 9. Minimal Example Program (Conceptual)

“Add two nodes and an edge, normalize, hash”:

1. `DEF_MOD p=2`
2. define features: node:A, node:B, rel:connects
3. emit terms:
   - vars={A} coeff=1 exp2=0
   - vars={B} coeff=1 exp2=0
   - vars={A,B,connects} coeff=1 exp2=0
4. `STATE_NORM(1)`
5. `STATE_HASH(SHA256)`

That hash is your cross-platform proof artifact.

---

If you want the *next* concrete step, tell me which you prefer and I’ll just do it (no questions):
1) the **actual JSON Schema** for CanvasL (validators) + a canonical feature-id section,  
2) the **exact opcode table** with numeric opcode assignments + binary operand layouts,  
3) a **portable C reference interpreter** for this ISA (fits both ESP-IDF and Pico SDK),  
4) a **Scheme reference interpreter** (R5RS) to serve as the spec oracle.

---

## You

CanvasL Json Schema

---

## ChatGPT

Below is a **complete, validator-ready JSON Schema** for **CanvasL JSON / JSONL**, written to be:

- **Normative** (can be referenced by RFCs)
- **Deterministic** (no ambiguous fields)
- **Directly compilable** to your **CAN-ISA**
- **Friendly to streaming (JSONL)** and static validation
- **Explicit about algebraic / polynomial semantics**

You can publish this as **`canvasl.schema.json`** and reference it from RFC-0002 / RFC-0004.

---
