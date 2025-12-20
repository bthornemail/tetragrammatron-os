# CanvasL JSONL Formalization for Polynomial Encoder/Decoder Execution
*(Standards Track Addendum: CanvasL-POLY v1.0)*

## 1. Normative Concepts

### 1.1 Boundary
A Boundary `B` is an immutable constraint object (e.g., FANO incidence + optional orientation + automorphism selection).

### 1.2 Encoder and Decoder (not cryptographic)
An **Encoder** is a deterministic function family parameterized by coefficients.  
A **Decoder** is a deterministic reconstruction/interpretation function relative to a Boundary.

We model:

- `E_c(·)` : encoder instantiated by coefficients `c`
- `D(·, B)` : decoder under boundary `B`

### 1.3 Execution Step
CanvasL JSONL is a sequence of steps `s0, s1, …` executed in increasing `phase`.

---

## 2. Canonical JSONL Record Types

CanvasL-POLY defines three required step types:

1. `define_encoder`
2. `apply_encoder`
3. `decode_and_validate`

Each is a JSON object per line.

### 2.1 Common Required Fields (all steps)

| Field | Type | Meaning |
|---|---|---|
| `id` | string | unique step id |
| `phase` | int ≥ 0 | total order index |
| `boundary` | string | boundary id (hash or version tag) |
| `anchor` | string | commit hash / epoch id |
| `op` | string | operation tag |
| `inputs` | string[] | references to prior outputs |
| `outputs` | string[] | references created by this step |

Forward references are forbidden.

---

## 3. Polynomial Encoder Definition

### 3.1 `define_encoder`

Defines an encoder `E` plus its coefficients `c`. Coefficients are “the key” in your sense: stable parameters.

```json
{
  "id": "enc-0",
  "phase": 0,
  "boundary": "FANO-v1",
  "anchor": "commit:abc123",
  "op": "define_encoder",
  "encoder_id": "E.local.1",
  "ring": "Z", 
  "basis_dim": 8,
  "poly_form": "affine",
  "coeffs": {
    "A": "ref:matrix:A0",
    "b": "ref:vector:b0"
  },
  "inputs": [],
  "outputs": ["enc:E.local.1"]
}
```

**Normative meaning** (affine example):
- `E_c(x) = A·x + b` over the declared ring.

You can support other `poly_form` values (e.g., `"degree2"`, `"sparse"`, `"multilinear"`) as long as evaluation is deterministic.

---

## 4. Streaming Data as Variables

### 4.1 `apply_encoder`

Applies the encoder to a variable assignment (data stream), producing an encoded state object.

```json
{
  "id": "step-1",
  "phase": 1,
  "boundary": "FANO-v1",
  "anchor": "commit:abc123",
  "op": "apply_encoder",
  "encoder_ref": "enc:E.local.1",
  "vars": {
    "x": "ref:state_vector:t1"
  },
  "evaluation": {
    "mode": "deterministic",
    "precision": "exact"
  },
  "inputs": ["enc:E.local.1", "ref:state_vector:t1"],
  "outputs": ["state:encoded:t1"]
}
```

**Normative meaning**:
- Let `x := resolve(ref:state_vector:t1)`.
- Compute `y := E_c(x)`.
- Store `y` under output reference `state:encoded:t1`.

---

## 5. Decoding and Boundary Validation

### 5.1 `decode_and_validate`

Decodes under the Boundary and asserts validity (including FANO/PCG constraints and automorphism alignment).

```json
{
  "id": "step-2",
  "phase": 2,
  "boundary": "FANO-v1",
  "anchor": "commit:abc123",
  "op": "decode_and_validate",
  "decoder": {
    "mode": "boundary_relative",
    "strategy": "canonical_under_automorphism"
  },
  "target": "state:encoded:t1",
  "checks": [
    "schema",
    "boundary_id_match",
    "automorphism_match",
    "fano_incidence",
    "pcg_pair_cover"
  ],
  "inputs": ["state:encoded:t1"],
  "outputs": ["state:decoded:t1", "proof:valid:t1"]
}
```

**Normative meaning**:
- Compute `(decoded, proof) := D(target, B)`.
- Run checks in order.
- If any check fails → **reject trace**.

---

## 6. Validity Rules (Normative)

Let `Trace = [s0..sn]`.

A trace is **VALID** iff:

