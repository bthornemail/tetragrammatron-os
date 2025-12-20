# 2) Self-Modifying Blocks (Biological Chirality)

## Safe self-modifying rule (crucial)
Self-modification is only allowed through **canonical patch opcodes** that:
1) operate on *whole instruction words*, and  
2) require a **time witness** and **fano barrier witness**, and  
3) end in **RECANON** (to maintain idempotence invariants).

### Memory model
- `CODE_SEG`: immutable by default
- `PATCH_SEG`: writable overlay (copy-on-write pages or word patch table)
- `ACTIVE_VIEW`: resolved instruction fetch = CODE ⊕ PATCH (deterministic)

### Opcodes
```
0x70 PATCH_BEGIN   begin patch transaction (barrier)
0x71 PATCH_WORD    write one 32-bit word at imm16 word-index
0x72 PATCH_END     close transaction
0x73 PATCH_APPLY   atomically publish PATCH_SEG -> ACTIVE_VIEW (epoch-locked)
0x74 PATCH_REVERT  drop unpublished patch
0x75 PATCH_HASH    rdst <- hash(PATCH_SEG) (for proofs)
```

### Chirality hook
Add one bit of “direction” to patch ops:

- `PATCH_WORD` includes `dir` bit: **0 = forward propagate**, **1 = backprop**  
This matches your “propagate/backprop” mental model without adding non-determinism.

---
