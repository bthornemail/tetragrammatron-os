# Polynomial Core (CLBC-POLY)

This directory will contain the canonical F₂[x] polynomial implementation using CLBC-POLY v1 encoding.

## Status

**Not yet implemented** - This is a placeholder for the polynomial core module.

## Requirements (RFC-0012 §2)

The VM operates on `POLY` objects which are:
- Canonical F₂[x] polynomials
- Encoded using CLBC-POLY v1 framing
- Byte-stable and deterministic

## Required Operations

- `can_poly_canon` - Normalize polynomial to canonical form
- `can_poly_gcd` - Compute GCD (meet operation)
- `can_poly_lcm` - Compute LCM (join operation)
- `can_load_poly_from_ref` - Load polynomial from object pool

## CLBC-POLY v1 Format

The format uses:
- `CLBC` magic header
- Kind/version/ring/flags fields
- Degree/nwords + words layout

See RFC-0012 §6 for object pool compatibility requirements.



