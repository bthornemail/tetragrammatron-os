# 9. Canonical JSON Template (Normative Skeleton)

This is the *shape* you must produce; values are computed.

```json
{
  "asset": {
    "version": "2.0",
    "generator": "CanvasL-OrigamiVM-GLB v1.0",
    "extras": {
      "rfc": "RFC-009A",
      "scale_fixed_point": 65536,
      "semantic_keywords": ["states","alphabet","left","right","transition","start","accept","reject"]
    }
  },
  "buffers": [
    { "byteLength": BIN_BYTE_LENGTH }
  ],
  "bufferViews": [
    { "buffer": 0, "byteOffset": OFF_VPOS, "byteLength": LEN_VPOS, "target": 34962 },
    { "buffer": 0, "byteOffset": OFF_VCOL, "byteLength": LEN_VCOL, "target": 34962 },
    { "buffer": 0, "byteOffset": OFF_VSEM, "byteLength": LEN_VSEM, "target": 34962 },
    { "buffer": 0, "byteOffset": OFF_IEDG, "byteLength": LEN_IEDG, "target": 34963 },
    { "buffer": 0, "byteOffset": OFF_ITRI, "byteLength": LEN_ITRI, "target": 34963 }
  ],
  "accessors": [
    { "bufferView": 0, "componentType": 5126, "count": V, "type": "VEC3",
      "min": [MINX, MINY, MINZ], "max": [MAXX, MAXY, MAXZ] },
    { "bufferView": 1, "componentType": 5121, "normalized": true, "count": V, "type": "VEC4" },
    { "bufferView": 2, "componentType": 5125, "count": V, "type": "VEC4" },
    { "bufferView": 3, "componentType": 5125, "count": E2, "type": "SCALAR" },
    { "bufferView": 4, "componentType": 5125, "count": T3, "type": "SCALAR" }
  ],
  "meshes": [
    {
      "primitives": [
        {
          "mode": 1,
          "attributes": { "POSITION": 0, "COLOR_0": 1 },
          "indices": 3,
          "extras": { "semanticAccessor": 2, "kind": "edges" }
        },
        {
          "mode": 4,
          "attributes": { "POSITION": 0, "COLOR_0": 1 },
          "indices": 4,
          "extras": { "semanticAccessor": 2, "kind": "faces" }
        }
      ]
    }
  ],
  "nodes": [ { "mesh": 0, "name": "CanvasLScene" } ],
  "scenes": [ { "nodes": [0] } ],
  "scene": 0
}
```

---
