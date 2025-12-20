# 5) What you get immediately

- A real **“fold trace”** view
- Deterministic, versionable artifacts
- A bridge to `.obj/.glb` later by replacing `fano_xy` with 3D lifts

---

## Next (one choice)
Do you want the SVG renderer to output:

1) **single static** (current) showing highlights, or  
2) **animated** (SMIL) over `step`, or  
3) **multi-layer**: one `<g>` per opcode type (points/lines/triads) so you can toggle in Inkscape?

Reply `1`, `2`, or `3` and I’ll extend the renderer accordingly.

---

## You

2

---

## ChatGPT

Cool — **(2) animated**. We’ll do **deterministic SMIL** (no JS), where each VM event becomes a timed highlight.

Below is an **RFC-009 Animation Extension** and a concrete renderer strategy that drops straight into the `svg_render_fano()` you already have.

---
