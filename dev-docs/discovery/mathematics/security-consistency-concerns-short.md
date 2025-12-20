# Security / Consistency concerns (short)

- **Consensus**: The Fano gate is a strong validity rule. Make sure every peer uses canonical block encoding so hashes match.
    
- **Denial**: A node may repeatedly propose invalid blocks — rate-limit rejections.
    
- **Multiversion**: When two valid Fano moments touch the same tetra IDs, vector-clock sets naturally record both; you’ll need application logic to order/merge conflicting child updates when rebuilding state.
    

---
