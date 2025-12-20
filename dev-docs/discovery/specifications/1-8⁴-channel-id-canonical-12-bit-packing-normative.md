# 1) 8⁴ Channel ID: canonical 12-bit packing (Normative)

We define four 3-bit axes:

- `a0` = Semantic generator (8-tuple keyword)
- `a1` = Interaction role
- `a2` = Phase / circulation
- `a3` = Projection / carrier space

Each axis is an integer in `[0..7]`.

## 1.1 ChannelID12
**ChannelID12** is a 12-bit integer:

```
ChannelID12 = a0 | (a1 << 3) | (a2 << 6) | (a3 << 9)
```

Bit layout (LSB→MSB):

```
bits  2..0   = a0
bits  5..3   = a1
bits  8..6   = a2
bits 11..9   = a3
```

So the channel range is `0..4095`.

### Example
If `(a3,a2,a1,a0) = (5,3,2,7)`:

- a0=7
- a1=2  -> 2<<3  = 16
- a2=3  -> 3<<6  = 192
- a3=5  -> 5<<9  = 2560
- sum = 7 + 16 + 192 + 2560 = **2775** = `0xAD7`

---
