# Implementation Gaps Analysis

This document analyzes what needs to be implemented or changed based on the architectural documentation in `dev-docs/`.

**Status as of:** 2025-12-21

---

## ✅ Already Implemented

### Tools
- ✅ `tools/validate_axes.mjs` - Structural validator (matches documentation)
- ✅ `tools/drift_scan.mjs` - Drift scanner (matches documentation)
- ✅ `tools/gen_tree_indexes.mjs` - Index generator
- ✅ `tools/validate_jsonl.mjs` - JSONL validator

### Infrastructure
- ✅ `.ulp/drift/` directory structure (events, reports, snapshots)
- ✅ `obsidian/bases/` with all six documented base files
- ✅ `hardware/` directory with probe.jsonl, canon.json, sphere.json

### Tree Structure
- ✅ `trees/tetragrammatron/branches/` - All 6 branches have complete four-axis structure
  - ✅ All have: freedom/, autonomy/, sovereignty/, context/ with 6 subfolders
  - ✅ All have: AGENTS.md and README.md

---

## ❌ Missing Implementations

### 1. Branch Structure Issues

#### trees/obsidian/branches/development/
**Status:** Incomplete structure
- ❌ Missing: `AGENTS.md`
- ❌ Missing: `README.md`
- ❌ Missing: `freedom/` folder
- ❌ Missing: `autonomy/` folder (exists but may be empty)
- ❌ Missing: `sovereignty/` folder
- ⚠️ Has: `context/services/` only (missing other 5 context subfolders)

**Action Required:**
```bash
cd trees/obsidian/branches/development
mkdir -p freedom autonomy sovereignty
mkdir -p context/{networks,views,connections,documents,assets}
# Create AGENTS.md and README.md from templates
```

#### trees/universal-life-protocol/branches/development/
**Status:** Incomplete structure + typo
- ❌ Missing: `AGENTS.md`
- ❌ Missing: `README.md`
- ⚠️ **TYPO**: Folder named `soverignty` should be `sovereignty`
- ⚠️ Has context/ but needs to verify all 6 subfolders exist

**Action Required:**
```bash
cd trees/universal-life-protocol/branches/development
mv soverignty sovereignty  # Fix typo
# Verify context subfolders
mkdir -p context/{networks,views,connections,documents,assets,services}
# Create AGENTS.md and README.md from templates
```

### 2. Formal Verification (Lean Files)

**Status:** Not implemented
- ❌ No Lean 4 files exist in the repository
- ❌ `dev-docs/formal-verification/axes-validator-soundness.md` documents a Lean file but it doesn't exist

**Action Required:**
Create `dev-docs/formal-verification/lean/Tetragrammatron_AxesValidator_SphereSoundness.lean` with the formalization documented in `axes-validator-soundness.md`.

**Files needed:**
- `Tetragrammatron_AxesValidator_SphereSoundness.lean`
- `lakefile.lean` (Lean project configuration)
- `lean-toolchain` (Lean version specification)

### 3. ULP Addressing Implementation

**Status:** Documented but not implemented
- ❌ No ULP address encoding/decoding utilities
- ❌ No ULP address validation
- ❌ No files using ULP address naming scheme

**Action Required:**

Create ULP addressing utilities:
```javascript
// tools/ulp_address.mjs
export function encodeULP(registers) { ... }
export function decodeULP(address) { ... }
export function validateULP(address) { ... }
export function toFilesystemSafe(address) { ... }
export function toCanonical(address) { ... }
```

### 4. Admissibility Contract Artifacts

**Status:** Documented but not implemented
- ❌ No branches have `context/documents/admissibility.contract.md`
- ❌ No branches have `context/services/adapters/` implementations

**Action Required:**

For each branch that needs public sphere mode:
1. Create `context/documents/admissibility.contract.md` explaining the contract
2. Create `context/services/adapters/parity_checker.ts` (or appropriate adapter)
3. Update validator to check for contracts in public mode

### 5. ESP Tree Structure

**Status:** Not applicable to four-axis ontology
- ⚠️ `trees/esp/` exists but contains ESP-IDF source code, not branches
- ⚠️ This appears to be external code (ESP-IDF v5.4.1)

**Decision Required:**
- Should ESP-IDF be moved out of trees/?
- Or should it be wrapped in a branch structure?
- Current structure breaks the trees→branches→axes pattern

**Recommendation:**
Move ESP-IDF to a separate location:
```bash
mv trees/esp/branches/idf-v5.4.1 vendor/esp-idf/v5.4.1
# Or create hardware/platforms/esp32/esp-idf/
```

---

## 🔧 Changes Needed to Existing Code

### 1. Fix Typo in ULP Branch

