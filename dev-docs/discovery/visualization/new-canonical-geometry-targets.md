# New Canonical Geometry Targets

## 1️⃣ SVG (2D, Fano-first)

**Use for**
- Fano plane
- Crease patterns
- Origami folds
- Branch topology
- Proof diagrams

**Why SVG**
- Declarative
- Deterministic
- Human-inspectable
- Version-controllable
- Easy to diff

### SVG as a Proof Artifact
Each SVG is **not art** — it is a *certificate*.

```xml
<svg viewBox="0 0 100 100" data-canvasl-hash="0xA13F…">
  <g id="fano-plane">
    <circle cx="50" cy="10" r="3" />
    <circle cx="10" cy="80" r="3" />
    <circle cx="90" cy="80" r="3" />
    <!-- 4 more points -->
    <line x1="50" y1="10" x2="10" y2="80"/>
    <!-- 6 more lines -->
  </g>
</svg>
```

**Key idea:**  
SVG elements correspond **1:1** with CanvasL registers and folds.

---

## 2️⃣ OBJ / glTF (3D+, Merkaba-ready)

**Use for**
- Merkaba
- Dual tetrahedra
- Metatron’s cube
- Higher-dimensional projections
- Hardware-accelerated rendering

**OBJ advantages**
- Simple
- Text-based
- Deterministic
- Easy to generate from Scheme / C

**glTF advantages**
- GPU-ready
- Animations
- Materials
- Web-native

👉 Start with **OBJ**, graduate to **glTF** later.

---
