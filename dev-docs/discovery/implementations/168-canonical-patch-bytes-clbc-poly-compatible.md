# 16.8 Canonical patch bytes (CLBC-POLY compatible)

To be hashable in a stable way, the patch MUST have canonical bytes.

## 16.8.1 Patch container (canonical)
Canonical bytes for patch hash:

```
"CANP"            ; 4 bytes magic
version           ; 1 byte (0x01)
policy_id         ; 1 byte
flags             ; 2 bytes (big-endian)
n_records         ; 4 bytes (big-endian)
records...        ; concatenated canonical record encodings
```

## 16.8.2 Canonical record encoding
Each record:

```
rec_type          ; 1 byte
space_id          ; 1 byte
reserved          ; 2 bytes = 0
addr              ; 4 bytes big-endian
len               ; 4 bytes big-endian
payload_len       ; 4 bytes big-endian
payload_bytes     ; payload_len bytes
```

Payload rules:
- WRITE: raw bytes
- FILL: 1 byte fill + 3 reserved + 4-byte run_len (or just store run_len in len and payload is 1 byte; pick one and freeze)
- MOVE: encode src_space + src_addr (1 + 3 reserved + 4 bytes)

**All integers big-endian.**  
**All reserved bytes MUST be zero.**  
This matches the CLBC style: strict canonicalization.

---
