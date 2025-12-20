# 1. **Extended CanvasL JSON Schema (CanvasL-POLY v1.0)**  
*(Normative, machine-checkable)*

You can publish this as:

```
canvasl-poly.schema.json
```

### 1.1 Top-Level Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://canvasl.org/schema/canvasl-poly-v1.json",
  "title": "CanvasL Polynomial Execution Step",
  "type": "object",
  "required": ["id", "phase", "boundary", "anchor", "op", "inputs", "outputs"],
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
    }
  },
  "oneOf": [
    { "$ref": "#/$defs/define_encoder" },
    { "$ref": "#/$defs/apply_encoder" },
    { "$ref": "#/$defs/decode_and_validate" }
  ],
  "additionalProperties": false,
  "$defs": {
```

---

### 1.2 `define_encoder`

```json
    "define_encoder": {
      "required": ["op", "encoder_id", "ring", "basis_dim", "poly_form", "coeffs"],
      "properties": {
        "op": { "const": "define_encoder" },
        "encoder_id": { "type": "string" },
        "ring": {
          "type": "string",
          "enum": ["Z", "Zmod2", "Q", "R"]
        },
        "basis_dim": {
          "type": "integer",
          "minimum": 1
        },
        "poly_form": {
          "type": "string",
          "enum": ["affine", "degree2", "multilinear", "sparse"]
        },
        "coeffs": {
          "type": "object",
          "additionalProperties": { "type": "string" }
        }
      }
    },
```

**Normative meaning**  
Defines the **local encoder function family** via coefficients.  
These coefficients are *structural parameters*, not secrets.

---

### 1.3 `apply_encoder`

```json
    "apply_encoder": {
      "required": ["op", "encoder_ref", "vars", "evaluation"],
      "properties": {
        "op": { "const": "apply_encoder" },
        "encoder_ref": { "type": "string" },
        "vars": {
          "type": "object",
          "additionalProperties": { "type": "string" }
        },
        "evaluation": {
          "type": "object",
          "required": ["mode"],
          "properties": {
            "mode": {
              "type": "string",
              "enum": ["deterministic"]
            },
            "precision": {
              "type": "string",
              "enum": ["exact", "bounded"]
            }
          }
        }
      }
    },
```

**Normative meaning**  
Applies the encoder to streamed variables (data references), producing an encoded state.

---

### 1.4 `decode_and_validate`

```json
    "decode_and_validate": {
      "required": ["op", "decoder", "target", "checks"],
      "properties": {
        "op": { "const": "decode_and_validate" },
        "decoder": {
          "type": "object",
          "required": ["mode"],
          "properties": {
            "mode": {
              "type": "string",
              "enum": ["boundary_relative"]
            },
            "strategy": {
              "type": "string",
              "enum": ["canonical_under_automorphism"]
            }
          }
        },
        "target": { "type": "string" },
        "checks": {
          "type": "array",
          "items": {
            "type": "string",
            "enum": [
              "schema",
              "boundary_id_match",
              "automorphism_match",
              "fano_incidence",
              "pcg_pair_cover"
            ]
          }
        }
      }
    }
```

**Normative meaning**  
Decodes encoded state under the Boundary and asserts structural validity.

---

### 1.5 File-Level Constraints (Normative)

A CanvasL-POLY JSONL file is valid iff:

1. Each line validates against this schema
2. `phase` strictly increases
3. All `inputs` reference earlier `outputs` or declared artifacts
4. `boundary` and `anchor` are consistent
5. All `decode_and_validate` steps succeed

---
