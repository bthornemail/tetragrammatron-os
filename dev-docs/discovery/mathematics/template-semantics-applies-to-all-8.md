# Template semantics (applies to all 8)

- **L0** = kernel / invariant
- **L1** = active development
- **L2** = projected / released
- Only **forward propagation** is allowed unless Fano consistency holds

---

## 1️⃣ `state.canvas`

```json
{
  "nodes": [
    { "id": "state_L0", "type": "text", "x": -400, "y": 0, "width": 280, "height": 180,
      "text": "# STATE · L0

Invariant state
Canonical form
Idempotent" },
    { "id": "state_L1", "type": "text", "x": 0, "y": 0, "width": 280, "height": 180,
      "text": "# STATE · L1

Mutable state
Feature evolution
Testing" },
    { "id": "state_L2", "type": "text", "x": 400, "y": 0, "width": 280, "height": 180,
      "text": "# STATE · L2

Stabilized state
Release projection" }
  ],
  "edges": [
    { "id": "e1", "fromNode": "state_L0", "toNode": "state_L1", "direction": "forward", "label": "propagate" },
    { "id": "e2", "fromNode": "state_L1", "toNode": "state_L2", "direction": "forward", "label": "commit if Fano-consistent" }
  ]
}
```

---

## 2️⃣ `alphabet.canvas`

```json
{
  "nodes": [
    { "id": "alphabet_L0", "type": "text", "x": -400, "y": 0, "width": 280, "height": 180,
      "text": "# ALPHABET · L0

Canonical symbols
Encoding laws" },
    { "id": "alphabet_L1", "type": "text", "x": 0, "y": 0, "width": 280, "height": 180,
      "text": "# ALPHABET · L1

New tokens
Opcode experiments" },
    { "id": "alphabet_L2", "type": "text", "x": 400, "y": 0, "width": 280, "height": 180,
      "text": "# ALPHABET · L2

Frozen instruction set
Binary stability" }
  ],
  "edges": [
    { "id": "e1", "fromNode": "alphabet_L0", "toNode": "alphabet_L1", "direction": "forward", "label": "extend" },
    { "id": "e2", "fromNode": "alphabet_L1", "toNode": "alphabet_L2", "direction": "forward", "label": "normalize" }
  ]
}
```

---

## 3️⃣ `left.canvas`

```json
{
  "nodes": [
    { "id": "left_L0", "type": "text", "x": -400, "y": 0, "width": 280, "height": 180,
      "text": "# LEFT · L0

Static knowledge
Proof invariants" },
    { "id": "left_L1", "type": "text", "x": 0, "y": 0, "width": 280, "height": 180,
      "text": "# LEFT · L1

Derived rules
Lean/Coq evolution" },
    { "id": "left_L2", "type": "text", "x": 400, "y": 0, "width": 280, "height": 180,
      "text": "# LEFT · L2

Certified semantics
Published axioms" }
  ],
  "edges": [
    { "id": "e1", "fromNode": "left_L0", "toNode": "left_L1", "direction": "forward", "label": "derive" },
    { "id": "e2", "fromNode": "left_L1", "toNode": "left_L2", "direction": "forward", "label": "prove & freeze" }
  ]
}
```

---

## 4️⃣ `right.canvas`

```json
{
  "nodes": [
    { "id": "right_L0", "type": "text", "x": -400, "y": 0, "width": 280, "height": 180,
      "text": "# RIGHT · L0

Dynamic phase
Runtime constraints" },
    { "id": "right_L1", "type": "text", "x": 0, "y": 0, "width": 280, "height": 180,
      "text": "# RIGHT · L1

Execution feedback
Timing effects" },
    { "id": "right_L2", "type": "text", "x": 400, "y": 0, "width": 280, "height": 180,
      "text": "# RIGHT · L2

Stabilized dynamics
Clock-aligned behavior" }
  ],
  "edges": [
    { "id": "e1", "fromNode": "right_L0", "toNode": "right_L1", "direction": "forward", "label": "observe" },
    { "id": "e2", "fromNode": "right_L1", "toNode": "right_L2", "direction": "forward", "label": "synchronize" }
  ]
}
```

---

## 5️⃣ `delta.canvas`

