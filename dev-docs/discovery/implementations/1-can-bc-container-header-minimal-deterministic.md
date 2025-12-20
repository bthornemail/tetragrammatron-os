# 1️⃣ CAN-BC Container Header (Minimal, Deterministic)

This gives you **firmware-safe loading**, versioning, and future extensibility, while keeping CLBC-POLY untouched.

## CAN-BC v1 Header (16 bytes)

```
Offset  Size  Field
0x00    4     Magic      "CAN\0"        ; 0x43 0x41 0x4E 0x00
0x04    1     Version    0x01
0x05    1     ISA        0x01            ; CAN-ISA v1
0x06    2     Flags      0x0000
0x08    4     CodeLen    u32 BE (bytes)
0x0C    4     EntryPC   u32 BE
```

**Properties**
- Deterministic
- Endianness fixed
- ESP32 / Pico friendly
- Future-proof for multiplexed segments

### Scheme Helper: Wrap Instruction Bytes

```scheme
(define (u32->be n)
  (list
    (quotient n #x1000000)
    (modulo (quotient n #x10000) 256)
    (modulo (quotient n #x100) 256)
    (modulo n 256)))

(define (canbc-wrap bytes entry-pc)
  (let* ((len (length bytes)))
    (append
      ;; Magic "CAN\0"
      (list #x43 #x41 #x4E #x00)
      ;; Version, ISA
      (list #x01 #x01)
      ;; Flags
      (list #x00 #x00)
      ;; Code length
      (u32->be len)
      ;; Entry PC
      (u32->be entry-pc)
      ;; Payload
      bytes)))
```

### Firmware-side invariant
- If magic/version mismatch → **refuse execution**
- If entry PC ≥ code length → **trap**
- Enables **safe PATCH_APPLY** later

---
