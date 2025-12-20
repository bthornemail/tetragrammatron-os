# Fold axioms → ISA opcodes (direct map)

This is the **one-to-one** contract your assembler + VM can enforce:

| Huzita–Hatori axiom | Meaning (informal) | ISA opcode | Operands (ObjId refs) | Emits |
|---|---|---|---|---|
| A1 | crease through two points | `FOLD_A1` | `p1 p2` | linear constraint |
| A2 | fold p1 onto p2 (bisector) | `FOLD_A2` | `p1 p2` | linear/quadratic (depends on encoding) |
| A3 | fold line onto line | `FOLD_A3` | `l1 l2` | linear/quadratic |
| A4 | fold perpendicular to line through point | `FOLD_A4` | `p l` | quadratic |
| A5 | fold point to line | `FOLD_A5` | `p l` | quadratic |
| **A6** | **fold p1→l1 and p2→l2 simultaneously** | **`FOLD_A6`** | **`p1 l1 p2 l2`** | **cubic constraint (tag=106)** |
| A7 | fold point to line through point | `FOLD_A7` | `p l q` | cubic-ish / special-case |

And the lattice core (your “Fano = idempotence” operationalization):

| Algebra operator | ISA opcode | Semantics |
|---|---|---|
| meet | `MEET_GCD` | `dst := normalize(gcd(a,b))` |
| join | `JOIN_LCM` | `dst := normalize(lcm(a,b))` |
| normalize | `NORM` | `dst := normalize(a)` |
| proof hook | `ASSERT_EQ` | fail/trace if `a != b` |

---
