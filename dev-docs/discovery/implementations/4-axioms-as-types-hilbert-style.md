# 4. Axioms as Types (Hilbert-style)

These are your **system guarantees**, written as propositions.

## Axiom 1 — Realize must satisfy the boundary

```coq
Axiom realize_sound :
  forall (c : Choice) (b : Boundary),
    (realize c b) ⊨ b.
```

## Axiom 2 — Non-canonicity (no unique realization)

There are many ways to express this. Here is a clean one:

```coq
Axiom realize_not_unique :
  exists (b : Boundary) (c1 c2 : Choice),
    c1 <> c2 /\ realize c1 b <> realize c2 b.
```

(You can weaken/strengthen this depending on how strict you want it.)

## Axiom 3 — Transform preserves realizability / validity

We need a statement that transforming constraints yields a compatible interior after realization.

```coq
Axiom transform_preserves_validity :
  forall (c : Choice) (b : Boundary),
    (realize c (transform b)) ⊨ (transform b).
```

This follows from `realize_sound`, but it’s fine to keep as an explicit guarantee in the spec.

## Axiom 4 — Separation invariant (no implicit boundary ↔ interior coercions)

In type theory this is enforced structurally: `Boundary` and `Interior` are different types.  
If you want it as an explicit axiom for humans:

```coq
Axiom no_coercion_boundary_to_interior :
  ~ (exists (f : Boundary -> Interior), True).

Axiom no_coercion_interior_to_boundary :
  ~ (exists (g : Interior -> Boundary), True).
```

(You might omit these in a real proof assistant because the type system already enforces it unless you add such functions.)

## Axiom 5 — Projection is “validity-preserving” (informative view)

Projection doesn’t create state, so we express it as: views correspond to some valid interior.

```coq
Parameter ViewOf : View -> Interior -> Prop.
Notation "v ≃ i" := (ViewOf v i) (at level 70).

Axiom project_is_view_of :
  forall (i : Interior),
    project i ≃ i.
```

And optionally: a view cannot “invent” interiors that violate the originating boundary (if the view claims anything about validity).

---
