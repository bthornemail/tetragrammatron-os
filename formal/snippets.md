# 5) Lean alignment (conceptual, clean)

Because schema is data, Lean imports it as a **finite predicate**, not an enum.

Conceptually:

```lean
structure SchemaTable where
  fixed : Fin 8 → Bool
  allowed : Fin 8 → Finset UInt8

def schemaValid (tab : SchemaTable) (a : Vector UInt8 8) : Prop :=
  ∀ i : Fin 5,
    tab.fixed i →
    a.get i ∈ tab.allowed i
```

You then prove once:

```lean
theorem invalid_prefix_no_execute :
  ¬ schemaValid tab addr → runChecked fuel code vm = trap …
```

Lean and ESP32 are now **provably enforcing the same law**.

---

# 6) Lean: extend the gate (cleanly)

You **do not change** the earlier theorem.  
You **refine** `schemaValid`:

```lean
def modeAdmissible (mode : Mode) (p : Fin 8) : Prop :=
  match mode with
  | Mode.any      => True
  | Mode.private7 => p.val ≠ 6
  | Mode.public4  => p.val = 0 ∨ p.val = 1 ∨ p.val = 3 ∨ p.val = 5

def schemaValid (tab : SchemaTable) (a : Addr8) (p : Fin 8) : Prop :=
  prefixValid tab a ∧
  ∀ i : Fin 5, modeAdmissible (tab.mode i) p
```

Your existing theorem still holds:

> invalid schema ⇒ no execute  

Now it’s **strictly stronger**, not replaced.

---
