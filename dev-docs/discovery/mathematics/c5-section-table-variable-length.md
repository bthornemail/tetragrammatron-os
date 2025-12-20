# C.5 Section Table (variable length)

Immediately after the 16-byte header is the section table, length = `section_table_len_be`.

Each section table entry is **16 bytes**:

```
offset size name
+0x00  1    stype
+0x01  1    sflags
+0x02  2    reserved (MUST be 0)
+0x04  4    soff_be   ; absolute file offset of payload
+0x08  4    slen_be   ; payload length in bytes (not including padding)
+0x0C  4    scrc_be   ; CRC32 of payload (0 means “no CRC”)
```

- `soff_be` MUST be 4-byte aligned.
- Payload bytes after `slen_be` up to alignment are padding zeros and NOT included in CRC.

---
