# Schema Gate Theorems

## Overview

This document presents the formal verification of the schema-gated execution model. The core theorem establishes that **invalid schema prefixes cannot execute**, which is the fundamental security boundary of Tetragrammatron-OS.

## Core Model

### Address Structure

```lean
abbrev Addr8 := Vector UInt8 8

def schemaPrefix5 (a : Addr8) : Vector UInt8 5 :=
  ⟨(List.range 5).map (fun i => a.get ⟨i, by decide⟩),
    by simp⟩
```

### Schema Categories

```lean
inductive Realm | local | public | ulp
inductive Ontology | human | device | agent | service | document | constraint | environment
inductive Capability | observe | compute | store | route | decide | attest | transform
inductive Process | batch | stream | consensus | proof | execution | arbitration
inductive Context | private | public | legal | scientific | religious | economic
```

### Schema Decoding

```lean
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
```

### Schema Validity

```lean
def schemaValid (a : Addr8) : Prop :=
  (decodeSchemaAddr a).isSome
```

## Execution Model

### VM State

```lean
structure VM where
  addr : Addr8
  pc   : Nat
deriving Repr
```

### Outcomes

```lean
inductive Outcome where
  | cont (vm : VM)
  | halt (vm : VM)
  | trap (vm : VM) (reason : String)
deriving Repr
```

### Execution

```lean
def run : Nat → Code → VM → Outcome
  | 0, _, vm => Outcome.trap vm "out_of_fuel"
  | Nat.succ fuel, code, vm =>
      match step code vm with
      | Outcome.cont vm' => run fuel code vm'
      | o => o
```

### Schema-Gated Execution

```lean
def runChecked (fuel : Nat) (code : Code) (vm : VM) : Outcome :=
  if h : schemaValid vm.addr then
    run fuel code vm
  else
    Outcome.trap vm "invalid_schema"
```

## Core Theorems

### Theorem 1: Invalid Schema Cannot Execute

```lean
theorem invalid_schema_no_execute (fuel : Nat) (code : Code) (vm : VM)
    (hbad : ¬ schemaValid vm.addr) :
    runChecked fuel code vm = Outcome.trap vm "invalid_schema" := by
  unfold runChecked
  simp [hbad]
```

**Meaning:** If the schema prefix is invalid, execution immediately traps with "invalid_schema" without performing any execution steps.

### Theorem 2: Valid Schema Executes Normally

```lean
theorem valid_schema_exec (fuel : Nat) (code : Code) (vm : VM)
    (hgood : schemaValid vm.addr) :
    runChecked fuel code vm = run fuel code vm := by
  unfold runChecked
  simp [hgood]
```

**Meaning:** If the schema prefix is valid, the gated execution behaves identically to normal execution.

### Theorem 3: Schema Validity Equivalence

```lean
theorem schemaValid_iff (a : Addr8) : schemaValid a ↔ (∃ s, decodeSchemaAddr a = some s) := by
  unfold schemaValid
  constructor
  · intro h
    rcases Option.isSome_iff_exists.mp h with ⟨s, hs⟩
    exact ⟨s, hs⟩
  · rintro ⟨s, hs⟩
    exact Option.isSome_iff_exists.mpr ⟨s, hs⟩
```

**Meaning:** Schema validity is equivalent to successful decoding.

## Schema Table Model

For data-driven schemas (future extension):

```lean
structure SchemaTable where
  fixed   : Fin 8 → Bool
  allowed : Fin 8 → Finset UInt8

def schemaValid (tab : SchemaTable) (a : Addr8) : Prop :=
  ∀ i : Fin 5,
    tab.fixed ⟨i.val, by exact lt_trans i.isLt (by decide)⟩ = true →
    a.get ⟨i.val, by exact lt_trans i.isLt (by decide)⟩ ∈
      tab.allowed ⟨i.val, by exact lt_trans i.isLt (by decide)⟩
```

This allows schemas to be loaded from binary data while maintaining the same theorems.

## Execution Implies Schema Present

For mesh nodes with schema registries:

```lean
theorem exec_implies_schema_present
  (reg : SchemaRegistry) (pkt : Packet) :
  executes reg pkt →
  ∃ tab, reg.lookup pkt.schemaKey = some tab ∧ 
         schemaValid tab pkt.addr pkt.residue
```

**Meaning:** If execution occurs, then a schema for that realm/hash existed and validated the prefix.

## Soundness

The schema gate is **sound**:

- Invalid addresses cannot execute (proved)
- Valid addresses execute normally (proved)
- No false positives (schema validity is decidable)
- No false negatives (all invalid addresses are caught)

## Related Documentation

- [Code Examples: Schema Gate](../code-examples/lean/schema-gate.lean)
- [Architecture: Address Schema](../architecture/address-schema.md)
- [Coding Principles: Schema Before Instance](../coding-principles/schema-before-instance.md)
- [Implementation Patterns: Schema Compilation](../implementation-patterns/schema-compilation.md)

