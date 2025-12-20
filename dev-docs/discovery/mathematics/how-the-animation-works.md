# How the animation works

### Points
Each point circle has a base style (white fill).  
On event `(POINT pid @ step)` we emit:

```xml
<set attributeName="fill" to="black" begin="240ms" dur="108ms" fill="remove"/>
```

### Lines
Each line polyline has base opacity/width.  
On event `(LINE lid @ step)` we emit:

```xml
<set attributeName="opacity" to="1" begin="240ms" dur="108ms" fill="remove"/>
<set attributeName="stroke-width" to="4" begin="240ms" dur="108ms" fill="remove"/>
```

### Triads
Triad is “three points pulse at once” (and optionally the matching line pulse if recognized).

---
