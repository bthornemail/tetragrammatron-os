# 1. SVG Document Envelope (MUST)

Emitters **MUST** produce SVG with:

- `viewBox="0 0 1024 1024"`
- `width="1024" height="1024"` OR omit and rely on viewBox
- `shape-rendering="geometricPrecision"`
- `vector-effect="non-scaling-stroke"` on strokes (or global style)
- **No transforms** for canonical geometry (transforms allowed only in debug layers)

```xml
<svg xmlns="http://www.w3.org/2000/svg"
     viewBox="0 0 1024 1024"
     width="1024" height="1024"
     shape-rendering="geometricPrecision">
  <defs>
    <style>
      .stroke { vector-effect: non-scaling-stroke; }
    </style>
  </defs>
</svg>
```

---
