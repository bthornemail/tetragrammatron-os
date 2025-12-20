# Small concrete example (icosahedron → balanced binary split)

Take VVV = 12 vertices; split into two groups of 6 (geometric hemispheres or spectral bisection), so n0=n1=6n_0=n_1=6n0 =n1 =6.

- Coarse scaling: φV=1121V.\varphi_V = 	frac{1}{\sqrt{12}}\mathbf{1}_V.φV =12 1 1V .
    
- First wavelet ψV\psi_{V}ψV :
    
    ψV=112(1B0−1B1)\psi_V=\frac{1}{\sqrt{12}}\big(\mathbf{1}_{B_0} - \mathbf{1}_{B_1}\big)ψV =12 1 (1B0  −1B1  )
    
    (since 1/2n=1/121/\sqrt{2n}=1/\sqrt{12}1/2n =1/12  here).
    
- Further split B0B_0B0  into B00,B01B_{00},B_{01}B00 ,B01  with sizes n00,n01n_{00},n_{01}n00 ,n01 , create ψB0\psi_{B_0}ψB0   with the general a,ba,ba,b formula.
    
- After all splits, you have 1 coarse + 11 wavelets = 12 orthonormal atoms.
    

Interpretation: coefficients ⟨f,ψ⟩\langle f,\psi\rangle⟨f,ψ⟩ give local spectral content; large magnitude at some node → a localized harmonic deviation to map to a musical microtone.

---
