# Development Documentation References

This directory contains references to the technical documentation in `../../../../../../dev-docs/`.

## Purpose

The `dev-docs/` directory contains technical reference material:
- Architecture patterns and models
- Formal verification and proofs
- Coding principles and conventions
- Implementation patterns
- Code examples

This branch (`development`) represents the **semantic organization** of the development process through the four-axis ontology, while `dev-docs/` provides the **technical reference** for implementation.

## Structure Mapping

| dev-docs Section | Purpose | Related Branch Axis |
|-----------------|---------|---------------------|
| `architecture/` | Core architectural patterns | `freedom/` (what's possible), `context/` (environment) |
| `formal-verification/` | Lean 4 theorems and proofs | `sovereignty/` (accountability), `autonomy/` (decisions) |
| `coding-principles/` | Development principles | `freedom/` (capabilities), `sovereignty/` (responsibility) |
| `implementation-patterns/` | Concrete patterns | `freedom/` (tools), `context/` (environment) |
| `code-examples/` | Reference implementations | `freedom/` (capabilities), `context/` (examples) |
| `conventions/` | Project standards | `autonomy/` (decisions), `sovereignty/` (enforcement) |

## Accessing dev-docs

From this branch, the dev-docs directory is located at:
```
../../../../../../dev-docs/
```

Or from the repository root:
```
dev-docs/
```

## Key Documents

- [Architecture Overview](../../../../../../dev-docs/architecture/README.md)
- [Coding Principles](../../../../../../dev-docs/coding-principles/README.md)
- [Implementation Patterns](../../../../../../dev-docs/implementation-patterns/README.md)
- [Formal Verification](../../../../../../dev-docs/formal-verification/README.md)
- [Conventions](../../../../../../dev-docs/conventions/README.md)

## Notes

- This directory does not duplicate content from dev-docs
- It provides semantic organization and references
- Technical details remain in dev-docs
- This branch provides the "why" and "who", dev-docs provides the "how"

