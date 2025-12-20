# 7. meshes[] and primitives[] (Canonical)

You will emit **one mesh** with **two primitives**:

### Primitive 0: edges
- `mode`: `1` (LINES)
- `attributes`:
  - `POSITION`: accessor 0
  - `COLOR_0`: accessor 1 (optional but recommended)
  - `_SEMANTIC`: accessor 2 (stored as a normal attribute name via `extras`, see below)
- `indices`: accessor 3

### Primitive 1: triangles
- `mode`: `4` (TRIANGLES)
- `attributes`: same as above
- `indices`: accessor 4

#### How to include SEMANTIC without breaking strict viewers
glTF only standardizes certain attribute names. To stay compatible:

- Do **NOT** name it as an unknown vertex attribute.
- Instead, include it as a parallel accessor referenced in `primitive.extras`:

```json
"extras": {
  "semanticAccessor": 2
}
```

This keeps standard renderers happy while your engine can read semantics.

---
