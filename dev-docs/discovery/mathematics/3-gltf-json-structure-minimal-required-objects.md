# 3. glTF JSON Structure (Minimal Required Objects)

The JSON chunk **MUST** be valid glTF 2.0 and include at least:

- `asset`
- `buffers[0]`
- `bufferViews[]`
- `accessors[]`
- `meshes[]`
- `nodes[]`
- `scenes[]`
- `scene`

Recommended:
- store top-level metadata in `asset.extras` and per-primitive semantics in `mesh.primitives[i].extras`.

---
