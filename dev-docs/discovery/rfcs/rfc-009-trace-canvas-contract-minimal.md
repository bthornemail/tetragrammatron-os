# RFC-009 Trace → Canvas Contract (minimal)

## Input: `trace.jsonl` (one event per line)

Required event shape:

```json
{"t":12345,"op":"TRIAD","a":"state","b":"alphabet","c":"delta","result":"accept","hash":"..."}
```

Fields:
- `op` MUST be `"TRIAD"` for triad merge events
- `a`,`b`,`c` MUST be axis names from:
  - `state, alphabet, left, right, delta, start, accept, reject`
- `result` MUST be `accept` or `reject`

You can add extra fields freely; the generator ignores them unless used.

---
