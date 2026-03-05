# Admissibility Contracts

**Extracted from:** CONVERSATION.md (lines 24386-24594)

## Overview

Admissibility contracts establish the formal boundary between structural validation and semantic admissibility. The key principle is that **folder structure alone cannot prove admissibility** - explicit contracts are required.

## Key Honesty Constraint

> If the branch is structurally valid **and** the branch supplies an explicit admissibility contract artifact, then projection soundness and boundary preservation follow.

This makes the system authoritative:
- Validator enforces **where the proof lives**
- The proof itself remains mathematical, local, explicit

This is exactly the same separation as:
- Ball membership vs Sphere admissibility

## Lean 4 Implementation

### `Tetragrammatron_AxesValidator_SphereSoundness.lean`

```lean
import Mathlib.Data.Fin.Basic
import Mathlib.Data.Nat.Basic
import Mathlib.Data.List.Basic

/-!
# Tetragrammatron — Axes Validator → Sphere Soundness (Contract Form)

This file is the *honest* normalization bridge:

- The filesystem validator enforces structure (axes + context subfolders).
- The *admissibility* of VM projection is not derivable from structure alone.
- Therefore we model admissibility as an explicit **branch-local contract**.

Theorems prove:
  (ValidatorOK ∧ Contract) ⇒ ∃ VM sphere projection (soundness)
  (ValidatorOK ∧ Contract ∧ Boundary) ⇒ boundary preservation
-/

namespace Tetragrammatron

/-- The four invariant axes. -/
inductive Axis where
  | freedom | autonomy | sovereignty | context
deriving DecidableEq, Repr

/-- Required context subfolders (type-level, not strings). -/
inductive CtxSub where
  | networks | views | connections | documents | assets | services
deriving DecidableEq, Repr

/-- A branch directory model. We abstract away actual IO: this is the semantic model
    that your validator enforces in the real repo. -/
structure BranchFS where
  hasAxis : Axis → Prop
  hasCtx  : CtxSub → Prop
  hasAGENTS : Prop
  hasREADME : Prop

/-- Structural validator predicate (what `validate_axes.mjs` enforces). -/
def ValidatorOK (b : BranchFS) : Prop :=
  (∀ a, b.hasAxis a) ∧
  (∀ c, b.hasCtx c) ∧
  b.hasAGENTS ∧
  b.hasREADME

/-! ## Hardware → pointer (sphere/ball core) -/

/-- Minimal hardware "ball" model: we only keep a pointer residue.
    In your full system this is derived from JSONL + canon + projection. -/
structure HardwareBall where
  residue : Fin 8

/-- VM pointer = residue. (In full system: fold/land + mod 8.) -/
def pointer (h : HardwareBall) : Fin 8 := h.residue

/-- Your canonical 7-point admissible predicate:
    admissibleGeodesic p := (p.val + 2) % 8 ≠ 0
-/
def admissibleGeodesic (p : Fin 8) : Prop :=
  ((p.val + 2) % 8) ≠ 0

/-- Key simplification: admissibleGeodesic p ↔ p ≠ 6. -/
theorem admissibleGeodesic_iff_ne6 (p : Fin 8) :
    admissibleGeodesic p ↔ p ≠ (6 : Fin 8) := by
  -- Finite case analysis (0..7).
  fin_cases p <;> decide

/-- VM sphere = admissible pointer. -/
abbrev VMSphere := { p : Fin 8 // admissibleGeodesic p }

/-- Projection: succeeds iff pointer admissible. -/
def project (h : HardwareBall) : Option VMSphere :=
  let p := pointer h
  if hp : admissibleGeodesic p then
    some ⟨p, hp⟩
  else
    none

/-- Projection soundness (direct). -/
theorem project_sound (h : HardwareBall) (hp : admissibleGeodesic (pointer h)) :
    ∃ v : VMSphere, project h = some v := by
  refine ⟨⟨pointer h, hp⟩, ?_⟩
  unfold project
  simp [hp]

/-! ## Branch-local admissibility contract -/

/-- A branch-local contract: in practice this is the statement proven/checked by
    the branch's encoding adapters (parity/prime/Fano, etc.).

    In the repo, this is represented by artifacts under the branch (documents, proofs, rules).
    Here it is a proposition parameterized by BranchFS and HardwareBall. -/
def AdmissibilityContract (b : BranchFS) (h : HardwareBall) : Prop :=
  admissibleGeodesic (pointer h)

/-- Boundary predicate (abstract); in practice: some spec hits min/max, etc. -/
def OnBoundary (h : HardwareBall) : Prop := True

/-- Boundary contract: boundary ⇒ admissible (your "boundary preservation" content). -/
def BoundaryContract (b : BranchFS) (h : HardwareBall) : Prop :=
  OnBoundary h → admissibleGeodesic (pointer h)

/-! ## The theorems you actually want -/

/-- Validator + contract ⇒ projection exists (factors to the VM sphere). -/
theorem validator_contract_implies_projection
    (b : BranchFS) (h : HardwareBall)
    (ok : ValidatorOK b)
    (C  : AdmissibilityContract b h) :
    ∃ v : VMSphere, project h = some v := by
  exact project_sound h C

/-- Validator + boundary contract + boundary ⇒ boundary preservation. -/
theorem validator_boundary_preservation
    (b : BranchFS) (h : HardwareBall)
    (ok : ValidatorOK b)
    (BC : BoundaryContract b h)
    (hb : OnBoundary h) :
    ∃ v : VMSphere, project h = some v := by
  have : admissibleGeodesic (pointer h) := BC hb
  exact project_sound h this

/-!
### Specialization hook (α-adapters)

To specialize "contract" to parity/prime/Fano facts, you define:

- a predicate `α : BranchFS → HardwareBall → Prop`
- and prove `α b h → admissibleGeodesic (pointer h)`

This is exactly your extension-adapter interface.
-/

def AlphaAdapter (α : BranchFS → HardwareBall → Prop) : Prop :=
  ∀ b h, α b h → admissibleGeodesic (pointer h)

/-- If α-adapter proves admissibility, it induces an admissibility contract. -/
theorem alpha_induces_contract
    (α : BranchFS → HardwareBall → Prop)
    (A : AlphaAdapter α)
    (b : BranchFS) (h : HardwareBall)
    (ha : α b h) :
    AdmissibilityContract b h := by
  exact A b h ha

end Tetragrammatron
```

