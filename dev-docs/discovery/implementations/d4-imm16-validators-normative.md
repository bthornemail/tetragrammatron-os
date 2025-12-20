# D.4 `imm16` Validators (Normative)

The assembler MUST apply the following checks **per opcode**:

### MUST-be-zero immediates
`CANON, USEI32, MEET_GCD, JOIN_LCM, ASSERT_CANON, ASSERT_IDEMP`:
- `imm16` MUST be `0`

### `COMMIT (0x03)` layout
- `imm16 = (profile<<8) | flags`
- flags: only bits 0..1 allowed

### `CLEAR (0x23)` layout
- low 4 bits are mask
- upper 12 bits MUST be zero

### `PROJ_FANO (0x30)` layout
- `imm16 = (omit_rule<<8) | flags`
- flags: only bits 0..5 allowed

### `EMIT_NODE (0x31)` layout
- `imm16 = (style<<12) | (layer<<8) | flags`
- flags: only bits 0..2 allowed

### `EMIT_EDGE (0x32)` layout
- `(from_idx<<8) | to_idx`
- from_idx, to_idx MUST be 0..6

### `LIFT_3D (0x33)` layout
- `imm16 = (space<<12) | (scale<<8) | flags`
- flags: only bits 0..3 allowed

### `ASSERT_FANO (0x42)` layout
- low 4 bits = reg3 (0..15); upper bits MUST be zero

Violations MUST raise an error (assembler “trap”).

---
