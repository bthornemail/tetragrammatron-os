# RFC-0013  
## Deterministic Derivation Overlay (BIP-39 / BIP-32 for CAN / CanvasL)

**Status:** Draft  
**Category:** Standards Track  
**Obsoletes:** None  
**Updates:** RFC-0012 (CANB Binary Encoding)  
**Author:** Universal Life Protocol / CanvasL Core  
**Target:** Origami VM, CAN-ISA v1.0, CLBC-POLY

---

## 1. Abstract

This RFC specifies a **deterministic derivation overlay** for the CanvasL / CAN execution environment using **BIP-39 mnemonics** and **BIP-32 hierarchical derivation**.

The overlay provides a **human-memorable, portable, cryptographically deterministic addressing mechanism** for:

- CANB object identifiers (REF32)
- polynomial seeds (CLBC-POLY)
- Fano-triad selection
- geometry emission (SVG / OBJ / GLB)
- virtual repository routing across high-dimensional lattices

This mechanism is **pure**, **side-effect free**, and **does not alter**:
- algebraic semantics (GCD / LCM)
- idempotence guarantees
- Fano consistency
- proof obligations

---

## 2. Design Goals

The derivation overlay MUST:

1. Be deterministic across platforms
2. Be independent of execution order
3. Preserve all existing CAN / CanvasL invariants
4. Introduce no floating-point operations
5. Allow human-portable replay of computation
6. Support virtualization of repositories beyond filesystem limits

---

## 3. Non-Goals

This RFC does **not** define:

- cryptographic ownership
- signing or authorization
- wallets or balances
- consensus or networking
- mutable state

The overlay is **addressing only**, not security policy.

---

## 4. Terminology

| Term | Meaning |
|----|----|
| **Mnemonic** | BIP-39 word sequence |
| **Seed** | 512-bit seed derived via PBKDF2 |
| **VDP** | Virtual Derivation Path |
| **REF32** | 32-bit canonical object reference |
| **Axis** | One of the semantic 8-tuple domains |
| **DERIVE** | Pure CAN instruction introduced here |

---

## 5. Virtual Derivation Path (VDP)

### 5.1 Structure

A **Virtual Derivation Path** is a hierarchical path analogous to BIP-32 but **not tied to a filesystem**.

```
m / can / canvasl / <axis> / <layer> / <cell> / <object>
```

Each segment maps to a hardened or non-hardened BIP-32 index.

### 5.2 Axis Mapping (Normative)

The semantic 8-tuple maps to indices **0–7**:

| Axis keyword | Index |
|-------------|-------|
| state       | 0 |
| symbol      | 1 |
| boundary    | 2 |
| relation    | 3 |
| transition  | 4 |
| source      | 5 |
| terminal    | 6 |
| rejection   | 7 |

This mapping MUST be used consistently across implementations.

---

## 6. Mnemonic → Seed Derivation

Seed derivation MUST follow **BIP-39** exactly:

- PBKDF2-HMAC-SHA512
- 2048 iterations
- optional passphrase supported
- output: 512 bits

No modifications are permitted.

---

## 7. Seed → CAN Object Derivation

### 7.1 REF32 Derivation (Normative)

A **REF32** is derived as:

```
REF32 = trunc32(
  HMAC-SHA256(derived_key, "CAN-REF")
)
```

Properties:
- deterministic
- architecture-independent
- collision-resistant in practice
- stable across time

REF32 MAY be used directly in CANB instructions.

---

### 7.2 Domain Separation

Derivation MUST be domain-separated using fixed ASCII tags:

| Domain | Tag |
|------|----|
| Polynomial | `"CAN-POLY"` |
| Geometry | `"CAN-GEOM"` |
| Fano-Triad | `"CAN-TRIAD"` |
| Hash | `"CAN-HASH"` |

---

## 8. New Instruction: `DERIVE`

### 8.1 Opcode Assignment

```
OP_DERIVE = 0x08
```

This opcode is added to **CAN-ISA v1.0**.

---

### 8.2 Semantics

`DERIVE` computes a deterministic handle from a mnemonic seed and virtual path.

- It is **pure**
- It has **no side effects**
- It MUST NOT mutate VM state
- It MUST NOT bypass CANON / PROJ_FANO

---

### 8.3 Binary Encoding (CANB-compliant)

```
31          24 23        20 19   16 15        0
+--------------+------------+-------+----------+
|  OPCODE=0x08 | FLAGS      |  RDST |  IMM16   |
+--------------+------------+-------+----------+
|                 REF32 (optional)               |
+------------------------------------------------+
```

#### Fields

| Field | Meaning |
|----|----|
| `RDST` | destination register |
| `IMM16` | domain selector |
| `REF32` | derived path hash (0 if implicit) |

---

### 8.4 Domain Selectors

| IMM16 | Domain |
|----|----|
| 0x0001 | Polynomial |
| 0x0002 | Geometry |
| 0x0003 | Fano-Triad |
| 0x0004 | Hash |

---

## 9. VM Semantics

1. DERIVE MUST:
   - read seed handle from source register
   - compute derived key
   - emit object handle
2. Result MUST be:
   - referentially transparent
   - cacheable
   - reproducible
3. DERIVE MUST NOT:
   - alter registers except RDST
   - affect proof state
   - bypass idempotence barriers

---

## 10. Interaction with Proof System

Derived objects:

- MUST still pass CANON normalization
- MUST still satisfy Fano consistency
- MUST still validate idempotence

Mnemonic derivation **does not constitute proof** — it only selects inputs.

---

## 11. Repository Virtualization

Implementations MAY interpret VDP segments as **virtual repository axes**, enabling:

- 11D–19D logical repo layouts
- branch lattices aligned with Fano triads
- deterministic re-materialization of repos

No filesystem coupling is required.

---

## 12. Security Considerations

- No private keys are exposed
- No signing is performed
- Mnemonics SHOULD be treated as public identifiers unless protected externally
- Collision resistance depends on SHA-256 truncation; acceptable for addressing

---

## 13. Implementation Status

This RFC is compatible with:

- Scheme assembler
- ESP32 / Pico firmware
- CLBC-POLY canonical codec
- Lean / Coq proof artifacts
- SVG / OBJ / GLB geometry emitters

---

## 14. Rationale (Non-Normative)

This overlay allows **human memory to address formal computation**.

It enables:
- replayable worlds
- deterministic AR/VR geometry
- mnemonic-addressed proofs
- decentralized, platform-agnostic execution

without weakening mathematical guarantees.

---

## 15. One-Sentence Guarantee

> **If two systems share a mnemonic, they share the same computation, geometry, and proof — forever.**
