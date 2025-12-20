# Register File Format (Template)

Example file: `registers/v1/state/logic/dynamics.canvasl`

```yaml
register:
  id: "v1:state:logic:dynamics"
  axes: ["state", "logic", "dynamics"]

  state:
    codec: "CLBC-POLY-v1"
    bytes_hex: ""          # canonical bytes, if available
    jsonl_poly: []         # optional, if you store canonical JSONL terms too

  invariant:
    canon_digest: ""       # sha256 of canonical bytes
    validator: "origami-vm-validate@0.1.0"

  provenance:
    created_from: ""
    last_proof: ""
```

---
