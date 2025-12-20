# 4. CanvasL JSONL Trace Format (Normative)

### 4.1 Record Envelope
Every line is one JSON object with required fields:

```json
{
  "v": "canvasl-poly-1",
  "phase": 0,
  "type": "boundary|choice|apply|assert|project|ticketset",
  "ts": 0,
  "refs": {},
  "data": {}
}
```

**MUST**
- be JSONL (one object per line)
- include `v`, `phase`, `type`
- be replayable in order (phase is monotone non-decreasing)

### 4.2 Canonical Record Types

#### (A) Boundary Declaration
```json
{
  "v": "canvasl-poly-1",
  "phase": 0,
  "type": "boundary",
  "refs": { "boundary_ref": "sha256:..." },
  "data": { "boundary_id": "fano7+pcg14@v1" }
}
```

#### (B) Realization Choice
```json
{
  "v": "canvasl-poly-1",
  "phase": 1,
  "type": "choice",
  "refs": { "choice_ref": "sha256:..." },
  "data": { "choice_id": "auto:perm-042" }
}
```

#### (C) Apply / Step (polynomial or transition)
```json
{
  "v": "canvasl-poly-1",
  "phase": 2,
  "type": "apply",
  "refs": {
    "input_refs": ["sha256:..."],
    "coeff_ref": "sha256:...",
    "output_ref": "sha256:..."
  },
  "data": { "op": "poly_eval", "degree": 1 }
}
```

#### (D) Assert Validity
```json
{
  "v": "canvasl-poly-1",
  "phase": 3,
  "type": "assert",
  "refs": { "interior_ref": "sha256:...", "boundary_ref": "sha256:..." },
  "data": { "checks": ["schema", "fano_incidence", "pcg_pair_cover"] }
}
```

#### (E) Project View (non-authoritative)
```json
{
  "v": "canvasl-poly-1",
  "phase": 4,
  "type": "project",
  "refs": { "interior_ref": "sha256:...", "view_ref": "sha256:..." },
  "data": { "view_type": "dodecahedron|fano|text" }
}
```

---
