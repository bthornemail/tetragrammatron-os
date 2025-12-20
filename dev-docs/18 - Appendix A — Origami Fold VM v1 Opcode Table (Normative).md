
## Appendix A — Origami Fold VM v1 Opcode Table (Normative)

This appendix defines the **minimum** opcode set required by RFC-009 §X (CANB v1 + Origami Fold VM). All opcodes are **1 byte** and executed in **32-bit fixed-width instructions**:

```
bits:  31..24   23..20   19..16   15..0
       opcode    A        B        imm16
```

### A.1 Register IDs (Semantic 8-Tuple Basis)

`A` and `B` fields that refer to semantic registers **MUST** use:

| reg_id | keyword |
|---:|---|
| 0 | states |
| 1 | alphabet |
| 2 | left_marker |
| 3 | right_marker |
| 4 | transition |
| 5 | start |
| 6 | accept |
| 7 | reject |

---

## A.2 Core Control and Canonicalization

### `0x00 OP_NOOP`
- **Format:** `opcode=0x00, A=*, B=*, imm16=*`
- **Semantics:** No effect.

### `0x01 OP_HALT`
- **Format:** `opcode=0x01`
- **Semantics:** Stop execution successfully at current PC.

### `0x02 OP_CANON`
- **Format:** `opcode=0x02`
- **Semantics (Normative):**
  - Canonicalize VM semantic state.
  - **Idempotence MUST hold:** `CANON(CANON(s)) = CANON(s)`.
  - Canonicalization MUST include CLBC-POLY canonical form for any resident polynomials.

### `0x03 OP_COMMIT`
- **Format:** `opcode=0x03, A=frame_chan, B=0, imm16=commit_flags`
- **Operands:**
  - `A` = frame channel (0..15) (renderer output lane)
  - `imm16` = flags (profile-defined; v1 recommends `0`)
- **Semantics (Normative):**
  1. Implicitly perform `OP_CANON`.
  2. Compute deterministic commit hash over canonical semantic state (profile-defined hash; SHA-256 RECOMMENDED).
  3. Emit a deterministic “frame boundary” event to the renderer contract.

---

## A.3 32-bit Immediate Construction (I32 latch)

The VM maintains a 32-bit latch `I32` for loading u32 IDs (poly_id, str_id, node_id, etc.).

### `0x10 OP_LDI16H`
- **Format:** `opcode=0x10, imm16=value`
- **Semantics:** `I32[31:16] := imm16`

### `0x11 OP_LDI16L`
- **Format:** `opcode=0x11, imm16=value`
- **Semantics:** `I32[15:0] := imm16`

### `0x12 OP_USEI32`
- **Format:** `opcode=0x12, A=dst_reg, B=kind, imm16=0`
- **Operands:**
  - `A` = destination semantic register (0..7)
  - `B` = destination kind:
    - `0` → `reg[A].poly_id := I32`
    - `1` → `reg[A].str_id  := I32`
    - `2` → `reg[A].node_id := I32`
    - `3` → `reg[A].mat_id  := I32`
- **Semantics:** Assign latched u32 to the selected field.
- **Rules:**
  - Unknown `B` kinds MUST trap (unless permissive mode).

---

## A.4 Polynomial Fold Algebra (Meet/Join)

All polynomial operations are performed in the configured ring (default **F₂[x]**) and MUST be deterministic.

### `0x20 OP_MEET_GCD`
- **Format:** `opcode=0x20, A=dst_reg, B=src_reg, imm16=0`
- **Semantics:**  
  `reg[A].poly := gcd(reg[A].poly, reg[B].poly)`
- **Required properties:**
  - `gcd(p,p)=p`
  - Result MUST be in CLBC-POLY canonical form (as-if re-encoded).

### `0x21 OP_JOIN_LCM`
- **Format:** `opcode=0x21, A=dst_reg, B=src_reg, imm16=0`
- **Semantics:**  
  `reg[A].poly := lcm(reg[A].poly, reg[B].poly)`
- **Required properties:**
  - `lcm(p,p)=p`
  - Result MUST be in CLBC-POLY canonical form.

