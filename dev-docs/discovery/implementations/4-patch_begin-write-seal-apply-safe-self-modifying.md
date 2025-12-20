# 4) PATCH_BEGIN / WRITE / SEAL / APPLY (safe self-modifying)

This is “self-modifying code” **without chaos**: you only allow mutation through a sealed patch object.

### VM state additions
- `patch.active : bool`
- `patch.buf[]  : byte[]` (bounded, e.g. 512 bytes on MCU)
- `patch.hash   : 32 bytes` (sha256 or blake2s)
- `patch.target : u16` (address or section id)
- `patch.barrier: u32` (required barrier token captured at begin)

### Opcodes
#### PATCH_BEGIN
- **Semantics:**
  - `patch.active ← true`
  - `patch.buf ← empty`
  - `patch.target ← imm16`
  - `patch.barrier ← t_vm` (or last barrier)
  - MUST emit PROOF event “patch begin”

**Encoding**
- `FMT=10`, imm16=target

#### PATCH_WRITE
- **Semantics:** append bytes to patch buffer
- `EXT` format: payload bytes are appended.

**Encoding**
- `FMT=11` (EXT), tag indicates PATCH_WRITE, bytes are patch data chunk.

#### PATCH_SEAL
- **Semantics:**
  - compute `patch.hash = H(patch.target || patch.barrier || patch.buf)`
  - `patch.active ← false`
  - emit PROOF event with hash

**Encoding**
- `FMT=00`

#### PATCH_APPLY
- **Semantics (MUST enforce):**
  - MUST fail unless:
    1) `patch.active == false`
    2) barrier token matches current `t_vm ≥ patch.barrier`
    3) target region is writable
    4) applying maintains “Fano consistency” (your merge rule)
  - If pass: write bytes into code/segment, then invalidate i-cache if needed

**Encoding**
- `FMT=00`

### “Fano consistency” for patches (minimal enforcement now)
For the vertical slice, make it mechanical and cheap:

- Let `A = hash(before_region)`
- Let `B = hash(patch_bytes)`
- Let `C = hash(after_region)`
- Define `TriadOK` iff `gcd(A,B) != 1 ∧ gcd(B,C) != 1 ∧ gcd(A,C) != 1`
  - (If you don’t have poly GCD yet, use byte-hash-prefix overlap as placeholder.)
- PATCH_APPLY MUST reject if `TriadOK` fails.
- Emit a PROOF event with decision.

This gives you the *shape* of the rule now; later you swap in real `poly_gcd/poly_lcm`.

---
