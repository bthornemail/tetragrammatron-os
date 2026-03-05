# Agent 0 — OBSERVER / FANO GUARDIAN

**Mnemonic:** `OBS-FANO-IDEM`  
**Role:** Final gate before merge approval  
**RFC Reference:** RFC-0000 §A (Agent 0 Prompt), §C (Mnemonic Fingerprint Rule), §D (Observer Rule)

## Overview

Agent 0 is the OBSERVER agent for Tetragrammatron-OS. Per RFC-0000 §A, Agent 0 **MUST NOT** write code, edit files, or propose features—its sole responsibility is verification. Agent 0 verifies that all changes preserve critical invariants before allowing merges.

**Normative Requirements (RFC-0000 §A):**
- Agent 0 MUST NOT write code, edit files, or propose features
- Agent 0 MUST verify that changes preserve:
  - Fano incidence consistency
  - Idempotence under normalization
  - 8-tuple semantic closure
  - Dual invariants (primal/dual, V↔E)
- Agent 0 MUST respond with: ✅ APPROVED (with invariant justification), or ❌ REJECTED (with violated invariant reference)

**Observer Rule (RFC-0000 §D):**
A change is mergeable **iff** the OBSERVER agent confirms:
1. Fingerprint consistency (§C)
2. Fano invariants preserved
3. No cross-agent contamination

## Invariant Checks

Agent 0 verifies six categories of invariants (4 from RFC-0000 §A + 2 from §D):

### 1. Fano Incidence Consistency (RFC-0000 §A, INV-12, INV-13)

- Verifies that `repo.canvasl` changes preserve Fano plane structure
- Checks that triad declarations match canonical Fano lines
- Ensures no non-Fano triads are introduced
- Uses logic from `tools/fano-merge-check.py`

**Violation Example:**
```
❌ REJECTED (with violated invariant reference: INV-12, INV-13)
  - Fano incidence consistency: INV-12, INV-13
    → Non-Fano triad detected: state, alphabet, reject
```

### 2. Idempotence Under Normalization (RFC-0000 §A, INV-1)

- Verifies that canonicalization is idempotent: `canon(canon(x)) == canon(x)`
- Currently checks for `.canb` and `.canbc` bytecode files
- Full implementation requires VM code execution (deferred for now)

**Note:** This check is currently a placeholder. Full implementation would require:
- Compiling/running VM code
- Testing canonicalization on bytecode files
- Verifying idempotence property

### 3. 8-Tuple Semantic Closure (RFC-0000 §A)

- Verifies all 8 axes are present in `repo.canvasl` structure:
  - `state`, `alphabet`, `left`, `right`, `delta`, `start`, `accept`, `reject`
- Ensures changes don't break axis completeness
- Checks that triad files exist for all axes

**Violation Example:**
```
❌ REJECTED (with violated invariant reference: 8-tuple)
  - 8-tuple semantic closure: 8-tuple
    → Missing axes in repo.canvasl structure: state, alphabet
```

### 4. Dual Invariants (RFC-0000 §A, Primal/Dual, V↔E)

- Basic check: Verifies Fano structure maintains 7 points ↔ 7 lines symmetry
- Full dual invariant checking requires Agent 5 coordination (deferred)

**Note:** This is a basic structural check. Full implementation requires:
- Agent 5 (Geometry & Visualization) coordination
- Point/line duality verification
- Projection homomorphism checks (INV-11)

### 5. Fingerprint Consistency (RFC-0000 §D, §C)

- Verifies each file has exactly one mnemonic fingerprint
- Checks fingerprints match expected agent domains
- Rejects files with multiple or missing fingerprints

**Valid Fingerprints:**
- `RFC-CANON-LAW` (Agent 1)
- `CAN-BIT-TRUTH` (Agent 2)
- `VM-EXEC-FOLD` (Agent 3)
- `PROOF-IDEM-SAFE` (Agent 4)
- `GEO-FANO-SVG` (Agent 5)
- `REPO-LATTICE-TIME` (Agent 6)
- `HW-TIME-REAL` (Agent 7)
- `OBS-FANO-IDEM` (Agent 0)

**Violation Example:**
```
❌ REJECTED (with violated invariant reference: §C)
  - Fingerprint consistency: §C
    → tools/agent0-observer.py: missing mnemonic fingerprint (expected: OBS-FANO-IDEM)
    → vm/can_vm.c: multiple fingerprints detected: VM-EXEC-FOLD, CAN-BIT-TRUTH
```

**Fingerprint Exempt Files:**
- Documentation files (`.md`, `.txt`)
- Configuration files (`.json`, `.yml`, `.yaml`)
- Build files (`Makefile`, `.gitignore`)
- License files

### 6. Cross-Agent Contamination (RFC-0000 §D)

- Verifies files don't mix fingerprints from different agents
- Checks that file paths match expected agent domains
- Prevents agent boundary violations

**Path-to-Fingerprint Mapping:**
- `rfc/` → `RFC-CANON-LAW`
- `vm/can_codec*`, `vm/canb_*`, `vm/can_disasm*` → `CAN-BIT-TRUTH`
- `vm/can_vm*`, `vm/can_poly*`, `vm/can_objpool*` → `VM-EXEC-FOLD`
- `vm/can_time*` → `HW-TIME-REAL`
- `proof/` → `PROOF-IDEM-SAFE`
- `core/geometry/` → `GEO-FANO-SVG`
- `repo.canvasl/` → `REPO-LATTICE-TIME`
- `tools/hw*`, `tools/termux*` → `HW-TIME-REAL`
- `tools/agent0-observer*` → `OBS-FANO-IDEM`

