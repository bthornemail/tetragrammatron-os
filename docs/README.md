# Tetragrammatron-OS Documentation

> Organized documentation for the proof-carrying, geometry-first operating system

## Directory Structure

### `/specifications/`
Formal RFC specifications and technical standards.

- **rfc-0000/** - Tetragrammatron-OS Charter and foundational documents
- **rfc-0009/** - Origami Fold VM Semantics (opcodes, instruction encoding, appendices)
- **rfc-0011/** - Repository Kernel Lattice and Fano-Safe Propagation
- **rfc-0012/** - Binary Encoding and Proof-Carrying Compilation
- **rfc-0013/** - Deterministic Derivation Overlay (BIP-39/BIP-32 for CAN)
- **assembler/** - Scheme assembler specifications and extensions
- **encoding/** - Binary encoding formats (CANB v1, CLBC-POLY container)
- **svg/** - SVG coordinate system, styling, and rendering specifications
- **schemas/** - JSON schemas for compilation and front matter

### `/mathematical-foundations/`
Mathematical theory and formal models.

- 8-tuple naming conventions
- Repository lattice as 8-tuple registers
- Core mathematical claims
- CAN-BIP overlay
- Measurable monotonic signaling

### `/implementation/`
Implementation guides, compiler design, and VM details.

- **vm/** - Virtual machine implementation documentation
- **compiler/** - Compiler architecture and design
- **formal-proof-guide.md** - What to prove and how
- **obsidian-role.md** - Integration with Obsidian

### `/governance/`
Project governance, agent specifications, and collaboration guidelines.

- **agents-canonical.md** - Formal agent specification (canonical)
- **workflow-and-roles.md** - Practical workflow and roles
- **setup.md** - Setup and configuration guide
- **formal-invariants.md** - System-wide formal invariants
- **multi-agent-collaboration-prompt.md** - Multi-agent collaboration guidelines

### `/archive/`
Historical documents and chat transcripts.

- **discovery-chat-YYYYMMDD.md** - Archived discovery conversations (78K+ lines)

### `/research/`
Exploratory research and experimental designs.

### `/ci-cd/`
Continuous integration and deployment documentation.

## Quick Navigation

### For Contributors
1. Start with `/governance/agents-canonical.md` to understand roles and constraints
2. Review `/governance/workflow-and-roles.md` for practical workflow
3. Check `/specifications/rfc-0000/charter.md` for project mission

### For Implementers
1. Read `/specifications/rfc-0009/fold-vm-semantics.md` for VM semantics
2. Review `/specifications/encoding/` for binary formats
3. Check `/implementation/` for compiler and VM guides

### For Researchers
1. Explore `/mathematical-foundations/` for theoretical foundations
2. Review `/specifications/rfc-0011/` for Fano plane and lattice theory
3. Check `/archive/` for historical discussion and discovery process

## Key Concepts

- **CAN-ISA**: The instruction set architecture for the Origami Fold VM
- **CANB v1**: Bit-level instruction encoding format
- **Fano Plane**: 7-point projective plane geometry used for consistency checks
- **8-Tuple**: Canonical semantic registers (state, alphabet, left, right, transition, start, accept, reject)
- **CLBC-POLY**: Polynomial codec container format
- **Proof-Carrying**: All execution is backed by formal proofs

## External Resources

- Main README: `/workspace/README.md`
- RFC Index: `/workspace/rfc/README.md`
- VM Implementation: `/workspace/vm/`
- Proof Directory: `/workspace/proof/`
- Test Suite: `/workspace/tests/`

## Version

Documentation reorganization completed: 2025-12-20

Aligned with:
- RFC-009 (Origami Fold VM Semantics)
- RFC-011 (Repository topology & lattice model)
- RFC-012 (Binary Encoding)
- RFC-013 (Time and Barriers)
- CAN-ISA v1.x
