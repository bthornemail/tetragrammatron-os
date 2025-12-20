# RFC-0011 §6 — CAN-ISA v1.0 Binding for Fano Consistency (Normative)

## 6.1 Design Goals

1. **All semantic states are polynomials** in canonical CLBC-POLY encoding.
2. VM execution MUST be deterministic and endian-stable.
3. Fano consistency MUST be checkable as a pure barrier instruction:
   - **strict mode** (pairwise + triple core + idempotence + non-absorption)
   - **weak mode** (triple core + touches core + idempotence)

---

## 6.2 Canonical Data Unit: CLBC-POLY Frame

All polynomial values referenced by CAN-ISA MUST be stored in memory as **CLBC-POLY v1 frames**.

### 6.2.1 CLBC-POLY v1 Frame Layout (Byte Exact)

```
offset  size  field
0       4     magic = "CLBC" (0x43 0x4C 0x42 0x43)
4       1     kind  = 'P'    (0x50)    // polynomial
5       1     ver   = 0x01
6       1     ring  = 0x01            // F₂[x]
7       1     flags = 0x00
8       4     degree   (u32, big-endian)
12      4     nwords   (u32, big-endian)
16      4*n   words[i] (u32, big-endian)  // bitset coefficients
```

**Normative requirement:** CAN-ISA MUST treat all CLBC-POLY integers as **big-endian**.  
(Your earlier “golden vector” tooling already assumes this.)

---

## 6.3 CAN-ISA Instruction Word (Fixed 16-bit)

Every instruction is exactly **16 bits**:

```
15..12  opcode (4 bits)
11..9   rd     (3 bits)   // destination register
8..6    ra     (3 bits)   // source A
5..3    rb     (3 bits)   // source B
2..0    imm3   (3 bits)   // mode / small immediate
```

- Registers `R0..R7` hold **pointers** (32-bit addresses) to CLBC-POLY frames in VM memory.
- Instructions are encoded in **big-endian 16-bit** in the bytecode stream:
  - high byte first, then low byte.

---

## 6.4 Opcode Set for Fano Folding (v1.0)

### 6.4.1 Core Lattice Ops

#### `0x1 MEET` — Polynomial GCD (fold intersection)

**Encoding:**
```
opcode=0001  rd ra rb imm3
```

**Semantics:**
- Load CLBC-POLY at `*ra`, `*rb`
- Compute `g = gcd(a,b)` in F₂[x]
- Write canonical CLBC-POLY for `g` into scratch/heap
- Store pointer to result in `rd`

**VM MUST** normalize/canonicalize output (degree/words trimmed).

---

#### `0x2 JOIN` — Polynomial LCM (fold union)

**Encoding:**
```
opcode=0010  rd ra rb imm3
```

**Semantics:**
- Compute `j = lcm(a,b) = (a*b)/gcd(a,b)` in F₂[x]
- Write canonical CLBC-POLY, store pointer in `rd`

---

### 6.4.2 Barrier Checks

#### `0x7 PROJ_FANO` — Fano Triad Barrier (the merge gate)

This is the *enforcement instruction*.

**Encoding:**
```
opcode=0111  rd ra rb imm3
```

**Register meaning:**
- `ra` points to `A`
- `rb` points to `B`
- `rd` points to `C`  (yes: `rd` used as 3rd source here; rd is not overwritten)

**imm3: mode**
- `000` = STRICT_FANO
- `001` = WEAK_FANO
- `010` = STRICT_FANO_NO_IDEMP (debug / not allowed in release builds unless explicitly enabled)
- all other values: reserved → MUST trap

**Result reporting:**
- On success: VM continues; `FLAGS.FANO_OK = 1`
- On failure: MUST trap with one failure code in `FLAGS.FAIL` and halt/abort the transaction.

---

## 6.5 PROJ_FANO Semantics (Exact Predicate)

**Invariant references:** This section enforces INV-12 (Fano Structural Validity) and INV-13 (Fano-Triad Closure) from `TETRAGRAMMATRON_OS_FORMAL_INVARIANTS.md`.

Let `A,B,C` be the polynomials referenced by `(ra, rb, rd)`.

Define helper operations (implemented via MEET/JOIN internally, but PROJ_FANO may shortcut):