**Violation Example:**
```
❌ REJECTED (with violated invariant reference: §D)
  - Cross-agent contamination: §D
    → vm/can_vm.c: fingerprint mismatch (expected: VM-EXEC-FOLD, got: CAN-BIT-TRUTH)
```

## Usage

### Standalone Tool

Run Agent 0 locally to check changes:

```bash
# Check changes between origin/main and HEAD
python3 tools/agent0-observer.py origin/main HEAD

# Check changes between specific refs
python3 tools/agent0-observer.py origin/current feature/my-branch

# Using Makefile
make agent0-check
```

### Exit Codes

- `0`: ✅ APPROVED — All invariants preserved
- `1`: ❌ REJECTED — One or more invariants violated

### Output Format (RFC-0000 §A Compliant)

Per RFC-0000 §A, Agent 0 responds with:
- ✅ **APPROVED** (with invariant justification)
- ❌ **REJECTED** (with violated invariant reference)

**Approved Example:**
```
✅ APPROVED (All invariants preserved: Fano incidence consistency (INV-12, INV-13), idempotence under normalization (INV-1), 8-tuple semantic closure, dual invariants (V↔E), fingerprint consistency (§C), no cross-agent contamination (§D))
```

**Rejected Example:**
```
❌ REJECTED (with violated invariant reference: INV-12, INV-13, §C)
  - Fano incidence consistency: INV-12, INV-13
    → Non-Fano triad detected: state, alphabet, reject
  - Fingerprint consistency: §C
    → tools/agent0-observer.py: missing mnemonic fingerprint (expected: OBS-FANO-IDEM)
```

**Note:** The detailed breakdown after the initial response provides specific violation details, but the first line must match the RFC format exactly: "❌ REJECTED (with violated invariant reference: ...)".

## CI Integration

Agent 0 runs automatically on pull requests via GitHub Actions (`.github/workflows/agent0-check.yml`).

### Workflow Behavior

1. **Triggers:** Pull requests (opened, synchronized, reopened, ready_for_review)
2. **Actions:**
   - Checks out repository
   - Runs `tools/agent0-observer.py` on PR diff
   - Posts results as PR comment
   - Sets PR status check (required for merge)
3. **Merge Blocking:** If Agent 0 rejects, the PR cannot be merged

### PR Comment Format

The workflow posts a comment on the PR with:
- ✅ **APPROVED** or ❌ **REJECTED** status
- Full Agent 0 output
- Summary message

### Status Check

The workflow sets a commit status:
- **Context:** `agent0-observer`
- **State:** `success` (approved) or `failure` (rejected)
- **Description:** "All invariants preserved" or "Invariant violations detected"

## Integration with Other Agents

### Agent 6 (REPO-LATTICE-TIME)

Agent 0 uses `tools/fano-merge-check.py` (Agent 6's tool) for Fano incidence checks. This ensures consistency between Agent 6's merge gate and Agent 0's final approval.

### Agent 4 (PROOF-IDEM-SAFE)

Agent 0 references proof specifications from `proof/AGENT0_PROOF_MAPPING.md` to understand which invariants must be verified.

### Agent 5 (GEO-FANO-SVG)

Full dual invariant checking requires Agent 5 coordination. Currently, Agent 0 performs basic structural checks only.

## Troubleshooting

### "Missing mnemonic fingerprint" Error

**Solution:** Add the appropriate fingerprint to your file:
```python
# Role: Agent 3 — SCHEME ASSEMBLER & VM IMPLEMENTER (VM-EXEC-FOLD)
```

### "Multiple fingerprints detected" Error

**Solution:** Ensure your file has exactly one fingerprint. Remove duplicate fingerprints.

### "Fingerprint mismatch" Error

**Solution:** Ensure the fingerprint matches the expected agent for the file path. See "Path-to-Fingerprint Mapping" above.

### "Non-Fano triad detected" Error

**Solution:** Ensure all triads in `repo.canvasl` match the canonical Fano lines. See `tools/fano-merge-check.py` for allowed triads.

### "Missing axes in repo.canvasl structure" Error

**Solution:** Ensure all 8 axes have corresponding triad files in `repo.canvasl/triads/`.

## Implementation Status

### ✅ Implemented

- Fano incidence consistency check
- 8-tuple semantic closure check
- Fingerprint consistency check
- Cross-agent contamination check
- Basic dual invariant check (structural only)
- CI integration

### ⏳ Deferred

- Full idempotence verification (requires VM execution)
- Full dual invariant checking (requires Agent 5 coordination)
- Advanced projection homomorphism checks

## References

- **RFC:** `dev-docs/00 - RFC-0000 APPENDIX — AGENT CONSTELLATION & TASK MATRIX.md`
- **Invariants:** `dev-docs/_IMPORTANT/TETRAGRAMMATRON_OS_FORMAL_INVARIANTS.md`
- **Proof Mapping:** `proof/AGENT0_PROOF_MAPPING.md`
- **Fano Merge Check:** `tools/fano-merge-check.py`

## Read-Only Verification

Per RFC-0000 §A, Agent 0:
- **MUST NOT** write code (except the verification tool itself)
- **MUST NOT** edit files
- **MUST NOT** propose features
- **MUST** only perform read-only verification

The `agent0-observer.py` tool is read-only—it only reads files to verify invariants and never modifies the repository. It performs no file write operations, only:
- Reading files to check fingerprints and content
- Running git commands to identify changed files (read-only)
- Outputting verification results to stdout/stderr

Agent 0's sole responsibility is verification. It does not generate code, modify files, or propose changes—only approve or reject based on invariant preservation.

---

**Mnemonic:** `OBS-FANO-IDEM`  
**RFC Reference:** RFC-0000 §A, §C, §D  
**Status:** Operational  
**Version:** 1.0 (RFC-0000 Compliant)

