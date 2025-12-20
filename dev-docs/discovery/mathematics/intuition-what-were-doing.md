# Intuition (what we’re doing)

The Haar wavelet on [0,1][0,1][0,1] is a **coarse→fine, localized, orthogonal** decomposition: at each dyadic split you keep the average (scaling function) and the difference (wavelet).  
We replicate that idea on a finite discrete geometry (vertices of a Platonic solid or their refinements) by:

1. building a **hierarchy of partitions** (coarse blocks → finer blocks), and
    
2. on every parent block, defining a **scaling function** (constant over the whole parent) and a **wavelet** (a normalized function that is + on one child block and − on the other child block, orthogonal to the parent scaling function).
    

The result: an orthonormal basis of localized, scale-indexed functions on the vertex set — a discrete Haar basis.

---
