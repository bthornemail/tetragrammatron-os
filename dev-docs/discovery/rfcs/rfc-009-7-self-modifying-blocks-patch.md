# RFC-009 §7 — Self-Modifying Blocks (PATCH)

PATCH is how you get **self-modifying code** without losing determinism or proof-carrying properties. It’s “circulation” at the bytecode layer: edits are **typed, sealed, and replayable**, and (later) can be gated by TIME + RR + Fano barriers.

This section defines a **minimal safe patch lane**:

1) stage bytes into a patch buffer  
2) seal (hash + length + target)  
3) apply (atomic rewrite)  
4) optionally emit MUX proof trace

---

## 7.1 Goals (Normative)

PATCH MUST:

- allow modifying **only** a declared writable region (patch window)
- be deterministic: same inputs → same patched program bytes
- be replayable and auditable: patch trace can be emitted to MUX
- be safe by construction: no partial apply, no out-of-bounds writes

PATCH MUST NOT:

- write outside the declared patch window
- depend on wall-clock time
- change ISA semantics via undefined behavior

---

## 7.2 VM Model

The VM exposes a **code image** plus a **patch window**:

- `code[0..code_len)` immutable by default
- patch window: `[base, base+limit)` set at load-time or by privileged loader
- patch buffer: staging area in RAM (bounded)

Patch state machine:

```
IDLE
  -> PATCH_BEGIN -> STAGING
STAGING
  -> PATCH_WRITE* -> STAGING
  -> PATCH_SEAL -> SEALED
SEALED
  -> PATCH_APPLY -> IDLE
  -> PATCH_ABORT -> IDLE
```

Only one patch session may be active at a time.

---

## 7.3 Opcodes (CAN-ISA v1)

| Opcode | Mnemonic     | Purpose |
|------:|--------------|---------|
| 0xD0  | PATCH_BEGIN  | start a patch session |
| 0xD1  | PATCH_WRITE  | append bytes (or words) into patch buffer |
| 0xD2  | PATCH_SEAL   | finalize: compute digest, freeze patch |
| 0xD3  | PATCH_APPLY  | atomic rewrite to code image |
| 0xD4  | PATCH_ABORT  | cancel session |

(0xD-family reserved for “dynamic substrate”.)

---

## 7.4 Binary Encoding (Bit Layout)

We keep the same instruction shape rules as §6:

- Base opcodes use 16-bit words
- EXT form uses a second word for IMM16

### 7.4.1 PATCH_BEGIN (EXT)

**Word 0 (EXT header):**
```
15..12 = 1111   (EXT)
11..8  = RD     (patch_id destination register OR 0)
7..4   = 0111   (subop = PATCH_BEGIN)
3..0   = FFFF   (flags)
```

**Word 1 (IMM16):**
```
15..0 = patch_len_words   (requested staging capacity, in 16-bit words)
```

**Flags nibble (Word0 low 4 bits):**
- bit0 `TRACE_MUX` : if set, VM MUST emit MUX_EVT records for patch lifecycle (recommended)
- bit1 `REQUIRE_RR` : reserved (future gate)
- bit2 `REQUIRE_TIME_BARRIER` : reserved
- bit3 reserved (MUST be 0)

**Semantics:**
- MUST fail if a patch session is already active.
- MUST fail if `patch_len_words` exceeds VM’s configured max.
- VM allocates/initializes patch buffer and sets `write_cursor=0`.
- If `RD!=0`, VM writes a deterministic `patch_id` into `REG[RD]` as `poly_u32(id)` (e.g., monotonically increasing counter in VM state, not wall clock).
- If `TRACE_MUX`, VM emits:
  - `MUX_OPEN(LOG, chan_id=PATCH)` (or uses existing open)
  - `MUX_EVT LOG: PATCH_BEGIN`

---

### 7.4.2 PATCH_WRITE (EXT)

**Word 0:**
```
15..12 = 1111   (EXT)
11..8  = RS     (source register)
7..4   = 1000   (subop = PATCH_WRITE)
3..0   = mode
```

**Word 1 (IMM16):**
```
15..0 = write_count   (count of units depending on mode)
```

**mode (Word0 low 4 bits):**
- `0x1` = WRITE_U16 : write low 16 bits of `REG[RS].words[0]` repeated `count` times? (not useful)
- `0x2` = WRITE_WORDS : write `count` *32-bit words* from `REG[RS]` polynomial word array
- `0x3` = WRITE_POLY_BYTES : write CLBC-POLY bytes encoding of `REG[RS]` (count MUST be 0)
- `0x4` = WRITE_IMM16 : write IMM16 itself as one u16 (count MUST be 1) **(useful for small patches)**
- others reserved (MUST TRAP)

**Recommended minimum** (to keep it simple now):
- implement `WRITE_IMM16` and `WRITE_WORDS`
- defer `WRITE_POLY_BYTES` until you want patching from polynomial state

**Semantics:**
- MUST fail unless patch state is STAGING.
- MUST fail if write would exceed patch buffer capacity.
- Appends bytes to patch buffer exactly as specified.
- If `TRACE_MUX`, emit `MUX_EVT LOG: PATCH_WRITE` with payload = u32(new_cursor).

