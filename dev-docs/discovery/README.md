# Discovery Document Organization

This directory contains organized content extracted from the original `_tetragrammatron-os-discovery.md` file (78,106 lines, 570 sections).

## Structure

- **mathematics/** (173 files) - Mathematical foundations:
  - n-sphere/n-ball duality
  - Topology and geometric progressions
  - Indexing conventions (0-based vs 1-based)
  - Platonic solids → 11D → E8×E8 → S24 sphere packing
  - Boundary-Interior Computational Framework (BICF)

- **rfcs/** (75 files) - RFC sections and specifications:
  - RFC 0001-0007: BICF/FANO framework
  - RFC-009: Origami Fold VM Semantics
  - RFC-0011: Repo.CanvasL Kernel
  - RFC-0012: Binary Encoding
  - RFC-0013: Time and Barriers
  - Various addenda and extensions

- **implementations/** (231 files) - Code implementations:
  - Scheme assembler code
  - Coq formalizations
  - Lean proofs
  - C/C++ VM implementations
  - ESP32/Pico firmware sketches
  - Python utilities

- **proofs/** (20 files) - Formal proofs and verification:
  - Lean 4 proofs
  - Coq theorems
  - Fano plane proofs
  - PCG-based verification

- **ci/** (15 files) - CI/CD configurations:
  - GitHub Actions workflows
  - Build pipelines
  - Test configurations
  - Release gates

- **visualization/** (12 files) - Visualization semantics:
  - SVG rendering specifications
  - Geometric projections
  - CanvasL visualization contracts

- **specifications/** (38 files) - Technical specifications:
  - JSON schemas
  - Binary encoding layouts
  - Canonical forms
  - Standards and normative documents

## Navigation

See [INDEX.md](INDEX.md) for a complete index of all extracted sections with line numbers from the original document.

## Original Document

The original discovery document is preserved at:
`/workspace/dev-docs/_tetragrammatron-os-discovery.md`

## Organization Process

Content was automatically extracted and organized by topic area using semantic analysis of section titles and content. Each section was categorized and saved as an individual markdown file for improved navigability and maintainability.

## Key Documents

### Mathematical Foundations
- [Foundational Knowledge Reference: The Sphere-Ball Duality in Computation](mathematics/foundational-knowledge-reference-the-sphere-ball-duality-in-computation.md)
- [Complete Geometric Progression: Platonic → 11D → E8×E8 → S24 Sphere Packing](mathematics/complete-geometric-progression-platonic-11d-e8e8-s24-sphere-packing.md)

### Core RFCs
- See `rfcs/` directory for all RFC documents

### Implementation Guides
- See `implementations/` directory for code examples and implementations
