# 📦 RFC-0011 PACKAGE — READY TO COMMIT

## 📁 Repository Root Layout

```text
CanvasL-core/
├─ repo.canvasl                # Kernel (normative)
├─ REPO_MODEL.md               # Human-readable rules
├─ registers/
│  └─ v1/
│     ├─ state/
│     │  ├─ state/
│     │  │  ├─ state.canvasl
│     │  │  └─ ...
│     │  └─ symbols/
│     └─ ...
├─ proofs/
│  └─ rfc-0011/
│     └─ .gitkeep
└─ tools/
   └─ validate-rfc-0011.scm    # (stub hook target)
```

---

## 1️⃣ `repo.canvasl` (KERNEL — NORMATIVE)

📍 **Path**: `repo.canvasl`

```yaml
kernel:
  version: "1.1.0"
  rfc: "RFC-0011"
  name: "CanvasL Repository Kernel"

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
      role: fixed-point
      direct_commits: false

    current:
      role: integration-manifold
      direct_commits: true

    feature:
      pattern: "feature/{axis}"
      allowed_axes:
        - state
        - symbols
        - logic
        - runtime
        - dynamics
        - genesis
        - validation
        - rejection
      direct_commits: true

    release:
      pattern: "release/*"
      direct_commits: false

  registers:
    version: v1
    scheme: triple-axis
    count: 512
    root: registers/v1
    path_template: "registers/v1/{a0}/{a1}/{a2}.canvasl"

  merge:
    canon:
      op: CANON
      idempotent: true

    meet:
      op: MEET
      algebra: lattice

    join:
      op: JOIN
      algebra: lattice

    fano_gate:
      policy: FANO-1
      triad:
        x: old_state
        y: new_state
        c: context_state
      definition: >
        MEET(x,y) ≠ 1 AND
        MEET(y,c) ≠ 1 AND
        MEET(x,c) ≠ 1

  validators:
    required: true
    deterministic: true
    proof_dir: proofs/rfc-0011
    reject_on_failure: true
```

This file **is the system**. Everything else derives from it.

---

## 2️⃣ Register File Template (THE “REGISTER AS MEMORY CELL”)

📍 **Path pattern**:  
`registers/v1/<axis0>/<axis1>/<axis2>.canvasl`

### Example:
📍 `registers/v1/state/logic/dynamics.canvasl`

```yaml
register:
  id: "v1:state:logic:dynamics"
  axes:
    - state
    - logic
    - dynamics

state:
  codec: CLBC-POLY-v1
  bytes_hex: "00"
  canon_digest: "0000000000000000"

invariants:
  canon_idempotent: true
  closed_under_meet: true
  closed_under_join: true
```

🔒 **RULES**
- This file is a **register**, not a document
- It MUST be canonical
- It MAY only change via **merge that passes Fano gate**
- No timestamps, no authorship, no history inside the file

---

## 3️⃣ Seed Generator (OPTIONAL BUT RECOMMENDED)

If you want to auto-generate all 512 registers:

```bash
axes=(state symbols logic runtime dynamics genesis validation rejection)

for a in "${axes[@]}"; do
  for b in "${axes[@]}"; do
    for c in "${axes[@]}"; do
      mkdir -p "registers/v1/$a/$b"
      cat > "registers/v1/$a/$b/$c.canvasl" <<EOF
register:
  id: "v1:$a:$b:$c"
  axes: [$a, $b, $c]

state:
  codec: CLBC-POLY-v1
  bytes_hex: "00"
  canon_digest: "0000000000000000"

invariants:
  canon_idempotent: true
  closed_under_meet: true
  closed_under_join: true
EOF
    done
  done
done
```

Run once, commit once.

---

## 4️⃣ Proof Artifact Directory

📍 **Path**: `proofs/rfc-0011/.gitkeep`

This directory stores **machine-generated merge proofs**.

Example proof artifact:

```json
{
  "rfc": "RFC-0011",
  "merge_id": "abc123",
  "validator": "origami-vm-validate@0.1.0",
  "register": "v1:state:logic:dynamics",
  "old_digest": "a1b2",
  "new_digest": "c3d4",
  "context_digest": "e5f6",
  "canon_ok": true,
  "meet_ok": true,
  "join_ok": true,
  "fano_ok": true,
  "decision": "accept"
}
```

No proof → merge fails.

---

## 5️⃣ `REPO_MODEL.md` (HUMAN MAP)

📍 **Path**: `REPO_MODEL.md`

```md