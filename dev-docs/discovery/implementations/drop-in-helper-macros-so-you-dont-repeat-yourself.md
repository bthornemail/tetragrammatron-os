# Drop-in helper macros (so you don’t repeat yourself)

```c
static inline size_t smil_set_freeze(char *out, size_t cap, size_t at,
                                     const char *href, const char *attr,
                                     const char *to, uint32_t begin_ms) {
  return appendf(out, cap, at,
    "<set href='%s' attributeName='%s' to='%s' begin='%ums' dur='1ms' fill='freeze'/>
",
    href, attr, to, (unsigned)begin_ms);
}
```

Then use:

```c
char id[8];

// Point
snprintf(id, sizeof(id), "#P%u", (unsigned)p);
at = smil_set_freeze(out, out_cap, at, id, "fill", "black", begin_ms);

// Line
snprintf(id, sizeof(id), "#L%u", (unsigned)l);
at = smil_set_freeze(out, out_cap, at, id, "opacity", "1", begin_ms);
at = smil_set_freeze(out, out_cap, at, id, "stroke-width", "4", begin_ms);
```

---
