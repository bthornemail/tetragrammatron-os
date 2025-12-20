# C.3 File Header (Fixed 16 bytes)

```
offset  size  name
0x00    4     magic        = ASCII "CLBC" (0x43 0x4C 0x42 0x43)
0x04    1     kind         = ASCII "N"    (0x4E)   ; N = CAN container
0x05    1     version      = 0x01
0x06    1     ring_id      = 0x01                 ; 0x01 = F₂[x] canonical poly ring
0x07    1     flags        ; bitfield (see C.4)
0x08    4     file_len_be  ; total bytes of file
0x0C    2     section_count_be
0x0E    2     section_table_len_be ; bytes of section table immediately following header
```

**Rationale:** This matches the “CLBC + kind + version + ring-id + flags” vibe you already established.

---
