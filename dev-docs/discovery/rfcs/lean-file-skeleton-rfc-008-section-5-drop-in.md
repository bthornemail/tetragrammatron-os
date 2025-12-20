# Lean file skeleton: RFC-008 Section 5 (drop-in)

Save as: `CanvasL/Proofs/RFC008_Section5_Fano.lean`

```lean
/-
RFC-008 Section 5: Universal Folding Normal Form

This file is a *skeleton* intended to be completed against your existing Poly / CLBC libs.
It establishes:

1) A projection Π_Fano : State → Fano
2) Idempotence: Π_Fano (Π_Fano s) = Π_Fano s
3) Fold invariance: Π_Fano (fold ax s) = Π_Fano s

You can later strengthen "fold invariance" to cover specific opcodes / axioms.
-/

import Std

namespace CanvasL

/-- Placeholder: replace with your canonical constraint/state type (e.g., normalized F₂[x] poly state). -/
opaque State : Type

/-- Placeholder: your canonicalization function. -/
opaque canon : State → State

/-- Canon idempotence (REQUIRED). Prove from your existing canon proofs. -/
axiom canon_idem : ∀ s : State, canon (canon s) = canon s

/-- Enumerate origami axioms (Huzita–Hatori). -/
inductive FoldAxiom : Type
| A1 | A2 | A3 | A4 | A5 | A6 | A7
deriving DecidableEq, Repr

/-- Placeholder: VM fold operator (axiom + state + (optional) context inputs). -/
opaque fold : FoldAxiom → State → State

/-- The Fano-normal-form carrier.
    You can make this a structure with 7 points/7 lines, or a compact canonical token. -/
opaque FanoNF : Type

/-- Π_Fano: canonical Fano projection.
    Implement as "extract incidence classes + canon + pack 7/7". -/
opaque projFano : State → FanoNF

/-- RFC-008 §5.1 (1) Idempotence. REQUIRED. -/
axiom projFano_idem : ∀ s : State, projFano (canon s) = projFano (canon (canon s))

/-
Better, once you implement projFano on canonical states:

axiom projFano_idem_strong : ∀ s : State, projFano (projFano_as_state s) = projFano s
…but that requires representing FanoNF back into State.
-/

/-- RFC-008 §5.1 (2) Fold Invariance. REQUIRED.
    Statement: projection after fold equals projection before fold (in canonical domain). -/
axiom projFano_fold_invariant :
  ∀ (ax : FoldAxiom) (s : State),
    projFano (canon (fold ax (canon s))) = projFano (canon s)

/-- A convenient derived lemma: Π_Fano is idempotent on canonical states. -/
theorem projFano_idempotent_on_canon :
  ∀ s : State, projFano (canon (canon s)) = projFano (canon s) := by
  intro s
  -- rewrite using canon_idem and projFano_idem (as stated)
  have hc : canon (canon s) = canon s := canon_idem s
  -- from projFano_idem: projFano (canon s) = projFano (canon (canon s))
  have hp : projFano (canon s) = projFano (canon (canon s)) := projFano_idem s
  -- rearrange
  simpa [hc] using hp.symm

/-- RFC-009 barrier correctness lemma:
    After a fold, projecting yields the same normal form. -/
theorem barrier_after_fold :
  ∀ (ax : FoldAxiom) (s : State),
    projFano (canon (fold ax (canon s))) = projFano (canon s) := by
  intro ax s
  exact projFano_fold_invariant ax s

end CanvasL
```

**How you’ll “make it real”:**
- Replace `opaque State` with your real `PolyState` / `CLBCState`.
- Replace `canon` with your proven normalizer.
- Implement `FanoNF` as a finite structure (7 points / 7 lines) or compact encoding.
- Replace `axiom` lines with actual theorems from your `CanvasL_Lean_Idempotence_Proof.zip` and codec proof zip.

---
