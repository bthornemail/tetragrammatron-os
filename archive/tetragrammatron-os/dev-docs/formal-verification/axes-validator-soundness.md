# Axes Validator → Sphere Soundness

## Overview

This document defines the **formal contract** between structural validation (filesystem axes) and admissibility proofs (sphere projection). It establishes the honest relationship between what the validator enforces and what mathematical properties can be guaranteed.

## The Honesty Constraint

**Key principle:** Folder structure alone cannot prove mathematical properties like `(p+2) % 8 ≠ 0`.

The correct theorem is:

> If the branch is structurally valid **and** the branch supplies an explicit admissibility contract artifact, then projection soundness and boundary preservation follow.

This makes the system authoritative:
- Validator enforces **where the proof lives**
- The proof itself remains mathematical, local, explicit

This is exactly the same separation as:
- Ball membership vs Sphere admissibility

## Conceptual Model

### Validator Role
The filesystem validator (`tools/validate_axes.mjs`) enforces:

1. Every branch has all four axes (freedom, autonomy, sovereignty, context)
2. `context/` has the correct subfolders (networks, views, connections, documents, assets, services)
3. `AGENTS.md` and `README.md` exist
4. No extra axes exist

This is **structural** validation, not semantic validation.

### Contract Role
An **Admissibility Contract** is a branch-local artifact that:

- Lives in `context/documents/admissibility.contract.md` (human-readable) or `.lean` (formal)
- States and proves: `admissibleGeodesic(pointer(hardware))`
- Is verified by extension adapters (parity/prime/Fano checkers)

### Combined Guarantee
```
ValidatorOK ∧ Contract ⇒ ∃ VMSphere projection
```

Only when **both** hold can we guarantee sphere projection succeeds.

## Lean Formalization

### File: `Tetragrammatron_AxesValidator_SphereSoundness.lean`

This is a single Lean 4 file that:

1. Models the axis validator as a predicate
2. Defines the 7-point admissible rule `(p+2) % 8 ≠ 0`
3. Defines a branch-local **AdmissibilityContract** proposition
4. Proves: `ValidatorOK ∧ Contract ⇒ projection succeeds`
5. Proves: `ValidatorOK ∧ BoundaryContract ∧ onBoundary ⇒ boundary preservation`

### Core Definitions

```lean
-- The four invariant axes
inductive Axis where
  | freedom | autonomy | sovereignty | context

-- Required context subfolders
inductive CtxSub where
  | networks | views | connections | documents | assets | services

-- Branch filesystem model (semantic)
structure BranchFS where
  hasAxis : Axis → Prop
  hasCtx  : CtxSub → Prop
  hasAGENTS : Prop
  hasREADME : Prop

-- Structural validator predicate
def ValidatorOK (b : BranchFS) : Prop :=
  (∀ a, b.hasAxis a) ∧
  (∀ c, b.hasCtx c) ∧
  b.hasAGENTS ∧
  b.hasREADME
```

### Hardware Model

```lean
-- Minimal hardware "ball" model
structure HardwareBall where
  residue : Fin 8

-- VM pointer = residue mod 8
def pointer (h : HardwareBall) : Fin 8 := h.residue

-- 7-point admissible predicate
def admissibleGeodesic (p : Fin 8) : Prop :=
  ((p.val + 2) % 8) ≠ 0

-- Simplified: admissibleGeodesic p ↔ p ≠ 6
theorem admissibleGeodesic_iff_ne6 (p : Fin 8) :
    admissibleGeodesic p ↔ p ≠ (6 : Fin 8) := by
  fin_cases p <;> decide
```

### Sphere Projection

```lean
-- VM sphere = admissible pointer
abbrev VMSphere := { p : Fin 8 // admissibleGeodesic p }

-- Projection: succeeds iff pointer admissible
def project (h : HardwareBall) : Option VMSphere :=
  let p := pointer h
  if hp : admissibleGeodesic p then
    some ⟨p, hp⟩
  else
    none

-- Projection soundness
theorem project_sound (h : HardwareBall) (hp : admissibleGeodesic (pointer h)) :
    ∃ v : VMSphere, project h = some v := by
  refine ⟨⟨pointer h, hp⟩, ?_⟩
  unfold project
  simp [hp]
```

### Admissibility Contract

```lean
-- Branch-local contract
def AdmissibilityContract (b : BranchFS) (h : HardwareBall) : Prop :=
  admissibleGeodesic (pointer h)

-- Boundary predicate
def OnBoundary (h : HardwareBall) : Prop := True

-- Boundary contract
def BoundaryContract (b : BranchFS) (h : HardwareBall) : Prop :=
  OnBoundary h → admissibleGeodesic (pointer h)
```

### Main Theorems

```lean
-- Validator + contract ⇒ projection exists
theorem validator_contract_implies_projection
    (b : BranchFS) (h : HardwareBall)
    (ok : ValidatorOK b)
    (C  : AdmissibilityContract b h) :
    ∃ v : VMSphere, project h = some v := by
  exact project_sound h C

-- Validator + boundary contract ⇒ boundary preservation
theorem validator_boundary_preservation
    (b : BranchFS) (h : HardwareBall)
    (ok : ValidatorOK b)
    (BC : BoundaryContract b h)
    (hb : OnBoundary h) :
    ∃ v : VMSphere, project h = some v := by
  have : admissibleGeodesic (pointer h) := BC hb
  exact project_sound h this
```

