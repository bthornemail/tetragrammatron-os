# 3. Required Interfaces as Types

## 3.1 Boundary transformation

```coq
Parameter transform : Boundary -> Boundary.
```

## 3.2 Realization (explicit, non-canonical)

There are two good options:

### Option A: realization is parameterized (recommended)
```coq
Parameter realize : Choice -> Boundary -> Interior.
```

### Option B: realization returns a set (also valid)
```coq
Parameter Realizations : Boundary -> Type.
Parameter pick : Realizations b -> Interior.  (* etc. *)
```

I’ll proceed with **Option A** because it enforces “non-canonical” cleanly.

## 3.3 Projection

```coq
Parameter project : Interior -> View.
```

## 3.4 Difference (optional)

```coq
Parameter Difference : Type.
Parameter difference : Interior -> Interior -> Difference.
```

---
