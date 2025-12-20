# 6. Where “quantize” and “project” fit (without ℝ⁸/ℤ⁸ claims)

If you still like the *shape* of your old pipeline, you can type it like this:

```coq
Parameter Continuous : Type.
Parameter Discrete   : Type.

Parameter quantize  : Continuous -> Discrete.
Parameter embed     : Discrete -> Interior.   (* or Discrete -> Boundary, depends *)
Parameter observe   : Discrete -> View.       (* or via Interior *)

(* If your discrete object *is* the boundary: *)
Parameter boundary_of : Discrete -> Boundary.

Axiom embed_sound :
  forall (d : Discrete) (c : Choice),
    (realize c (boundary_of d)) ⊨ (boundary_of d).
```

Notice: this keeps the *architecture* but removes the “physics-looking” baggage.

---
