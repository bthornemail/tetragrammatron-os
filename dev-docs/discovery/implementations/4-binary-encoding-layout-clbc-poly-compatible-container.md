# 4) Binary encoding layout (CLBC-POLY compatible container)

You asked that instruction encoding “match CLBC-POLY codec”. The clean way:

### 4.1 CAN container = CLBC-style framing + instruction stream

```
CANBC v1 container (big-endian fields)

0..3   magic      = "CANB"
4      version    = 0x01
5      flags      = bitfield
6      ring_id    = 0x01  (F2[x])
7      hdr_len    = 0x10  (16 bytes header)

8..11  code_len   = u32   (# bytes of instruction stream)
12..15 poly_len   = u32   (# bytes of CLBC-POLY blobs section)

[code section: code_len bytes]
[poly section: poly_len bytes, concatenated CLBC-POLY v1 records]
```

Then instructions refer to polynomial blobs by **index** (or offset) deterministically.

---
