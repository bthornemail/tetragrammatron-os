# RFC-0012 — CANB v1 Binary Encoding

**Title:** CANB v1 — CanvasL Binary Encoding Format  
**Status:** Normative  
**Applies to:**
- CAN-ISA bytecode streams
- Origami Fold VM instruction encoding
- Object pool encoding
- CLBC-POLY compatibility

**Updates:** RFC-0000 (CAN-ISA Invariants), RFC-0009 (Origami Fold VM)  
**Mnemonic:** `RFC-CANON-LAW`

---

## 1. Scope and Purpose

This RFC defines the **CANB v1** (CanvasL Binary) encoding format for:

- Origami Fold VM instructions
- Object pool references
- Deterministic bytecode streams
- Cross-platform compatibility

CANB v1 SHALL preserve all invariants defined in RFC-0000.

---

## 2. Endianness

All multi-byte integers SHALL be **big-endian**.

This ensures:
- Deterministic encoding across platforms
- Compatibility with network protocols
- Consistent hashing

---

## 3. Instruction Encoding

### 3.1 Fixed-Width Format

Each instruction SHALL be **32 bits** (4 bytes), fixed-width.

### 3.2 Instruction Word Layout

```
31          24 23        20 19   16 15        0
+--------------+------------+-------+----------+
|   OPCODE     |    FLAGS   |  RDST  |   IMM16  |
+--------------+------------+-------+----------+
```

- **OPCODE** (8 bits, bits 31-24): Instruction operation code (RFC-0009 §4)
- **FLAGS** (4 bits, bits 23-20): Instruction flags
- **RDST** (4 bits, bits 19-16): Destination register (0-15)
- **IMM16** (16 bits, bits 15-0): Immediate value (opcode-specific)

### 3.3 Flags Field

The FLAGS field SHALL have the following bit layout:

| Bit | Name | Meaning |
|-----|------|---------|
| 0 | CANON_IN | Inputs are canonicalized before operation |
| 1 | CANON_OUT | Output is canonicalized after operation |
| 2 | PROOF_REQUIRED | Operation requires proof witness |
| 3 | EMIT | Operation emits geometry events |
| 4-7 | RESERVED | MUST be 0 |

### 3.4 Register Encoding

- **RDST** (4 bits):** Register index 0-15
  - Registers 0-7 are semantic registers (RFC-0009 §2.2)
  - Registers 8-15 are implementation-defined

---

## 4. CANB Container Format

### 4.1 Container Structure

A CANB v1 container SHALL have the following structure:

```
+------------------+
| Container Header |
+------------------+
| Section 0        |
+------------------+
| Section 1        |
+------------------+
| ...              |
+------------------+
| Section N        |
+------------------+
```

### 4.2 Container Header

The container header SHALL be 16 bytes:

```
Offset  Size  Field
0       4     MAGIC  = "CANB" (0x43 0x41 0x4E 0x42)
4       1     VER    = 0x01
5       1     FLAGS  (reserved, MUST be 0)
6       2     SECTION_COUNT (number of sections)
8       4     HEADER_CHECKSUM (CRC32 of header)
12      4     RESERVED (MUST be 0)
```

### 4.3 Section Format

Each section SHALL have:

```
Offset  Size  Field
0       1     SECTION_TYPE
1       3     SECTION_SIZE (bytes, excluding header)
4       N     SECTION_DATA
```

### 4.4 Section Types

| Type | Value | Meaning |
|------|-------|---------|
| CODE | 0x01 | Instruction stream |
| DATA | 0x02 | Object pool data |
| META | 0x03 | Metadata (non-executable) |
| PROOF | 0x04 | Proof witness data |

---

## 5. Object Pool Encoding

### 5.1 Object References

Object pool references SHALL be encoded as **32-bit** values (REF32).

### 5.2 CLBC-POLY Compatibility

Object pool objects SHALL be encoded per **CLBC-POLY** codec:

- Canonical polynomial representation
- Big-endian encoding
- Deterministic serialization

### 5.3 Object Pool Rule

Bytecode streams MAY embed CLBC-POLY objects as **framed blobs**, addressed by REF32.

Objects MUST be in canonical encoding (CLBC-POLY v1).

---

## 6. Immediate Value Encoding

### 6.1 16-bit Immediate (IMM16)

The IMM16 field SHALL be interpreted per opcode:

- Signed or unsigned as specified by opcode semantics
- Big-endian encoding
- Opcode-specific validation rules apply

### 6.2 32-bit Immediate Construction

32-bit immediate values SHALL be constructed via:

- `LDI16H` (RFC-0009 §4.5): Load high 16 bits into I32 latch
- `LDI16L` (RFC-0009 §4.5): Load low 16 bits into I32 latch
- `USEI32` (RFC-0009 §4.5): Use complete I32 value

This construction SHALL be deterministic and idempotent.

---

## 7. Determinism Requirements

### 7.1 Byte-Stable Encoding

Given identical input, encoding SHALL produce:

- Byte-identical output
- Identical object pool layout
- Identical instruction sequence

### 7.2 Platform Independence

Encoding SHALL be independent of:

- Host architecture (x86, ARM, RISC-V)
- Operating system
- Compiler toolchain
- Floating-point representation

### 7.3 Round-Trip Requirement

Encoding/decoding SHALL be round-trip sound:

```
Decode(Encode(S)) = S
```

This SHALL preserve RFC-0000 CAN-INV-3 (Decode/Encode Soundness).

---

## 8. Opcode Encoding

### 8.1 Opcode Assignment

Opcode assignments SHALL match RFC-0009 Appendix A.

### 8.2 Reserved Opcodes

Opcodes 0xF0-0xFF SHALL be reserved for:

- Implementation-specific extensions
- Debug operations
- Future standardization

### 8.3 Invalid Opcodes

Decoding an invalid opcode SHALL result in:

- Execution halt
- Error state
- Rejection of instruction stream

---

## 9. Validation Rules

### 9.1 Instruction Validation

An instruction SHALL be valid if:

- Opcode is defined (RFC-0009 §4)
- Register indices are in valid range (0-15)
- IMM16 interpretation is valid for opcode
- Reserved bits are 0

### 9.2 Container Validation

A container SHALL be valid if:

- Magic number is "CANB"
- Version is 0x01
- Section count is non-zero
- All sections are valid
- Header checksum is correct

---

## 10. Relationship to Other RFCs

This RFC:

- **Implements encoding** for RFC-0009 (Origami Fold VM)
- **Preserves invariants** from RFC-0000 (CAN-ISA Invariants)
- **Defines format** for RFC-0011 (Repository Kernel) bytecode
- **Compatible with** CLBC-POLY codec

---

## 11. Conformance

### 11.1 Minimum Implementation

A conforming implementation SHALL:

- Support 32-bit fixed-width instructions
- Use big-endian encoding
- Support CANB v1 container format
- Validate instruction encoding
- Preserve determinism

### 11.2 Compatibility

CANB v1 SHALL be compatible with:

- CLBC-POLY object encoding
- RFC-0009 instruction semantics
- RFC-0000 invariant preservation

---

## Appendix A: CANB v1 Constants

| Constant | Value | Meaning |
|----------|-------|---------|
| CANB_MAGIC | "CANB" | Container magic number |
| CANB_VERSION | 0x01 | CANB v1 version |
| INSTR_SIZE | 4 | Instruction size in bytes |
| HEADER_SIZE | 16 | Container header size in bytes |

---

**End of RFC-0012**