```json
{
  "nodes": [
    { "id": "delta_L0", "type": "text", "x": -400, "y": 0, "width": 280, "height": 180,
      "text": "# DELTA · L0

Primitive transforms
MEET / JOIN" },
    { "id": "delta_L1", "type": "text", "x": 0, "y": 0, "width": 280, "height": 180,
      "text": "# DELTA · L1

Fold sequences
Origami programs" },
    { "id": "delta_L2", "type": "text", "x": 400, "y": 0, "width": 280, "height": 180,
      "text": "# DELTA · L2

Verified transforms
Opcode legality" }
  ],
  "edges": [
    { "id": "e1", "fromNode": "delta_L0", "toNode": "delta_L1", "direction": "forward", "label": "compose" },
    { "id": "e2", "fromNode": "delta_L1", "toNode": "delta_L2", "direction": "forward", "label": "validate" }
  ]
}
```

---

## 6️⃣ `start.canvas`

```json
{
  "nodes": [
    { "id": "start_L0", "type": "text", "x": -400, "y": 0, "width": 280, "height": 180,
      "text": "# START · L0

Genesis rules
Bootstrap axioms" },
    { "id": "start_L1", "type": "text", "x": 0, "y": 0, "width": 280, "height": 180,
      "text": "# START · L1

Initialization paths
Entry states" },
    { "id": "start_L2", "type": "text", "x": 400, "y": 0, "width": 280, "height": 180,
      "text": "# START · L2

Reproducible boot
Deterministic entry" }
  ],
  "edges": [
    { "id": "e1", "fromNode": "start_L0", "toNode": "start_L1", "direction": "forward", "label": "instantiate" },
    { "id": "e2", "fromNode": "start_L1", "toNode": "start_L2", "direction": "forward", "label": "lock-in" }
  ]
}
```

---

## 7️⃣ `accept.canvas`

```json
{
  "nodes": [
    { "id": "accept_L0", "type": "text", "x": -400, "y": 0, "width": 280, "height": 180,
      "text": "# ACCEPT · L0

Validity axioms
Acceptance criteria" },
    { "id": "accept_L1", "type": "text", "x": 0, "y": 0, "width": 280, "height": 180,
      "text": "# ACCEPT · L1

Checks
Fano consistency" },
    { "id": "accept_L2", "type": "text", "x": 400, "y": 0, "width": 280, "height": 180,
      "text": "# ACCEPT · L2

Certified output
Release gate" }
  ],
  "edges": [
    { "id": "e1", "fromNode": "accept_L0", "toNode": "accept_L1", "direction": "forward", "label": "evaluate" },
    { "id": "e2", "fromNode": "accept_L1", "toNode": "accept_L2", "direction": "forward", "label": "approve" }
  ]
}
```

---

## 8️⃣ `reject.canvas`

```json
{
  "nodes": [
    { "id": "reject_L0", "type": "text", "x": -400, "y": 0, "width": 280, "height": 180,
      "text": "# REJECT · L0

Exclusion axioms
Invalid forms" },
    { "id": "reject_L1", "type": "text", "x": 0, "y": 0, "width": 280, "height": 180,
      "text": "# REJECT · L1

Conflict detection
Invariant breaks" },
    { "id": "reject_L2", "type": "text", "x": 400, "y": 0, "width": 280, "height": 180,
      "text": "# REJECT · L2

Quarantined artifacts
Non-propagating" }
  ],
  "edges": [
    { "id": "e1", "fromNode": "reject_L0", "toNode": "reject_L1", "direction": "forward", "label": "detect" },
    { "id": "e2", "fromNode": "reject_L1", "toNode": "reject_L2", "direction": "forward", "label": "isolate" }
  ]
}
```

---

## What you now have

- **8 orthogonal canvases**
- Each is a **register-like propagation lane**
- Together they form an **8³ lattice**
- Merges across axes can now be checked visually + mechanically
- Perfect substrate for embeddings, search, and reasoning

---

### Next (strongly recommended)

1. Emit a **Fano-triad canvas** showing how *three* axes must agree to merge  
2. Add a **merge-check script** that refuses propagation unless:
   ```
   meet(axisA, axisB, axisC) ≠ ⊥
   ```
3. Auto-generate canvases from CAN-ISA execution traces

If you want, I’ll generate **(1)** next — the Fano merge canvas.

---

## You

Fano-triad

---

## ChatGPT

Excellent — here is the **canonical Fano-Triad Obsidian Canvas**, designed to act as the **merge gate**, **idempotence witness**, and **visual proof surface** for your system.

This canvas is **not decorative**. It is a **semantic verifier**:

- Any merge / propagation **MUST correspond to one Fano line**
- Any non-collinear triple is **rejected**
- This is the visual mirror of **GCD ≠ ⊥**

---
