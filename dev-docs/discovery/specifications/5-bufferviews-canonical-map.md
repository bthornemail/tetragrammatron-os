# 5. bufferViews[] (Canonical Map)

Create one bufferView per segment, in the same order:

| bufferView idx | Name   | target | byteOffset | byteLength |
|---:|--------|--------|----------:|-----------:|
| 0 | V_POS  | `34962` (ARRAY_BUFFER) | computed | computed |
| 1 | V_COL  | `34962` | computed | computed |
| 2 | V_SEM  | `34962` | computed | computed |
| 3 | I_EDG  | `34963` (ELEMENT_ARRAY_BUFFER) | computed | computed |
| 4 | I_TRI  | `34963` | computed | computed |
| 5 | ANIM_T | `34962` | computed | computed |
| 6 | ANIM_W | `34962` | computed | computed |

`byteOffset` is measured from start of BIN payload (chunk data), not from file start.

---
