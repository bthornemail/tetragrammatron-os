# Appendix D — Complexity Analysis (Conservative)

Let:

- `k` = basis dimension
- `d` = polynomial degree
- `n` = number of execution steps
- `t` = number of triples checked under PCG

---

### D.1 Storage

| Component | Complexity |
|--------|------------|
| Encoder coefficients | O(k^d) |
| Trace length | O(n) |
| References (hashes) | O(n) |

Total storage is **sublinear in state history** for fixed `d`.

---

### D.2 Evaluation

| Operation | Cost |
|--------|------|
| Polynomial evaluation | O(k^d) |
| Decode under Boundary | O(1)–O(k) |
| Fano incidence check | O(1) |
| PCG pair-cover | O(t) |

---

### D.3 Merge

| Operation | Cost |
|--------|------|
| Concatenation | O(n) |
| Replay validation | O(n·k^d) |

This is strictly bounded and deterministic.

---
