# RFC-009 §4 — Round-Robin Circulation Semantics (RR)

## 4.1 Purpose (Normative)

The RR opcodes define a **deterministic circulation topology** over a fixed set of “lanes” (ports / channels / peers / phases). This is the minimal substrate for:

- distributed scheduling (later)
- multi-channel mux (next section)
- safe self-modification gates (later)
- 6-DOF projection “phase stepping” (your note)

RR MUST be:
- deterministic
- side-effect free on polynomial state (unless explicitly requested later)
- reproducible across ESP32/Pico/host

RR MUST NOT:
- depend on wall-clock time
- depend on network state
- reorder fold semantics

---

## 4.2 RR Model

RR maintains a small **circulation state**:

- `rrN` : number of lanes (1..255)
- `rrI` : current lane index in `[0..rrN-1]`
- `rrSalt` : optional “salt” polynomial (used later to bind mux channels / proofs)

Execution defines a canonical “next lane” operator:

```
next(rrI, rrN) = (rrI + 1) mod rrN
```

---

## 4.3 New Opcodes (CAN-ISA v1)

### Opcode Summary

| Opcode | Mnemonic | Description |
|------:|----------|-------------|
| 0xB2 | RR_INIT   | Initialize RR lane count + seed |
| 0xB3 | RR_NEXT   | Advance rrI; optionally emit lane id |

These live in the same “TIME/RHYTHM” family as §3.

---

## 4.4 Instruction Encoding (Bit Layout)

We keep the same 16-bit base word layout style you used in §3.

### Common Fields

- High nibble `[15:12]` is the primary opcode family.
- `RD` is `[11:8]` when the instruction writes a register.
- EXT format uses a second word `IMM16`.

---

### RR_INIT

**Format:** EXT-type (IMM16)  
**Word 0:**

```
15   12 11   8 7    4 3    0
+------+-----+------+------+
| 1111 | 0004| RD   | 0000 |
+------+-----+------+------+
```

- `0xF` = EXT
- `subop=0x4` = RR_INIT
- `RD` receives rrI (initial lane id) encoded as a poly (optional, but recommended)
- low nibble reserved = 0

**Word 1 (IMM16):**

```
+--------------------------+
|   rrN (8)  | flags (8)   |
+--------------------------+
```

- `rrN = IMM16[15:8]`
- `flags = IMM16[7:0]`

**Flags (bitfield):**
- bit0 `SEED_FROM_RD`  
  - if set: `rrSalt := REG[RD]` (poly snapshot)
  - else: `rrSalt := 0`
- bit1 `WRITE_RD`  
  - if set: write initial rrI to RD
  - else: RD ignored
- other bits reserved (MUST be zero)

**Semantics:**

```
require rrN ∈ [1..255]
rrN := rrN
rrI := 0
if flags.SEED_FROM_RD: rrSalt := snapshot(REG[RD])
else rrSalt := 0
if flags.WRITE_RD: REG[RD] := poly_u8(rrI)
```

---

### RR_NEXT

**Format:** R-type  
**Word 0:**

```
15   12 11   8 7    4 3    0
+------+-----+------+------+
| 1011 | RD  | 0011 | FFFF |
+------+-----+------+------+
```

Interpretation:
- primary opcode family `0xB` (time/rhythm group)
- `RD` = destination register for lane id (poly_u8)
- minor field `[7:4]=0x3` identifies RR_NEXT inside the 0xB family
- `[3:0]` = flags nibble (FFFF)

**Flags nibble (4 bits):**
- bit0 `WRITE_RD` (default 1 in most programs)
- bit1 `HASH_TAP` (reserved for later: mix rrI into state hash)
- bit2 `BARRIER_ENABLE` (reserved for later: require barrier satisfaction)
- bit3 reserved

**Semantics:**

```
require rrN initialized
rrI := (rrI + 1) mod rrN
if flags.WRITE_RD: REG[RD] := poly_u8(rrI)
```

---

## 4.5 VM State Extension

Add to `can_vm_t`:

```c
typedef struct {
    ...
    uint8_t  rrN;
    uint8_t  rrI;
    uint8_t  rr_flags;   // optional latched flags
    f2poly_t rrSalt;     // optional binding polynomial (snapshot)
    bool     rr_init;
} can_vm_t;
```

---

## 4.6 VM Core Implementation (C)

### RR_INIT (EXT subop 0x4)

