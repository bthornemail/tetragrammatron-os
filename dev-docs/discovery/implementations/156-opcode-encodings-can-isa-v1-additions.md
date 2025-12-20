# 15.6 Opcode encodings (CAN-ISA v1 additions)

We add three opcodes: `MUX_OPEN`, `MUX_EVT`, `MUX_CLOSE`.

These MUST use the same 16-bit instruction word style you’ve been using in the CAN-ISA “imm16 layouts” work: one primary word + optional extension word(s).

## 15.6.1 Instruction word layout (recap)
We assume 16-bit base word:

```
bits: 15..12  11..8  7..4   3..0
      OPC      A      B      C
```

- `OPC` = 4-bit major opcode family
- `A/B/C` = 4-bit fields (regs / minor / flags)

And an optional second word `imm16` for immediate payload.

### Reserved major family
Use major `0xD` for MUX (keeps TIME/RR at 0xE, EXT at 0xF).

---

## 15.6.2 MUX_OPEN
**Major:** 0xD  
**Minor:** in field C

```
word0: [ OPC=0xD | A=stream_id | B=kind | C=0x0 ]
word1: imm16 = flags
word2: imm16 = meta_hash_id (u16 handle into a hash register or table)
```

Rules:
- The VM MUST start a new stream with given `stream_id`.
- If stream already open, MUST trap unless `flags` allows restart.
- `meta_hash_id` references a canonical hash (e.g. SHA256 truncated to 16 via table) that binds metadata like coordinate profile, units, etc.

Flags (imm16):
- bit0: `ALLOW_REOPEN`
- bit1: `EMIT_OPEN_EVT` (emit an event that can be replay-checked)
- bits15..2 reserved

---

## 15.6.3 MUX_EVT
**Major:** 0xD

```
word0: [ OPC=0xD | A=stream_id | B=chan | C=0x1 ]
word1: imm16 = ts16   ; typically low16(T) from TIME_RD
word2: imm16 = payload_len_words (u16)
word3.. : payload words (16-bit each)
```

Rules:
- VM MUST canonical-hash payload bytes exactly as `payload_len_words*2` bytes, big-endian word order.
- VM MUST update rolling stream hash (15.3).
- VM MUST allow zero-length payload (heartbeat).

---

## 15.6.4 MUX_CLOSE
**Major:** 0xD

```
word0: [ OPC=0xD | A=stream_id | B=0 | C=0x2 ]
word1: imm16 = flags
```

Rules:
- VM MUST finalize rolling hash and publish `final_hash` to a known place:
  - a dedicated “hash register bank” or
  - emit a `DEBUG` evt with the hash (canonical)
- VM MUST mark stream closed.

Flags:
- bit0: `EMIT_FINAL_HASH_EVT`
- bit1: `TRAP_IF_EMPTY`
- others reserved

---