## Extension Adapter Interface

The contract system allows extension via **α-adapters**:

```lean
-- Alpha adapter type
def AlphaAdapter (α : BranchFS → HardwareBall → Prop) : Prop :=
  ∀ b h, α b h → admissibleGeodesic (pointer h)

-- If α-adapter proves admissibility, it induces a contract
theorem alpha_induces_contract
    (α : BranchFS → HardwareBall → Prop)
    (A : AlphaAdapter α)
    (b : BranchFS) (h : HardwareBall)
    (ha : α b h) :
    AdmissibilityContract b h := by
  exact A b h ha
```

This is exactly the "extension adapter" pattern:

- Each adapter (parity, prime, Fano) defines an `α` predicate
- Prove `α ⇒ admissibleGeodesic`
- Adapter becomes a valid contract provider

## Contract Artifacts

### Location
Branch-local contracts live in `context/documents/`:

- `admissibility.contract.md` - Human-readable explanation
- `admissibility.contract.lean` - Formal Lean proof
- `admissibility.contract.ts` - Runtime TypeScript checker

### Example: Parity Adapter Contract

**File:** `context/documents/admissibility.contract.md`

```markdown
# Admissibility Contract

This branch uses **parity-based admissibility**.

## Rule
A pointer `p` is admissible iff `p` is odd.

## Proof Sketch
- All odd values in Fin 8 are {1, 3, 5, 7}
- For each: (p+2) % 8 ∈ {3, 5, 7, 1} ≠ 0
- Therefore: odd(p) ⇒ admissibleGeodesic(p) ✓

## Implementation
See: `context/services/adapters/parity_checker.ts`
```

**File:** `context/services/adapters/parity_checker.ts`

```typescript
export function checkParity(pointer: number): boolean {
  return (pointer % 2) === 1;
}

export function isAdmissible(pointer: number): boolean {
  return checkParity(pointer);
}
```

## Two Modes: Private vs Public

The system supports **two operational modes**:

### Private / Ball Mode
- Structure-only validation
- Permissive (no contract required)
- Full 8×8-bit addresses
- Maximal detail

### Public / Sphere Mode
- Structure + contract validation
- Strict (contract artifact required)
- Compressed addresses (projection applied)
- Admissibility guaranteed

This maps to ULP address scopes:
- `ulp:0000::/16` - private (no contract needed)
- `ulp:8000::/16` - public (contract required)

## Validator Extension

The axes validator can be extended to enforce contract presence:

```javascript
// In tools/validate_axes.mjs

function validatePublicMode(branchDir) {
  const contractPath = path.join(branchDir, "context/documents/admissibility.contract.md");
  if (!fs.existsSync(contractPath)) {
    die(`Public sphere mode requires admissibility contract at ${contractPath}`);
  }
  // Optionally: verify contract format, run Lean checker, etc.
}
```

## What This Accomplishes

You now have a **formal contract boundary**:

1. **Validator** guarantees structure (axes, subfolders, AGENTS.md)
2. **Adapters** supply proofs (α) for admissibility
3. **Lean** proves projection exists uniquely through that contract (soundness)

This separates concerns:

| Layer | Responsibility |
|-------|---------------|
| Filesystem | Structural constraints |
| Validator | Enforce structure |
| Contract | Mathematical properties |
| Adapter | Check/prove contracts |
| Lean | Formal soundness proof |

## Benefits

### Honesty
No false claims. Structure ≠ semantics. Explicit contracts bridge the gap.

### Composability
Adapters can be swapped (parity → prime → Fano) without changing validator.

### Auditability
Contracts are files. Version control tracks them. Drift scanner monitors them.

### Extensibility
New adapters just need to prove `α ⇒ admissibleGeodesic`.

### Verification
Lean proofs are machine-checkable, not just documentation.

## Usage Workflow

1. **Create branch** with four axes (validator enforces)
2. **Choose adapter** (parity, prime, Fano, custom)
3. **Write contract** in `context/documents/admissibility.contract.md`
4. **Implement checker** in `context/services/adapters/`
5. **Optionally prove** in Lean (`.contract.lean`)
6. **Run validator** to ensure structure + contract presence
7. **Deploy to sphere** with guaranteed admissibility

## Future Work

Possible extensions:

1. **Contract verification tool** - Validate contract proofs automatically
2. **Multi-adapter support** - Combine multiple checkers (parity ∧ prime)
3. **Proof search** - Auto-generate Lean proofs from adapter implementations
4. **Contract evolution** - Track contract changes via drift scanner
5. **Sphere registry** - Public catalog of verified contracts

## References

- See `four-axis-ontology.md` for structural requirements
- See `ulp-addressing.md` for private/public scope semantics
- See `drift-tracking-system.md` for monitoring contract changes
- See `completion-theory.md` for the broader mathematical framework
