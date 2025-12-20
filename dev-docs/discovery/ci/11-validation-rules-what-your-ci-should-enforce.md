# 11. Validation Rules (What your CI should enforce)

A GLB is **RFC-009A compliant** iff:

1) GLB header fields correct; length matches file size  
2) Exactly 2 chunks: JSON then BIN  
3) JSON parses as valid glTF 2.0 and references **one buffer**  
4) bufferViews/accessors match the tables above  
5) All offsets/lengths are 4-byte aligned  
6) POSITION min/max correct for emitted float positions  
7) BIN byteLength matches `buffers[0].byteLength`  
8) Semantics are present either as accessor 2 + primitive.extras.semanticAccessor

---