- `AB = gcd(A,B)`
- `BC = gcd(B,C)`
- `AC = gcd(A,C)`
- `ABC = gcd(AB,C)`
- `J = lcm(lcm(A,B),C)`
- `ONE` = polynomial constant 1
- `IDEMP(X)` := `gcd(X,X) == X` (true for canonical polys, but required as a safety invariant)

### 6.5.1 STRICT_FANO (imm3 = 000)

PROJ_FANO MUST succeed iff **all** hold:

**(S1) Pairwise non-trivial incidence**
- `AB ≠ ONE`
- `BC ≠ ONE`
- `AC ≠ ONE`

**(S2) Triple core exists**
- `ABC ≠ ONE`

**(S3) Idempotent closure**
- `IDEMP(J)` MUST hold

**(S4) Non-absorption (no degenerate collapse)**
- `AB ≠ A`
- `BC ≠ B`
- `AC ≠ C`

If any clause fails, VM MUST trap with:

- S1 fail → `FANO_NO_PAIRWISE_INCIDENT`
- S2 fail → `FANO_NO_COMMON_CORE`
- S3 fail → `FANO_NON_IDEMPOTENT`
- S4 fail → `FANO_DEGENERATE_ABSORPTION`

### 6.5.2 WEAK_FANO (imm3 = 001)

PROJ_FANO MUST succeed iff:

**(W1) Triple core exists**
- `K = ABC ≠ ONE`

**(W2) Each touches the core**
- `gcd(A,K) ≠ ONE`
- `gcd(B,K) ≠ ONE`
- `gcd(C,K) ≠ ONE`

**(W3) Core idempotence**
- `IDEMP(K)` MUST hold

Failure codes:
- W1 fail → `FANO_NO_COMMON_CORE`
- W2 fail → `FANO_NO_PAIRWISE_INCIDENT`
- W3 fail → `FANO_NON_IDEMPOTENT`

---

## 6.6 Minimal Assembler Mnemonics (for Scheme assembler)

Even though this is 16-bit, keep mnemonics simple:

```
MEET   rd, ra, rb        ; rd := gcd(ra, rb)
JOIN   rd, ra, rb        ; rd := lcm(ra, rb)

FANO.S rd, ra, rb        ; triad barrier STRICT, sources=(ra,rb,rd)
FANO.W rd, ra, rb        ; triad barrier WEAK,   sources=(ra,rb,rd)
```

**Note:** `FANO.*` uses `(ra, rb, rd)` as `(A,B,C)`; it does not clobber rd.

---

## 6.7 Worked Encoding Example (Byte Exact)

Example: `MEET R3, R1, R2`

Fields:
- opcode = `0x1` → `0001`
- rd=3 → `011`
- ra=1 → `001`
- rb=2 → `010`
- imm3=0 → `000`

Bitstring:
```
0001 011 001 010 000
```

Grouped into 16 bits:
```
00010110 01010000
   0x16     0x50
```

So the bytecode stream contains:
```
16 50
```

Example: `FANO.S R4, R1, R2`  (triad = A=R1, B=R2, C=R4)

- opcode=0x7 → `0111`
- rd=4 → `100`   (C)
- ra=1 → `001`   (A)
- rb=2 → `010`   (B)
- imm3=0 → `000` (STRICT)

Bits:
```
0111 100 001 010 000
```

Bytes:
```
01111000 10100000
   0x78     0xA0
```

---

## 6.8 Integration Hook: Git Merge Gate == PROJ_FANO

A repo merge gate MUST compile the merge intent into a triad list and insert:

- `FANO.S` barriers (release/current → main)
- optionally `FANO.W` barriers (feature → current)

If any barrier traps, the merge MUST be rejected.

---

## 6.10 Dual Invariant Requirements (Normative)

**Status:** Normative  
**Invariant Level:** Kernel (Non-negotiable)  
**Applies to:** PROJ_FANO, CANON, MEET, JOIN operations

### 6.10.1 Purpose

The Fano plane (PG(2,2)) is **closed under duality** (RFC-0000 §4). This section specifies the dual invariant requirements that MUST be preserved by all projection and merge operations.

### 6.10.2 Dual Invariant Definition

