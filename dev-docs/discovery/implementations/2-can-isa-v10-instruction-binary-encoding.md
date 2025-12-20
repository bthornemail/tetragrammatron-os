# 2. CAN-ISA v1.0 instruction binary encoding

CAN-ISA v1.0 remains “byte opcode table”, but the *encoding* below makes it deterministic and easy to implement on ESP32/Pico.

## 2.1 Instruction word = 32 bits (fixed)

Every instruction is exactly **4 bytes**:

```
byte0: OPCODE
byte1: A      (register / small immediate)
byte2: B      (register / small immediate)
byte3: C      (register / flags / small immediate)
```

No multi-length instructions in v1.0. (If you need more, you add opcodes that interpret A/B/C as an index into CONST tables.)

### 2.2 Register model (for fold VM)

- `R0..R15` are **poly registers** (hold a canonical F₂[x] polynomial object).
- `K0..K7` are **context keys** (u32 ids) used for barrier checks / commit labeling.
- Flags register `F` is implicit (set by `CMP`, `BARRIER`, etc.).

Byte fields interpret as:

- If an operand is a “reg”, it’s `0x0..0xF`.
- If an operand is an “idx”, it’s `u8` index into the relevant table (e.g. POLY index for CONST loads).
- Any other meaning is opcode-specific but MUST be specified in the opcode table.

---

## 3. Fold VM core opcodes (minimal RFC-009 vertical slice)

These are the *semantics you said you want first*: **CANON + MEET(GCD) + JOIN(LCM) + PROJ_FANO barriers**.

### 3.1 `OP_CONST_POLY` — load polynomial constant
**Encoding:** `OP_CONST_POLY dst, idx`

- `byte0 = OP_CONST_POLY`
- `byte1 = dst` (0..15)
- `byte2 = idx` (0..255) index into `POLY` section index table
- `byte3 = 0`

**Semantics:** Load CLBC-POLY blob at `idx`, decode to internal `f2poly_t`, normalize, store in `Rdst`.

### 3.2 `OP_CANON` — canonicalize (idempotent normalization)
**Encoding:** `OP_CANON dst, src`

- `byte1=dst`, `byte2=src`

**Semantics:** `Rdst := canon(Rsrc)` where `canon` is your deterministic normalization.
**MUST satisfy:** `canon(canon(p)) = canon(p)`.

### 3.3 `OP_MEET` — meet = GCD
**Encoding:** `OP_MEET dst, a, b`

- `byte1=dst`, `byte2=a`, `byte3=b`

**Semantics:** `Rdst := gcd(Ra, Rb)` over F₂[x], then canonicalize.

### 3.4 `OP_JOIN` — join = LCM
**Encoding:** `OP_JOIN dst, a, b`

- `byte1=dst`, `byte2=a`, `byte3=b`

**Semantics:** `Rdst := lcm(Ra, Rb)` over F₂[x], then canonicalize.

### 3.5 `OP_PROJ_FANO` — projection operator (7-point/7-line summary)
**Encoding:** `OP_PROJ_FANO dst, src, mode`

- `byte1=dst` poly reg receiving projection result (often a reduced invariant polynomial)
- `byte2=src`
- `byte3=mode` (bitfield)
  - bit0: project “required fields only”
  - bit1: include key K
  - bit2: enforce 7-point cap (reject if not representable)

**Semantics:** deterministically project `Rsrc` into the “Fano summary space” (your chosen canonical map; implementation-defined but deterministic and proven idempotent).

### 3.6 `OP_BARRIER_FANO` — invariance/idempotence barrier check
**Encoding:** `OP_BARRIER_FANO src, expected, flags`

- `byte1 = src`
- `byte2 = expected` (poly reg holding expected invariant; often `PROJ_FANO` output)
- `byte3 = flags`
  - bit0: require `PROJ_FANO(src) == expected`
  - bit1: require `MEET(src, src) == src` (idempotence)
  - bit2: require `JOIN(src, src) == src` (idempotence)
  - bit3: trap-on-fail (else set flag + continue)

**Semantics:** sets VM flag or traps.

---
