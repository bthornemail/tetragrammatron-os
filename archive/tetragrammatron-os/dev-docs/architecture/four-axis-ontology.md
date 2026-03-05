# Four-Axis Ontology

## Overview

The Four-Axis Ontology provides a **stable, composable framework** for organizing content in the Tree-of-Life system. It defines four invariant axes that prevent ideological drift while allowing disagreement and preserving contradictions.

## Core Principle

These are **not values**. They are **axes of constraint**.

## The Four Pillars

### 1. Freedom
> What actions are possible.

- Capability space
- Option availability
- "Can I do X?"

Freedom records the **possibility space** - what capabilities, affordances, and permissions exist within a given domain.

### 2. Autonomy
> Who decides.

- Decision locus
- Agency boundary
- "Who chooses X?"

Autonomy identifies **decision authority** - where agency lives, who has the power to choose, and how delegation works.

### 3. Sovereignty
> Who is accountable.

- Ownership of consequences
- Authority over outcomes
- "Who bears responsibility for X?"

Sovereignty defines **accountability** - who owns the consequences, who has authority over outcomes, and where responsibility lies.

### 4. Context
> Under what conditions any of the above are interpreted.

- Environment
- Medium
- Relations
- "Where / with whom / under what constraints does X exist?"

Context is what **prevents Freedom from becoming chaos**, Autonomy from becoming isolation, and Sovereignty from becoming domination.

This is philosophically sound *and* computationally tractable.

## Branch Folder Schema

Every **branch** MUST follow the same internal structure:

```
branches/<branch>/
├── AGENTS.md
├── README.md
├── freedom/
├── autonomy/
├── sovereignty/
└── context/
```

No exceptions. This is what makes branches comparable.

## Context Subfolders

Inside `context/`:

```
context/
├── networks/      # social, technical, biological, logical networks
├── views/         # perspectives, frames, observers
├── connections/   # explicit relations, edges, dependencies
├── documents/     # texts, laws, scriptures, specs
├── assets/        # media, models, binaries, artifacts
└── services/      # active processes, APIs, agents, rituals
```

This is **excellent** because:

- it maps cleanly to filesystem semantics
- it maps cleanly to Three.js groups
- it maps cleanly to Obsidian Bases
- it gives agents a finite, inspectable surface

## Folder Semantics

### freedom/
- Records what actions are possible
- Capabilities, affordances, permissions
- Presence = possibility
- Absence = constraint
- No judgment is implied

### autonomy/
- Records who decides
- Choice structures, delegation, consent
- Decision locus and agency boundaries

### sovereignty/
- Records accountability
- Ownership, responsibility, authority
- Who bears consequences

### context/
- Records interpretation conditions
- Environment, relations, artifacts
- Frames how the other three axes are understood

## Agent Constraints

Agents MUST respect this separation. Do not collapse or conflate axes.

### Allowed Agent Actions
- Read files
- Generate derived indices or visualizations
- Validate structure
- Summarize state in README.md

### Forbidden Agent Actions
- Alter source JSONL / CanvasL / documents
- Introduce new axes or rename folders
- Infer intent beyond explicit content

## Output Expectations

When asked to act on a branch, agents should:

1. State which axis they are operating on
2. Identify which context constraints apply
3. Produce outputs that can be traced back to files

Silence or ambiguity must be preserved, not "filled in".

## Why This Works

This structure:

- prevents ideological drift
- prevents agent hallucination
- allows disagreement without collapse
- allows visualization without distortion
- allows aggregation (consensus lattice) later

Most importantly:

> **It lets people disagree about God, freedom, morality, or reality without disagreeing about structure.**

That's extremely rare.

## Mapping to Renderer & OS

- Each axis = **Group3D**
- Each subfolder = **nested Group3D**
- Files = **Object3D / glyph / node**
- Context = spatial frame
- Freedom/Autonomy/Sovereignty = constraint overlays
- Sphere–Ball projection still holds:
  - filesystem = ball
  - indices = canon
  - renderer = sphere
  - interpretation = observer

Nothing breaks.

## Branch-Level AGENTS.md Template

```markdown
# AGENTS — Branch: <branch>

This file defines **agent-operable constraints** for the `<branch>` domain.
It follows the AGENTS.md standard: closest file wins.

## Ontological Axes (DO NOT ALTER)

This branch is structured along four invariant axes:

1. Freedom
2. Autonomy
3. Sovereignty
4. Context

Agents MUST respect this separation. Do not collapse or conflate axes.

## Folder Semantics

- `freedom/`
  - Records what actions are possible
  - Capabilities, affordances, permissions

- `autonomy/`
  - Records who decides
  - Choice structures, delegation, consent

- `sovereignty/`
  - Records accountability
  - Ownership, responsibility, authority

- `context/`
  - Records interpretation conditions
  - Environment, relations, artifacts

## Context Subfolders

Agents MAY read from but MUST NOT mutate:

- `context/networks/`
- `context/views/`
- `context/connections/`
- `context/documents/`
- `context/assets/`
- `context/services/`

## Allowed Agent Actions

- Read files
- Generate derived indices or visualizations
- Validate structure
- Summarize state in README.md

## Forbidden Agent Actions

- Alter source JSONL / CanvasL / documents
- Introduce new axes or rename folders
- Infer intent beyond explicit content

## Output Expectations

When asked to act on this branch, agents should:

1. State which axis they are operating on
2. Identify which context constraints apply
3. Produce outputs that can be traced back to files

Silence or ambiguity must be preserved, not "filled in".
```

## Branch-Level README.md Template

```markdown
# Branch: <branch>

This branch explores the concept of **<branch>** through four lenses:

- Freedom
- Autonomy
- Sovereignty
- Context

The purpose of this branch is not to define truth, but to **map constraints**.

---

## Current State Summary

### Freedom
What actions are possible here?

- (brief summary or links)
- See: `freedom/`

### Autonomy
Who decides and how?

- (brief summary or links)
- See: `autonomy/`

### Sovereignty
Who is accountable for outcomes?

- (brief summary or links)
- See: `sovereignty/`

### Context
Under what conditions do the above apply?

- Networks, relationships, environments
- See: `context/`

---

## Open Tensions

List unresolved or contradictory constraints, if any:

- …
- …

Contradictions are allowed and preserved.

---

## How This Branch Connects

- Parent Tree: `<tree>`
- Related Branches:
  - `<other-branch>`
  - …

Connections are descriptive, not prescriptive.

---

## Notes

This branch is a **living structure**.
Updates should preserve:
- axis separation
- historical traceability
- explicit uncertainty
```

## Integration with ULP Addressing

The four-axis structure integrates with ULP addressing:

- Axis folders can contain files named with ULP addresses
- ULP register R6 (semantic mode) indicates public vs private projection
- Prefixes can organize content hierarchically within each axis
- Address scopes map to tree/branch/context levels

## Validation

See `tools/validate_axes.mjs` for structural validation that enforces:

1. Every branch has all four axes
2. `context/` has the correct subfolders
3. `AGENTS.md` and `README.md` exist
4. No extra axes exist

## References

- See `ulp-addressing.md` for how addresses integrate with the axis structure
- See `obsidian-bases.md` for table-driven views of axis content
- See `drift-tracking.md` for monitoring structural changes over time
