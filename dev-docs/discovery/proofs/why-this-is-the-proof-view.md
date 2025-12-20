# Why this is the “proof view”
- Your VM trace is essentially a sequence of constraints/derivations.
- Accumulating visualization means the diagram is **monotone**: once a fact is established, it persists.
- That aligns with your **idempotence** story (re-applying the same event doesn’t change the final rendered state).

---
