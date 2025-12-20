# 7) Convenience macros (Informative)

## 7.1 Encode/decode formulas

**Encode:**
```
channel12(a3,a2,a1,a0) = a0 + 8*a1 + 64*a2 + 512*a3
imm16(flags, channel12) = (flags<<12) | channel12
```

**Decode:**
```
a0 =  channel12        & 7
a1 = (channel12 >> 3)  & 7
a2 = (channel12 >> 6)  & 7
a3 = (channel12 >> 9)  & 7
flags4 = (imm16 >> 12) & 0xF
```

## 7.2 Human-readable literal form
Allow an assembler literal:

```
@STATE/ENV/SYNC/GLB
```

Which maps to:

```
a0=STATE, a1=ENV, a2=SYNC, a3=GLB
```

---
