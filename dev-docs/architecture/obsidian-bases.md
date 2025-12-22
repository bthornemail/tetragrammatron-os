# Obsidian Bases Schema

## Overview

Obsidian Bases provide a **table-driven, queryable view** of the Four-Axis Ontology and project content. They create a read-only projection layer over the filesystem that enables live consensus tables, filterable views, and structural comparison.

## Canonical Bases Philosophy

- **Bases = observation layer**
- No file mutation
- Read-only projection of the filesystem
- One base per axis, plus summary bases

This mirrors:
- Ball → filesystem
- Sphere → Bases projection
- Observer → human/agent query

## Folder Placement

```
obsidian/bases/
├── axes.base.md           # Master overview lattice
├── freedom.base.md        # Freedom axis view
├── autonomy.base.md       # Autonomy axis view
├── sovereignty.base.md    # Sovereignty axis view
├── context.base.md        # Context axis view (with subfolders)
└── drift.base.md          # Drift events timeline
```

## Master Axes Base

File: `obsidian/bases/axes.base.md`

This is the **overview lattice** showing all constraint artifacts across all branches.

```markdown
---
base:
  name: Axes Overview
  source:
    folders:
      - trees
  filters:
    - path.includes("/branches/")
  columns:
    - name: Tree
      value: path.split("/")[1]
    - name: Branch
      value: path.split("/")[3]
    - name: Axis
      value: |
        if (path.includes("/freedom/")) return "Freedom";
        if (path.includes("/autonomy/")) return "Autonomy";
        if (path.includes("/sovereignty/")) return "Sovereignty";
        if (path.includes("/context/")) return "Context";
        return "—";
    - name: File
      value: file.name
    - name: Type
      value: file.extension
    - name: Modified
      value: file.mtime
---

# Axes Overview

This base shows **all constraint artifacts** across all branches,
classified by the four invariant axes.

Use this to:
- detect imbalance (missing axes)
- inspect where meaning is coming from
- compare branches structurally
```

This gives you a **consensus lattice surface** immediately.

## Axis-Specific Bases

### Freedom Base

File: `obsidian/bases/freedom.base.md`

```markdown
---
base:
  name: Freedom Axis
  source:
    folders:
      - trees
  filters:
    - path.includes("/freedom/")
  columns:
    - name: Tree
      value: path.split("/")[1]
    - name: Branch
      value: path.split("/")[3]
    - name: Capability
      value: file.name
    - name: Format
      value: file.extension
    - name: Path
      value: path
---

# Freedom Axis

This base enumerates **what actions are possible** per branch.

Interpretation rules:
- Presence = possibility
- Absence = constraint
- No judgment is implied
```

### Autonomy Base

File: `obsidian/bases/autonomy.base.md`

```markdown
---
base:
  name: Autonomy Axis
  source:
    folders:
      - trees
  filters:
    - path.includes("/autonomy/")
  columns:
    - name: Tree
      value: path.split("/")[1]
    - name: Branch
      value: path.split("/")[3]
    - name: Decision
      value: file.name
    - name: Format
      value: file.extension
    - name: Path
      value: path
---

# Autonomy Axis

This base enumerates **who decides** per branch.

Interpretation rules:
- Identifies decision locus
- Maps agency boundaries
- Shows delegation structures
```

### Sovereignty Base

File: `obsidian/bases/sovereignty.base.md`

```markdown
---
base:
  name: Sovereignty Axis
  source:
    folders:
      - trees
  filters:
    - path.includes("/sovereignty/")
  columns:
    - name: Tree
      value: path.split("/")[1]
    - name: Branch
      value: path.split("/")[3]
    - name: Accountability
      value: file.name
    - name: Format
      value: file.extension
    - name: Path
      value: path
---

# Sovereignty Axis

This base enumerates **who is accountable** per branch.

Interpretation rules:
- Maps ownership of consequences
- Identifies authority structures
- Shows responsibility assignment
```

### Context Base (Expanded)

File: `obsidian/bases/context.base.md`

The Context base is special — it reflects the six subfolders.

```markdown
---
base:
  name: Context Axis
  source:
    folders:
      - trees
  filters:
    - path.includes("/context/")
  columns:
    - name: Tree
      value: path.split("/")[1]
    - name: Branch
      value: path.split("/")[3]
    - name: Context Type
      value: path.split("/")[5]
    - name: Artifact
      value: file.name
    - name: Format
      value: file.extension
---

# Context Axis

Context types include:
- networks
- views
- connections
- documents
- assets
- services

This base defines **how interpretation is framed**, not what is true.
```

## Drift Events Base

File: `obsidian/bases/drift.base.md`

```markdown
---
base:
  name: Drift Events
  source:
    folders:
      - .ulp/drift/events
  filters:
    - path.endsWith("drift.jsonl")
  columns:
    - name: Time
      value: t
    - name: Kind
      value: k
    - name: Value
      value: v
---

# Drift Events

This is an append-only log of structural changes.

Use it as:
- consensus timeline
- audit trail
- replay driver for the 3D renderer
```

## What Bases Provide

Obsidian Bases give you:

1. **Live consensus tables** - Real-time view of what exists across all branches
2. **Filterable disagreement** - See where branches differ on any axis
3. **Structural comparison** - Compare branches by axis balance
4. **Audit trails** - Track changes over time via drift events
5. **Query surface** - Machine-readable queries over project structure

## Integration with Other Systems

### ULP Addressing
- Bases can filter by ULP address prefixes
- Address registers can be extracted as columns
- Scope prefixes (`ulp:0000::`, `ulp:8000::`) can be used for filtering

### Four-Axis Ontology
- One base per axis enables independent inspection
- Master base shows cross-axis relationships
- Missing content becomes visible as gaps

### Drift Tracking
- Drift base provides timeline view
- Can correlate structural changes with content changes
- Enables replay and audit

### Three.js Renderer
- Base queries can drive scene generation
- Spatial layout can follow base groupings
- Filtering can control visibility

## Usage Patterns

### Detect Imbalance
Query the Axes Overview base and group by axis. Branches with missing axes become immediately visible.

### Compare Branches
Filter bases by tree or branch name to see how different domains handle the same axis.

### Track Evolution
Use the Drift base to see when files were added, modified, or removed, and correlate with validator status.

### Generate Reports
Export base tables to generate human-readable summaries of project state.

## Base Column Expressions

Bases support JavaScript expressions in column definitions:

- `file.name` - Filename without extension
- `file.extension` - File extension
- `file.mtime` - Modification time
- `file.size` - File size
- `path` - Full path
- `path.split("/")[n]` - Path segments
- Conditional logic with `if/else`
- String methods

## Best Practices

1. **Read-Only** - Never use bases to modify files
2. **Projection** - Bases project structure, they don't define it
3. **Consistency** - Use consistent column names across related bases
4. **Documentation** - Always include interpretation rules in base headers
5. **Validation** - Verify base queries match actual file structure

## Future Extensions

Possible future base types:

- **Address Base** - Filter and display by ULP address components
- **Schema Base** - Validate JSONL against schemas
- **Adapter Base** - Show active extension adapters
- **Contract Base** - Display admissibility contracts

## References

- See `four-axis-ontology.md` for the structure bases project over
- See `drift-tracking.md` for how bases integrate with change tracking
- See `ulp-addressing.md` for address-based filtering patterns
