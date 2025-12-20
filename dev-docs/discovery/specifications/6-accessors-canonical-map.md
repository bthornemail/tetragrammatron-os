# 6. accessors[] (Canonical Map)

| accessor idx | For | bufferView | componentType | type | count | normalized |
|---:|-----|---:|---:|------|------:|:--|
| 0 | POSITION | 0 | 5126 | VEC3 | vertexCount | false |
| 1 | COLOR_0  | 1 | 5121 | VEC4 | vertexCount | true |
| 2 | SEMANTIC | 2 | 5125 | VEC4 | vertexCount | false |
| 3 | EDGES indices | 3 | 5125 | SCALAR | edgeCount*2 | false |
| 4 | TRI indices   | 4 | 5125 | SCALAR | triCount*3 | false |
| 5 | anim times (opt) | 5 | 5126 | SCALAR | keyframeCount | false |
| 6 | anim values (opt) | 6 | 5126 | VEC3 | keyframeCount | false |

**POSITION accessor MUST include** `min` and `max`.  
All others MAY omit `min/max`.

---
