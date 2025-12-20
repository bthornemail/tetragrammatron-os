# 8. Fixed-Point / Embedded Compatibility (MUST)

All coordinates are integers ≤ 1024, so:

- On microcontrollers, treat CU as **Q0 integer**
- Or optionally scale down by 4 for screen buffers

No trig needed. No floats.

---

## Quick sanity check
- All geometry fits in `[64,960]`
- Symmetry preserved
- Emission is deterministic
- Fano projection can be checked against incidence metadata even if the “circle line” isn’t collinear in Euclidean sense (because Fano incidence is projective, not Euclidean)

---

If you want, next I can:
- emit the **exact canonical SVG template** (full file),
- or write the **CAN-ISA opcode → SVG primitive mapping** so the VM can stream `DRAW_POINT/DRAW_LINE/DRAW_CIRCLE_LINE` events deterministically.

---

## You

Opcode mapping

---

## ChatGPT

## Opcode → SVG Mapping (Normative)

This maps **CAN-ISA (Origami Fold VM)** instructions to **deterministic SVG primitives** using the **canonical 1024×1024 Fano coordinate system** I specified.

### Coordinate constants (baked into renderer)
- `p0..p6` coordinates are **fixed** (no runtime floats).
- `viewBox = 0 0 1024 1024`
- Circle-line: `cx=512 cy=512 r=192`

---
