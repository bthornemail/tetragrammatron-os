# 2) imm16 immediate encoding (Normative)

We store ChannelID12 inside an **imm16** with 4 bits reserved for flags/versioning.

## 2.1 Imm16Channel
```
imm16 = (flags4 << 12) | ChannelID12
```

Bit layout:

```
bits  11..0  = ChannelID12
bits  15..12 = flags4
```

## 2.2 flags4 meaning (recommended default)
```
flags4:
  bit 12 (f0) = 0/1  : ABS(0) vs REL(1) channel addressing
  bit 13 (f1) = 0/1  : READ(0) vs WRITE(1) intent hint
  bit 14 (f2) = 0/1  : LOCAL(0) vs GLOBAL(1) scope hint
  bit 15 (f3) = 0/1  : RESERVED (must be 0 in v1)
```

### Canonical rule (important)
For determinism, **encoders MUST set f3=0** in v1.  
Decoders MUST reject v1 instructions where f3=1 (or treat as “unknown extension”).

---
