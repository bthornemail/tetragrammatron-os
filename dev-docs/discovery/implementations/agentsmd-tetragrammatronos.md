# AGENTS.md — TetragrammatronOS

Owner: Brian Thorne  
Repo: bthornemail/tetragrammatron-os

## Mission
Build a proof-carrying, platform-agnostic VM + assembler + visualization contract where:
- bytecode execution is deterministic,
- canonicalization barriers enforce invariants,
- merges preserve Fano / dual-consensus consistency,
- targets include ESP32-S3, Pico 2 W, Termux Android, and host reference VMs.

This repo treats "correctness" as a **build artifact**:
- if a theorem fails, the branch cannot merge.

---

## Roles (humans and automated agents)

### Humans
- **Maintainer (Brian)**: owns RFC acceptance, release tags, and invariant policies.
- **Contributors**: implement RFC sections + tests + proofs.

### Automated agents (CI + scripts)
- **Proof agent**: runs Lean/Coq checks.
- **Assembler agent**: checks Scheme assembler emits canonical bytecode.
- **VM parity agent**: runs golden vectors across targets (host + ESP32 + Pico if available).

---

## Branch topology (semantic 8-tuple keywords)
We avoid symbols (Q Σ L R δ s t r). Use keywords:

1. `state/`        (was Q)
2. `alphabet/`     (was Σ)
3. `left/`         (was L)
4. `right/`        (was R)
5. `transition/`   (was δ)
6. `start/`        (was s)
7. `accept/`       (was t)
8. `reject/`       (was r)

### Core branches
- `main`      — normalized fixed point (must always pass proofs)
- `current`   — integration manifold
- `release/*` — frozen projections (tags come from here)
- `feature/<keyword>/<topic>` — active work streams (only merge into `current`)

---

## Merge rules (Fano-consistent only)
A merge is allowed only if all checks pass:

1. **Proof barrier**
   - Lean: `lake build`
   - Coq (if present): `make coq` or equivalent
2. **Bytecode determinism**
   - assembler emits identical bytes for identical source (hash stable)
   - CLBC-POLY / CAN-ISA encodings match golden vectors
3. **Dual-consensus invariant barrier**
   - If a component defines a “dual consensus scalar” (4D), it must either:
     - use a symmetric normalizer, OR
     - prove invariance under the repo’s canonicalization axiom
   - See: `lean/Tetragrammatron/Consensus/TriadicInvariant.lean`
4. **Fano triad gate**
   - Triad merges must preserve the 7-point/7-line incidence constraints for visualization states
   - If a PR touches renderer contracts, it must update the Fano triad tests.

---

## RFC process
- RFCs live in `rfc/`
- Each RFC must specify:
  - invariants (MUST / MUST NOT),
  - binary encoding (bit layouts),
  - test vectors,
  - proof obligations (Lean/Coq),
  - reference implementation path (Scheme VM first, then C firmware).

---

## Definition of "Done"
A feature is done when:
- Spec: RFC updated
- Code: Scheme reference + C firmware path exists (or explicitly deferred)
- Tests: golden vectors + property tests
- Proof: Lean theorem(s) compile and bind to the implementation invariants

---

## Contact / funding links
- Email: bthornemail@gmail.com
- Cash App: https://cash.app/$brianthorne
- Venmo: https://venmo.com/u/brianthorne
- LinkedIn: https://www.linkedin.com/in/brian-thorne-5b8a96112/
```

---

## 3) `GENESIS.md` (drop-in)

```markdown