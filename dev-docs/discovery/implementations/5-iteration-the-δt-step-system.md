# 5. Iteration / the ΔT step system

You had:

- \(T_{n+1} = T_n + \Delta T\)
- \(\Delta T = T_{n+1} - T_n\)

In this framework, the clean formal version is:

- boundary step: `b_{n+1} = transform b_n`
- interior step: `i_n = realize c_n b_n` for some choice sequence

### Define a step relation

```coq
Record State : Type := {
  b : Boundary;
  i : Interior;
  ok : i ⊨ b;
}.

Parameter choose : nat -> Choice.

Definition step (n : nat) (s : State) : State :=
  let b' := transform s.(b) in
  let i' := realize (choose n) b' in
  {| b := b';
     i := i';
     ok := realize_sound (choose n) b' |}.
```

This gives you a **deterministic boundary evolution** with **explicit non-canonical interior realization** via `choose n`.

### Optional: define Δ as a typed “difference of interiors”

```coq
Definition Delta (s1 s2 : State) : Difference :=
  difference s2.(i) s1.(i).
```

---
