# 16.1 Design goals (normative)

A PATCH subsystem MUST:

1. Support **self-modifying code** while preserving **replay determinism**.
2. Enforce a **safety gate**:
   - PATCH application MUST be permitted only inside a defined time barrier region.
   - PATCH application MUST be rejected if it violates the VM’s **Fano consistency** policy.
3. Use canonical encoding and hashing compatible with your CLBC-POLY discipline:
   - Every patch MUST have canonical bytes.
   - Patch identity MUST be a hash of canonical bytes.
4. Permit **incremental development**:
   - You can start with patching data segments (safer),
   - then enable patching executable segments once verification hooks exist.

---
