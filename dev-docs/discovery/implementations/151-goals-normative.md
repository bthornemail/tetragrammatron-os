# 15.1 Goals (normative)

The MUX subsystem MUST:

1. Encode a sequence of **typed events** (visual, audio, telemetry, debug).
2. Permit deterministic replay by:
   - hashing canonical payloads (CLBC-POLY codec-compatible hashing discipline),
   - recording TIME_RD / WAIT boundaries from RFC-009 §14.
3. Allow **progressive refinement**:
   - High-order: GLB (preferred)  
   - Down-lifts: OBJ/MTL, then SVG paths/lines
4. Keep the VM core deterministic: MUX emission MUST NOT change poly registers or control flow.

---
