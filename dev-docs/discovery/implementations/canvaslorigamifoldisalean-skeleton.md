# `CanvasL/Origami/FoldISA.lean` (skeleton)

```lean
/-
CanvasL Origami Fold ISA
========================

Goal:
- Treat each origami fold axiom (Huzita–Hatori) as an instruction that
  emits a *constraint polynomial* in some ring.
- VM-level meet/join = gcd/lcm on emitted constraints.
- Determinism: canonical encoding + normalization idempotence.

This file is intentionally skeletal: the “hard math” is isolated behind
small interfaces so you can swap in your actual Poly/CLBC library later.
-/

namespace CanvasL
namespace Origami

/-- Minimal 2D point (renderer uses actual coords; VM can stay symbolic). -/
structure Point where
  x : Int
  y : Int
deriving DecidableEq, Repr

/-- Line in ax + by + c = 0 form (integer-normalized in VM). -/
structure Line where
  a : Int
  b : Int
  c : Int
deriving DecidableEq, Repr

/-- A crease is a line; we keep it separate for clarity. -/
abbrev Crease := Line

/-
Constraint Polynomial Interface
-------------------------------
Replace this with your actual F₂[x] / CLBC polynomial type, or
a symbolic constraint object that can be compiled into CLBC-POLY bytes.
-/

/-- Abstract constraint object (to be refined to `f2poly_t` / CLBC bytes). -/
structure Constraint where
  tag   : Nat        -- kind identifier (helps canonicalization)
  bytes : ByteArray  -- canonical payload (already normalized)
deriving DecidableEq, Repr

/-- Deterministic “meet” operator = gcd (placeholder). -/
def constraintMeet (c₁ c₂ : Constraint) : Constraint :=
  -- TODO: wire to `f2poly_gcd` over decoded CLBC-POLY
  if c₁ == c₂ then c₁ else { tag := 0, bytes := #[] }

/-- Deterministic “join” operator = lcm (placeholder). -/
def constraintJoin (c₁ c₂ : Constraint) : Constraint :=
  -- TODO: wire to `f2poly_lcm` over decoded CLBC-POLY
  if c₁ == c₂ then c₁ else { tag := 1, bytes := c₁.bytes ++ c₂.bytes }

/-- Normalization is idempotent (crucial for determinism). -/
axiom normalize : Constraint → Constraint
axiom normalize_idem : ∀ c, normalize (normalize c) = normalize c

/-
Fold Axioms (Huzita–Hatori)
---------------------------
We define the axioms as *constructors* with explicit operands.
You can later refine Point/Line to projective types, add optional fields, etc.
-/
inductive FoldAxiom : Type
| A1_throughPoints   (p₁ p₂ : Point) : FoldAxiom
| A2_bisectPoints     (p₁ p₂ : Point) : FoldAxiom
| A3_mapLineToLine    (ℓ₁ ℓ₂ : Line)  : FoldAxiom
| A4_perpThroughPoint (p : Point) (ℓ : Line) : FoldAxiom
| A5_mapPointToLine   (p : Point) (ℓ : Line) : FoldAxiom
| A6_cubicFold        (p₁ : Point) (ℓ₁ : Line) (p₂ : Point) (ℓ₂ : Line) : FoldAxiom
| A7_mapPointToLineThroughPoint (p : Point) (ℓ : Line) (q : Point) : FoldAxiom
deriving DecidableEq, Repr

/-
ISA Layer
---------
We map each FoldAxiom directly to an opcode with fixed operands.
Encoding/decoding is separate (your assembler will do it).
-/

/-- Register indices for a tiny VM (u8 is enough). -/
abbrev Reg := UInt8

/-- Operand refs: points/lines are stored in a VM object table and referenced by id. -/
abbrev ObjId := UInt16

/-- Opcodes for CLBC-ISA (origami extension). -/
inductive OpCode : Type
| NOP
| LOAD_POINT (dst : Reg) (pid : ObjId)
| LOAD_LINE  (dst : Reg) (lid : ObjId)

/- Fold emitters: write constraint into dst register (or a constraint table). -/
| FOLD_A1 (dst : Reg) (p1 : ObjId) (p2 : ObjId)
| FOLD_A2 (dst : Reg) (p1 : ObjId) (p2 : ObjId)
| FOLD_A3 (dst : Reg) (l1 : ObjId) (l2 : ObjId)
| FOLD_A4 (dst : Reg) (p  : ObjId) (l  : ObjId)
| FOLD_A5 (dst : Reg) (p  : ObjId) (l  : ObjId)
| FOLD_A6 (dst : Reg) (p1 : ObjId) (l1 : ObjId) (p2 : ObjId) (l2 : ObjId)  -- cubic
| FOLD_A7 (dst : Reg) (p  : ObjId) (l  : ObjId) (q  : ObjId)

/- Lattice ops on constraints (your “Fano / idempotence core”). -/
| MEET_GCD (dst : Reg) (a : Reg) (b : Reg)
| JOIN_LCM (dst : Reg) (a : Reg) (b : Reg)
| NORM     (dst : Reg) (a : Reg)

/- Optional: assertions for dynamic proof runs on device. -/
| ASSERT_EQ (a : Reg) (b : Reg)
deriving DecidableEq, Repr

/-
VM State + Semantics
--------------------
We keep object table separate from constraint registers.
-/

/-- VM “objects”: points/lines live here, referenced by ObjId. -/
inductive Obj : Type
| point (p : Point)
| line  (l : Line)
deriving DecidableEq, Repr

structure VMState where
  objs  : ObjId → Option Obj
  regs  : Reg → Constraint
deriving Repr

/-- Lookup helpers. -/
def getPoint (st : VMState) (id : ObjId) : Option Point :=
  match st.objs id with
  | some (Obj.point p) => some p
  | _ => none

def getLine (st : VMState) (id : ObjId) : Option Line :=
  match st.objs id with
  | some (Obj.line l) => some l
  | _ => none

/-
Constraint Compilation (Axiom → Constraint)
-------------------------------------------
This is where you map geometry to polynomials.
For A6, this MUST produce a cubic constraint object (tagged).
-/

/-- Emit constraint for a fold axiom (canonicalized). -/
def compileFold : FoldAxiom → Constraint
| FoldAxiom.A1_throughPoints p₁ p₂ =>
    normalize { tag := 101, bytes := #[] }  -- TODO encode (p₁,p₂)
| FoldAxiom.A2_bisectPoints p₁ p₂ =>
    normalize { tag := 102, bytes := #[] }
| FoldAxiom.A3_mapLineToLine ℓ₁ ℓ₂ =>
    normalize { tag := 103, bytes := #[] }
| FoldAxiom.A4_perpThroughPoint p ℓ =>
    normalize { tag := 104, bytes := #[] }
| FoldAxiom.A5_mapPointToLine p ℓ =>
    normalize { tag := 105, bytes := #[] }
| FoldAxiom.A6_cubicFold p₁ ℓ₁ p₂ ℓ₂ =>
    -- IMPORTANT: tag identifies “cubic eliminant” constraint.
    normalize { tag := 106, bytes := #[] }
| FoldAxiom.A7_mapPointToLineThroughPoint p ℓ q =>
    normalize { tag := 107, bytes := #[] }

/-- Execute one opcode step (partial; extend as needed). -/
def step : OpCode → VMState → VMState
| OpCode.NOP, st => st
| OpCode.FOLD_A6 dst p1 l1 p2 l2, st =>
    match getPoint st p1, getLine st l1, getPoint st p2, getLine st l2 with
    | some P1, some L1, some P2, some L2 =>
        let c := compileFold (FoldAxiom.A6_cubicFold P1 L1 P2 L2)
        { st with regs := fun r => if r == dst then c else st.regs r }
    | _, _, _, _ => st
| OpCode.MEET_GCD dst a b, st =>
    let c := constraintMeet (st.regs a) (st.regs b)
    { st with regs := fun r => if r == dst then normalize c else st.regs r }
| OpCode.JOIN_LCM dst a b, st =>
    let c := constraintJoin (st.regs a) (st.regs b)
    { st with regs := fun r => if r == dst then normalize c else st.regs r }
| OpCode.NORM dst a, st =>
    { st with regs := fun r => if r == dst then normalize (st.regs a) else st.regs r }
| _, st => st

/-
Key proof obligations you’ll want next:
- NORM is idempotent
- MEET/JOIN are commutative/associative (up to normalization)
- A6 emits “cubic-tagged” constraints; and consensus is gcd/lcm stable
-/

theorem norm_idem_reg (st : VMState) (r : Reg) :
  normalize (normalize (st.regs r)) = normalize (st.regs r) := by
  simpa using normalize_idem (st.regs r)

end Origami
end CanvasL
```

---