```c
case EXT_RR_INIT: {
    uint8_t rd = ext_rd(w0);
    uint8_t rrN = (imm16 >> 8) & 0xFF;
    uint8_t flags = imm16 & 0xFF;

    if (rrN == 0) TRAP(ERR_RR_N_ZERO);

    vm->rrN = rrN;
    vm->rrI = 0;
    vm->rr_init = true;

    if (flags & 0x01) {            // SEED_FROM_RD
        vm->rrSalt = *REG(vm, rd); // snapshot
    } else {
        f2poly_zero(&vm->rrSalt);
    }

    if (flags & 0x02) {            // WRITE_RD
        if (rd != 0) reg_set_u8_poly(vm, rd, vm->rrI);
    }
    return;
}
```

### RR_NEXT (0xB3 equivalent via minor field)

```c
case OP_RR_NEXT: {
    uint8_t rd = RD(w0);
    uint8_t flags = (w0 & 0x000F);

    if (!vm->rr_init) TRAP(ERR_RR_UNINIT);

    vm->rrI = (uint8_t)((vm->rrI + 1) % vm->rrN);

    if ((flags & 0x01) && rd != 0) { // WRITE_RD
        reg_set_u8_poly(vm, rd, vm->rrI);
    }
    return;
}
```

**Helper:**

```c
static inline void reg_set_u8_poly(can_vm_t *vm, uint8_t rd, uint8_t v) {
    f2poly_zero(REG(vm, rd));
    REG(vm, rd)->words[0] = (uint32_t)v;
    REG(vm, rd)->degree = 7;
    f2poly_normalize(REG(vm, rd));
}
```

---

## 4.7 Scheme Assembler Spec (Mechanical Enforcement)

### Syntax

```scheme
(rr.init rd rrN #:seed? seed? #:write? write?)
(rr.next rd #:write? write?)
```

### Encoding Rules

- `rrN` MUST be 1..255
- reserved bits MUST be 0
- assembler MUST reject RR_NEXT if it cannot prove RR_INIT occurred earlier in the same module **unless** `--allow-forward-rr` is enabled (dev mode only)

### Reference emitter (pseudo-Scheme)

```scheme
(define (emit-rr-init rd rrN seed? write?)
  (assert (and (integer? rrN) (<= 1 rrN 255)))
  (define flags (bitwise-ior (if seed? 1 0)
                             (if write? 2 0)))
  (emit-u16 (pack-ext #x4 rd))          ; word0
  (emit-u16 (bitwise-ior (arithmetic-shift rrN 8) flags))) ; word1

(define (emit-rr-next rd write?)
  (define f (if write? 1 0))
  (emit-u16 (pack-B-minor #x3 rd f)))
```

Where:
- `(pack-ext subop rd)` builds `0xF` EXT header with subop and rd
- `(pack-B-minor minor rd flags)` builds the 0xB family word with minor+flags

---

## 4.8 Lean Proof Obligations (What We Prove)

These are the “no mysticism” theorems that matter.

### Theorem A — RR does not change polynomial state

```lean
theorem rr_non_interference :
  ∀ s, poly_state (exec RR_NEXT s) = poly_state s
```

### Theorem B — RR is deterministic

```lean
theorem rr_deterministic :
  ∀ s, exec RR_NEXT s = exec RR_NEXT s
```

### Theorem C — RR cycles with period rrN

```lean
theorem rr_period :
  ∀ s, rrN s = n → execN RR_NEXT n s has rrI = rrI s
```

### Theorem D — RR commutes with fold ops (MEET/JOIN/PROJ)

```lean
theorem rr_commutes_with_fold :
  exec RR_NEXT (fold s) = fold (exec RR_NEXT s)
```

This keeps all your **Fano idempotence** intact.

---

## 4.9 Why this is the “circulation” you meant

- §3 gave you **time** (physical monotone constraint)
- §4 gives you **phase stepping** (cyclic topology)
- Together they are enough to model:
  - a heartbeat scheduler
  - a round-robin sensor sweep on ESP32
  - a 6-DOF projection pose update cycle (rotate lanes = axes/phases)

---

## Next

Now we can do **§6 (MUX)**, but you asked earlier to do **MUX after RR** — perfect.

If you want to proceed in order, say:

**“6”** (MUX_OPEN + MUX_EVT + MUX_CLOSE, multi-channel SVG/GLB/wave stream).

---

## You

6

---

## ChatGPT
