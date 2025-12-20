# 7. Required Metadata Hooks (MUST)

Each emitted SVG MUST carry:

- `data-canvsl-hash="…"` (hash of canonical CanvasL record input)
- `data-proj="fano"` when this layout is used
- Each point element has `id="p0"` etc.
- Each line element has `id="L0"` etc. and `data-incidence="p0,p2,p4"`

Example:
```xml
<g id="fano" data-proj="fano" data-canvsl-hash="0x...">
  <line id="L0" data-incidence="p0,p2,p4" x1="512" y1="128" x2="832" y2="704" class="stroke"/>
  ...
  <circle id="Lcircle" data-incidence="p1,p3,p5" cx="512" cy="512" r="192" class="stroke"/>
  <circle id="p0" cx="512" cy="128" r="10"/>
  ...
</g>
```

*(If you want the circle-line to correspond to a specific incidence triple, fix it to `{p1,p3,p5}` or whichever you choose — but make it **single and normative**. The important part is it is stable and referenced as a “line.”)*

---
