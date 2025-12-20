# 16.2 Patch object model

A patch is a **sealed object**:

- `PATCH_BEGIN` creates a patch builder for an in-flight patch.
- `PATCH_WRITE` appends patch records (writes/edits).
- `PATCH_SEAL` freezes the patch and computes `patch_hash`.
- `PATCH_APPLY` applies the sealed patch to a target region if allowed.

A patch is immutable after `SEAL`.

---
