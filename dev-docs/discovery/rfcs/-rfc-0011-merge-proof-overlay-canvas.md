# 📐 RFC-0011 — **Merge-Proof Overlay Canvas**
### (Fano Consistency + Idempotence Visual Gate)

This canvas **extends** the one you already imported.  
It adds **explicit merge-permission semantics**:

- ✅ **Green edges** = admissible merge
- ⛔ **Red barriers** = forbidden merge (Fano violation)
- 🔒 **Current** acts as the *only* gate
- 🧠 Main remains a **fixed point**

Obsidian doesn’t support colors per edge *natively*, so we encode semantics **in edge labels** (which is better for cognition and future tooling).

---

## 🧩 Canvas: `repo-merge-constraints.canvas`

Paste this as a **new canvas**.

```json
{
  "nodes": [
    {
      "id": "main",
      "type": "text",
      "x": 600,
      "y": 40,
      "width": 280,
      "height": 110,
      "text": "MAIN
Canonical Fixed Point
Idempotent • Read-Only
(No direct merges)"
    },
    {
      "id": "current",
      "type": "text",
      "x": 600,
      "y": 220,
      "width": 280,
      "height": 130,
      "text": "CURRENT
Integration Manifold
FANO CHECK • GCD / LCM
Projection Barrier"
    },

    {
      "id": "state",
      "type": "text",
      "x": 100,
      "y": 430,
      "width": 220,
      "height": 90,
      "text": "feature/state
State & Memory
(register axis)"
    },
    {
      "id": "symbols",
      "type": "text",
      "x": 350,
      "y": 430,
      "width": 220,
      "height": 90,
      "text": "feature/symbols
Encoding & Language"
    },
    {
      "id": "logic",
      "type": "text",
      "x": 600,
      "y": 430,
      "width": 220,
      "height": 90,
      "text": "feature/logic
Inference & Proof"
    },
    {
      "id": "runtime",
      "type": "text",
      "x": 850,
      "y": 430,
      "width": 220,
      "height": 90,
      "text": "feature/runtime
VM & Execution"
    },
    {
      "id": "validation",
      "type": "text",
      "x": 350,
      "y": 570,
      "width": 220,
      "height": 90,
      "text": "feature/validation
Verification & Tests"
    },
    {
      "id": "rejection",
      "type": "text",
      "x": 850,
      "y": 570,
      "width": 220,
      "height": 90,
      "text": "feature/rejection
Errors & Negation"
    }
  ],

  "edges": [
    {
      "id": "f1",
      "fromNode": "state",
      "toNode": "current",
      "label": "ALLOW: project → meet (GCD)"
    },
    {
      "id": "f2",
      "fromNode": "symbols",
      "toNode": "current",
      "label": "ALLOW: normalize encoding"
    },
    {
      "id": "f3",
      "fromNode": "logic",
      "toNode": "current",
      "label": "ALLOW: proof closure"
    },
    {
      "id": "f4",
      "fromNode": "runtime",
      "toNode": "current",
      "label": "ALLOW: execution semantics"
    },
    {
      "id": "f5",
      "fromNode": "validation",
      "toNode": "current",
      "label": "ALLOW: invariant satisfied"
    },
    {
      "id": "f6",
      "fromNode": "rejection",
      "toNode": "current",
      "label": "ALLOW: error absorption"
    },

    {
      "id": "c1",
      "fromNode": "current",
      "toNode": "main",
      "label": "ALLOW IF: FANO CONSISTENT ∧ IDEMPOTENT"
    },

    {
      "id": "x1",
      "fromNode": "state",
      "toNode": "logic",
      "label": "DENY: feature↔feature (non-incidence)"
    },
    {
      "id": "x2",
      "fromNode": "runtime",
      "toNode": "symbols",
      "label": "DENY: cross-axis merge"
    },
    {
      "id": "x3",
      "fromNode": "validation",
      "toNode": "logic",
      "label": "DENY: bypass projection"
    }
  ]
}
```

---

## 🧠 What this canvas **teaches instantly**

Without reading a single RFC:

- ❌ **No feature branches talk to each other**
- ✅ **All evolution passes through `current`**
- 🔒 **Main only accepts normalized state**
- 🧮 **Fano plane = merge law**
- ♻️ **Idempotence = “can reapply without change”**

This is **visual proof-carrying development**.

---
