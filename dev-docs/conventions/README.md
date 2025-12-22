# Conventions

This directory contains project conventions and standards for Tetragrammatron-OS.

## Contents

- **[AGENTS.md Standard](./agents-md.md)** - AGENTS.md file format and conventions
- **[File Naming](./file-naming.md)** - Naming conventions for files and directories
- **[Schema Definitions](./schema-definitions.md)** - JSON schema patterns and standards

## Key Conventions

### AGENTS.md Standard
Machine-readable guidance for AI coding agents, following the emerging AGENTS.md standard. Provides predictable instruction manifests that complement human-focused READMEs.

### File Structure
Four-axis ontology enforced at branch level:
- `freedom/` - What actions are possible
- `autonomy/` - Who decides
- `sovereignty/` - Who is accountable
- `context/` - Under what conditions

Context subfolders:
- `networks/` - Social, technical, biological, logical networks
- `views/` - Perspectives, frames, observers
- `connections/` - Explicit relations, edges, dependencies
- `documents/` - Texts, laws, scriptures, specs
- `assets/` - Media, models, binaries, artifacts
- `services/` - Active processes, APIs, agents, rituals

### Schema Versioning
- JSON schemas use semantic versioning
- Schema version tracked in metadata
- Backward compatibility maintained where possible

## Related Documentation

- [Architecture: File Structure](../architecture/file-structure.md)
- [Implementation Patterns: Validation Patterns](../implementation-patterns/validation-patterns.md)

