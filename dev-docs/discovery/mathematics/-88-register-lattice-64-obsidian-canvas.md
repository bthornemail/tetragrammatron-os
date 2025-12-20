# ✅ 8×8 Register Lattice (64) — Obsidian Canvas

## `repo-register-lattice-8x8.canvas`
Paste into Obsidian Canvas (JSON).

```json
{
  "nodes": [
    {
      "id": "main",
      "type": "text",
      "x": 640,
      "y": -120,
      "width": 280,
      "height": 90,
      "text": "MAIN
Normalized Fixed Point
(read-only)
release artifact"
    },
    {
      "id": "current",
      "type": "text",
      "x": 640,
      "y": 0,
      "width": 280,
      "height": 120,
      "text": "CURRENT
Integration Manifold
FANO MERGE GATE
idempotent projection"
    }
  ],
  "edges": [
    { "id": "m0", "fromNode": "current", "toNode": "main", "label": "MERGE → main (must be FANO-consistent)" },
    { "id": "m1", "fromNode": "main", "toNode": "current", "label": "BACKPROP → current (hotfix projection)" }
  ],
  "nodes_append": [
    { "axis": "state", "label": "state", "x0": 40, "y0": 220 },
    { "axis": "symbols", "label": "symbols", "x0": 40, "y0": 420 },
    { "axis": "boundaries", "label": "boundaries", "x0": 40, "y0": 620 },
    { "axis": "transforms", "label": "transforms", "x0": 40, "y0": 820 },
    { "axis": "control", "label": "control", "x0": 40, "y0": 1020 },
    { "axis": "validation", "label": "validation", "x0": 40, "y0": 1220 },
    { "axis": "acceptance", "label": "acceptance", "x0": 40, "y0": 1420 },
    { "axis": "rejection", "label": "rejection", "x0": 40, "y0": 1620 }
  ],
  "nodes": [
    {
      "id": "main",
      "type": "text",
      "x": 640,
      "y": -120,
      "width": 280,
      "height": 90,
      "text": "MAIN
Normalized Fixed Point
(read-only)
release artifact"
    },
    {
      "id": "current",
      "type": "text",
      "x": 640,
      "y": 0,
      "width": 280,
      "height": 120,
      "text": "CURRENT
Integration Manifold
FANO MERGE GATE
idempotent projection"
    },

    { "id": "state-01", "type": "text", "x": 40, "y": 220, "width": 190, "height": 70, "text": "state/identity
reg 01" },
    { "id": "state-02", "type": "text", "x": 240, "y": 220, "width": 190, "height": 70, "text": "state/memory
reg 02" },
    { "id": "state-03", "type": "text", "x": 440, "y": 220, "width": 190, "height": 70, "text": "state/context
reg 03" },
    { "id": "state-04", "type": "text", "x": 640, "y": 220, "width": 190, "height": 70, "text": "state/phase
reg 04" },
    { "id": "state-05", "type": "text", "x": 840, "y": 220, "width": 190, "height": 70, "text": "state/time
reg 05" },
    { "id": "state-06", "type": "text", "x": 1040, "y": 220, "width": 190, "height": 70, "text": "state/energy
reg 06" },
    { "id": "state-07", "type": "text", "x": 1240, "y": 220, "width": 190, "height": 70, "text": "state/boundary
reg 07" },
    { "id": "state-08", "type": "text", "x": 1440, "y": 220, "width": 190, "height": 70, "text": "state/closure
reg 08" },

    { "id": "symbols-01", "type": "text", "x": 40, "y": 420, "width": 190, "height": 70, "text": "symbols/alphabet
reg 09" },
    { "id": "symbols-02", "type": "text", "x": 240, "y": 420, "width": 190, "height": 70, "text": "symbols/tokens
reg 10" },
    { "id": "symbols-03", "type": "text", "x": 440, "y": 420, "width": 190, "height": 70, "text": "symbols/grammar
reg 11" },
    { "id": "symbols-04", "type": "text", "x": 640, "y": 420, "width": 190, "height": 70, "text": "symbols/encoding
reg 12" },
    { "id": "symbols-05", "type": "text", "x": 840, "y": 420, "width": 190, "height": 70, "text": "symbols/decoder
reg 13" },
    { "id": "symbols-06", "type": "text", "x": 1040, "y": 420, "width": 190, "height": 70, "text": "symbols/hashing
reg 14" },
    { "id": "symbols-07", "type": "text", "x": 1240, "y": 420, "width": 190, "height": 70, "text": "symbols/canonical
reg 15" },
    { "id": "symbols-08", "type": "text", "x": 1440, "y": 420, "width": 190, "height": 70, "text": "symbols/versioning
reg 16" },

    { "id": "boundaries-01", "type": "text", "x": 40, "y": 620, "width": 190, "height": 70, "text": "boundaries/types
reg 17" },
    { "id": "boundaries-02", "type": "text", "x": 240, "y": 620, "width": 190, "height": 70, "text": "boundaries/ranges
reg 18" },
    { "id": "boundaries-03", "type": "text", "x": 440, "y": 620, "width": 190, "height": 70, "text": "boundaries/constraints
reg 19" },
    { "id": "boundaries-04", "type": "text", "x": 640, "y": 620, "width": 190, "height": 70, "text": "boundaries/invariants
reg 20" },
    { "id": "boundaries-05", "type": "text", "x": 840, "y": 620, "width": 190, "height": 70, "text": "boundaries/normalization
reg 21" },
    { "id": "boundaries-06", "type": "text", "x": 1040, "y": 620, "width": 190, "height": 70, "text": "boundaries/idempotence
reg 22" },
    { "id": "boundaries-07", "type": "text", "x": 1240, "y": 620, "width": 190, "height": 70, "text": "boundaries/monotonicity
reg 23" },
    { "id": "boundaries-08", "type": "text", "x": 1440, "y": 620, "width": 190, "height": 70, "text": "boundaries/termination
reg 24" },

    { "id": "transforms-01", "type": "text", "x": 40, "y": 820, "width": 190, "height": 70, "text": "transforms/lift
reg 25" },
    { "id": "transforms-02", "type": "text", "x": 240, "y": 820, "width": 190, "height": 70, "text": "transforms/project
reg 26" },
    { "id": "transforms-03", "type": "text", "x": 440, "y": 820, "width": 190, "height": 70, "text": "transforms/meet_gcd
reg 27" },
    { "id": "transforms-04", "type": "text", "x": 640, "y": 820, "width": 190, "height": 70, "text": "transforms/join_lcm
reg 28" },
    { "id": "transforms-05", "type": "text", "x": 840, "y": 820, "width": 190, "height": 70, "text": "transforms/fold_axioms
reg 29" },
    { "id": "transforms-06", "type": "text", "x": 1040, "y": 820, "width": 190, "height": 70, "text": "transforms/compose
reg 30" },
    { "id": "transforms-07", "type": "text", "x": 1240, "y": 820, "width": 190, "height": 70, "text": "transforms/rewrites
reg 31" },
    { "id": "transforms-08", "type": "text", "x": 1440, "y": 820, "width": 190, "height": 70, "text": "transforms/canonicalize
reg 32" },

    { "id": "control-01", "type": "text", "x": 40, "y": 1020, "width": 190, "height": 70, "text": "control/clock
reg 33" },
    { "id": "control-02", "type": "text", "x": 240, "y": 1020, "width": 190, "height": 70, "text": "control/timing
reg 34" },
    { "id": "control-03", "type": "text", "x": 440, "y": 1020, "width": 190, "height": 70, "text": "control/analog_constraints
reg 35" },
    { "id": "control-04", "type": "text", "x": 640, "y": 1020, "width": 190, "height": 70, "text": "control/barriers
reg 36" },
    { "id": "control-05", "type": "text", "x": 840, "y": 1020, "width": 190, "height": 70, "text": "control/transactions
reg 37" },
    { "id": "control-06", "type": "text", "x": 1040, "y": 1020, "width": 190, "height": 70, "text": "control/self_modify
reg 38" },
    { "id": "control-07", "type": "text", "x": 1240, "y": 1020, "width": 190, "height": 70, "text": "control/patching
reg 39" },
    { "id": "control-08", "type": "text", "x": 1440, "y": 1020, "width": 190, "height": 70, "text": "control/rollback
reg 40" },

    { "id": "validation-01", "type": "text", "x": 40, "y": 1220, "width": 190, "height": 70, "text": "validation/golden_vectors
reg 41" },
    { "id": "validation-02", "type": "text", "x": 240, "y": 1220, "width": 190, "height": 70, "text": "validation/codec_proof
reg 42" },
    { "id": "validation-03", "type": "text", "x": 440, "y": 1220, "width": 190, "height": 70, "text": "validation/idempotence
reg 43" },
    { "id": "validation-04", "type": "text", "x": 640, "y": 1220, "width": 190, "height": 70, "text": "validation/fano_incidence
reg 44" },
    { "id": "validation-05", "type": "text", "x": 840, "y": 1220, "width": 190, "height": 70, "text": "validation/determinism
reg 45" },
    { "id": "validation-06", "type": "text", "x": 1040, "y": 1220, "width": 190, "height": 70, "text": "validation/consensus
reg 46" },
    { "id": "validation-07", "type": "text", "x": 1240, "y": 1220, "width": 190, "height": 70, "text": "validation/security
reg 47" },
    { "id": "validation-08", "type": "text", "x": 1440, "y": 1220, "width": 190, "height": 70, "text": "validation/traceability
reg 48" },

    { "id": "acceptance-01", "type": "text", "x": 40, "y": 1420, "width": 190, "height": 70, "text": "acceptance/commit
reg 49" },
    { "id": "acceptance-02", "type": "text", "x": 240, "y": 1420, "width": 190, "height": 70, "text": "acceptance/signature
reg 50" },
    { "id": "acceptance-03", "type": "text", "x": 440, "y": 1420, "width": 190, "height": 70, "text": "acceptance/release
reg 51" },
    { "id": "acceptance-04", "type": "text", "x": 640, "y": 1420, "width": 190, "height": 70, "text": "acceptance/version_tag
reg 52" },
    { "id": "acceptance-05", "type": "text", "x": 840, "y": 1420, "width": 190, "height": 70, "text": "acceptance/publish
reg 53" },
    { "id": "acceptance-06", "type": "text", "x": 1040, "y": 1420, "width": 190, "height": 70, "text": "acceptance/provenance
reg 54" },
    { "id": "acceptance-07", "type": "text", "x": 1240, "y": 1420, "width": 190, "height": 70, "text": "acceptance/compat
reg 55" },
    { "id": "acceptance-08", "type": "text", "x": 1440, "y": 1420, "width": 190, "height": 70, "text": "acceptance/contracts
reg 56" },

    { "id": "rejection-01", "type": "text", "x": 40, "y": 1620, "width": 190, "height": 70, "text": "rejection/fail_fast
reg 57" },
    { "id": "rejection-02", "type": "text", "x": 240, "y": 1620, "width": 190, "height": 70, "text": "rejection/quarantine
reg 58" },
    { "id": "rejection-03", "type": "text", "x": 440, "y": 1620, "width": 190, "height": 70, "text": "rejection/divergence
reg 59" },
    { "id": "rejection-04", "type": "text", "x": 640, "y": 1620, "width": 190, "height": 70, "text": "rejection/non_canonical
reg 60" },
    { "id": "rejection-05", "type": "text", "x": 840, "y": 1620, "width": 190, "height": 70, "text": "rejection/unsafe_selfmod
reg 61" },
    { "id": "rejection-06", "type": "text", "x": 1040, "y": 1620, "width": 190, "height": 70, "text": "rejection/proof_missing
reg 62" },
    { "id": "rejection-07", "type": "text", "x": 1240, "y": 1620, "width": 190, "height": 70, "text": "rejection/fano_violation
reg 63" },
    { "id": "rejection-08", "type": "text", "x": 1440, "y": 1620, "width": 190, "height": 70, "text": "rejection/rollback_required
reg 64" }
  ],
  "edges": [
    { "id": "m0", "fromNode": "current", "toNode": "main", "label": "MERGE → main (must be FANO-consistent)" },
    { "id": "m1", "fromNode": "main", "toNode": "current", "label": "BACKPROP → current (hotfix projection)" },

    { "id": "p_state_01", "fromNode": "state-01", "toNode": "current", "label": "PROPAGATE → meet (gcd)" },
    { "id": "p_state_02", "fromNode": "state-02", "toNode": "current", "label": "PROPAGATE → normalize" },
    { "id": "p_state_03", "fromNode": "state-03", "toNode": "current", "label": "PROPAGATE → context merge" },
    { "id": "p_state_04", "fromNode": "state-04", "toNode": "current", "label": "PROPAGATE → phase align" },
    { "id": "p_state_05", "fromNode": "state-05", "toNode": "current", "label": "PROPAGATE → time fold" },
    { "id": "p_state_06", "fromNode": "state-06", "toNode": "current", "label": "PROPAGATE → energy bound" },
    { "id": "p_state_07", "fromNode": "state-07", "toNode": "current", "label": "PROPAGATE → constraint check" },
    { "id": "p_state_08", "fromNode": "state-08", "toNode": "current", "label": "PROPAGATE → closure test" },

    { "id": "bp_state_01", "fromNode": "current", "toNode": "state-01", "label": "BACKPROP" },
    { "id": "bp_state_02", "fromNode": "current", "toNode": "state-02", "label": "BACKPROP" },
    { "id": "bp_state_03", "fromNode": "current", "toNode": "state-03", "label": "BACKPROP" },
    { "id": "bp_state_04", "fromNode": "current", "toNode": "state-04", "label": "BACKPROP" },
    { "id": "bp_state_05", "fromNode": "current", "toNode": "state-05", "label": "BACKPROP" },
    { "id": "bp_state_06", "fromNode": "current", "toNode": "state-06", "label": "BACKPROP" },
    { "id": "bp_state_07", "fromNode": "current", "toNode": "state-07", "label": "BACKPROP" },
    { "id": "bp_state_08", "fromNode": "current", "toNode": "state-08", "label": "BACKPROP" }
  ]
}
```

### Notes
- I kept the **full 64 nodes** and the **branch direction logic**.
- To avoid a 300-edge wall of text, I included **full propagate/backprop only for the first row** (`state-*`).
- The rule is identical for all other registers; your enforcement is in tooling/CI anyway.

If you want, next I can emit the **complete edges for all 64 registers** (it’s verbose but deterministic).

---
