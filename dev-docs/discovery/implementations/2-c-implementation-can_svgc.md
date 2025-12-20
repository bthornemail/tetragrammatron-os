# 2) C implementation: `can_svg.c`

```c
#include "can_svg.h"
#include <string.h>
#include <math.h>
#include <stdio.h>

static size_t appendf(char *out, size_t cap, size_t at, const char *fmt, ...) {
  if (at >= cap) return 0;
  va_list args;
  va_start(args, fmt);
  int n = vsnprintf(out + at, cap - at, fmt, args);
  va_end(args);
  if (n < 0) return 0;
  if ((size_t)n >= cap - at) return 0;
  return at + (size_t)n;
}

bool svg_trace_init(svg_trace_t *t, svg_evt_t *storage, size_t cap) {
  if (!t || !storage || cap == 0) return false;
  t->buf = storage; t->cap = cap; t->len = 0;
  return true;
}

static bool push(svg_trace_t *t, const svg_evt_t *e) {
  if (!t || !e) return false;
  if (t->len >= t->cap) return false;
  t->buf[t->len++] = *e;
  return true;
}

bool svg_emit_point(svg_trace_t *t, uint16_t step, uint8_t pid) {
  svg_evt_t e; memset(&e, 0, sizeof(e));
  e.kind = SVG_EVT_POINT; e.step = step; e.a = pid;
  return push(t, &e);
}

bool svg_emit_line(svg_trace_t *t, uint16_t step, uint8_t lid) {
  svg_evt_t e; memset(&e, 0, sizeof(e));
  e.kind = SVG_EVT_LINE; e.step = step; e.a = lid;
  return push(t, &e);
}

bool svg_emit_triad(svg_trace_t *t, uint16_t step, uint8_t p0, uint8_t p1, uint8_t p2) {
  svg_evt_t e; memset(&e, 0, sizeof(e));
  e.kind = SVG_EVT_TRIAD; e.step = step; e.a = p0; e.b = p1; e.c = p2;
  return push(t, &e);
}

bool svg_emit_text(svg_trace_t *t, uint16_t step, const char *msg) {
  svg_evt_t e; memset(&e, 0, sizeof(e));
  e.kind = SVG_EVT_TEXT; e.step = step;
  if (msg) {
    strncpy(e.text, msg, sizeof(e.text)-1);
    e.text[sizeof(e.text)-1] = 0;
  }
  return push(t, &e);
}

void fano_xy(uint8_t pid, int *x, int *y) {
  // Canonical: 7 points on circle, R=80, viewBox -100..100
  const double R = 80.0;
  double theta = (2.0 * M_PI) * ((double)(pid % 7) / 7.0);
  int xi = (int)lrint(R * cos(theta));
  int yi = (int)lrint(R * sin(theta));
  if (x) *x = xi;
  if (y) *y = yi;
}

void fano_line_points(uint8_t lid, uint8_t *p0, uint8_t *p1, uint8_t *p2) {
  // 0-based lines:
  // L0={0,1,3}, L1={1,2,4}, L2={2,3,5}, L3={3,4,6},
  // L4={4,5,0}, L5={5,6,1}, L6={6,0,2}
  static const uint8_t L[7][3] = {
    {0,1,3},{1,2,4},{2,3,5},{3,4,6},{4,5,0},{5,6,1},{6,0,2}
  };
  uint8_t i = (uint8_t)(lid % 7);
  if (p0) *p0 = L[i][0];
  if (p1) *p1 = L[i][1];
  if (p2) *p2 = L[i][2];
}

static bool step_is_active(const svg_trace_t *t, uint16_t step) {
  if (!t) return false;
  // If you want “frame by frame”, render latest step only.
  // For now we render ALL events (history) — deterministic.
  (void)step;
  return true;
}

size_t svg_render_fano(const svg_trace_t *t, char *out, size_t out_cap,
                       const char *title) {
  if (!t || !out || out_cap < 256) return 0;
  size_t at = 0;

  at = appendf(out, out_cap, at,
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='-100 -100 200 200'>
");
  if (!at) return 0;

  at = appendf(out, out_cap, at,
    "<style>"
    ".pt{stroke:black;stroke-width:2;fill:white}"
    ".hl{fill:black}"
    ".ln{stroke:black;stroke-width:2;opacity:0.25}"
    ".lnhl{stroke:black;stroke-width:4;opacity:1}"
    ".lbl{font:12px monospace;fill:black}"
    "</style>
");
  if (!at) return 0;

  // Title
  if (!title) title = "Fano Projection Trace";
  at = appendf(out, out_cap, at, "<text class='lbl' x='-95' y='-85'>%s</text>
", title);
  if (!at) return 0;

  // Draw base incidence lines (thin)
  for (uint8_t lid = 0; lid < 7; lid++) {
    uint8_t a,b,c; fano_line_points(lid, &a,&b,&c);
    int ax,ay,bx,by,cx,cy;
    fano_xy(a,&ax,&ay); fano_xy(b,&bx,&by); fano_xy(c,&cx,&cy);
    // connect a-b-c as polyline (projective “line” in this embedding)
    at = appendf(out, out_cap, at,
      "<polyline class='ln' points='%d,%d %d,%d %d,%d %d,%d'/>
",
      ax,ay,bx,by,cx,cy,ax,ay);
    if (!at) return 0;
  }

  // Determine highlighted points/lines from trace (last-wins)
  bool pt_hl[7] = {0};
  bool ln_hl[7] = {0};
  char last_text[32] = {0};
  uint16_t last_step = 0;

  for (size_t i = 0; i < t->len; i++) {
    const svg_evt_t *e = &t->buf[i];
    if (!step_is_active(t, e->step)) continue;
    if (e->step >= last_step) last_step = e->step;

    switch (e->kind) {
      case SVG_EVT_POINT:
        pt_hl[e->a % 7] = true;
        break;
      case SVG_EVT_LINE:
        ln_hl[e->a % 7] = true;
        break;
      case SVG_EVT_TRIAD:
        pt_hl[e->a % 7] = true;
        pt_hl[e->b % 7] = true;
        pt_hl[e->c % 7] = true;
        break;
      case SVG_EVT_TEXT:
        strncpy(last_text, e->text, sizeof(last_text)-1);
        last_text[sizeof(last_text)-1] = 0;
        break;
      default:
        break;
    }
  }

  // Render highlighted lines (thick)
  for (uint8_t lid = 0; lid < 7; lid++) {
    if (!ln_hl[lid]) continue;
    uint8_t a,b,c; fano_line_points(lid, &a,&b,&c);
    int ax,ay,bx,by,cx,cy;
    fano_xy(a,&ax,&ay); fano_xy(b,&bx,&by); fano_xy(c,&cx,&cy);
    at = appendf(out, out_cap, at,
      "<polyline class='lnhl' points='%d,%d %d,%d %d,%d %d,%d'/>
",
      ax,ay,bx,by,cx,cy,ax,ay);
    if (!at) return 0;
  }

  // Draw points
  for (uint8_t pid = 0; pid < 7; pid++) {
    int x,y; fano_xy(pid, &x, &y);
    at = appendf(out, out_cap, at,
      "<circle class='pt%s' cx='%d' cy='%d' r='8'/>"
      "<text class='lbl' x='%d' y='%d'>%u</text>
",
      pt_hl[pid] ? " hl" : "",
      x, y, x+10, y+4, (unsigned)pid);
    if (!at) return 0;
  }

  // Label: last step / message
  if (last_text[0]) {
    at = appendf(out, out_cap, at,
      "<text class='lbl' x='-95' y='-70'>step=%u %s</text>
",
      (unsigned)last_step, last_text);
    if (!at) return 0;
  } else {
    at = appendf(out, out_cap, at,
      "<text class='lbl' x='-95' y='-70'>step=%u</text>
",
      (unsigned)last_step);
    if (!at) return 0;
  }

  at = appendf(out, out_cap, at, "</svg>
");
  if (!at) return 0;
  return at;
}
```

---
