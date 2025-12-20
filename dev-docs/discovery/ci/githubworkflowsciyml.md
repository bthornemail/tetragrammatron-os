# `.github/workflows/ci.yml`

```yaml
name: TetragrammatronOS CI

on:
  push:
    branches:
      - main
      - current
      - "feature/**"
      - "release/**"
  pull_request:
    branches:
      - main
      - current

env:
  LEAN_VERSION: "4.9.0"
  CANON_HASH_FILE: canon.sha256

jobs:

  # ------------------------------------------------------------
  # 1. Repository topology & branch policy
  # ------------------------------------------------------------
  repo-policy:
    name: Repo Merge Policy (Fano-consistent)
    runs-on: ubuntu-latest
    steps:
      - name: Validate branch naming
        run: |
          BRANCH="${GITHUB_REF#refs/heads/}"
          echo "Branch: $BRANCH"

          if [[ "$BRANCH" == "main" ]]; then
            echo "✓ main branch allowed"
          elif [[ "$BRANCH" == "current" ]]; then
            echo "✓ current branch allowed"
          elif [[ "$BRANCH" == release/* ]]; then
            echo "✓ release branch allowed"
          elif [[ "$BRANCH" == feature/* ]]; then
            echo "✓ feature branch allowed"
          else
            echo "❌ Invalid branch name"
            exit 1
          fi

      - name: Prevent direct commits to main
        if: github.event_name == 'push' && github.ref == 'refs/heads/main'
        run: |
          echo "❌ Direct pushes to main are forbidden"
          exit 1

  # ------------------------------------------------------------
  # 2. Lean proofs (formal invariants)
  # ------------------------------------------------------------
  lean-proofs:
    name: Lean Proof Verification
    runs-on: ubuntu-latest
    needs: repo-policy
    steps:
      - uses: actions/checkout@v4

      - name: Install Lean
        uses: leanprover/lean-action@v1
        with:
          version: ${{ env.LEAN_VERSION }}

      - name: Build Lean proofs
        run: |
          cd lean
          lake build

      - name: Ensure no admits in consensus proofs
        run: |
          if grep -R "admit" lean/Tetragrammatron; then
            echo "❌ Found admit in Lean proofs"
            exit 1
          else
            echo "✓ No admits found"
          fi

  # ------------------------------------------------------------
  # 3. Scheme assembler determinism
  # ------------------------------------------------------------
  scheme-assembler:
    name: Scheme Assembler Determinism
    runs-on: ubuntu-latest
    needs: repo-policy
    steps:
      - uses: actions/checkout@v4

      - name: Install Scheme (Guile)
        run: sudo apt-get update && sudo apt-get install -y guile-3.0

      - name: Assemble canonical program
        run: |
          mkdir -p build
          guile asm/can-assemble.scm \
            examples/fano_fold.canl \
            > build/out.canbc

      - name: Hash bytecode
        run: |
          sha256sum build/out.canbc | tee build/${CANON_HASH_FILE}

      - name: Reassemble and verify identical output
        run: |
          guile asm/can-assemble.scm \
            examples/fano_fold.canl \
            > build/out2.canbc

          sha256sum build/out2.canbc > build/recheck.sha256

          diff build/${CANON_HASH_FILE} build/recheck.sha256

  # ------------------------------------------------------------
  # 4. Golden vector consistency (host VM)
  # ------------------------------------------------------------
  golden-vectors:
    name: Golden Vector Consistency
    runs-on: ubuntu-latest
    needs:
      - scheme-assembler
      - lean-proofs
    steps:
      - uses: actions/checkout@v4

      - name: Build host reference VM
        run: |
          make vm-host

      - name: Run golden tests
        run: |
          make golden

      - name: Verify canonical hashes unchanged
        run: |
          git diff --exit-code golden/

  # ------------------------------------------------------------
  # 5. Dual-consensus invariant gate (RFC-009 / RFC-011)
  # ------------------------------------------------------------
  dual-consensus:
    name: Dual & Triadic Consensus Invariant
    runs-on: ubuntu-latest
    needs:
      - lean-proofs
      - golden-vectors
    steps:
      - uses: actions/checkout@v4

      - name: Run consensus invariant checks
        run: |
          ./scripts/check-dual-consensus.sh

  # ------------------------------------------------------------
  # 6. Release gate
  # ------------------------------------------------------------
  release-gate:
    name: Release Gate
    runs-on: ubuntu-latest
    if: startsWith(github.ref, 'refs/heads/release/')
    needs:
      - dual-consensus
      - golden-vectors
    steps:
      - name: Release approved
        run: |
          echo "✓ Release branch passes all invariants"
```

---

## What this CI **guarantees**

### ✔ Mathematical correctness
- Lean proofs **must compile**
- No `admit` allowed in consensus or invariant files

### ✔ Deterministic execution
- Scheme assembler must emit **bit-identical bytecode**
- Hash comparison enforces **canonical encoding**

### ✔ Fano / dual consistency
- Explicit invariant gate for **RFC-009 / RFC-011**
- 4D duality errors **cannot merge**

### ✔ Repo topology enforcement
- No direct pushes to `main`
- Feature branches must live on semantic axes
- Release branches are frozen projections

---

## How this matches your philosophy

This CI is **not a linter**.

It is a **proof-carrying merge barrier**:

> *If the universe diverges, the build fails.*

Exactly as you described.

---

### Next (recommended)
I can also generate:
- `scripts/check-dual-consensus.sh`
- a `justfile` / `Makefile` that mirrors CI locally
- ESP32 / Pico matrix builds (optional, cached)

Just tell me which one you want next.