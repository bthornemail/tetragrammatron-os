# 15.2 MUX object model

A MUX stream is a sequence of frames:

- `Open(stream_id, kind, flags, meta_hash)`
- `Evt(stream_id, ts16, chan, payload...)` (zero or more)
- `Close(stream_id, final_hash)`

Where:
- `stream_id` is u8 (0..255)
- `kind` describes payload schema
- `meta_hash` binds metadata to prevent drift

---