## What This Accomplishes

- **Formal contract boundary**:
  - Validator guarantees structure
  - Adapters supply proofs (α) for admissibility
  - Lean proves projection exists **uniquely through that contract** (soundness)

This matches the "extension adapters" plan exactly.

## Implementation in Repository

Each branch can optionally include:

- `context/documents/admissibility.contract.md` (human readable)
- `context/documents/admissibility.contract.lean` (formal)
- `context/services/adapters/*.ts` (checker)

Validator can be extended to **require** that file for "public sphere mode".

### Two Modes

- **Private / ball mode**: structure-only, permissive
- **Public / sphere mode**: structure + contract required

## Schema Validation Contracts

### Schema Prefix Validation Contract

**Contract:** All addresses must have valid schema prefixes (R0-R4) before any operation.

```lean
def SchemaValidationContract (addr : Addr8) (schema : SchemaTable) : Prop :=
  schemaValid schema addr
```

**Enforcement:**
- Execution requires valid schema prefix
- Routing requires valid schema prefix
- Projection requires valid schema prefix

**Theorem:**
```lean
theorem invalid_schema_no_execute :
  ¬ schemaValid schema addr →
  runChecked fuel code vm = Outcome.trap vm "invalid_schema"
```

### Signature Verification Contract

**Contract:** Protected/public schemas must have valid signatures.

```lean
def SignatureVerificationContract 
  (schema : SchemaTable) 
  (sig : SchemaSignature) 
  (ctx : TrustCtx) : Prop :=
  match schema.schemaClass with
  | .private => True  -- Optional
  | .protected => verifySignature schema.bin sig ctx.sharedKey
  | .public => verifySignature schema.bin sig ctx.publicKey
```

**Enforcement:**
- Protected schemas: Require group key signature
- Public schemas: Require public trust root signature
- Private schemas: Signature optional

**Theorem:**
```lean
theorem protected_requires_signature :
  schema.schemaClass = .protected →
  ¬ verifySignature schema.bin sig ctx.sharedKey →
  rejectSchema schema
```

### Class Admissibility Contract

**Contract:** Schema class must be admissible for trust context.

```lean
def ClassAdmissibilityContract 
  (schema : SchemaTable) 
  (ctx : TrustCtx) : Prop :=
  classAdmissible schema.schemaClass ctx
```

**Enforcement:**
- Private: Requires `ctx.isSelf`
- Protected: Requires `ctx.sharedKeyOK`
- Public: Always admissible

**Theorem:**
```lean
theorem exec_implies_class_admissible :
  executes reg ctx pkt →
  classAdmissible pkt.schemaClass ctx
```

## Combined Execution Contract

The complete execution contract requires all three:

```lean
def ExecutionContract 
  (addr : Addr8) 
  (schema : SchemaTable) 
  (sig : SchemaSignature) 
  (ctx : TrustCtx) : Prop :=
  SchemaValidationContract addr schema ∧
  SignatureVerificationContract schema sig ctx ∧
  ClassAdmissibilityContract schema ctx
```

**Meaning:** Execution can only occur if:
1. Schema prefix is valid
2. Signature is valid (if required)
3. Class is admissible for trust context

## Key Theorems

1. **validator_contract_implies_projection**: Validator + contract ⇒ projection exists
2. **validator_boundary_preservation**: Validator + boundary contract + boundary ⇒ boundary preservation
3. **alpha_induces_contract**: α-adapter proves admissibility ⇒ induces contract
4. **invalid_schema_no_execute**: Invalid schema prefix cannot execute
5. **protected_requires_signature**: Protected schemas require valid signature
6. **exec_implies_class_admissible**: Execution implies class admissibility

## Related Concepts

- [Schema Gate Theorems](./schema-gate-theorems.md) - Formal proofs
- [Triadic Law Proofs](./triadic-law-proofs.md) - Class admissibility proofs
- [Sphere-Ball Model](../architecture/sphere-ball-model.md)
- [Validation System](../architecture/validation-system.md)
- [Architecture: Address Schema](../architecture/address-schema.md)
- [Architecture: Triadic Law](../architecture/triadic-law.md)
- [Adapter Pattern](../implementation-patterns/adapter-pattern.md)

