# 4. Why this matches CLBC-POLY precisely

- All polynomial constants are **embedded as CLBC-POLY blobs** unchanged.
- The Fold VM only needs:
  1) `clbc_poly_decode(bytes)->f2poly_t`
  2) `f2poly_gcd/lcm`
  3) `clbc_poly_encode(f2poly_t)->bytes` (for hashing / logs / roundtrip tests)

So your “codec truth” stays single-source.

---
