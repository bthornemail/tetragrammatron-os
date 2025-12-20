# 10. Computing Offsets and Lengths (Exact Rules)

Let:
- `V = vertexCount`
- `E = edgeCount`
- `T = triCount`

Compute segment lengths:

- `LEN_VPOS = V * 12`
- `LEN_VCOL = V * 4`
- `LEN_VSEM = V * 16`
- `LEN_IEDG = (E * 2) * 4`
- `LEN_ITRI = (T * 3) * 4`

Define `PAD4(n) = (4 - (n mod 4)) mod 4`.

Then:

- `OFF_VPOS = 0`
- `OFF_VCOL = OFF_VPOS + LEN_VPOS + PAD4(LEN_VPOS)`
- `OFF_VSEM = OFF_VCOL + LEN_VCOL + PAD4(LEN_VCOL)`
- `OFF_IEDG = OFF_VSEM + LEN_VSEM + PAD4(LEN_VSEM)`
- `OFF_ITRI = OFF_IEDG + LEN_IEDG + PAD4(LEN_IEDG)`
- `BIN_BYTE_LENGTH = OFF_ITRI + LEN_ITRI + PAD4(LEN_ITRI)`

Padding bytes between segments MUST be `0x00`.

---
