# File Structure Conventions

**Extracted from:** CONVERSATION.md (lines 23300-23936)

## Overview

Tetragrammatron-OS enforces a strict four-axis ontology at the branch level, ensuring structural consistency without enforcing meaning.

## Branch Structure

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

## Four-Axis Ontology

These are **not values**. They are **axes of constraint**.

### Freedom
> What actions are possible.

- Capability space
- Option availability
- "Can I do X?"

### Autonomy
> Who decides.

- Decision locus
- Agency boundary
- "Who chooses X?"

### Sovereignty
> Who is accountable.

- Ownership of consequences
- Authority over outcomes
- "Who bears responsibility for X?"

### Context
> Under what conditions any of the above are interpreted.

- Environment
- Medium
- Relations
- "Where / with whom / under what constraints does X exist?"

Context is what **prevents Freedom from becoming chaos**,  
Autonomy from becoming isolation,  
and Sovereignty from becoming domination.

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

## Required Files

Each branch must have:

- `AGENTS.md` - Machine-readable agent guidance
- `README.md` - Human-readable state summary

## Tree Structure

```
trees/
├── <tree>/
│   ├── branches/
│   │   └── <branch>/
│   │       ├── AGENTS.md
│   │       ├── README.md
│   │       ├── freedom/
│   │       ├── autonomy/
│   │       ├── sovereignty/
│   │       └── context/
│   │           ├── networks/
│   │           ├── views/
│   │           ├── connections/
│   │           ├── documents/
│   │           ├── assets/
│   │           └── services/
```

## Validation

The validator enforces:
1. All four axes exist
2. Context has all required subfolders
3. AGENTS.md and README.md exist
4. No extra axes exist

## Principles

- **Structure enforced**: Validator ensures consistency
- **Meaning free**: No interpretation of content
- **Contradiction preserved**: Disagreement is allowed
- **Consensus observable**: Not mandated

## Why This Works

This structure:
- prevents ideological drift
- prevents agent hallucination
- allows disagreement without collapse
- allows visualization without distortion
- allows aggregation (consensus lattice) later

Most importantly:

> **It lets people disagree about God, freedom, morality, or reality  
> without disagreeing about structure.**

That's extremely rare.

## Related Concepts

- [Validation Patterns](../implementation-patterns/validation-patterns.md)
- [AGENTS.md Standard](../conventions/agents-md.md)
- [Architecture Overview](./README.md)

