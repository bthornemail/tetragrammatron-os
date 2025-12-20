# `repo.canvasl` (Kernel File)

Save at repository root: `repo.canvasl`

```yaml
$schema: "canvasl://repo/kernel/v1"
kind: repo-kernel
name: "universal-life-protocol"
kernel_version: "1.0"
branches:
  main: "main"
  current: "current"
  feature_pattern: "feature/{axis}/{register}"
axes:
  - name: state
    registers: [identity, memory, context, phase, time, energy, boundary, closure]
  - name: symbols
    registers: [alphabet, tokens, grammar, encoding, decoder, hashing, canonical, versioning]
  - name: boundaries
    registers: [types, ranges, constraints, invariants, normalization, idempotence, monotonicity, termination]
  - name: transforms
    registers: [lift, project, meet_gcd, join_lcm, fold_axioms, compose, rewrites, canonicalize]
  - name: control
    registers: [clock, timing, analog_constraints, barriers, transactions, self_modify, patching, rollback]
  - name: validation
    registers: [golden_vectors, codec_proof, idempotence, fano_incidence, determinism, consensus, security, traceability]
  - name: acceptance
    registers: [commit, signature, release, version_tag, publish, provenance, compat, contracts]
  - name: rejection
    registers: [fail_fast, quarantine, divergence, non_canonical, unsafe_selfmod, proof_missing, fano_violation, rollback_required]
policy:
  register_files_root: "registers"
  register_append_only: true
  allow_merge_targets:
    feature_to_current: true
    feature_to_main: false
    current_to_main: true
    main_to_current: true
fano_gate:
  required: true
  invariants:
    - canonical_encoding
    - normalization_idempotence
    - deterministic_replay
    - meet_join_closure
    - fano_triad_preservation
  failure_codes:
    - NON_CANONICAL
    - IDEMPOTENCE_FAIL
    - NON_DETERMINISTIC
    - CLOSURE_FAIL
    - FANO_VIOLATION
    - PROOF_MISSING
    - ANALOG_CONSTRAINT_FAIL
analog_constraint:
  enabled: true
  source: "clock/timing_crystal"
  rule: "timestamped events must be monotone and bounded jitter"
notes:
  - "This kernel is a knowledge-graph friendly topology: axes/registers are stable embedding keys."
```

---
