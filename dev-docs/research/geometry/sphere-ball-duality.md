# Sphere–Ball Duality (Boundary vs Interior) — Research Note

**Status:** Non‑normative  
**Source:** Split archive at `dev-docs/_archive/chat-exports/2025-12-20-n-sphere-vs-n-ball/`

## What is mathematically solid

- **Boundary relation:** \(\partial B^{n+1} = S^n\).  
  An \(n\)-sphere is the boundary of an \((n+1)\)-ball.
- **Inclusion:** \(S^n \subset B^{n+1}\) is canonical; a map \(S^n \to B^{n+1}\) is **not** canonical without extra structure.

## How (and how not) to use this in Tetragrammatron‑OS

- **Useful abstraction:** “boundary vs interior” maps cleanly onto **constraint vs admissible state**, or **type vs value**.
- **Avoid overreach:** indexing conventions (0‑based/1‑based) are **labels**, not physics, and do not by themselves generate topology.
- **If you introduce a \(\psi\) mapping:** treat it as an **explicit interface** (versioned, testable, rejectable), not as a theorem.

## Pointers

- Original chat export (split): `dev-docs/_archive/chat-exports/2025-12-20-n-sphere-vs-n-ball/README.md`
- Authoritative system docs: `rfc/README.md`, `proof/INDEX.md`, `vm/README.md`

