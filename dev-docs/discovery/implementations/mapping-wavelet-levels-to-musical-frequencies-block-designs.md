# Mapping wavelet levels to musical frequencies & block designs

- **Coarse scaling function** = global pitch centroid f0f_0f0 .
    
- **Wavelet coefficients** at level jjj represent **local deviations / partials / microtonal detunings** at scale jjj.
    
- Choose a mapping from scale jjj to frequency scaling:
    
    - equal-tempered mapping: multiply by 2m/122^{m/12}2m/12 for semitone offset mmm,
        
    - fractal / golden scaling: multiply by φj\varphi^{j}φj for phi-based hierarchical scaling,
        
    - overtone mapping: scale by small integer ratios (3/2, 5/4) for wavelets that correspond to pentagonal blocks etc.
        
- **Block design view**: blocks at a given level are “blocks” in the BIBD sense; overlaps between blocks across levels (or different partitions) encode λ values (how often a pair of vertices co-occur together in phases). PBIBDs correspond to using an association scheme to pick partition classes rather than arbitrary splits.
    

---
