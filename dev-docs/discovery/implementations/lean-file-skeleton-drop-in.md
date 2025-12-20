# Lean File Skeleton (drop-in)

Create: `proof/RFC0012_FoldVM.lean`

```lean
import Std

namespace CanvasL

/-- Abstract canonical bytes (for determinism claims). -/
abbrev Bytes := List UInt8

/-- Ring is fixed to F₂[x] in implementation; in proof we model ops abstractly. -/
structure Poly where
  repr : Bytes

/-- Canonicalization function. In implementation: CLBC-POLY normalize + canonical encode. -/
def canon (p : Poly) : Poly := p  -- placeholder

/-- Meet/join as lattice operators (implementation: gcd/lcm on canonical polys). -/
def meet (a b : Poly) : Poly := a -- placeholder
def join (a b : Poly) : Poly := a -- placeholder

/-- Fano projection result. Could be triad-set + reduced poly, modeled abstractly. -/
structure FanoProj where
  poly  : Poly
  triads : Bytes

def proj_fano (p : Poly) : FanoProj :=
  { poly := p, triads := [] } -- placeholder

/-- Predicate that triads are valid (incidence constraint). -/
def fano_valid (t : Bytes) : Prop := True

/-- VM instruction model (subset). -/
inductive Op
| CANON | MEET | JOIN | PROJ_FANO | ASSERT_IDEMP | COMMIT | EMIT_GEOM
deriving Repr, DecidableEq

/-- JSONL IR event model (semantics-level). -/
structure IREvent where
  op : Op
  a  : Nat := 0
  b  : Nat := 0
  dst : Nat := 0

/-- Bytecode instruction model (semantics-level). -/
structure Inst where
  op : Op
  ra : Nat := 0
  rb : Nat := 0
  rd : Nat := 0

/-- Compiler: IR → bytecode (must be deterministic). -/
def assemble (ir : List IREvent) : List Inst :=
  ir.map (fun e => { op := e.op, ra := e.a, rb := e.b, rd := e.dst })

/-- === Theorems (to be proven against real definitions) === -/

theorem canon_idempotent (p : Poly) :
  canon (canon p) = canon p := by
  rfl  -- replace with real proof once canon is defined

theorem proj_idempotent (p : Poly) :
  (proj_fano (proj_fano p).poly) = proj_fano p := by
  -- once proj_fano is defined, prove triads and poly stable
  rfl

theorem meet_comm (a b : Poly) :
  meet a b = meet b a := by
  rfl

theorem join_comm (a b : Poly) :
  join a b = join b a := by
  rfl

/-- Determinism: assemble is a function. (Trivial here; important once bytes are emitted.) -/
theorem assemble_deterministic (ir : List IREvent) :
  assemble ir = assemble ir := by rfl

/-- Safety: projected triads must satisfy fano_valid. -/
theorem proj_fano_valid (p : Poly) :
  fano_valid (proj_fano p).triads := by
  trivial

end CanvasL
```

This is a skeleton: replace placeholders with your real `canon/gcd/lcm` defs and theorems become nontrivial but structured.

---
