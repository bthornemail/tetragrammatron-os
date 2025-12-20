# A cleaned, implementable “BICF Core” (Coq/Lean-ish)

This version is consistent and actually proves.

```coq
(* ===================== *)
(* BICF Core (Minimal)   *)
(* ===================== *)

Universe u.

Parameter Boundary : Type@{u}.
Parameter Interior : Type@{u}.
Parameter View     : Type@{u}.
Parameter Choice   : Type@{u}.

(* Satisfaction / validity judgment *)
Parameter valid : Interior -> Boundary -> Prop.
Notation "i ⊨ b" := (valid i b) (at level 70).

(* Boundary evolution *)
Parameter transform : Boundary -> Boundary.

(* Explicit (non-canonical) realization *)
Parameter realize : Boundary -> Choice -> Interior.

(* Observation / rendering *)
Parameter project : Interior -> View.

(* --------------------- *)
(* Axiom 1: Soundness    *)
(* --------------------- *)
Axiom realize_sound :
  forall (b : Boundary) (c : Choice),
    (realize b c) ⊨ b.

(* --------------------------------------- *)
(* Axiom 2: Non-canonicity (at least once) *)
(* --------------------------------------- *)
Axiom realize_not_unique :
  exists (b : Boundary) (c1 c2 : Choice),
    c1 <> c2 /\ realize b c1 <> realize b c2.

(* ----------------------------------- *)
(* Axiom 3: Realizability preservation *)
(* ----------------------------------- *)
Definition realizable (b : Boundary) : Prop :=
  exists i : Interior, i ⊨ b.

Axiom transform_preserves_realizability :
  forall b : Boundary,
    realizable b -> realizable (transform b).

(* ----------------------------- *)
(* Axiom 4: Projection is a view *)
(* ----------------------------- *)
Parameter ViewOf : View -> Interior -> Prop.
Notation "v ≃ i" := (ViewOf v i) (at level 70).

Axiom project_is_view :
  forall i : Interior,
    project i ≃ i.
```

### Optional “explicitness/completeness” axiom (use carefully)
If you want the “every valid interior is some realization” property, make it explicit as a *strong* optional module:

```coq
Axiom realize_complete :
  forall (b : Boundary) (i : Interior),
    i ⊨ b -> exists c : Choice, realize b c = i.
```

This is powerful, but it effectively says: **Choice is at least as expressive as Interior**.

---
