# 4. Canonical BIN Layout v1.0 (BufferViews + Accessors)

The BIN chunk is a single `buffer` with the following **canonical segments in this order**:

## 4.1 Segment Order (normative)
1) `V_POS` : Vertex positions (float32 xyz)  
2) `V_COL` : Vertex colors (uint8 rgba, normalized)  
3) `V_SEM` : Vertex semantic payload (uint32 x 4)  
4) `I_EDG` : Edge indices (uint32 pairs)  
5) `I_TRI` : Triangle indices (uint32 triplets)  
6) `ANIM_T` : Animation times (float32) — optional  
7) `ANIM_W` : Animation weights/values (float32) — optional

Every segment **MUST** begin on a 4-byte boundary.  
Padding bytes between segments **MUST** be `0x00`.

---

## 4.2 Segment Definitions

### A) V_POS (POSITION)
- Type: `VEC3`  
- componentType: `5126` (FLOAT)  
- count: `vertexCount`  
- Byte stride (optional): omit; tightly packed
- Bytes: `vertexCount * 12`

**Accessor fields REQUIRED:**
- `min` and `max` MUST be provided (for deterministic viewer behavior)

### B) V_COL (COLOR_0)
- Type: `VEC4`  
- componentType: `5121` (UNSIGNED_BYTE)  
- normalized: `true`  
- count: `vertexCount`  
- Bytes: `vertexCount * 4`

### C) V_SEM (semantic payload)
A deterministic, GPU-friendly per-vertex payload.

- Type: `VEC4`  
- componentType: `5125` (UNSIGNED_INT)  
- normalized: omitted/false  
- count: `vertexCount`  
- Bytes: `vertexCount * 16`

**Meaning of the 4 uint32 lanes (normative):**
- `sem.x` = `axis_id` (0..7) OR keyword hash low32  
- `sem.y` = `fano_id` (0..6, or 0xFFFFFFFF if N/A)  
- `sem.z` = `triad_id` (0..N-1, or 0xFFFFFFFF if N/A)  
- `sem.w` = `opcode_id` or `event_id` (implementation choice, but MUST be consistent)

> If you want keyword strings, store them in `mesh.extras.keywords` and keep `axis_id` as small int for speed.

### D) I_EDG (Edge indices)
Used by a **LINES** primitive.

- componentType: `5125` (UNSIGNED_INT)  
- type: `SCALAR`  
- count: `edgeCount * 2`  
- Bytes: `edgeCount * 2 * 4`

Primitive mode: `1` (LINES)

### E) I_TRI (Triangle indices)
Used by a **TRIANGLES** primitive.

- componentType: `5125` (UNSIGNED_INT)  
- type: `SCALAR`  
- count: `triCount * 3`  
- Bytes: `triCount * 3 * 4`

Primitive mode: `4` (TRIANGLES)

### F) ANIM_T (optional)
- componentType: `5126` (FLOAT)  
- type: `SCALAR`  
- count: `keyframeCount`  
- Bytes: `keyframeCount * 4`

### G) ANIM_W (optional)
Either:
- weights, or
- per-node translation samples, etc.

For v1.0, simplest is **node translation**:
- componentType: `5126` (FLOAT)  
- type: `VEC3`  
- count: `keyframeCount`  
- Bytes: `keyframeCount * 12`

---
