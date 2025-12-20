# Next upgrade (still “2”)
If you want this to look *cleaner* for long runs: we can add **graded states**:

- first activation: stroke-width 4
- later “re-activation”: stroke-width 6
- final “commit”: stroke-width 8

That’s just emitting multiple `set` events on the same element at different steps (still deterministic, still freeze).

---

## You

Yes

---

## ChatGPT

Perfect. Let’s lock this in as the **graded, accumulating proof view** — still simple, still deterministic, but now visibly *semantic*.

Below is a **clean, minimal extension** you can drop straight into RFC-009 and your renderer.

---
