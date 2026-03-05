# AGENTS — Branch: development

This file defines **agent-operable constraints** for the `development` domain.
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
  - Records what development actions are possible
  - Development capabilities, tools, technologies, frameworks
  - What can be built, what tools are available

- `autonomy/`
  - Records who decides in development
  - Decision-making processes, architecture choices, priorities
  - Who chooses technologies, who sets standards

- `sovereignty/`
  - Records accountability in development
  - Code quality ownership, release responsibility, maintenance accountability
  - Who is responsible for what parts of the system

- `context/`
  - Records development environment and conditions
  - CI/CD, build systems, documentation references
  - Development infrastructure and tooling

## Context Subfolders

Agents MAY read from but MUST NOT mutate:

- `context/networks/` - Development team structures, collaboration networks
- `context/views/` - Development perspectives, architectural views
- `context/connections/` - Dependencies, relationships between components
- `context/documents/` - Reference to `../../../../dev-docs/` technical documentation
- `context/assets/` - Development assets, build artifacts
- `context/services/` - CI/CD configs, build scripts, automation

## Allowed Agent Actions

- Read files
- Generate derived indices or visualizations
- Validate structure
- Summarize state in README.md
- Reference technical documentation in dev-docs/

## Forbidden Agent Actions

- Alter source JSONL / CanvasL / documents
- Introduce new axes or rename folders
- Infer intent beyond explicit content
- Modify technical reference documentation in dev-docs/

## Output Expectations

When asked to act on this branch, agents should:

1. State which axis they are operating on
2. Identify which context constraints apply
3. Produce outputs that can be traced back to files
4. Reference relevant dev-docs sections when appropriate

Silence or ambiguity must be preserved, not "filled in".

## Relationship to dev-docs/

The `context/documents/` folder references the technical documentation in `../../../../dev-docs/`.
This branch represents the **semantic organization** of the development process, while dev-docs contains the **technical reference** material.

Agents should:
- Use dev-docs for technical implementation details
- Use this branch for understanding development process semantics
- Link between the two when appropriate

