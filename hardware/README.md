# Hardware Data Layer

This directory contains hardware probe data, canonical records, and sphere projections.

## Files

- **`probe.jsonl`**: Raw hardware probe events in JSONL format
  - Each line is a JSON object with fields: `t` (timestamp), `k` (key), `v` (value)
  - Optional fields: `src` (source), `q` (quadrant: KK/KU/UK/UU)
  - Validated against `schemas/hw_event.schema.json`

- **`canon.json`**: Canonical hardware record
  - Generated from `probe.jsonl` using `tools/hw_canon.mjs`
  - Contains quadrant-tagged values with provenance
  - Validated against `schemas/hw_canon.schema.json`

- **`sphere.json`**: VM sphere projection
  - Generated from `canon.json` using `tools/hw_project.mjs`
  - Contains pointer residue (0-7) and admissibility check
  - Validated against `schemas/hw_sphere.schema.json`

## Pipeline

```
probe.jsonl
    ↓ validate (validate_jsonl.mjs)
    ↓ canonicalize (hw_canon.mjs)
canon.json
    ↓ project (hw_project.mjs)
sphere.json
```

## Usage

### Validate probe data
```bash
node tools/validate_jsonl.mjs hardware/probe.jsonl schemas/hw_event.schema.json
```

### Generate canonical record
```bash
node tools/hw_canon.mjs hardware/probe.jsonl hardware/canon.json
```

### Generate sphere projection
```bash
node tools/hw_project.mjs hardware/canon.json hardware/sphere.json
```

### Full pipeline
```bash
node tools/validate_jsonl.mjs hardware/probe.jsonl schemas/hw_event.schema.json
node tools/hw_canon.mjs hardware/probe.jsonl hardware/canon.json
node tools/hw_project.mjs hardware/canon.json hardware/sphere.json
```

## Data Immutability

- Source files (`probe.jsonl`) are treated as immutable ground truth
- Generated files (`canon.json`, `sphere.json`) are projection artifacts
- Regenerate canonical/sphere files when probe data changes
- Never modify probe data directly

## Quadrant System

Canonical records use quadrant tags to track knowledge provenance:

- **KK (Known Known)**: Observed fact, stable
- **KU (Known Unknown)**: Key relevant but value missing, uses default
- **UK (Unknown Known)**: Derived by adapter/rule, not directly observed
- **UU (Unknown Unknown)**: Outside model, uses model default

## Projection Rules

- Pointer computed via fold/land operation + mod 8
- Admissibility: `(p + 2) % 8 ≠ 0` (equiv `p ≠ 6`)
- 7 out of 8 possible residues are admissible


