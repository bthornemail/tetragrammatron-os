4 [[file:../../../AGENT.org::*Lean: formal schema gate (invalid schema cannot execute)][Lean: formal schema gate (invalid schema cannot execute):1]]
namespace Tetragrammatron

abbrev Addr8 := Vector UInt8 8

/-- Schema table is data: fixed rows + allowed sets. -/
structure SchemaTable where
  fixed   : Fin 8 → Bool
  allowed : Fin 8 → Finset UInt8

/-- Schema-valid means: for i∈{0..4}, if fixed then byte is in allowed. -/
def schemaValid (tab : SchemaTable) (a : Addr8) : Prop :=
  ∀ i : Fin 5,
    tab.fixed ⟨i.val, by
      -- i.val < 5 < 8
      exact lt_trans i.isLt (by decide)⟩ = true →
    a.get ⟨i.val, by exact lt_trans i.isLt (by decide)⟩ ∈
      tab.allowed ⟨i.val, by exact lt_trans i.isLt (by decide)⟩

/-- Minimal VM state for the gate theorem. Extend later. -/
structure VM where
  addr : Addr8
  pc   : Nat

inductive Outcome where
  | cont (vm : VM)
  | halt (vm : VM)
  | trap (vm : VM) (reason : String)

abbrev Code := List UInt8

/-- One-step placeholder (your real CanISA semantics plugs in here). -/
def step (_code : Code) (vm : VM) : Outcome :=
  Outcome.halt vm

def run : Nat → Code → VM → Outcome
  | 0, _, vm => Outcome.trap vm "out_of_fuel"
  | Nat.succ fuel, code, vm =>
      match step code vm with
      | Outcome.cont vm' => run fuel code vm'
      | o => o

/-- Gate: invalid schema traps before any stepping. -/
def runChecked (tab : SchemaTable) (fuel : Nat) (code : Code) (vm : VM) : Outcome :=
  if h : schemaValid tab vm.addr then
    run fuel code vm
  else
    Outcome.trap vm "invalid_schema"

theorem invalid_schema_no_execute (tab : SchemaTable) (fuel : Nat) (code : Code) (vm : VM)
    (hbad : ¬ schemaValid tab vm.addr) :
    runChecked tab fuel code vm = Outcome.trap vm "invalid_schema" := by
  unfold runChecked
  simp [hbad]

theorem valid_schema_exec (tab : SchemaTable) (fuel : Nat) (code : Code) (vm : VM)
    (hgood : schemaValid tab vm.addr) :
    runChecked tab fuel code vm = run fuel code vm := by
  unfold runChecked
  simp [hgood]

end Tetragrammatron
4 Lean: formal schema gate (invalid schema cannot execute):1 ends here