**Dual invariance** means that operations on the Fano plane MUST preserve symmetry under the duality transformation that exchanges:
- Points ↔ Lines
- Primal representation ↔ Dual representation
- Vertex-based projections ↔ Edge-based projections

### 6.10.3 Requirements for PROJ_FANO

The `PROJ_FANO` instruction (RFC-0011 §6.5) MUST preserve dual invariance:

#### 6.10.3.1 Primal-Dual Symmetry

For any triad `(A, B, C)` that passes STRICT_FANO validation:
- The dual triad `(A', B', C')` (where `'` denotes dual transformation) MUST also pass STRICT_FANO validation
- The projection result MUST be invariant under duality: `Proj_Fano(A,B,C) = Dual(Proj_Fano(Dual(A),Dual(B),Dual(C)))`

#### 6.10.3.2 Vertex-Edge Duality (V↔E)

In geometric projections:
- Vertex-based representations MUST have equivalent edge-based dual representations
- Any operation that modifies vertex structure MUST preserve equivalent edge structure
- The canonical form MUST be independent of whether representation is vertex-first or edge-first

**Note:** This requirement applies when geometry projection layer (Agent 5) is integrated. VM implementations MUST provide hooks for dual invariant checking.

### 6.10.4 Requirements for CANON

The `CANON` instruction (RFC-0011 §6.9.2) MUST preserve dual invariance:

#### 6.10.4.1 Dual-Normalization Equivalence

For any polynomial state `P`:
- `CANON(P)` and `CANON(Dual(P))` MUST produce results that are dual-equivalent
- The canonical form MUST be chosen such that dual states normalize to dual canonical forms

**Operational requirement:**
- VM implementations MUST ensure canonicalization does not break dual symmetry
- If a polynomial has a dual representation, canonicalization MUST preserve the duality relationship

### 6.10.5 Requirements for MEET and JOIN

The `MEET` (GCD) and `JOIN` (LCM) operations MUST preserve dual invariance:

#### 6.10.5.1 Dual Operation Commutativity

For any polynomials `A` and `B`:
- `Dual(MEET(A,B)) = JOIN(Dual(A), Dual(B))`
- `Dual(JOIN(A,B)) = MEET(Dual(A), Dual(B))`

This is the **lattice duality law** for F₂[x] polynomials.

**Operational requirement:**
- VM implementations MUST ensure MEET/JOIN operations respect this duality
- This is automatically satisfied if operations are implemented correctly in F₂[x], but MUST be verified

### 6.10.6 Implementation Status

**Current status:** Dual invariant checking is **not yet implemented** in the VM.

**Required implementation:**
1. Add dual invariant validation hooks to `PROJ_FANO` implementation
2. Add dual equivalence checking to `CANON` implementation  
3. Coordinate with Agent 5 (Geometry & Visualization) for geometric dual projections

**Reference implementation path:**
- See `lean/Tetragrammatron/Consensus/TriadicInvariant.lean` for formal specification
- See `AGENTS.md` §128-138 for 4D dual consensus requirements

### 6.10.7 Failure Modes

If dual invariance is violated:
- `PROJ_FANO` MUST trap with `FANO_DUAL_VIOLATION` (new error code)
- `CANON` MUST trap with `CANON_DUAL_VIOLATION` (new error code)
- VM MUST halt execution to prevent invalid state propagation

**Error codes:**
- `FANO_DUAL_VIOLATION` — PROJ_FANO result violates dual symmetry
- `CANON_DUAL_VIOLATION` — CANON result violates dual symmetry

### 6.10.8 Relationship to Other Invariants

This section enforces:
- RFC-0000 §4 (Fano plane "Closed under duality")
- RFC-0000 §5 (Semantic closure — dual invariants are part of the 8-tuple closure)
- `TETRAGRAMMATRON_OS_FORMAL_INVARIANTS.md` — Dual invariants (primal/dual, V↔E)

**Cross-reference:** This complements the Fano validation requirements in §6.5 (PROJ_FANO) and canonicalization requirements in RFC-0011 §6.9.2 (CANON).

**Agent 0 requirement:** Agent 0 (OBSERVER) MUST verify dual invariant preservation before approving merges. See Agent 0 verification checklist in `dev-docs/00 - RFC-0000 APPENDIX — AGENT CONSTELLATION & TASK MATRIX.md` §A.