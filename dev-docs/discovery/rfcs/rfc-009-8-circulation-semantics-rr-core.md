# RFC-009 §8 — Circulation Semantics (RR Core)

This is the **analog/digital bridge you were reaching for**: RR is the deterministic “heartbeat” that lets *execution* circulate through participants/threads/planes **without** importing nondeterminism. TIME gives you a physical-ish scalar; RR gives you **topology**.

RR is also the clean gate for **safe self-modifying blocks** (§7): *only the current token holder may PATCH_APPLY*.

---

## 8.1 Definitions

- **Ring**: ordered set of participants `P = [p0, p1, …, p(n-1)]`
- **Token**: exclusive permission to perform gated operations
- **Epoch**: monotonic counter incremented on each rotation
- **Owner**: current token holder index `owner ∈ [0..n-1]`

RR state in VM:

```text
rr.enabled : Bool
rr.n       : Nat (2..255)
rr.owner   : Nat (0..n-1)
rr.epoch   : u32
rr.mask    : optional bitmask for membership (future)
```

---

## 8.2 Normative Invariants

RR MUST satisfy:

1) **Unique ownership**: exactly one owner when enabled  
2) **Deterministic rotation**: `next(owner) = (owner + 1) mod n`  
3) **Idempotent init**: re-initializing with same params yields same state  
4) **Monotone epoch**: `epoch` increments on each successful RR_NEXT  
5) **Gating**: if an opcode declares `REQUIRE_RR`, VM MUST reject execution unless caller id == owner  

RR MUST NOT depend on wall-clock. (TIME gates are separate.)

---

## 8.3 Opcodes (CAN-ISA v1)

| Opcode | Mnemonic   | Purpose |
|------:|------------|---------|
| 0xC0  | RR_INIT    | initialize or reset ring |
| 0xC1  | RR_OWNER   | read current owner/epoch |
| 0xC2  | RR_NEXT    | advance token to next owner |
| 0xC3  | RR_BARRIER | enforce “only owner may pass” |
| 0xC4  | RR_DISABLE | disable RR gating |

(0xC-family reserved for circulation.)

---

## 8.4 Binary Encoding (Imm16 layouts)

We use the same 16-bit instruction scheme as §7: base word + optional EXT word.

### 8.4.1 RR_INIT (EXT)

**Word 0 (EXT header):**
```
15..12 = 1111   (EXT)
11..8  = RD     (dst register for rr_handle or 0)
7..4   = 1100   (subop = RR_INIT)
3..0   = flags
```

**Word 1 (IMM16):**
```
15..8 = n_participants   (2..255; 0/1 invalid)
7..0  = start_owner      (0..n-1)
```

**Flags (low nibble):**
- bit0 `TRACE_MUX` : emit MUX_EVT on init/next/barrier
- bit1 `RESET_EPOCH` : if set, epoch := 0; else keep epoch if already enabled (idempotent upgrade path)
- bit2 `ENABLE_GATING` : if set, rr.enabled := true
- bit3 reserved (MUST be 0)

**Semantics:**
- If `n_participants < 2` → TRAP.
- If `start_owner >= n_participants` → TRAP.
- Sets `rr.n`, `rr.owner`, and (optionally) `rr.epoch`.
- If `ENABLE_GATING` not set, RR may be configured but inactive.
- If `RD != 0`, VM writes a deterministic “handle” to `REG[RD]`:
  - `handle = poly_u32( (n<<8) | start_owner )` (simple canonical encoding)

---

### 8.4.2 RR_OWNER (R-type)

**Word 0:**
```
15..12 = 1100  (0xC family)
11..8  = RD    (dst)
7..4   = 0001  (minor = RR_OWNER)
3..0   = mode
```

**mode:**
- `0x0`: write owner index to RD as `poly_u32(owner)`
- `0x1`: write epoch to RD as `poly_u32(epoch)`
- `0x2`: pack (owner<<24 | n<<16 | epoch_low16) into RD (fast debug)
- others reserved → TRAP

