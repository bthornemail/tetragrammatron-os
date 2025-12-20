# `repo.canvasl` Kernel (Normalized Template)

Save as `repo.canvasl`:

```yaml
kernel:
  version: "1.1"
  rfc: "RFC-011"
  axes:
    - state
    - symbols
    - logic
    - runtime
    - dynamics
    - genesis
    - validation
    - rejection

  branches:
    main:
      role: "fixed-point"
      direct_commits: false
    current:
      role: "integration-manifold"
      direct_commits: true
    feature:
      pattern: "feature/{axis}"
      direct_commits: true
    release:
      pattern: "release/*"
      direct_commits: false

  registers:
    version: "v1"
    scheme: "triple-axis"
    root: "registers/v1"
    count: 512
    path_template: "registers/v1/{a0}/{a1}/{a2}.canvasl"

  merge:
    canon:
      op: "CANON"
      requirement: "MUST"
    meet:
      op: "MEET"      # e.g. GCD
      requirement: "MUST"
    join:
      op: "JOIN"      # e.g. LCM
      requirement: "MUST"
    fano_gate:
      op: "FANO_OK"
      requirement: "MUST"
      triad:
        x: "old_state"
        y: "new_state"
        c: "context_state"

  validators:
    tool: "origami-vm-validate"
    version: "0.1.0"
    proof_dir: "proofs/rfc-011"
    proof_required: true
    deterministic: true
    fail_on_missing_proof: true
```

---
