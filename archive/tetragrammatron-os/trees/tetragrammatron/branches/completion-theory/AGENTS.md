# AGENTS — Branch: completion-theory

This file defines **agent-operable constraints** for the `completion-theory` domain.
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
  - Records what completion operations are possible
  - Capabilities of the completion mechanism

- `autonomy/`
  - Records who decides completion behavior
  - Decision-making about refinement

- `sovereignty/`
  - Records accountability for completion correctness
  - Who ensures completion is sound

- `context/`
  - Records conditions under which completion applies
  - Mathematical foundations, operational/invariant semantics

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

