# Tetragrammatron-OS Development Documentation

This directory contains extracted coding methods, principles, and architectural patterns from the Tetragrammatron-OS project, organized for easy reference and understanding.

## Structure

- **[Architecture](./architecture/)** - Core architectural patterns and models
  - Sphere-Ball duality model
  - Projection systems
  - Validation systems
  - File structure conventions

- **[Formal Verification](./formal-verification/)** - Lean 4 theorems and proofs
  - Admissibility contracts
  - Validator soundness theorems
  - Completion theory
  - Operational/invariant semantics

- **[Coding Principles](./coding-principles/)** - Core development principles
  - Immutability patterns
  - Deterministic operations
  - Composable design
  - Boundary preservation

- **[Implementation Patterns](./implementation-patterns/)** - Concrete implementation patterns
  - Drift tracking
  - Canonicalization
  - Quadrant system (KK/KU/UK/UU)
  - Adapter patterns
  - Validation strategies

- **[Code Examples](./code-examples/)** - Reference implementations
  - Lean 4 code
  - TypeScript patterns
  - Scheme canonicalizers
  - JavaScript/Node.js tools

- **[Conventions](./conventions/)** - Project conventions and standards
  - AGENTS.md standard
  - File naming conventions
  - Schema definitions

## How to Use This Documentation

1. Start with [Architecture Overview](./architecture/README.md) for high-level understanding
2. Review [Coding Principles](./coding-principles/README.md) for development guidelines
3. Reference [Implementation Patterns](./implementation-patterns/README.md) for specific solutions
4. Check [Code Examples](./code-examples/README.md) for concrete implementations

## Extraction Notes

This documentation was extracted from `CONVERSATION.md` working backwards from the end, focusing on technical content and filtering out non-technical discussions. Content is organized by topic with reverse chronological order maintained within each document (newest first).

## Relationship to Tree Structure

This technical reference documentation is complemented by semantic organization in the tree structure:

- **Tree branches** (`trees/tetragrammatron/branches/`): Semantic organization through four-axis ontology (freedom, autonomy, sovereignty, context)
- **dev-docs**: Technical reference and implementation details (this directory)
- **Conversations**: Source material for semantic content extraction

See `trees/tetragrammatron/branches/BRANCH_TO_DEVDOCS.md` for mapping between branches and dev-docs sections.

