# 2. Core Judgments

We need a validity relation: “this interior satisfies that boundary”.

```coq
(* Validity / satisfaction: interior i is valid for boundary b *)
Parameter Sat : Interior -> Boundary -> Prop.
Notation "i ⊨ b" := (Sat i b) (at level 70).
```

This is the key bridge: **boundary constrains interior**, but they remain distinct types.

---
