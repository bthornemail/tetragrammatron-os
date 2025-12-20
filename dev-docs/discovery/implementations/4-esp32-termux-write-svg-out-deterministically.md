# 4) ESP32 / Termux: write SVG out deterministically

On embedded, you can just dump to UART:

```c
char svg[8192];
size_t n = svg_render_fano(&vm->trace, svg, sizeof(svg), "CAN-ISA Fano Trace");
if (n > 0) {
  printf("%s
", svg);
}
```

On Termux, capture to file:

```bash
idf.py monitor | sed -n '/<svg /,/<\/svg>/p' > trace.svg
```

Open `trace.svg` anywhere.

---
