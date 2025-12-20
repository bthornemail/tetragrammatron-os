# 3) Hook it into your VM opcodes (exact mapping)

You already have:

- `PROJ_FANO` (makes a 0..6 class)
- `BARRIER_FANO` (validates triad)

Add these **two emission hooks**:

### After `PROJ_FANO dst, src`
- compute projected point id `pid ∈ 0..6`
- emit `SVG_EVT_POINT(pid)`

### After `BARRIER_FANO a,b,c`
- compute the line id (if you want) OR just emit the triad
- emit `SVG_EVT_TRIAD(a,b,c)`
- if it corresponds to one of the 7 canonical lines, emit `SVG_EVT_LINE(lid)`

Minimal + deterministic.

#### Line lookup helper (triad → line id)
```c
static int fano_find_line(uint8_t p0, uint8_t p1, uint8_t p2) {
  for (int lid = 0; lid < 7; lid++) {
    uint8_t a,b,c; fano_line_points((uint8_t)lid, &a,&b,&c);
    // set compare (constant size)
    uint8_t s[3] = {p0%7, p1%7, p2%7};
    uint8_t t[3] = {a,b,c};
    // count matches
    int m = 0;
    for (int i=0;i<3;i++) for (int j=0;j<3;j++) if (s[i]==t[j]) m++;
    if (m == 3) return lid;
  }
  return -1;
}
```

---
