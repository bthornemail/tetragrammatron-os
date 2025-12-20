# 1) C header: `can_svg.h`

```c
#pragma once
#include <stdint.h>
#include <stddef.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

// --- SVG event kinds (VM → renderer stream) ---
typedef enum {
  SVG_EVT_POINT = 1,   // highlight a point id 0..6
  SVG_EVT_LINE  = 2,   // highlight a line id 0..6
  SVG_EVT_TRIAD = 3,   // highlight a triad of points (a,b,c)
  SVG_EVT_TEXT  = 4    // attach a short label
} svg_evt_kind_t;

typedef struct {
  svg_evt_kind_t kind;
  uint16_t step;     // monotonically increasing
  uint8_t  a, b, c;  // meaning depends on kind
  char     text[32]; // optional null-terminated
} svg_evt_t;

typedef struct {
  svg_evt_t *buf;
  size_t cap;
  size_t len;
} svg_trace_t;

bool svg_trace_init(svg_trace_t *t, svg_evt_t *storage, size_t cap);
bool svg_emit_point(svg_trace_t *t, uint16_t step, uint8_t pid);
bool svg_emit_line(svg_trace_t *t, uint16_t step, uint8_t lid);
bool svg_emit_triad(svg_trace_t *t, uint16_t step, uint8_t p0, uint8_t p1, uint8_t p2);
bool svg_emit_text(svg_trace_t *t, uint16_t step, const char *msg);

// Render full SVG to a caller buffer (returns bytes written, 0 on error)
size_t svg_render_fano(const svg_trace_t *t, char *out, size_t out_cap,
                       const char *title);

// Utility: deterministic mapping 0..6 → (x,y)
void fano_xy(uint8_t pid, int *x, int *y);

// Utility: line id 0..6 → three point ids
void fano_line_points(uint8_t lid, uint8_t *p0, uint8_t *p1, uint8_t *p2);

#ifdef __cplusplus
}
#endif
```

---
