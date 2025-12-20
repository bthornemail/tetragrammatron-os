# 5) Frame / grouping opcodes

### `0x7E FRAME_BEGIN frameFlags`
- `frameFlags` (u8): same bits as PROJ_FANO flags

**SVG:** opens a `<g id="frameN">` group (N increments deterministically).

### `0x7F FRAME_END`
Closes current frame group.

---
