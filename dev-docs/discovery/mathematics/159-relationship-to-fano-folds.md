# 15.9 Relationship to Fano / folds
- The fold VM produces **poly state** and **Fano projection results**.
- The MUX emits the *visualization* of those results:
  - points/lines of Fano triads as SVG_LINESET
  - lifted meshes as OBJ_MESH / GLB_CHUNK
  - harmonic signatures as NOTE_EVENT

Crucial: folds remain deterministic; MUX is deterministic **given the same fold trace + time trace**.

---
