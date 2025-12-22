/-
Tetragrammatron Address Schema Execution Gate

Core idea:
- Address = 8 bytes.
- Schema prefix = first 5 bytes (R0..R4).
- Only schema-valid prefixes may execute.
- runChecked: pre-checks schema; otherwise returns Trap "invalid_schema" without stepping.

This is the Lean contract: invalid prefix ⇒ no execution.

(Keep instance bytes R5..R7 free.)
-/

import Mathlib.Data.Vector
import Mathlib.Data.Finset.Basic

namespace Tetragrammatron

/-- 8-byte address. -/
abbrev Addr8 := Vector UInt8 8

/-- Extract schema prefix bytes R0..R4. -/
def schemaPrefix5 (a : Addr8) : Vector UInt8 5 :=
  ⟨(List.range 5).map (fun i => a.get ⟨i, by decide⟩),
    by simp⟩

/-- Schema categories (aligned with address-schema.yaml). -/
inductive Realm | local | public | ulp
inductive Ontology | human | device | agent | service | document | constraint | environment
inductive Capability | observe | compute | store | route | decide | attest | transform
inductive Process | batch | stream | consensus | proof | execution | arbitration
inductive Context | private | public | legal | scientific | religious | economic

/-- One canonical schema-decoded address. -/
structure SchemaAddr where
  realm      : Realm
  ontology   : Ontology
  capability : Capability
  process    : Process
  context    : Context
  inst5      : UInt8
  inst6      : UInt8
  inst7      : UInt8

/-- Total decoding for R0..R4. -/
def decodeRealm : UInt8 → Option Realm
  | 0x00 => some .local
  | 0x01 => some .public
  | 0x1A => some .ulp
  | _    => none

def decodeOntology : UInt8 → Option Ontology
  | 0x01 => some .human
  | 0x02 => some .device
  | 0x03 => some .agent
  | 0x04 => some .service
  | 0x05 => some .document
  | 0x06 => some .constraint
  | 0x07 => some .environment
  | _    => none

def decodeCapability : UInt8 → Option Capability
  | 0x01 => some .observe
  | 0x02 => some .compute
  | 0x03 => some .store
  | 0x04 => some .route
  | 0x05 => some .decide
  | 0x06 => some .attest
  | 0x07 => some .transform
  | _    => none

def decodeProcess : UInt8 → Option Process
  | 0x01 => some .batch
  | 0x02 => some .stream
  | 0x03 => some .consensus
  | 0x04 => some .proof
  | 0x05 => some .execution
  | 0x06 => some .arbitration
  | _    => none

def decodeContext : UInt8 → Option Context
  | 0x01 => some .private
  | 0x02 => some .public
  | 0x03 => some .legal
  | 0x04 => some .scientific
  | 0x05 => some .religious
  | 0x06 => some .economic
  | _    => none

/-- Decode full 8 bytes into SchemaAddr (schema must be valid). -/
def decodeSchemaAddr (a : Addr8) : Option SchemaAddr := do
  let r0 := a.get ⟨0, by decide⟩
  let r1 := a.get ⟨1, by decide⟩
  let r2 := a.get ⟨2, by decide⟩
  let r3 := a.get ⟨3, by decide⟩
  let r4 := a.get ⟨4, by decide⟩
  let realm      ← decodeRealm r0
  let ontology   ← decodeOntology r1
  let capability ← decodeCapability r2
  let process    ← decodeProcess r3
  let context    ← decodeContext r4
  pure {
    realm, ontology, capability, process, context,
    inst5 := a.get ⟨5, by decide⟩,
    inst6 := a.get ⟨6, by decide⟩,
    inst7 := a.get ⟨7, by decide⟩
  }

/-- Schema-valid iff decoding succeeds. -/
def schemaValid (a : Addr8) : Prop :=
  (decodeSchemaAddr a).isSome

theorem schemaValid_iff (a : Addr8) : schemaValid a ↔ (∃ s, decodeSchemaAddr a = some s) := by
  unfold schemaValid
  constructor
  · intro h
    rcases Option.isSome_iff_exists.mp h with ⟨s, hs⟩
    exact ⟨s, hs⟩
  · rintro ⟨s, hs⟩
    exact Option.isSome_iff_exists.mpr ⟨s, hs⟩

/- ===== CanISA "execution core" (minimal) ===== -/

/-- VM core state for execution (address + pc + regs). -/
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

namespace Op
  def HALT : UInt8 := 0x01
  def NOP  : UInt8 := 0x00
end Op

/-- Fetch by matching on `drop pc`. -/
def fetch? (code : Code) (pc : Nat) : Option UInt8 :=
  match code.drop pc with
  | []      => none
  | b :: _  => some b

/-- One tiny step: NOP/HALT only (extend with your full opcode set). -/
def step (code : Code) (vm : VM) : Outcome :=
  match fetch? code vm.pc with
  | none => Outcome.halt vm
  | some op =>
    if op = Op.NOP then
      Outcome.cont { vm with pc := vm.pc + 1 }
    else if op = Op.HALT then
      Outcome.halt { vm with pc := vm.pc + 1 }
    else
      Outcome.trap vm s!"unknown_opcode_{op}"

/-- Fuel-bounded run. -/
def run : Nat → Code → VM → Outcome
  | 0, _, vm => Outcome.trap vm "out_of_fuel"
  | Nat.succ fuel, code, vm =>
      match step code vm with
      | Outcome.cont vm' => run fuel code vm'
      | o => o

/-- Schema-gated run: if schema invalid, trap immediately (no stepping). -/
def runChecked (fuel : Nat) (code : Code) (vm : VM) : Outcome :=
  if h : schemaValid vm.addr then
    run fuel code vm
  else
    Outcome.trap vm "invalid_schema"

/-- The theorem: invalid schema ⇒ execution uniquely factors through the gate (no steps). -/
theorem invalid_schema_no_execute (fuel : Nat) (code : Code) (vm : VM)
    (hbad : ¬ schemaValid vm.addr) :
    runChecked fuel code vm = Outcome.trap vm "invalid_schema" := by
  unfold runChecked
  simp [hbad]

/-- Companion: valid schema ⇒ runChecked equals raw run. -/
theorem valid_schema_exec (fuel : Nat) (code : Code) (vm : VM)
    (hgood : schemaValid vm.addr) :
    runChecked fuel code vm = run fuel code vm := by
  unfold runChecked
  simp [hgood]

end Tetragrammatron
