# 1. Universes and Base Types

We separate roles at the type level.

```coq
(* Universes / kinds *)
Universe U.

(* Role types *)
Parameter Boundary : Type.
Parameter Interior : Type.
Parameter View     : Type.

(* Optional: a type of "choices" / parameters for non-canonical realization *)
Parameter Choice : Type.
```

---
