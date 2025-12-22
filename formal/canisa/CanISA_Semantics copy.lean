/-
  Lean 4 small-step semantics for the CanISA core.
  This model mirrors the interpreter behavior and acts as a reference for proofs.
-/

namespace CanISA

abbrev Addr8 := Vector UInt8 8
abbrev RegFile := Vector UInt32 16

structure Event where
  key : String
  val1? : Option UInt8 := none
  vals? : Option (List UInt8) := none
  deriving Repr, DecidableEq

structure VM where
  addr : Addr8
  regs : RegFile
  pc   : Nat
  zf   : Bool
  deriving Repr

@[inline] def getReg (vm : VM) (r : Nat) : UInt32 :=
  vm.regs.get ⟨r % 16, by have : 0 < (16:Nat) := by decide ; exact Nat.mod_lt _ this⟩

@[inline] def setReg (vm : VM) (r : Nat) (v : UInt32) : VM :=
  { vm with regs := vm.regs.set ⟨r % 16, by have : 0 < (16:Nat) := by decide ; exact Nat.mod_lt _ this⟩ v }

@[inline] def getAddrByte (vm : VM) (i : Nat) : UInt8 :=
  vm.addr.get ⟨i % 8, by have : 0 < (8:Nat) := by decide ; exact Nat.mod_lt _ this⟩

abbrev Code := List UInt8

@[inline] def fetch? (code : Code) (pc : Nat) : Option UInt8 := code.get? pc

@[inline] def fetch2? (code : Code) (pc : Nat) : Option (UInt8 × UInt8) := do
  let b0 ← fetch? code pc
  let b1 ← fetch? code (pc + 1)
  pure (b0, b1)

@[inline] def fetch3? (code : Code) (pc : Nat) : Option (UInt8 × UInt8 × UInt8) := do
  let b0 ← fetch? code pc
  let b1 ← fetch? code (pc + 1)
  let b2 ← fetch? code (pc + 2)
  pure (b0, b1, b2)

namespace Op
  def NOP : UInt8 := 0x00
  def HALT : UInt8 := 0x01
  def MOV : UInt8 := 0x10
  def LOAD8 : UInt8 := 0x11
  def MOD8 : UInt8 := 0x30
  def ADMISS_EXCEPT6 : UInt8 := 0x31
  def LOADADDR8 : UInt8 := 0x60
  def EMIT8 : UInt8 := 0x50
  def EMITREGS : UInt8 := 0x51
end Op

inductive Outcome where
  | cont (vm : VM) (trace : List Event)
  | halt (vm : VM) (trace : List Event)
  | trap (vm : VM) (trace : List Event) (reason : String)
  deriving Repr

@[inline] def loNib (b : UInt8) : Nat := (b &&& 0x0F).toNat
@[inline] def hiNib (b : UInt8) : Nat := ((b >>> 4) &&& 0x0F).toNat

/-- Execute one instruction. -/
def step (code : Code) (vm : VM) (trace : List Event) : Outcome :=
  match fetch? code vm.pc with
  | none => Outcome.halt vm trace
  | some op =>
    if op = Op.NOP then
      Outcome.cont { vm with pc := vm.pc + 1 } trace
    else if op = Op.HALT then
      Outcome.halt { vm with pc := vm.pc + 1 } trace
    else if op = Op.MOV then
      match fetch2? code vm.pc with
      | some (_, packed) =>
        let vm' := setReg vm (loNib packed) (getReg vm (hiNib packed))
        Outcome.cont { vm' with pc := vm.pc + 2 } trace
      | none => Outcome.trap vm trace "decode_error_MOV"
    else if op = Op.LOAD8 then
      match fetch3? code vm.pc with
      | some (_, rD, imm) =>
        let vm' := setReg vm rD.toNat (UInt32.ofNat imm.toNat)
        Outcome.cont { vm' with pc := vm.pc + 3 } trace
      | none => Outcome.trap vm trace "decode_error_LOAD8"
    else if op = Op.MOD8 then
      match fetch2? code vm.pc with
      | some (_, rD) =>
        let vm' := setReg vm rD.toNat (getReg vm rD.toNat &&& 0x07)
        Outcome.cont { vm' with pc := vm.pc + 2 } trace
      | none => Outcome.trap vm trace "decode_error_MOD8"
    else if op = Op.ADMISS_EXCEPT6 then
      match fetch2? code vm.pc with
      | some (_, rD) =>
        let value := getReg vm rD.toNat &&& 0xFF
        if value = 6 then
          Outcome.trap { vm with pc := vm.pc + 2 } trace "admissibility_violation_except6"
        else
          Outcome.cont { vm with pc := vm.pc + 2 } trace
      | none => Outcome.trap vm trace "decode_error_ADMISS"
    else if op = Op.LOADADDR8 then
      match fetch2? code vm.pc with
      | some (_, rStart) =>
        let vm' := (List.range 8).foldl (fun acc i => setReg acc (rStart.toNat + i) (UInt32.ofNat (getAddrByte acc i).toNat)) vm
        Outcome.cont { vm' with pc := vm.pc + 2 } trace
      | none => Outcome.trap vm trace "decode_error_LOADADDR8"
    else if op = Op.EMIT8 then
      match (fetch? code (vm.pc + 1), fetch? code (vm.pc + 2), fetch? code (vm.pc + 3)) with
      | (some lo, some hi, some rD) =>
        let idx := lo.toNat + 256 * hi.toNat
        let value := (getReg vm rD.toNat &&& 0xFF).toNat
        let ev : Event := { key := s!"emit8[{idx}]", val1? := some (UInt8.ofNat value) }
        Outcome.cont { vm with pc := vm.pc + 4 } (trace ++ [ev])
      | _ => Outcome.trap vm trace "decode_error_EMIT8"
    else if op = Op.EMITREGS then
      match (fetch? code (vm.pc + 1), fetch? code (vm.pc + 2), fetch? code (vm.pc + 3), fetch? code (vm.pc + 4), fetch? code (vm.pc + 5)) with
      | (some lo, some hi, some rStart, some count, _) =>
        let idx := lo.toNat + 256 * hi.toNat
        let vals := (List.range count.toNat).map (fun i => UInt8.ofNat ((getReg vm (rStart.toNat + i) &&& 0xFF).toNat))
        let ev : Event := { key := s!"emitregs[{idx}]", vals? := some vals }
        Outcome.cont { vm with pc := vm.pc + 5 } (trace ++ [ev])
      | _ => Outcome.trap vm trace "decode_error_EMITREGS"
    else
      Outcome.trap vm trace s!"unknown_opcode_{op}"

/-- Bounded execution with fuel. -/
def run (code : Code) : Nat → VM → List Event → Outcome
  | Nat.zero, vm, tr => Outcome.trap vm tr "out_of_fuel"
  | Nat.succ fuel, vm, tr =>
    match step code vm tr with
    | Outcome.cont vm' tr' => run fuel vm' tr'
    | other => other

/-- After applying MOD8, the register is strictly < 8. -/
def regMod8 (vm : VM) (r : Nat) : Prop := getReg vm r < 8

end CanISA
