# 12.1 Normative rules (assembler-enforced)

### PATCH State Machine (single “active patch” per thread)
Assembler maintains a compile-time state:

- `patch_state = Idle | Open(id,len,owner,written_bytes, sealed?)`
- transitions:

| Instruction | Precondition | Effect |
|---|---|---|
| `patch.begin` | Idle | Open(...) |
| `patch.write` | Open and not sealed | increments `written_bytes`, bounds check |
| `patch.seal` | Open and not sealed | sealed := true |
| `patch.apply` | Open and sealed OR (policy: allow apply of last sealed patch) | emits apply |
| `patch.abort` | Open | returns to Idle |

**Normative constraints**
- `patch.write` MUST NOT exceed `len` (sum of write payload lengths ≤ len)
- `patch.seal` MUST occur before `patch.apply`
- `patch.begin` MUST NOT occur while a patch is already open (unless you explicitly enable nested patches; default NO)
- `patch.apply` MUST pass the **gate adjacency** requirement already implemented:
  - RR barrier strict (required)
  - TIME barrier strict + couple_rr (recommended)  
  - adjacency within the same basic block (as previously defined)

### MUX channel constraints (optional but recommended)
- `mux.evt` MUST be inside an open channel: requires prior `mux.open` for same `ch` not yet closed.
- `mux.close` MUST match an open channel.

---