### `0x22 OP_SWAP`
- **Format:** `opcode=0x22, A=reg1, B=reg2, imm16=0`
- **Semantics:** Swap the entire semantic-register payloads of `reg[A]` and `reg[B]`.

### `0x23 OP_CLEAR`
- **Format:** `opcode=0x23, A=reg, imm16=clear_mask`
- **Operands:** `imm16` bitmask:
  - bit0: clear `poly_id`
  - bit1: clear `str_id`
  - bit2: clear `node_id`
  - bit3: clear `mat_id`
- **Semantics:** Clears selected fields deterministically.

---

## A.5 Fano Projection and Geometry Emission

### `0x30 OP_PROJ_FANO`
- **Format:** `opcode=0x30, A=frame_chan, B=0, imm16=proj_flags`
- **Semantics (Normative):**
  - Derive a 7-point Fano projection from the 8 semantic registers using the RFC-009 omission rule:
    - compute `w(r)=weight(reg[r].poly)`
    - omit `argmin (w(r), r)`
  - Emit nodes/edges for the Fano plane into renderer channel `A`.
- **Flags (`imm16`):**
  - bit0: emit circle-line
  - bit1: emit all 7 lines
  - bit2: emit all 7 points
  - bit3: attach keyword labels (RECOMMENDED)
  - others reserved (MUST be 0 in v1)

### `0x31 OP_EMIT_NODE`
- **Format:** `opcode=0x31, A=frame_chan, B=reg, imm16=node_flags`
- **Semantics:** Emit a node derived from `reg[B]` into channel `A`.  
  Used for per-axis canvases / partial projections.
- **Rule:** Emission MUST be idempotent per (node_id, frame_chan).

### `0x32 OP_EMIT_EDGE`
- **Format:** `opcode=0x32, A=frame_chan, B=edge_kind, imm16=packed`
- **Operands:**
  - `B` selects edge derivation kind (profile-defined)
  - `imm16` packs two 8-bit indices (hi=from, lo=to) into the **current 7-point projection index space** (0..6).
- **Rule:** Emission MUST be idempotent per (from,to,kind,frame_chan).

### `0x33 OP_LIFT_3D`
- **Format:** `opcode=0x33, A=frame_chan, B=lift_kind, imm16=lift_flags`
- **Semantics:** Lift the most recent 2D derived frame to a 3D representation (OBJ/GLB contract layer).
- **Rule:** MUST use fixed-point integer coordinate rules (RFC-009 §X.8.3–§X.8.4).

---

## A.6 Barriers and Consistency Checks

These opcodes do **not** change semantic state except by trapping on failure.

### `0x40 OP_ASSERT_CANON`
- **Format:** `opcode=0x40`
- **Semantics:** Trap unless state is already canonical (as defined by `OP_CANON`).

### `0x41 OP_ASSERT_IDEMPOTENT`
- **Format:** `opcode=0x41, A=reg, B=test_kind, imm16=0`
- **Test kinds:**
  - `B=0`: assert `gcd(p,p)=p` for `reg[A]`
  - `B=1`: assert `lcm(p,p)=p` for `reg[A]`
- **Semantics:** Trap on failure.

### `0x42 OP_ASSERT_FANO_TRIAD`
- **Format:** `opcode=0x42, A=reg1, B=reg2, imm16=reg3_in_low_nibble`
- **Encoding:**
  - `imm16 & 0x000F` is `reg3` (0..7)
- **Semantics:** Trap unless the three selected registers satisfy the VM’s Fano-triad predicate (profile-defined).  
  v1 RECOMMENDS: all pairwise gcd are non-trivial (not equal to 1) after canonicalization.

---

## A.7 Reserved Ranges (v1)

- `0x50..0x5F` reserved for “origami fold axioms” expansions (A1..A7) once you decide which must be primitive vs derived.
- `0x60..0x6F` reserved for timing/clock constraints (crystal/analog barrier hooks) as pure **assertions**, not semantics (so determinism is preserved).
- `0x70..0x7F` reserved for multiplex/stream controls (AVD integration).

Readers/executors:
- MUST trap on encountering an unknown opcode in strict mode.
- MAY ignore unknown opcodes only in a non-consensus debug profile.
