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
