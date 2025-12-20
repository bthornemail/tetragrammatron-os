# Example trace you can test immediately

`trace.jsonl`:

```jsonl
{"t":1,"op":"TRIAD","a":"state","b":"alphabet","c":"delta","result":"accept"}
{"t":2,"op":"TRIAD","a":"delta","b":"left","c":"right","result":"accept"}
{"t":3,"op":"TRIAD","a":"state","b":"left","c":"right","result":"accept"}  // NOT a Fano line → reject
```

Run:

```bash
python3 gen_fano_canvas.py trace.jsonl fano-triad.runtime.canvas
```

Open `fano-triad.runtime.canvas` in Obsidian.

---
