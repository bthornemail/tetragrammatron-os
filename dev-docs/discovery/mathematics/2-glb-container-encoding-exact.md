# 2. GLB Container Encoding (Exact)

A `.glb` file is:

## 2.1 Header (12 bytes)
Little-endian:

| Offset | Size | Field   | Value |
|-------:|-----:|---------|-------|
| 0      | 4    | magic   | `0x46546C67` (“glTF”) |
| 4      | 4    | version | `2` |
| 8      | 4    | length  | total file bytes |

## 2.2 Chunk 0: JSON
| Offset | Size | Field | Value |
|-------:|-----:|-------|-------|
| +0 | 4 | chunkLength | length of JSON payload (padded to 4) |
| +4 | 4 | chunkType | `0x4E4F534A` (“JSON”) |
| +8 | N | JSON bytes | UTF-8, padded with ASCII space `0x20` to 4-byte boundary |

## 2.3 Chunk 1: BIN
| Offset | Size | Field | Value |
|-------:|-----:|-------|-------|
| +0 | 4 | chunkLength | length of BIN payload (padded to 4) |
| +4 | 4 | chunkType | `0x004E4942` (“BIN\0”) |
| +8 | N | BIN bytes | padded with `0x00` to 4-byte boundary |

---
