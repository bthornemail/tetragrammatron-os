# Appendix B — CanvasL-POLY JSON Schema (Normative)

This schema defines the **authoritative executable contract** for CanvasL-POLY traces.

> **Claim:** Any executor conforming to this schema and semantics is BICF-compliant for polynomial state evolution.

### B.1 File-Level Rules (Normative)

A CanvasL-POLY trace:

1. MUST be valid JSONL (one object per line)
2. MUST be strictly ordered by `phase`
3. MUST reference exactly one `boundary`
4. MUST be prefix-closed
5. MUST be deterministic under replay

---

### B.2 JSON Schema (Draft 2020-12)

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://canvasl.org/schema/canvasl-poly-v1.json",
  "title": "CanvasL-POLY Execution Step",
  "type": "object",
  "required": [
    "id",
    "phase",
    "boundary",
    "anchor",
    "op",
    "inputs",
    "outputs"
  ],
  "properties": {
    "id": { "type": "string" },
    "phase": { "type": "integer", "minimum": 0 },
    "boundary": { "type": "string" },
    "anchor": { "type": "string" },
    "op": {
      "type": "string",
      "enum": [
        "define_encoder",
        "apply_encoder",
        "decode_and_validate"
      ]
    },
    "inputs": {
      "type": "array",
      "items": { "type": "string" }
    },
    "outputs": {
      "type": "array",
      "items": { "type": "string" }
    },

    "encoder_id": { "type": "string" },
    "ring": { "type": "string" },
    "basis_dim": { "type": "integer", "minimum": 1 },
    "poly_form": { "type": "string" },
    "coeffs": { "type": "object" },

    "encoder_ref": { "type": "string" },
    "vars": { "type": "object" },

    "decoder": { "type": "object" },
    "checks": {
      "type": "array",
      "items": { "type": "string" }
    }
  },
  "additionalProperties": false,
  "allOf": [
    {
      "if": { "properties": { "op": { "const": "define_encoder" } } },
      "then": { "required": ["encoder_id", "ring", "basis_dim", "poly_form", "coeffs"] }
    },
    {
      "if": { "properties": { "op": { "const": "apply_encoder" } } },
      "then": { "required": ["encoder_ref", "vars"] }
    },
    {
      "if": { "properties": { "op": { "const": "decode_and_validate" } } },
      "then": { "required": ["decoder", "checks"] }
    }
  ]
}
```

This schema is **sufficient for independent implementation**.

---
