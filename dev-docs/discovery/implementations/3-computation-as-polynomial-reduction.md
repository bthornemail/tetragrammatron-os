# 3. Computation as Polynomial Reduction

## 3.1 State Representation

Let computation state be represented as a multivariate polynomial:

\[
S = \sum_k c_k \prod_i x_i^{k_i}
\]

Where:
- variables \( x_i \) correspond to **features / fields**,
- coefficients \( c_k \) encode local structure,
- normalization collapses equivalent representations.

---

## 3.2 Events as Operators

Events are algebraic operators acting on terms:

- **Linear operators** → coefficient updates
- **Quadratic operators** → pairwise interactions
- **Normalization** → canonical reduction

No control flow is required.

---

## 3.3 Merge ≡ Reduce

Given two states \( S_1, S_2 \):

\[
	ext{merge}(S_1, S_2) = 	ext{normalize}(S_1 + S_2)
\]

This operation is:
- commutative,
- associative,
- deterministic.

This directly enables distributed convergence.

---

## 3.4 CPUs Reinterpreted

A CPU is therefore:

> a fast algebraic reducer implementing fixed normalization rules.

This reframes execution, memory, and synchronization as algebraic phenomena.

---
