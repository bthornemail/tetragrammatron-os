# 4) Style opcodes (stable CSS)

### `0x78 STYLE_DEFINE styleId, strokeW, pointR, flags`
- `styleId` (u8)
- `strokeW` (u8): default 4
- `pointR` (u8): default 10
- `flags` (u8):
  - bit0: dashed line
  - bit1: low-alpha (debug)
  - others reserved

**SVG effect:** emits/updates a `<style>` block (canonical ordering by `styleId`).

---
