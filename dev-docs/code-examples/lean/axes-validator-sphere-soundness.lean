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
