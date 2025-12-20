# Algorithm (practical steps)

1. **Choose solid & vertex set**: e.g., icosahedron vertices VVV (12 points) or a refined triangulation of the sphere (subdivide faces).
    
2. **Build adjacency / geometry**: optional but useful if you want geometry-aware partitions (use geodesic or spectral clustering).
    
3. **Create partition tree**: repeatedly split blocks. Options:
    
    - Geometric split: split a parent block by plane through centroid, or by k-means on coordinates (k=2).
        
    - Topological split: coarsen via graph clustering / METIS / spectral bisection.
        
    - Manual split: choose meaningful musical groupings (fifths, triads, pentagons) to encode λ overlaps.
        
4. **At each split** compute ψP\psi_PψP  using the formula above; keep φB0,φB1\varphi_{B_0}, \varphi_{B_1}φB0  ,φB1   for further splitting.
    
5. **Expand a function f:V→Rf:V	o\mathbb{R}f:V→R**: coefficients are inner products cP=⟨f,ψP⟩c_P=\langle f,\psi_P\ranglecP =⟨f,ψP ⟩, coarse coeff ccoarse=⟨f,φV⟩c_{	ext{coarse}}=\langle f,\varphi_V\rangleccoarse =⟨f,φV ⟩. Reconstruction is the orthonormal sum.
    

---
