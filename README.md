# Tetragrammatron-OS

> **A geometry-first, proof-carrying operating system and virtual machine for deterministic computation across software, hardware, and space.**

Tetragrammatron-OS is an experimental but rigorous computing substrate that unifies:

- **Computation** (bytecode, VM, assembler)
- **Mathematics** (polynomials, lattices, projective geometry)
- **Time & physics** (clocks, barriers, scheduling)
- **Visualization** (SVG / GLB / projection geometry)
- **Formal verification** (Lean / Coq)
- **Embedded execution** (ESP32, RP2040, mobile, routers)

This is not an application framework.  
It is a **computational ontology**.

---

## 1. What Problem This Solves

Modern systems suffer from:
- Implicit global state
- Unverifiable execution
- Inconsistent geometry across platforms
- Separation of logic, proof, time, and visualization
- Fragile abstractions between software and hardware

**Tetragrammatron-OS replaces those with:**

- Explicit constraints
- Idempotent normalization
- Deterministic execution
- Proof-carrying state transitions
- A minimal geometric core (the Fano plane)

---

## 2. Core Idea (Plain Language)

Every computation is treated as a **fold**:

- A fold reduces a space of possibilities
- Folding twice yields the same result as folding once (idempotence)
- Valid folds preserve structure (invariants)

The **Fano plane** (7 points, 7 lines) is the smallest structure where:
- All folds are representable
- Consistency can be checked locally
- Projection is loss-bounded

This becomes the **universal execution surface**.

---

## 3. The 8-Tuple (Semantic Closure)

All system behavior is expressed through **eight semantic registers**  
(derivable, composable, and sufficient):

| Axis | Meaning |
|----|----|
| **State** | What exists |
| **Symbol** | What is referenced |
| **Left** | Structural / static projection |
| **Right** | Experiential / dynamic projection |
| **Transition** | Change |
| **Source** | Origin |
| **Target** | Destination |
| **Result** | Outcome |

Every instruction, proof, visualization, and branch maps to this tuple.

---

## 4. Architecture Overview

```
┌──────────────────────────┐
│      RFC Layer           │  ← Formal semantics
├──────────────────────────┤
│     Proof Layer          │  ← Lean / Coq
├──────────────────────────┤
│     VM / ISA Layer       │  ← CAN-ISA, Origami VM
├──────────────────────────┤
│     Geometry Layer       │  ← Fano / folds / projections
├──────────────────────────┤
│     Time & Barrier Layer │  ← clocks, waits, scheduling
├──────────────────────────┤
│     Hardware Layer       │  ← ESP32, Pico, Android, Router
└──────────────────────────┘
```

No layer bypasses another.

---

## 5. Instruction Model (High Level)

Instructions are **folds**, not commands.

Examples:
- `MEET` → constraint intersection (GCD-like)
- `JOIN` → constraint union (LCM-like)
- `PROJ_FANO` → canonical projection
- `BARRIER_T` → physical time constraint
- `PATCH_*` → bounded self-modification

All instructions:
- Have fixed binary encodings
- Are formally spec’d
- Are provably safe or rejected

---

## 6. Visualization Is Not Decoration

Visualization is **semantic output**, not UI.

- SVG = exact 2D projection
- GLB = exact 3D/4D projection
- Edges encode direction, time, and causality
- Colors encode semantic axes
- Geometry **is executable state**

A rendered object always corresponds to a verifiable computation.

---

## 7. Repository Structure (Canonical)

```
tetragrammatron-os/
├── README.md
├── AGENTS.md
├── rfc/
│   ├── README.md
│   ├── RFC-0000-can-isa-invariants.md
│   ├── RFC-0009-origami-fold-vm.md
│   ├── RFC-0011-repo-lattice.md
│   ├── RFC-0012-binary-encoding.md
│   └── RFC-0013-time-and-barriers.md
├── core/
│   ├── canvasl/
│   ├── poly/
│   └── geometry/
├── vm/
│   ├── can-isa/
│   ├── origami-vm/
│   └── disassembler/
├── proof/
│   ├── lean/
│   └── coq/
├── assembler/
│   └── scheme/
├── hardware/
│   ├── esp32/
│   ├── pico/
│   └── android/
├── visualization/
│   ├── svg/
│   └── glb/
└── demos/
```

Branches are semantic, not temporal:
- `main` → normalized fixed point
- `current` → integration manifold
- `feature/*` → orthogonal semantic axes

**Merge gate.** All repo.canvasl edits pass through the Agent‑6 Fano merge gate:

- `repo.canvasl/kernel.canvasl` declares the lattice topology + branch policy.
- `repo.canvasl/<axis>/<axis>/<axis>/reg.canvasl` are the 8×8×8 registers.
- `repo.canvasl/triads/<axis>.canvasl` enumerate legal Fano lines per axis.
- `tools/gen_repo_canvasl.py` regenerates the kernel, registers, and triad files (`--check` verifies without modifying files). `make repo-lattice`, `make repo-check`, and `make repo-verify` wrap these commands (`repo-verify` also runs the Fano merge gate with `FANO_BASE=origin/main` by default).
- `tools/fano-merge-check.py` enforces topology + triads and runs in `.github/workflows/can-invariant-merge.yml`.

A merge is valid iff touched axes only form legal Fano triads and each axis has its triad declaration.

---

## 8. Hardware Philosophy

Hardware is not an endpoint — it is a **constraint oracle**.

ESP32, Pico, phones, and routers provide:
- Time
- Latency
- Entropy
- Physical limits

The VM adapts — never assumes.

---

## 9. Status

This project is:
- Research-grade
- Actively evolving
- Internally consistent
- Externally experimental

Expect:
- RFC-driven changes
- Formalization first
- Implementation second
- Demos last

---

## 10. Why the Name

**Tetragrammatron-OS**

- **Tetra** — binary quadratic form
- **Gramma** — grammar / wave / symbol
- **Tron** — automaton / machine
- **OS** — a 64-bit mnemonic interpreter

It names the *function*, not the myth.

---

## 11. Getting Involved

If you:
- Care about correctness
- Enjoy foundational systems
- Prefer proof over promise
- Want computation grounded in reality

Open an issue or read the RFCs.

---

## 12. Canonical Statement

> **Tetragrammatron-OS treats computation as geometry under constraint,  
> where execution, proof, time, and visualization are the same act.**
