# Graph / spectral variants (more advanced)

If you prefer a construction that respects graph structure (adjacency/Laplacian) rather than arbitrary partitions, consider:

- **Spectral graph wavelets** (Hammond, Vandergheynst, Gribonval): use Laplacian eigenpairs and apply scale filters g(tλ)g(t\lambda)g(tλ) to build bandpass atoms. They are global in frequency but can be localized in space.
    
- **Diffusion wavelets** (Coifman & Maggioni): build multiresolution from powers of a diffusion operator; more automatic multiscale.
    
- **Balanced graph bisection** (via Fiedler eigenvector) to form the binary tree used above — merges geometric fidelity and Haar simplicity.
    

---
