# ✅ Minimal `.canvasl` Register Template (append-only)

Use this exact header for every register file:

```yaml
$schema: "canvasl://repo/register/v1"
kind: register
path: registers/<axis>/<name>.canvasl
rules:
  append_only: true
  merge_targets:
    - current
  backprop_source: current
  merge_gate: fano_consistency
state:
  poly:
    clbc_hex: ""          # canonical CLBC-POLY bytes, if materialized
  notes: []
  proof_refs: []
  last_commit_hash: ""
```

---
