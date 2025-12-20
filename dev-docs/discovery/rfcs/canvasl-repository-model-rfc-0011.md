# CanvasL Repository Model (RFC-0011)

This repository is not organized by time.
It is organized by meaning.

## Branch Roles

- main  
  Canonical fixed point. No direct commits.

- current  
  Integration manifold. All normalization happens here.

- feature/<axis>  
  Isolated semantic workspaces.
  One axis per branch.

## Registers

Each `.canvasl` file is a register.
Registers form a 512-cell lattice (8×8×8).

Registers do not store history.
Git history stores history.
Registers store truth.

## Merge Rule (Non-Negotiable)

A merge that touches registers MUST:

1. Canonicalize state
2. Be closed under MEET and JOIN
3. Pass the Fano triad gate
4. Emit a proof artifact

If any step fails, the merge is invalid.

## Why This Exists

This repository is:
- A datastore
- A virtual machine
- A proof system
- A visualization substrate

All at once.
```

---

## 6️⃣ Validator Hook Stub (SCHEME)

📍 **Path**: `tools/validate-rfc-0011.scm`

```scheme
;; RFC-0011 Validator Stub
;; To be wired to CI / pre-merge hooks

(define (validate-merge registers context)
  ;; TODO:
  ;; - load canonical state
  ;; - apply CANON
  ;; - compute MEET / JOIN
  ;; - enforce FANO_OK
  ;; - emit proof artifact
  'unimplemented)
```

This intentionally aligns with your existing Scheme VM.

---
