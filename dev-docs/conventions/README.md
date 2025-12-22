# Conventions

This directory contains project conventions and standards for Tetragrammatron-OS.

## Contents

- **[AGENTS.md Standard](./agents-md.md)** - AGENTS.md file format and conventions (includes schema-gated execution rules)
- **[Address Schema](./address-schema.md)** - Address format and naming conventions
- **[Schema Files](./schema-files.md)** - Schema file formats and structures
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

### Address Schema Conventions
- 8-byte addresses: `R0:R1:R2:R3:R4:R5:R6:R7`
- Prefix40 notation: `R0:R1:R2:R3:R4::/40`
- Schema key format: `{realm}|{schema_hash}`
- Filesystem-safe encoding: `R0_R1_R2_R3_R4_R5_R6_R7`

### Schema File Formats
- YAML source: `address-schema.yaml` (immutable source of truth)
- Binary compiled: `address-schema.bin` (ABI v2/v3)
- Signature sidecar: `{key}.sig.json` (Ed25519)
- Dev mode JSONL: `schema.jsonl` (development-friendly)

### Schema Versioning
- JSON schemas use semantic versioning
- Schema version tracked in metadata
- ABI version in binary header
- Epoch for schema evolution
- Backward compatibility maintained where possible

## Related Documentation

- [Architecture: File Structure](../architecture/file-structure.md)
- [Implementation Patterns: Validation Patterns](../implementation-patterns/validation-patterns.md)

