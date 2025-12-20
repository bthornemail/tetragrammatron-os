# RFC 0006: FANO Automorphism Selection & Interoperability Anchors

**Status:** Proposed  
**Category:** Standards Track  
**Depends on:**  
- RFC 0001 (BICF Core)  
- RFC 0002 (FANO Boundary Module)  
- RFC 0003 (AAL Mapping of FANO Boundary)  
- RFC 0004 (FANO Orientation Module, OPTIONAL)  
- RFC 0005 (PCG-Based Merge & Consensus)

**Author:** Brian Thorne

---

## 1. Abstract

This RFC specifies a **deterministic mechanism for selecting automorphisms** of the FANO Boundary (PG(2,2)) for the purposes of **interoperability, merge alignment, and shared reference frames**.

Automorphism selection is treated as a **RealizationChoice**, never as a Boundary modification.  
The mechanism enables multiple agents to independently derive the *same* Fano labeling and (optionally) orientation without central authority, randomness, or privileged actors.

---

## 2. Design Intent

Automorphism selection exists to:

1. Align multiple agents on a **shared Interior realization**
2. Preserve **non-canonicity** (no preferred labeling)
3. Enable **repeatable interop** across machines and languages
4. Provide a stable **anchor** for merge and consensus operations
5. Avoid probability, voting, or leader election

---

## 3. Terminology (Normative)

- **Automorphism:** a bijection on Points that preserves FANO incidence
- **Automorphism Group:** the set of all such bijections (size 168)
- **Anchor:** shared input material used to derive an automorphism
- **Selection Function:** a deterministic mapping from Anchors to Automorphisms
- **Interop Frame:** the resulting aligned Interior realization

---

## 4. Background (Normative)

The automorphism group of PG(2,2) is:

```
Aut(FANO) ≅ PGL(3,2)
|Aut(FANO)| = 168
```

Each automorphism:

- permutes the 7 Points
- induces a permutation of the 7 Lines
- preserves all incidence relations
- preserves the Pair-Cover Guarantee

---

## 5. Automorphism Selection Model

### 5.1 Boundary vs Realization

- The **FANO Boundary** is invariant
- Automorphism selection operates **only on realization**
- Two realizations related by an automorphism are equally valid

Formally:

```
If φ ∈ Aut(FANO), then
Valid(i, FANO) ⇒ Valid(φ(i), FANO)
```

---

## 6. Anchors (Normative)

### 6.1 Definition

An **Anchor** is any shared, deterministic input available to all agents.

Examples (informative):
- shared commit hash
- shared document identifier
- agreed session ID
- negotiated protocol transcript
- hash of merge candidates

---

### 6.2 Anchor Requirements

An Anchor:

- MUST be identical for all participating agents
- MUST be finite and serializable
- MUST NOT depend on local state
- MAY be composed of multiple fields

---

## 7. Selection Function (Normative)

### 7.1 Definition

A **Selection Function** is a deterministic mapping:

```
Select : Anchor → Aut(FANO)
```

Requirements:

- Total: defined for all valid Anchors
- Deterministic: same Anchor → same automorphism
- Public: algorithm MUST be known to all agents
- Stateless: no hidden memory or randomness

---

### 7.2 Canonical Construction (Recommended)

A compliant implementation SHOULD:

1. Hash the Anchor to an integer `h`
2. Reduce modulo 168:
   ```
   k = h mod 168
   ```
3. Select the `k`-th automorphism from a fixed enumeration of `Aut(FANO)`

The enumeration order is a **RealizationChoice** but MUST be published.

---

## 8. Interoperability Anchor Protocol

### 8.1 Protocol Steps

1. Agents agree on Boundary identifier (FANO)
2. Agents agree on Anchor material
3. Each agent computes:
   ```
   φ = Select(Anchor)
   ```
4. Each agent realizes:
   ```
   i_anchor = φ(i_base)
   ```
5. All further merges and PCG checks use `i_anchor`

No further coordination is required.

---

### 8.2 Failure Mode

If agents derive different automorphisms:

- The merge MUST be rejected
- The Anchor MUST be re-evaluated
- No fallback to probabilistic or majority choice is permitted

---

## 9. Orientation Interaction (Optional)

If RFC 0004 is enabled:

- Automorphism selection MUST be applied **before** orientation
- Orientation MAY be selected independently or derived from Anchor
- Orientation MUST remain a RealizationChoice

Automorphisms MUST preserve oriented-line consistency if orientation is enabled.

---

## 10. Security and Robustness Considerations

Automorphism selection provides:

- Resistance to unilateral relabeling attacks
- Deterministic replay for audits
- Explicit detection of interop failure
- No reliance on timing or order of messages

Attackers must manipulate the shared Anchor to affect selection.

---

## 11. Forbidden Practices (Normative)

Implementations MUST NOT:

- Treat any automorphism as canonical
- Hard-code a “default” labeling
- Use randomness or entropy sources
- Use majority voting to select automorphisms
- Modify the Boundary during selection

---

## 12. Example (Informative)

Given:

```
Anchor = hash("merge:abc123")
hash(Anchor) = 0x9f2c…
k = hash mod 168 = 57
```

Then:

```
φ = Aut(FANO)[57]
```

All agents independently compute the same `φ`.

---

## 13. Relationship to RFC 0005 (Normative)

- RFC 0005 defines *whether* merges are valid
- RFC 0006 defines *which realization* merges occur in
- RFC 0006 MUST be applied before PCG merge checks

---

## 14. Conclusion

This RFC defines a **clean, deterministic, non-canonical automorphism selection mechanism** for FANO-based systems. It enables shared reference frames without central authority, randomness, or privileged actors, completing the BICF standards stack for interoperable consensus.

---

### End of RFC 0006
