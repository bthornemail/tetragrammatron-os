# AGENTS.md  
**Tetragrammatron-OS**

> A proof-carrying, geometry-first operating system and virtual machine for origami-based computation, polynomial constraint execution, and physically grounded autonomy.

---

## 1. Purpose

This document defines **who and what is allowed to act** within the Tetragrammatron-OS codebase.

An **Agent** is any human, program, model, or system component that:
- Writes code
- Modifies specifications
- Executes or mutates bytecode
- Generates proofs, geometry, or artifacts
- Interacts with hardware or time constraints

All agents are governed by **formal constraints**, **idempotence rules**, and **Fano-consistency invariants**.

---

## 2. Primary Maintainer (Human Agent)

**Name:** Brian Thorne  
**GitHub:** https://github.com/bthornemail  
**Email:** bthornemail@gmail.com  

**Public links (identity & sponsorship):**
- Cash App: https://cash.app/$brianthorne  
- Venmo: https://venmo.com/u/brianthorne  
- LinkedIn: https://www.linkedin.com/in/brian-thorne-5b8a96112/

### Authority
The primary maintainer has final authority over:
- RFC acceptance and versioning
- ISA changes
- Canonical semantics
- Release branch promotion
- Security decisions

---

## 3. Agent Classes

### 3.1 Human Agents

Humans interact through Git, issues, RFCs, and code reviews.

**Permissions:**
- May propose changes via PRs
- May author RFC drafts
- May not bypass invariants or rewrite history without approval

**Constraints:**
- All merges must preserve **Fano consistency**
- No direct commits to `main`
- All work flows through semantic branches

---

### 3.2 Software Agents (Internal)

These agents are part of the system itself.

#### VM Agents
- `origami-vm`
- `can-isa-vm`
- `poly-logos-engine`

**Capabilities:**
- Execute bytecode
- Enforce barriers
- Apply fold semantics
- Emit geometry and events

**Restrictions:**
- Cannot self-modify without `PATCH_*` opcode sequence
- Must produce deterministic output
- Must emit proofs or hashes for all state changes

---

### 3.3 Proof Agents

Formal reasoning components.

Examples:
- Lean proof kernels
- Coq models
- Canonical normalizers

**Role:**
- Verify idempotence
- Prove fold correctness
- Check invariants across merges, execution, and projection

**Rule:**
> No execution step is “valid” unless it is *provably admissible* or reducible to a proven primitive.

---

### 3.4 AI / LLM Agents

AI agents may assist with:
- Drafting RFCs
- Generating boilerplate
- Exploring design spaces
- Producing reference implementations

**Hard limits:**
- AI agents **cannot** be authoritative
- AI output must be reviewed by a human agent
- AI may not introduce unverifiable semantics

**Canonical rule:**
> AI can propose; proofs must dispose.

---

### 3.5 Hardware Agents

Physical systems executing or constraining the VM.

Examples:
- ESP32 (S3, C6)
- Raspberry Pi Pico 2 W
- Android devices (Termux)
- Routers (OpenWRT / LuCI)

**Responsibilities:**
- Provide time signals
- Enforce physical constraints
- Emit sensor and clock data
- Act as schedulable nodes in RR topology

**Constraint:**
Hardware agents may **delay**, **block**, or **gate** execution, but may not invent state.

---

## 4. Agent Interaction Model

All agent interaction is mediated through **formal artifacts**:

- `.can` / `.canbc` — CAN-ISA bytecode
- `.canvasl` — semantic topology descriptors
- `.jsonl` — event streams
- `.svg` / `.glb` — geometric projections
- `.lean` / `.v` — proofs

There is **no implicit shared state** between agents.

Everything flows through:
```
Artifact → Validation → Projection → Commit
```

---

## 5. Security & Trust Model

### 5.1 Trust Anchors
- RFCs
- Proof kernels
- Deterministic VM execution
- Hashes of canonical forms

### 5.2 What Is Not Trusted
- Floating-point geometry
- Wall-clock time without barrier verification
- Undocumented side effects
- Implicit global state

---

## 6. Self-Modification Policy

Self-modifying behavior is allowed **only** through:

```
PATCH_BEGIN
PATCH_WRITE
PATCH_SEAL
PATCH_APPLY
```

Rules:
- Patches must be bounded
- Patches must be reversible or provably idempotent
- Patches must preserve invariants
- Patch application is a *first-class event* (loggable + provable)

---

## 7. Ethical & Philosophical Constraint

Tetragrammatron-OS is designed to support:
- Autonomy
- Reciprocity
- Determinism
- Transparency
- Physical grounding

It explicitly rejects:
- Surveillance-only architectures
- Centralized coercive control
- Opaque execution semantics

---

## 8. Canonical Statement

> **An agent in Tetragrammatron-OS is not defined by power, but by constraint.  
> What is allowed to act is what can be proven to act correctly.**

---

## 9. Version

- **AGENTS.md v1.0**
- Aligned with:
  - RFC-009 (Origami Fold VM Semantics)
  - RFC-011+ (Repository topology & lattice model)
  - CAN-ISA v1.x