**File:** `trees/universal-life-protocol/branches/development/soverignty/`
**Change:** Rename to `sovereignty`
**Impact:** Breaking change - any references need updating

### 2. Update Validator for Public Mode

**File:** `tools/validate_axes.mjs`
**Enhancement:** Add optional public mode validation that requires contracts

```javascript
function validatePublicMode(branchDir, isPublic) {
  if (!isPublic) return;

  const contractPath = path.join(
    branchDir,
    "context/documents/admissibility.contract.md"
  );

  if (!fs.existsSync(contractPath)) {
    die(`Public sphere mode requires contract at ${contractPath}`);
  }
}
```

### 3. Extend Drift Scanner

**File:** `tools/drift_scan.mjs`
**Enhancement:** Monitor for ULP address file patterns

Already good, but could add:
```javascript
// Track ULP-addressed files separately
function isULPAddress(filename) {
  return /^ulp_[0-9a-f]{4}_[0-9a-f]{4}_[0-9a-f]{4}_[0-9a-f]{4}/.test(filename);
}
```

---

## 📋 Templates to Create

### 1. Branch AGENTS.md Template

Create `templates/AGENTS.md` from the template in `dev-docs/architecture/four-axis-ontology.md`.

### 2. Branch README.md Template

Create `templates/README.md` from the template in `dev-docs/architecture/four-axis-ontology.md`.

### 3. Admissibility Contract Template

Create `templates/admissibility.contract.md` with:
- Rule explanation
- Proof sketch
- Implementation reference

---

## 🎯 Priority Implementation Order

### Phase 1: Fix Structural Issues (High Priority)
1. ✅ Fix `soverignty` → `sovereignty` typo in ULP branch
2. ✅ Complete `trees/obsidian/branches/development/` structure
3. ✅ Complete `trees/universal-life-protocol/branches/development/` structure
4. ✅ Add AGENTS.md and README.md to incomplete branches
5. ✅ Run `node tools/validate_axes.mjs` to verify

### Phase 2: ULP Addressing (Medium Priority)
1. ⬜ Create `tools/ulp_address.mjs` with encoding/decoding functions
2. ⬜ Add ULP address validation to `tools/validate_axes.mjs`
3. ⬜ Create example files using ULP addressing scheme
4. ⬜ Document ULP address usage in AGENTS.md files

### Phase 3: Formal Verification (Medium Priority)
1. ⬜ Set up Lean 4 project structure
2. ⬜ Create `Tetragrammatron_AxesValidator_SphereSoundness.lean`
3. ⬜ Add lakefile and toolchain configuration
4. ⬜ Verify proofs compile

### Phase 4: Admissibility Contracts (Low Priority)
1. ⬜ Create contract template
2. ⬜ Add example parity adapter to one branch
3. ⬜ Extend validator for public mode contract checking
4. ⬜ Document contract extension process

### Phase 5: ESP Tree Reorganization (Optional)
1. ⬜ Decide on ESP-IDF placement strategy
2. ⬜ Move ESP-IDF out of trees/ if appropriate
3. ⬜ Update any build scripts/references

---

## 🧪 Testing Checklist

After implementing changes:

- [ ] `node tools/validate_axes.mjs` passes with exit code 0
- [ ] `node tools/drift_scan.mjs` completes successfully
- [ ] All branches have AGENTS.md and README.md
- [ ] All branches have 4 axes with context/ having 6 subfolders
- [ ] No branches have typos in folder names
- [ ] Drift events are being recorded in `.ulp/drift/events/drift.jsonl`
- [ ] Obsidian bases load without errors
- [ ] (If implemented) Lean files typecheck with `lake build`
- [ ] (If implemented) ULP addresses encode/decode correctly

---

## 📝 Documentation Updates Needed

After implementation:

1. Update `AGENTS.md` in affected branches
2. Update `README.md` in affected branches
3. Add ULP addressing examples to `dev-docs/code-examples/`
4. Document contract creation process
5. Update `trees/README.md` if ESP structure changes

---

## Summary

**Critical Issues (Must Fix):**
- 2 branches missing AGENTS.md and README.md
- 1 branch has typo: `soverignty` → `sovereignty`
- 2 branches incomplete folder structure

**Enhancement Opportunities (Should Implement):**
- ULP addressing utilities
- Lean formal verification
- Admissibility contracts
- Public mode validation

**Architectural Decisions Needed:**
- What to do with ESP-IDF tree structure
- Whether to enforce contracts in all branches or only public sphere

**Estimated Effort:**
- Phase 1 (Critical): 1-2 hours
- Phase 2 (ULP): 3-4 hours
- Phase 3 (Lean): 4-6 hours
- Phase 4 (Contracts): 2-3 hours
- Phase 5 (ESP): 1-2 hours (depending on decision)

**Total: ~15-20 hours of implementation work**
