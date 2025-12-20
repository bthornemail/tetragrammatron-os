# Patch: change the `<set ...>` attributes

In your `svg_render_fano_animated(...)`, replace each pulse-style `<set ... dur=... fill='remove'>`
with an accumulating set:

- `dur="0.001ms"` (or `"1ms"` if you prefer safe parsing)
- `fill="freeze"`

### Points (accumulating)
**Before**
```xml
<set href='#P3' attributeName='fill' to='black' begin='240ms' dur='108ms' fill='remove'/>
```

**After**
```xml
<set href='#P3' attributeName='fill' to='black' begin='240ms' dur='1ms' fill='freeze'/>
```

### Lines (accumulating)
**Before**
```xml
<set href='#L2' attributeName='opacity' to='1' begin='240ms' dur='108ms' fill='remove'/>
<set href='#L2' attributeName='stroke-width' to='4' begin='240ms' dur='108ms' fill='remove'/>
```

**After**
```xml
<set href='#L2' attributeName='opacity' to='1' begin='240ms' dur='1ms' fill='freeze'/>
<set href='#L2' attributeName='stroke-width' to='4' begin='240ms' dur='1ms' fill='freeze'/>
```

---
