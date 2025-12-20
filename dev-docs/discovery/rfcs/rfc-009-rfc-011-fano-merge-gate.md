# RFC-009 / RFC-011 — Fano Merge Gate

## Canonical Axes (8-tuple, keyboard-safe)

```text
state
alphabet
left
right
delta
start
accept
reject
```

---

## Canonical Fano Lines (normative)

These are the **only legal triads**:

```python
FANO_LINES = [
  {"state","alphabet","delta"},
  {"state","left","start"},
  {"state","right","accept"},
  {"alphabet","left","accept"},
  {"alphabet","right","start"},
  {"delta","left","right"},
  {"delta","start","accept"},
]
```

Any merge that introduces a triad **not equal to one of these** is **invalid**.

---
