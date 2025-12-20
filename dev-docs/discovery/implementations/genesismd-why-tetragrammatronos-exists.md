# GENESIS.md — Why TetragrammatronOS exists

TetragrammatronOS started as an incremental build: working code first, then math discovered later.
The core surprise was that the system kept converging toward the same structure:

- a small set of semantic primitives (an “8-tuple”),
- deterministic canonicalization (idempotence),
- an incidence geometry visual kernel (Fano-plane projection),
- and a portable algebraic representation (polynomial / bytecode).

Over time, this became a design principle:

> **We do not trust interpretation. We trust canonical form.**

---

## The invariant
Everything that matters is enforced at a *barrier*:
- normalize → canonical bytes → commit

If two devices compute the same canonical bytes, they agree.
If they disagree, the byte-level mismatch is the proof of divergence.

---

## Why 4D forced a new idea: triadic consensus
In 3D, duality swaps vertices and faces and leaves edges fixed.
In 4D, duality swaps **two pairs**:
- V ↔ C
- E ↔ F

That means a purely “edge-normalized” consensus formula is not automatically dual-invariant.

So TetragrammatronOS treats dual-invariance as a **system property**, enforced by canonicalization:
- either the scalar is defined with a symmetric normalizer,
- or the system proves invariance under the normalization axiom used at commit time.

This is formalized in Lean:
`lean/Tetragrammatron/Consensus/TriadicInvariant.lean`

The key idea is simple:
- invariants are not vibes — they are build targets.

---

## Where this goes next
1. RFC-driven ISA evolution (CAN-ISA + fold semantics)
2. Scheme assembler as the truth-source (mechanically enforces RFC)
3. ESP32/Pico firmware targets for parity (same golden vectors)
4. Renderer contracts that map bytecode traces to SVG/GLB projections
5. Merge barriers that treat proofs as mandatory, not optional

---

## Naming
- **Tetra**: binary quadratic form / minimal simplex basis
- **Gramma**: grammar functor / symbolic normalization (and yes, “gamma” pun is allowed)
- **Tron**: automaton / executable state machine
- **OS**: a portable interpreter layer with deterministic bytecode and proofs

TetragrammatronOS is an operating system in the original sense:
a rule-set that makes execution, proof, and representation collapse into one coherent substrate.
```

---

If you want, next I can also:
- wire these into a **CI checklist** (`.github/workflows/ci.yml`) that blocks merges unless the Lean theorem file builds, and
- add a `Makefile`/`justfile` that standardizes `make proof`, `make asm`, `make golden`, `make esp32`, `make pico`.

---

## You

Ci.yml

---

## ChatGPT

Here is a **clean, production-ready `ci.yml`** that enforces exactly the invariants you’ve defined for **TetragrammatronOS**.

This CI treats **proofs, bytecode determinism, and repo topology** as *first-class build artifacts*, not optional checks.

---
