# 1. CanvasL JSON Schema (Authoritative)

This schema is intentionally **strict**:
- reviewers can validate files mechanically,
- tools can reject malformed boundaries,
- execution semantics are unambiguous.

You can publish this as:

```
canvasl.schema.json
```

---

## 1.1 Top-level JSONL record schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://canvasl.org/schema/canvasl.json",
  "title": "CanvasL JSONL Record",
  "type": "object",
  "required": ["id", "phase", "type", "body"],
  "properties": {
    "id": {
      "type": "string",
      "description": "Globally unique identifier for the record"
    },
    "phase": {
      "type": "integer",
      "minimum": 0,
      "description": "Sequential execution phase"
    },
    "type": {
      "type": "string",
      "enum": ["boundary", "ticket", "guarantee"]
    },
    "ref": {
      "type": "string",
      "description": "Optional Git / Lean / Coq reference"
    },
    "body": {
      "type": "object"
    }
  },
  "allOf": [
    { "$ref": "#/$defs/boundaryRecord" },
    { "$ref": "#/$defs/ticketRecord" },
    { "$ref": "#/$defs/guaranteeRecord" }
  ],
  "$defs": {
```

---

## 1.2 Boundary record

```json
    "boundaryRecord": {
      "if": {
        "properties": { "type": { "const": "boundary" } }
      },
      "then": {
        "required": ["body"],
        "properties": {
          "body": {
            "type": "object",
            "properties": {
              "domain": {
                "type": "object",
                "properties": {
                  "points": {
                    "type": "array",
                    "items": { "type": "integer" },
                    "minItems": 1
                  },
                  "lines": {
                    "type": "array",
                    "items": { "type": "string" }
                  }
                },
                "required": ["points"]
              },
              "incidence": {
                "type": "object",
                "additionalProperties": {
                  "type": "array",
                  "items": { "type": "integer" },
                  "minItems": 3,
                  "maxItems": 3
                }
              },
              "properties": {
                "type": "object",
                "properties": {
                  "line_cardinality": { "const": 3 },
                  "unique_line_through_two_points": { "type": "boolean" }
                }
              },
              "symmetry": {
                "type": "object",
                "properties": {
                  "group": { "type": "string" },
                  "order": { "type": "integer" }
                }
              }
            }
          }
        }
      }
    },
```

---

## 1.3 Ticket record

```json
    "ticketRecord": {
      "if": {
        "properties": { "type": { "const": "ticket" } }
      },
      "then": {
        "required": ["body"],
        "properties": {
          "body": {
            "type": "object",
            "properties": {
              "tickets": {
                "type": "array",
                "items": {
                  "type": "array",
                  "items": { "type": "integer" },
                  "minItems": 3,
                  "maxItems": 3
                }
              }
            },
            "required": ["tickets"]
          }
        }
      }
    },
```

---

## 1.4 Guarantee record

```json
    "guaranteeRecord": {
      "if": {
        "properties": { "type": { "const": "guarantee" } }
      },
      "then": {
        "required": ["body"],
        "properties": {
          "body": {
            "type": "object",
            "properties": {
              "statement": { "type": "string" },
              "verified": { "const": true },
              "method": { "type": "string" },
              "invariants": {
                "type": "array",
                "items": { "type": "string" }
              }
            },
            "required": ["statement", "verified"]
          }
        }
      }
    }
  }
}
```

✔ This schema is **sufficiently strict for standards**  
✔ Yet extensible for future CanvasL dialects

---
