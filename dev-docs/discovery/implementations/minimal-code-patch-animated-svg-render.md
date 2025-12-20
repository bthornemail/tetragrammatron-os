# Minimal code patch: Animated SVG render

Add a new function:

## `svg_render_fano_animated(...)`

```c
// Render animated SVG using SMIL sets.
// Events become pulses on point/line elements.
size_t svg_render_fano_animated(const svg_trace_t *t, char *out, size_t out_cap,
                                const char *title,
                                uint16_t frame_ms) {
  if (!t || !out || out_cap < 512 || frame_ms == 0) return 0;

  const uint16_t DUR_MS = (uint16_t)((frame_ms * 9) / 10);
  size_t at = 0;

  at = appendf(out, out_cap, at,
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='-100 -100 200 200'>
");
  if (!at) return 0;

  at = appendf(out, out_cap, at,
    "<style>"
    ".pt{stroke:black;stroke-width:2;fill:white}"
    ".ln{stroke:black;stroke-width:2;opacity:0.25;fill:none}"
    ".lbl{font:12px monospace;fill:black}"
    "</style>
");
  if (!at) return 0;

  if (!title) title = "Fano Trace (Animated)";
  at = appendf(out, out_cap, at, "<text class='lbl' x='-95' y='-85'>%s</text>
", title);
  if (!at) return 0;

  // --- Base geometry: lines (with IDs) ---
  for (uint8_t lid = 0; lid < 7; lid++) {
    uint8_t a,b,c; fano_line_points(lid, &a,&b,&c);
    int ax,ay,bx,by,cx,cy;
    fano_xy(a,&ax,&ay); fano_xy(b,&bx,&by); fano_xy(c,&cx,&cy);

    at = appendf(out, out_cap, at,
      "<polyline id='L%u' class='ln' points='%d,%d %d,%d %d,%d %d,%d'/>
",
      (unsigned)lid, ax,ay,bx,by,cx,cy,ax,ay);
    if (!at) return 0;
  }

  // --- Base geometry: points (with IDs) ---
  for (uint8_t pid = 0; pid < 7; pid++) {
    int x,y; fano_xy(pid, &x, &y);
    at = appendf(out, out_cap, at,
      "<circle id='P%u' class='pt' cx='%d' cy='%d' r='8'/>"
      "<text class='lbl' x='%d' y='%d'>%u</text>
",
      (unsigned)pid, x, y, x+10, y+4, (unsigned)pid);
    if (!at) return 0;
  }

  // --- Emit SMIL pulses driven by trace ---
  // Policy: events in trace order; same step ok (they overlap).
  for (size_t i = 0; i < t->len; i++) {
    const svg_evt_t *e = &t->buf[i];
    uint32_t begin_ms = (uint32_t)e->step * (uint32_t)frame_ms;

    if (e->kind == SVG_EVT_POINT) {
      uint8_t p = (uint8_t)(e->a % 7);
      at = appendf(out, out_cap, at,
        "<set href='#P%u' attributeName='fill' to='black' begin='%ums' dur='%ums' fill='remove'/>
",
        (unsigned)p, (unsigned)begin_ms, (unsigned)DUR_MS);
      if (!at) return 0;

    } else if (e->kind == SVG_EVT_LINE) {
      uint8_t l = (uint8_t)(e->a % 7);
      at = appendf(out, out_cap, at,
        "<set href='#L%u' attributeName='opacity' to='1' begin='%ums' dur='%ums' fill='remove'/>
"
        "<set href='#L%u' attributeName='stroke-width' to='4' begin='%ums' dur='%ums' fill='remove'/>
",
        (unsigned)l, (unsigned)begin_ms, (unsigned)DUR_MS,
        (unsigned)l, (unsigned)begin_ms, (unsigned)DUR_MS);
      if (!at) return 0;

    } else if (e->kind == SVG_EVT_TRIAD) {
      uint8_t p0 = (uint8_t)(e->a % 7), p1 = (uint8_t)(e->b % 7), p2 = (uint8_t)(e->c % 7);

      // Pulse points
      at = appendf(out, out_cap, at,
        "<set href='#P%u' attributeName='fill' to='black' begin='%ums' dur='%ums' fill='remove'/>
"
        "<set href='#P%u' attributeName='fill' to='black' begin='%ums' dur='%ums' fill='remove'/>
"
        "<set href='#P%u' attributeName='fill' to='black' begin='%ums' dur='%ums' fill='remove'/>
",
        (unsigned)p0, (unsigned)begin_ms, (unsigned)DUR_MS,
        (unsigned)p1, (unsigned)begin_ms, (unsigned)DUR_MS,
        (unsigned)p2, (unsigned)begin_ms, (unsigned)DUR_MS);
      if (!at) return 0;

      // Optional: if triad is a canonical line, pulse that line too
      int lid = fano_find_line(p0, p1, p2);
      if (lid >= 0) {
        at = appendf(out, out_cap, at,
          "<set href='#L%u' attributeName='opacity' to='1' begin='%ums' dur='%ums' fill='remove'/>
"
          "<set href='#L%u' attributeName='stroke-width' to='4' begin='%ums' dur='%ums' fill='remove'/>
",
          (unsigned)lid, (unsigned)begin_ms, (unsigned)DUR_MS,
          (unsigned)lid, (unsigned)begin_ms, (unsigned)DUR_MS);
        if (!at) return 0;
      }

    } else if (e->kind == SVG_EVT_TEXT) {
      // Minimal: stamp text at step time (non-animated label). Optional: animate opacity.
      // Keep deterministic and simple:
      at = appendf(out, out_cap, at,
        "<text class='lbl' x='-95' y='-70'>%u: %s</text>
",
        (unsigned)e->step, e->text);
      if (!at) return 0;
    }
  }

  at = appendf(out, out_cap, at, "</svg>
");
  if (!at) return 0;
  return at;
}
```

### Usage
```c
char svg[16384];
size_t n = svg_render_fano_animated(&vm->trace, svg, sizeof(svg),
                                    "CAN-ISA Fold Trace", 120);
printf("%s
", svg);
```

---
