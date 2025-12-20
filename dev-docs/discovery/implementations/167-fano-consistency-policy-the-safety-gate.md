# 16.7 Fano consistency policy (the safety gate)

This is where your “merge must maintain Fano consistency” becomes executable.

We define a policy function:

`POLICY_OK : (pre_state, patch, post_state) -> Bool`

Minimum enforceable version (start here):

### 16.7.1 Minimal policy (Policy 0: strict)
PATCH_APPLY MUST ensure ALL of:

1. **Normalization invariance**
   - After applying patch, the VM’s canonicalization functions still satisfy:
     - `normalize(normalize(x)) = normalize(x)` for all affected registries/memory regions that represent canonical objects.
2. **Opcode validity**
   - If patch touches CODE, every modified instruction word MUST decode to a valid opcode/format.
3. **Fano barrier invariance**
   - If the VM tracks Fano-triad invariants (gcd/meet triads), then:
     - the set of “required invariants” MUST remain satisfied after patch.
   - Practically: run `PROJ_FANO` + `FANO_TRIAD_CHECK` on a required set of registers before committing patch effects.
4. **Hash chain continuity**
   - If your VM has a rolling program hash, then:
     - program hash MUST be updated deterministically, and the patch hash MUST be recorded in the chain.

This is exactly how you avoid “nondeterministic self-modification”.

### 16.7.2 Stronger policy (Policy 1: proof-carrying)
Optional but aligned with your Lean/Coq path:

- Patch includes an attached **proof token**:
  - e.g. a Merkle pointer to a proof artifact, or a compact certificate
- VM verifies certificate (even just a signature + hash allowlist at first)
- Only then allow CODE patching.

You can phase this in.

---
