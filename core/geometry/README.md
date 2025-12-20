# Geometry Core (Fano Projection)

Agent 5 (`GEO-FANO-SVG`) owns the projection layer that maps canonical VM
events to byte-stable SVG output. This directory contains the reference
implementations for the renderer and input bridges.

## Components

| File | Purpose |
| --- | --- |
| `fano_svg.py` | Canonical renderer + CLI (`render events JSONL → SVG`) |
| `triad_to_svg.py` | Trace bridge (`TRIAD trace JSONL → render events + SVG`) |
| `invariants.py` | Projection invariant analyzer for render-event streams |
| `examples/fano_triangle.geom.jsonl` | Minimal render-event sample (line + points + labels) |

## JSONL Render Event Schema

Each line is a JSON object with an `op` string:

| Opcode | Fields | Description |
| --- | --- | --- |
| `FRAME_BEGIN` | `flags` list or int, optional `seq` | Opens a frame; flags bits: `lines`, `points`, `labels`, `meta_hash` |
| `FRAME_END` | – | Closes the current frame |
| `PROJ_FANO` | `flags` | Updates frame metadata without drawing |
| `DRAW_FANO_LINE` | `line`, `style` | Adds/overwrites canonical line `L0..L6` |
| `DRAW_FANO_POINT` | `point`, `style`, optional `axis` | Adds/overwrites canonical point `p0..p6` (axis is stored as `data-axis`) |
| `DRAW_FANO_CIRCLE_LINE` | `style` | Adds the circle-line (`p1,p3,p5` incidence) |
| `LABEL_FANO_POINT` | `point`, `text` or `string_id` | Emits `<text>` anchored to the point |
| `DEFINE_STRING` | `id`, `text` | Registers string table entries for later labels |

Events can appear in any order; determinism comes from canonical sorting inside
`fano_svg.py` (`lines → circle → points → labels`, sorted by IDs).

## CLI Usage

```bash
# Render the sample frame to SVG
python core/geometry/fano_svg.py \
  examples/fano_triangle.geom.jsonl \
  build/fano_triangle.svg \
  --hash sha256:demo \
  --title "Fano Triangle"

# Convert a TRIAD trace to SVG (and keep the derived render events)
python core/geometry/triad_to_svg.py \
  trace.jsonl \
  build/trace.svg \
  --events-out build/trace.geom.jsonl \
  --hash sha256:trace \
  --title "Repo Triads"

# Verify projection + dual invariants
python core/geometry/invariants.py build/trace.geom.jsonl
```

Use `-` to read events/triads from stdin or write SVG to stdout.

## Axis ↔ Point Mapping (Normative)

The renderer follows the canonical assignment that satisfies both the RFC-0012
line layout (`L0..L6`) and the merge-gate triads (dev-docs/10). Triad →
line mapping is baked into `triad_to_svg.py` and documented here for clarity:

| Axis (8-tuple) | Point ID | Canonical label |
| --- | --- | --- |
| `state` | `p0` | states |
| `alphabet` | `p1` | alphabet |
| `delta` | `p2` | transition |
| `left` | `p3` | left_marker |
| `start` | `p4` | start |
| `accept` | `p5` | accept (gate) |
| `right` | `p6` | right_marker |

With this mapping the seven allowed triads map exactly onto the seven Fano
lines (L0..L6), ensuring that JSONL traces built from repo-lattice events
project without ambiguity. When a render event supplies an `axis` field,
the renderer emits it as `data-axis="…"` on the corresponding `<circle>`.

## Tests

```bash
python -m unittest tests.test_fano_svg tests.test_triad_to_svg tests.test_invariants
```

## References

- dev-docs/12 — Exact SVG coordinate system
- dev-docs/13 — Opcode → SVG mapping
- dev-docs/14 — Canonical line table + deterministic emitter
- dev-docs/15 — Normative SVG style sheet
- dev-docs/10 — Canonical Fano triads per axis (merge gate)
