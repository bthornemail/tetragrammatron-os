---
base:
  name: Drift Events
  source:
    folders:
      - .ulp/drift/events
  filters:
    - path.endsWith("drift.jsonl")
  columns:
    - name: Time
      value: t
    - name: Kind
      value: k
    - name: Value
      value: v
---

# Drift Events

This is an append-only log of structural changes.

Use it as:
- consensus timeline
- audit trail
- replay driver for the 3D renderer

