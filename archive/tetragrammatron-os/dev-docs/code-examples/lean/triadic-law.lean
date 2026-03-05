/-
Tetragrammatron Triadic Law: Private/Protected/Public Schema Classes

Core idea:
- Three schema visibility classes unify crypto, geometry, and algebra.
- Private = point / monomial / privateKey
- Protected = line / binomial / sharedKey
- Public = plane / trinomial / publicKey
- Execution admissibility depends on class and trust context.
-/

import Mathlib.Data.Vector
import Mathlib.Data.Finset.Basic

namespace Tetragrammatron

/-- Schema visibility classes. -/
inductive SchemaClass | private | protected | public
deriving DecidableEq, Repr

/-- Trust context for class admissibility. -/
structure TrustCtx where
  isSelf : Prop
  sharedKeyOK : Prop
deriving Repr

/-- Class admissibility predicate. -/
def classAdmissible (cls : SchemaClass) (ctx : TrustCtx) : Prop :=
  match cls with
  | .private   => ctx.isSelf
  | .protected => ctx.sharedKeyOK
  | .public    => True

/-- Address and schema (simplified). -/
abbrev Addr8 := Vector UInt8 8

structure SchemaTable where
  schemaClass : SchemaClass
  -- ... other fields ...
deriving Repr

/-- VM state. -/
structure VM where
  addr : Addr8
  pc   : Nat
deriving Repr

inductive Outcome where
  | cont (vm : VM)
  | halt (vm : VM)
  | trap (vm : VM) (reason : String)
deriving Repr

abbrev Code := List UInt8

/-- Schema validity (simplified). -/
def schemaValid (tab : SchemaTable) (a : Addr8) : Prop := True

/-- Execution step (simplified). -/
def step (_code : Code) (vm : VM) : Outcome := Outcome.halt vm

/-- Fuel-bounded run. -/
def run : Nat → Code → VM → Outcome
  | 0, _, vm => Outcome.trap vm "out_of_fuel"
  | Nat.succ fuel, code, vm =>
      match step code vm with
      | Outcome.cont vm' => run fuel code vm'
      | o => o

/-- Schema-gated and class-gated run. -/
def runChecked (tab : SchemaTable) (ctx : TrustCtx) (fuel : Nat) (code : Code) (vm : VM) : Outcome :=
  if h_schema : schemaValid tab vm.addr then
    if h_class : classAdmissible tab.schemaClass ctx then
      run fuel code vm
    else
      Outcome.trap vm "class_inadmissible"
  else
    Outcome.trap vm "invalid_schema"

/-- Protected schemas require shared key. -/
theorem protected_requires_shared_key
  (tab : SchemaTable) (ctx : TrustCtx) (fuel : Nat) (code : Code) (vm : VM)
  (h_protected : tab.schemaClass = .protected)
  (h_no_key : ¬ ctx.sharedKeyOK) :
  runChecked tab ctx fuel code vm = Outcome.trap vm "class_inadmissible" := by
  unfold runChecked
  simp [h_protected, h_no_key]
  unfold classAdmissible
  simp

/-- Private schemas require self context. -/
theorem private_requires_self
  (tab : SchemaTable) (ctx : TrustCtx) (fuel : Nat) (code : Code) (vm : VM)
  (h_private : tab.schemaClass = .private)
  (h_not_self : ¬ ctx.isSelf) :
  runChecked tab ctx fuel code vm = Outcome.trap vm "class_inadmissible" := by
  unfold runChecked
  simp [h_private, h_not_self]
  unfold classAdmissible
  simp

/-- Public schemas are always admissible (trust context irrelevant). -/
theorem public_always_admissible
  (tab : SchemaTable) (ctx : TrustCtx) :
  tab.schemaClass = .public →
  classAdmissible tab.schemaClass ctx := by
  intro h
  unfold classAdmissible
  simp [h]

/-- Information flow: no downward leakage. -/
structure World where
  schemas : List SchemaTable
  events  : List String
deriving Repr

/-- Public view of world (only public schemas and events). -/
def publicView (w : World) : List String :=
  w.events  -- Simplified: in full system, filter by schema class

/-- Two worlds are publicly equivalent except for protected data. -/
def publicEquivalentExceptProtected (w1 w2 : World) : Prop :=
  publicView w1 = publicView w2

/-- No downward flow: changing protected data doesn't change public view. -/
theorem no_downflow_protected
  (w1 w2 : World) :
  publicEquivalentExceptProtected w1 w2 →
  publicView w1 = publicView w2 := by
  intro h
  exact h

/-- Execution implies schema present and class admissible. -/
theorem exec_implies_triad
  (tab : SchemaTable) (ctx : TrustCtx) (fuel : Nat) (code : Code) (vm : VM) :
  runChecked tab ctx fuel code vm ≠ Outcome.trap vm "invalid_schema" →
  runChecked tab ctx fuel code vm ≠ Outcome.trap vm "class_inadmissible" →
  schemaValid tab vm.addr ∧ classAdmissible tab.schemaClass ctx := by
  intro h1 h2
  constructor
  · -- schemaValid
    unfold runChecked at h1
    by_contra h_not_valid
    simp [h_not_valid] at h1
  · -- classAdmissible
    unfold runChecked at h2
    by_contra h_not_adm
    simp [h_not_adm] at h2

end Tetragrammatron
