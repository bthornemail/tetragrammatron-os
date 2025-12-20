# A.7 Deterministic Encoding Rules (Normative)

To guarantee byte identity across platforms:

1. Section order **MUST** be: `VMPR`, `CODE`, then `POLY`, `SYMB`, `META`, `DGST`, `SIGN` (if present).
2. For any JSON in META: object keys **MUST** be lexicographically sorted; emit minimal JSON (no spaces/newlines).
3. All reserved fields **MUST** be zero.
4. All padding bytes **MUST** be zero.
5. Any list/array ordering (polys, sym entries) **MUST** be stable and canonical:
   - POLY blobs ordered by their bytewise CLBC-POLY encoding ascending
   - SYMB entries ordered by name bytes ascending

---
