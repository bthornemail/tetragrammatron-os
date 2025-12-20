# Appendix C — Merge Semantics for CanvasL-POLY (Normative)

### C.1 Definitions

Let:

- `T₁`, `T₂` be two CanvasL-POLY traces
- `B` be a shared Boundary
- `A` be a shared Anchor (e.g., Git commit hash)
- `E` be the set of defined encoders

---

### C.2 Merge Preconditions (MUST)

Two traces MAY be merged iff:

1. **Boundary identity**
   ```
   T₁.boundary == T₂.boundary
   ```

2. **Anchor compatibility**
   ```
   T₁.anchor == T₂.anchor
   ```

3. **Encoder compatibility**
   - For every encoder `Eᵢ` defined in both traces:
     - `poly_form`, `ring`, `basis_dim`, and `coeffs` MUST match exactly

4. **Phase monotonicity**
   - The merged trace preserves total phase ordering

---

### C.3 Merge Operation (Normative)

The merge of `T₁` and `T₂` is the **concatenation** of their steps, followed by **full replay validation**:

```
merge(T₁, T₂) =
  replay_and_validate(sort_by_phase(T₁ ∪ T₂))
```

If replay fails at any step → **merge rejected**.

---

### C.4 FANO / PCG Constraint Preservation

For FANO-bound traces:

- The merged decoded state MUST still satisfy:
  - Fano incidence
  - Automorphism alignment
  - PCG pair-cover constraints

This makes merge **structural**, not heuristic.

---

### C.5 Consequence (Key Property)

> Two traces merge iff their **polynomial descriptions compose without violating boundary constraints**.

This is the formal replacement for:
- voting
- quorum
- conflict resolution heuristics

---
