# AGENTS.md Standard

**Extracted from:** CONVERSATION.md (lines 23060-23486)

## Overview

AGENTS.md is a recognized standard for guiding AI coding agents and tools. It provides machine-readable guidance that complements human-focused READMEs.

## Root-Level AGENTS.md

Place at project root to provide guidance for the entire project.

### Structure

```markdown
# Project Name — Agents Guide

This `AGENTS.md` file provides **AI coding agents** machine-readable guidance about the structure, conventions, and workflows of the project. AGENTS.md is a recognized standard for guiding AI coding agents and tools.

## 🧭 Project Structure

- Directory layout and organization
- Key directories and their purposes
- File naming conventions

## 🛠 Build & Tooling

AI agents should assume the following workflow:

```bash
# Commands agents should use
```

## 📐 Coding Conventions

- Language-specific patterns
- Code style guidelines
- Integration points

## 📊 Project Understanding

Agents should leverage:
- Key concepts and abstractions
- Data flow patterns
- Integration points

Agents should **not modify**:
- Source manifest files
- Data streams (treat as immutable ground truth)

## 🧪 Test & Validation Conventions

- Validation requirements
- Testing strategies
- Quality gates

## ⚠️ Safety & Boundaries

- What agents should not do
- Security considerations
- Mutation restrictions

## 🧾 Pull Request & Commit Guidelines

- PR title conventions
- Commit message format
- Required updates
```

## Branch-Level AGENTS.md

Place inside each branch folder to provide localized guidance.

### Structure

```markdown
# Agents Instructions for Branch: <branch>

This file provides localized guidance for AI coding agents working within the `<branch>` scope. Closest `AGENTS.md` takes precedence.

## Scope

- This branch contains:
  - Subdirectories and their purposes
  - Key files and their roles

## Local Commands

```bash
# Branch-specific commands
```

## Conventions for This Branch

- Follow project conventions from root `AGENTS.md`
- Branch-specific patterns
- Local constraints

## Local Validation

- Branch-specific validation requirements
- Expected artifacts

## Do Not

- Branch-specific restrictions
- What not to modify
```

## Four-Axis Branch Structure

For branches following the four-axis ontology:

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

## Principles

- **Closest file wins**: Branch-level AGENTS.md overrides root-level
- **Machine-readable**: Structured format for AI agents
- **Complementary**: Works alongside human-focused READMEs
- **Actionable**: Provides concrete commands and constraints
- **Safe**: Explicit boundaries and restrictions

## Related Concepts

- [File Structure](../architecture/file-structure.md)
- [Validation Patterns](../implementation-patterns/validation-patterns.md)