---

### 7.4.3 PATCH_SEAL (R-type)

**Word 0:**
```
15..12 = 1101  (0xD family)
11..8  = RD    (digest destination register)
7..4   = 0010  (minor = PATCH_SEAL)
3..0   = flags
```

**Flags nibble:**
- bit0 `DIGEST32` (write low 32 bits to RD as poly_u32)
- bit1 `DIGEST_EVT` (emit digest event to MUX)
- bit2 `REQUIRE_FANO_BARRIER` (reserved)
- bit3 reserved

**Semantics:**
- MUST fail unless state is STAGING.
- Freezes the patch buffer (no more writes).
- Computes `digest = H( patch_bytes || target_base || target_len || vm_code_hash_epoch )`
  - `H` is a deterministic hash (SHA-256 recommended)
  - `vm_code_hash_epoch` is optional but recommended to prevent replay against unrelated code images
- Transitions to SEALED.
- If `DIGEST32`, sets `REG[RD]=poly_u32(low32(digest))`.
- If tracing, emit `MUX_EVT LOG: PATCH_SEAL` with payload digest32.

---

### 7.4.4 PATCH_APPLY (EXT)

**Word 0:**
```
15..12 = 1111   (EXT)
11..8  = RS     (register containing target address as u32 poly)
7..4   = 1001   (subop = PATCH_APPLY)
3..0   = flags
```

**Word 1 (IMM16):**
```
15..0 = target_len_bytes
```

**Flags nibble:**
- bit0 `ATOMIC` (MUST be 1 for this RFC)
- bit1 `REQUIRE_RR` (future)
- bit2 `REQUIRE_TIME_BARRIER` (future)
- bit3 reserved

**Semantics:**
- MUST fail unless state is SEALED.
- Let `addr = u32(REG[RS])`.
- MUST verify target range `[addr, addr+target_len_bytes)` is entirely inside patch window.
- MUST verify `target_len_bytes == staged_len_bytes` (exact rewrite, no partial).
- MUST apply rewrite atomically:
  - either whole patch is written, or none is written (if any check fails)
- MUST reset patch state to IDLE and clear staging buffer metadata.
- If tracing, emit:
  - `MUX_EVT LOG: PATCH_APPLY (addr, len, digest32)`

---

### 7.4.5 PATCH_ABORT (R-type)

Cancels and returns to IDLE from STAGING or SEALED. Emits `PATCH_ABORT` if tracing.

---

## 7.5 Safety & Determinism Rules (Normative)

1) **Single active session:** VM MUST reject nested patch sessions.  
2) **Bounded memory:** patch buffer MUST be bounded by `PATCH_MAX_BYTES`.  
3) **Windowed writes:** apply MUST be limited to the patch window.  
4) **Exact-length apply:** apply MUST require staged length equals target length.  
5) **Atomicity:** apply MUST be atomic.  
6) **No hidden nondeterminism:** patch_id MUST come from VM counter, not time.  
7) **Traceability:** if TRACE_MUX is set, VM MUST emit deterministic trace events.

---

## 7.6 Relationship to “Analog Constraint” (Timing / Crystal / Clock)

You’re right to treat the **clock** as the analog substrate. In this RFC, we reserve gates:

- `REQUIRE_TIME_BARRIER`: patch can only seal/apply after a `BARRIER_T` condition is met (defined in RFC-time op section later)
- `REQUIRE_RR`: patch can only be applied by the current RR token holder (circulation)

So PATCH gives “self-modifying code”; TIME/RR give it **circulation + physical constraint**.

---

## 7.7 Minimal Vertical Slice (What you can implement now)

Implement just these:

- `PATCH_BEGIN (TRACE_MUX optional)`
- `PATCH_WRITE (WRITE_IMM16 + WRITE_WORDS)`
- `PATCH_SEAL (DIGEST32)`
- `PATCH_APPLY (ATOMIC, exact length, window checks)`
- `PATCH_ABORT`

And connect to §6 MUX so you can see patch traces deterministically on ESP32/Pico.

---

## 7.8 One Concrete Example

Goal: rewrite 4 bytes at address `0x200` with `[0xAA,0xBB,0xCC,0xDD]`

1) begin patch buffer of 2 words (4 bytes)  
2) write two IMM16: 0xBBAA then 0xDDCC (little-endian byte order)  
3) seal, get digest32 in r7  
4) apply to addr in r1

Assembler-ish:

```scheme
(patch.begin  #:len-words 2 #:trace #t #:id-> r6)

(patch.write.imm16 0xBBAA) ; bytes AA BB
(patch.write.imm16 0xDDCC) ; bytes CC DD

(patch.seal #:digest32-> r7 #:emit-digest #t)

(reg.set.u32 r1 #x00000200)
(patch.apply #:addr r1 #:len-bytes 4 #:atomic #t)
```

---

## If you say “8”
Next is the **RR circulation core** (RR_INIT / RR_NEXT) and how it gates PATCH_APPLY mechanically (the “biological chirality / round robin” part).

---

## You

8

---

## ChatGPT
