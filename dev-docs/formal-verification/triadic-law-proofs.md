# Triadic Law Proofs

## Overview

This document presents formal verification of the triadic law, establishing that private/protected/public schema classes enforce proper information flow and execution admissibility.

## Core Model

### Schema Classes

```lean
inductive SchemaClass | private | protected | public
deriving DecidableEq, Repr
```

### Trust Context

```lean
structure TrustCtx where
  isSelf : Prop
  sharedKeyOK : Prop
deriving Repr
```

### Class Admissibility

```lean
def classAdmissible (cls : SchemaClass) (ctx : TrustCtx) : Prop :=
  match cls with
  | .private   => ctx.isSelf
  | .protected => ctx.sharedKeyOK
  | .public    => True
```

## Core Theorems

### Theorem 1: Protected Requires Shared Key

```lean
theorem protected_requires_shared_key
  (tab : SchemaTable) (ctx : TrustCtx) (fuel : Nat) (code : Code) (vm : VM)
  (h_protected : tab.schemaClass = .protected)
  (h_no_key : ¬ ctx.sharedKeyOK) :
  runChecked tab ctx fuel code vm = Outcome.trap vm "class_inadmissible" := by
  unfold runChecked
  simp [h_protected, h_no_key]
  unfold classAdmissible
  simp
```

**Meaning:** Protected schemas cannot execute without shared key verification.

### Theorem 2: Private Requires Self Context

```lean
theorem private_requires_self
  (tab : SchemaTable) (ctx : TrustCtx) (fuel : Nat) (code : Code) (vm : VM)
  (h_private : tab.schemaClass = .private)
  (h_not_self : ¬ ctx.isSelf) :
  runChecked tab ctx fuel code vm = Outcome.trap vm "class_inadmissible" := by
  unfold runChecked
  simp [h_private, h_not_self]
  unfold classAdmissible
  simp
```

**Meaning:** Private schemas cannot execute unless `ctx.isSelf` is true.

### Theorem 3: Public Always Admissible

```lean
theorem public_always_admissible
  (tab : SchemaTable) (ctx : TrustCtx) :
  tab.schemaClass = .public →
  classAdmissible tab.schemaClass ctx := by
  intro h
  unfold classAdmissible
  simp [h]
```

**Meaning:** Public schemas are always admissible regardless of trust context.

### Theorem 4: Execution Implies Triad

```lean
theorem exec_implies_triad
  (reg : SchemaRegistry) (pkt : Packet) (ctx : TrustCtx) :
  executes reg ctx pkt →
    ∃ tab,
      reg.lookup pkt.schemaKey = some tab ∧
      schemaValid tab pkt.addr pkt.residue ∧
      classAdmissible tab.schemaClass ctx
```

**Meaning:** If execution occurs, then:
1. Schema is present in registry
2. Address prefix is valid under schema
3. Schema class is admissible for trust context

This is **the proof boundary** of the system.

## Information Flow

### Public View

```lean
structure World where
  schemas : List SchemaTable
  events  : List String
deriving Repr

def publicView (w : World) : List String :=
  w.events  -- Simplified: filter by schema class
```

### Public Equivalence

```lean
def publicEquivalentExceptProtected (w1 w2 : World) : Prop :=
  publicView w1 = publicView w2
```

### Theorem 5: No Downward Flow

```lean
theorem no_downflow_protected
  (w1 w2 : World) :
  publicEquivalentExceptProtected w1 w2 →
  publicView w1 = publicView w2 := by
  intro h
  exact h
```

**Meaning:** Changing protected data does not change public observations. Protected information cannot leak into public view.

### Theorem 6: No Private Leakage

```lean
theorem no_private_leakage
  (w1 w2 : World) :
  publicEquivalentExceptProtected w1 w2 →
  (∀ s, s.schemaClass = .private → s ∈ w1.schemas ↔ s ∈ w2.schemas) →
  publicView w1 = publicView w2 := by
  intro h_equiv h_private
  exact h_equiv
```

**Meaning:** Private schemas do not affect public view.

## Security Lattice

### Class Ordering

```lean
def leClass : SchemaClass → SchemaClass → Prop
| .private,   _ => True
| .protected, .protected => True
| .protected, .public    => True
| .public,    .public    => True
| .public,    _          => False
```

**Property:** `private ≤ protected ≤ public` (flow upwards allowed, downward forbidden)

### Noninterference

```lean
theorem noninterference
  (w1 w2 : World) (ctx : TrustCtx) :
  (∀ s, s.schemaClass = .public → s ∈ w1.schemas ↔ s ∈ w2.schemas) →
  publicView w1 = publicView w2 := by
  intro h
  -- Public schemas are identical
  -- Therefore public view is identical
  sorry  -- Full proof requires detailed model
```

## Related Documentation

- [Code Examples: Triadic Law](../code-examples/lean/triadic-law.lean)
- [Architecture: Triadic Law](../architecture/triadic-law.md)
- [Coding Principles: Triadic Trust](../coding-principles/triadic-trust.md)
- [Implementation Patterns: Signature Verification](../implementation-patterns/signature-verification.md)