1. **Schema validity**: every line matches its record type.
2. **Phase monotonicity**: phases strictly increase (or nondecreasing with tie-break; choose one—recommended strictly increasing).
3. **No forward references**: each `inputs` ref must be produced by an earlier step or externally declared.
4. **Boundary consistency**: all steps share the same `boundary` (or explicit boundary transitions, if your system allows RFC boundary transforms).
5. **Deterministic evaluation**: the same trace under the same Boundary must yield identical outputs.
6. **Boundary checks**: all `decode_and_validate` checks pass.

---

## 7. FANO Constraint Encoding in CanvasL

When `boundary` is a FANO boundary:

- The system MUST provide (directly or via references) a representation of:
  - point set `U`
  - line set `L`
  - incidence predicate `I(p, ℓ)`

### 7.1 Minimal FANO artifacts referenced by trace

You can include these as content-addressed objects:

- `ref:fano:points`
- `ref:fano:lines`
- `ref:fano:incidence`
- `ref:fano:automorphism_selection`

Then `fano_incidence` check means:

> For every claimed line relation induced by the decoded state, verify it matches the incidence predicate under the selected automorphism.

### 7.2 PCG Pair-Cover check

For each triple event `(a,b,c)` that the decoded state asserts/observes:

- verify that at least one of the pairs lies on a common line in the appropriate plane (per your two-plane partition when using the 1–14 lottery construction).

If you’re using the 14-number construction, add a boundary parameter:

```json
"boundary_params": {
  "pcg": {
    "planes": [
      {"name": "P0", "labels": [1,2,3,4,5,6,7]},
      {"name": "P1", "labels": [8,9,10,11,12,13,14]}
    ]
  }
}
```

---

## 8. Paper-Ready Formal Semantics (Minimal)

You can quote this in the paper as your formal model:

### 8.1 Operational Semantics

Let `Env` map references to values.

- **Define encoder**
  - `Env[enc:E] := (poly_form, coeffs, ring, basis_dim)`

- **Apply encoder**
  - `x := Env[ref:x]`
  - `y := Eval(poly_form, coeffs, x)`
  - `Env[state:encoded:t] := y`

- **Decode+validate**
  - `(d, π) := Decode(Env[state:encoded:t], Boundary)`
  - `assert Checks(d, Boundary)`
  - `Env[state:decoded:t] := d`
  - `Env[proof:valid:t] := π`

A trace is accepted iff no assertion fails.

---

## 9. One Complete Minimal Trace Example (3 lines)

```jsonl
{"id":"enc-0","phase":0,"boundary":"FANO-v1","anchor":"commit:abc123","op":"define_encoder","encoder_id":"E.local.1","ring":"Z","basis_dim":8,"poly_form":"affine","coeffs":{"A":"ref:matrix:A0","b":"ref:vector:b0"},"inputs":[],"outputs":["enc:E.local.1"]}
{"id":"step-1","phase":1,"boundary":"FANO-v1","anchor":"commit:abc123","op":"apply_encoder","encoder_ref":"enc:E.local.1","vars":{"x":"ref:state_vector:t1"},"evaluation":{"mode":"deterministic","precision":"exact"},"inputs":["enc:E.local.1","ref:state_vector:t1"],"outputs":["state:encoded:t1"]}
{"id":"step-2","phase":2,"boundary":"FANO-v1","anchor":"commit:abc123","op":"decode_and_validate","decoder":{"mode":"boundary_relative","strategy":"canonical_under_automorphism"},"target":"state:encoded:t1","checks":["schema","boundary_id_match","automorphism_match","fano_incidence","pcg_pair_cover"],"inputs":["state:encoded:t1"],"outputs":["state:decoded:t1","proof:valid:t1"]}
```

This is enough to be “authoritative” because it defines:
- what a step is
- what determinism means
- how validation happens
- how FANO/PCG is applied

---

## 10. Recommended Naming in the Paper

To avoid crypto confusion, call the “keypair”:

- **Local Encoder Parameters** (coefficients)
- **Boundary-Relative Decoder** (canonical decode under automorphism)

If you later *also* add cryptographic signing, it becomes a separate layer:
- signatures attach to JSONL lines or commits
- but do not change CanvasL semantics

---

If you want, I can also produce the **extended JSON Schema** that validates these three record types (with `oneOf` branches per `op`), plus a short “Method” section text you can paste directly into the whitepaper describing CanvasL-POLY in academic style.

---

## You

Yes

---

## ChatGPT

Great — below is **exactly what you need to make this paper authoritative**:

1. **An extended, machine-checkable CanvasL JSON Schema** (with `oneOf` per operation)
2. **A publication-ready “Methods” section** you can paste directly into the whitepaper

Nothing speculative, nothing informal. This locks the execution model.

---
