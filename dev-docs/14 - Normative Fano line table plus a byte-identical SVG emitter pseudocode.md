
## 1) Canonical Fano points (fixed)

All renderers MUST use these exact integer coordinates (1024×1024 viewBox):

| pointId | name | x   | y   |
|--------:|------|-----|-----|
| 0 | p0 | 512 | 256 |
| 1 | p1 | 707 | 369 |
| 2 | p2 | 707 | 655 |
| 3 | p3 | 512 | 768 |
| 4 | p4 | 317 | 655 |
| 5 | p5 | 317 | 369 |
| 6 | p6 | 512 | 512 |

SVG viewBox MUST be: `0 0 1024 1024`

---

## 2) Normative Fano incidence lines (L0..L6)

We freeze the classic 7 triples (points on each “line”):

Let the incidence blocks be:

- **L0** = {0, 1, 2}  
- **L1** = {0, 3, 4}  
- **L2** = {0, 5, 6}  
- **L3** = {1, 3, 5}  
- **L4** = {1, 4, 6}  
- **L5** = {2, 3, 6}  
- **L6** = {2, 4, 5}

### Endpoints rule (deterministic)
For each triple `{a,b,c}`, the `<line>` endpoints MUST be the **lexicographically smallest pair** among the 3 choose 2 pairs.

That means:

| lineId | incidence triple | endpoints (for `<line>`) |
|-------:|------------------|--------------------------|
| 0 | {0,1,2} | (0,1) |
| 1 | {0,3,4} | (0,3) |
| 2 | {0,5,6} | (0,5) |
| 3 | {1,3,5} | (1,3) |
| 4 | {1,4,6} | (1,4) |
| 5 | {2,3,6} | (2,3) |
| 6 | {2,4,5} | (2,4) |

> Note: The “circle line” is separate (`Lcircle`) and is NOT one of these 7.

---

## 3) Normative “circle line” (Lcircle)

- `cx=512 cy=512 r=192`
- `data-incidence="p1,p3,p5"` (frozen)

---

## 4) Renderer output ordering (MUST)

To guarantee identical SVG bytes:

1) `<svg ...>` header in fixed attribute order  
2) `<defs><style>...</style></defs>` (styles sorted by styleId ascending)  
3) Per frame group `<g id="frameN">` in increasing N  
4) Inside each frame:
   - lines (`<line>`), sorted by `lineId`
   - circle line (if present), after `<line>` entries
   - points (`<circle>`), sorted by `pointId`
   - labels (`<text>`), sorted by target id (`p0..p6`, then lines)

All attributes within an element MUST be emitted in a fixed order (example below).

---

## 5) SVG emitter pseudocode (deterministic)

This is intentionally “boring” and mechanical.

```text
DATA:
  P[0..6] = (x,y) fixed table above
  L[0..6] = {
    inc: sorted triple [a,b,c],
    endpoints: (minPair among (a,b),(a,c),(b,c))
  }
  CIRCLE = (cx=512, cy=512, r=192, inc="p1,p3,p5")

STATE:
  styles: map styleId -> {strokeW, pointR, flags}
  frames: list of Frame { drawLinesSet, drawPointsSet, drawLabelsSet, ... }
  currentFrame: optional Frame
  frameIndex: integer starting at 0

NORMALIZE_RES(events):
  - interpret opcodes sequentially
  - build frames with sets (avoid duplicates)
  - store any label strings by id
  - DO NOT emit SVG during this pass

EMIT_SVG(normalizedState):
  write SVG header:
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
  write <defs><style> with deterministic CSS, sorted by styleId

  for each frame in frames by increasing frameIndex:
    write: <g id="frame{N}">
      emit lines:
        for lineId in 0..6:
          if frame wants lineId:
            (a,b,c) = L[lineId].inc
            (u,v)   = L[lineId].endpoints
            (x1,y1) = P[u]
            (x2,y2) = P[v]
            emit exactly:
              <line id="L{lineId}" data-incidence="p{a},p{b},p{c}"
                    x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}"
                    class="stroke style-{styleId}"/>
      emit circle-line if present:
        <circle id="Lcircle" data-incidence="p1,p3,p5"
                cx="512" cy="512" r="192"
                class="stroke style-{styleId}"/>

      emit points:
        for pointId in 0..6:
          if frame wants pointId:
            (cx,cy) = P[pointId]
            r = styles[styleId].pointR (or default 10)
            emit:
              <circle id="p{pointId}" cx="{cx}" cy="{cy}" r="{r}"
                      class="point style-{styleId}"/>

      emit labels:
        for pointId in 0..6:
          if frame has label for p{pointId}:
            (cx,cy)=P[pointId]
            x = cx + 14
            y = cy - 14
            emit:
              <text data-label-for="p{pointId}" x="{x}" y="{y}"
                    class="label">{escapedText}</text>
    write: </g>

  write </svg>
```

### Attribute order MUST be exactly as shown
If you change attribute order, your SVG bytes will differ across implementations.

---

## 6) Quick sanity: “Fano-triad” example (L0)

Line L0 is incidence `{0,1,2}` and endpoints `(0,1)` so it draws from p0→p1 but still declares 3-point incidence in `data-incidence`.

That’s what you want: **projective incidence is semantic**, Euclidean collinearity is not required.
