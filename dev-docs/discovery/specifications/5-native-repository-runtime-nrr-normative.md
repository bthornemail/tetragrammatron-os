# 5. Native Repository Runtime (NRR) (Normative)

## 5.1 Minimal Interface
**MUST implement:**
- `put(bytes) -> ref`
- `get(ref) -> bytes`
- `append(line_bytes)` to trace log
- `scan()` stream lines in order

## 5.2 Storage Profile Targets
- **Desktop**: filesystem objects + `trace.jsonl`
- **ESP32**: flash sectors + append-only log + optional object cache
- **Git backend (optional)**: `ref` maps to blobs/commits

---
