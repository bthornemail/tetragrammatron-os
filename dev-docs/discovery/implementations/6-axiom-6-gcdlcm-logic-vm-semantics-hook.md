# 6) “Axiom 6 = GCD/LCM logic” (VM Semantics Hook)

We will make this **mechanical**, not mystical:

- A6 is modeled as “find shared constraint intersection across a triad”
- In your algebra: intersection = **meet = gcd**
- And completion / union = **join = lcm**
- So A6 can be implemented as:

```
A6(a,b; ctx) :=
  canon( gcd( lcm(a,ctx), lcm(b,ctx) ) )
```

That’s “global fold” because it uses ctx as the “point at infinity / shared key”.

So in VM terms:

- `FOLD-A6 src dst` means:
  - dst := CANON( MEET( JOIN(src, K), JOIN(src', K) ) )
  - where K is “context register” (choose fixed R7 or a VM constant)

We’ll encode that convention:

**Convention:** `R7` is the **KEY/CONTEXT register**.

This gives you:
- deterministic “cubic” behavior (because it mixes meet/join)
- idempotence after CANON
- explicit dependence on the shared key

---