---

### 8.4.3 RR_NEXT (R-type)

**Word 0:**
```
15..12 = 1100  (0xC family)
11..8  = RD    (dst)
7..4   = 0010  (minor = RR_NEXT)
3..0   = flags
```

**Flags:**
- bit0 `REQUIRE_OWNER` : must only execute if caller is current owner
- bit1 `INCR_EPOCH` : must be 1 in this RFC
- bit2 reserved
- bit3 reserved

**Semantics:**
- If `rr.enabled=false` → TRAP (or NOOP if you want; RFC says TRAP for safety).
- If `REQUIRE_OWNER=1`, VM MUST verify caller id == rr.owner.
- rr.owner := (rr.owner + 1) mod rr.n
- rr.epoch := rr.epoch + 1 (u32 wrap allowed, deterministic)
- If `RD != 0`, write new owner to RD.

---

### 8.4.4 RR_BARRIER (EXT)

This is the mechanical gate you’ll use everywhere (PATCH_APPLY, COMMIT, etc.).

**Word 0:**
```
15..12 = 1111 (EXT)
11..8  = RS   (register holding caller_id as u32 poly)
7..4   = 1101 (subop = RR_BARRIER)
3..0   = flags
```

**Word 1 (IMM16):**
```
15..0 = barrier_tag   (opaque, for tracing / proofs)
```

**Flags:**
- bit0 `TRACE_MUX`
- bit1 `STRICT` : if set, TRAP on failure; if clear, write 0/1 to RS? (see below)
- bit2 reserved
- bit3 reserved

**Semantics:**
- Let `caller = u32(REG[RS])`.
- Pass condition: `rr.enabled=true ∧ caller == rr.owner`.
- If pass: continue.
- If fail:
  - if `STRICT=1` → TRAP
  - else VM writes `REG[RS]=poly_u32(0)` and continues (soft barrier)

Tracing:
- If `TRACE_MUX`, emit `MUX_EVT LOG: RR_BARRIER(tag, caller, owner, epoch, pass)`.

---

### 8.4.5 RR_DISABLE (R-type)

Disables gating but retains parameters.

**Word 0:**
```
15..12 = 1100
11..8  = 0000
7..4   = 0100 (minor = RR_DISABLE)
3..0   = 0000
```

Semantics: `rr.enabled := false`.

---

## 8.5 “Caller ID” and Topology Binding

RR assumes a `caller_id` exists. You have two clean options:

1) **Single-device VM**: caller_id = “thread index” or “task id”
2) **Distributed**: caller_id = “node index” negotiated at boot

RFC-009 stays agnostic: it only requires **a stable integer** in a register.

---

## 8.6 Gating PATCH (§7) with RR (Required Link)

Update §7 PATCH_APPLY semantics with RR:

- If PATCH_APPLY flags include `REQUIRE_RR`:
  - VM MUST run `RR_BARRIER` internally using `caller_id` (from a dedicated VM register or supplied RS)
  - If barrier fails → PATCH_APPLY MUST TRAP and MUST NOT modify code

This is the “circulation + chirality” you described: **only the token holder may mutate the organism**.

---

## 8.7 Minimal Vertical Slice (Firmware-first)

Implement:

- RR_INIT (EXT)
- RR_OWNER
- RR_NEXT (REQUIRE_OWNER=1, INCR_EPOCH=1)
- RR_BARRIER (STRICT=1)
- Patch gating: require RR for PATCH_APPLY

Then your loop is immediately meaningful:

1) RR_BARRIER (only owner acts)
2) execute fold ops / patch ops
3) RR_NEXT (pass token)
4) repeat

That’s your deterministic “pulse”.

---

## If you say “9”
Next is the **TIME core** (TIME_RD + WAIT + BARRIER_T) and exactly how to treat the crystal/clock as an *analog constraint* without leaking nondeterminism into proofs.

---

## You

9

---

## ChatGPT
