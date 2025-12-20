# 16.5 Patch record types

A sealed patch is a sequence of patch records.

Minimum record set:

1. **WRITE**: overwrite bytes at address
2. **FILL**: fill range with repeated byte
3. **MOVE** (optional): copy bytes from src→dst (must be deterministic)

Each record MUST have a canonical encoding (16.8).

---
