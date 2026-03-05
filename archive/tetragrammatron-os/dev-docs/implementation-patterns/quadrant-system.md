# Quadrant System (KK/KU/UK/UU)

**Extracted from:** CONVERSATION.md (lines 20000-20460)

## Overview

The quadrant system implements a **Rumsfeld quadrant model** for tracking knowledge provenance. It enables composable spheres where "unknown" is typed, merges are monotone, and defaults are explicit (so no drift).

## Quadrant Semantics

- **KK (Known Known)**: Observed fact, stable
- **KU (Known Unknown)**: Key is relevant but value missing; must resolve via default/constraints
- **UK (Unknown Known)**: Derived by adapter (parity/prime/Fano); not directly observed
- **UU (Unknown Unknown)**: Outside model; do not pretend to know; may carry *top/bottom marker*

## QValue Structure

Each canonical field is a **QValue**: `{ q, v, defaulted?, evidence[] }`

```typescript
type Quadrant = "KK" | "KU" | "UK" | "UU";

interface QValue {
  q: Quadrant;
  v: any;  // The actual value
  defaulted?: boolean;
  evidence: string[];  // Provenance trail
}
```

## Default Resolution Rule

Define a total function: `resolve : (key, QValue) → Value`

But keep provenance: `defaulted=true` if not KK/UK.

### Policy

- **KK** → take `v`, `defaulted=false`
- **UK** → take `v`, `defaulted=false`, mark evidence "derived:adapter/X"
- **KU** → choose **conservative default** (safe upper bound / minimal capability), `defaulted=true`
- **UU** → choose **model default** = `"unknown"` or `0` depending on field, `defaulted=true`, but keep `q=UU` so nobody confuses it with knowledge

### Example Canonical Defaults (Safe + Stable)

- `word_bits`: default 64 (KU/UU)
- `endian`: default `"little"` on Linux/Android; else `"unknown"` if you want stricter
- `addr_bits`: default = `word_bits` (derived ⇒ UK)
- `cpu_cores`: default 1 (KU/UU)
- `mem_upper_bytes`: default = observed mem if present else 0 or 512MiB conservative
- `time_model`: `"tick"` (KU), `"unknown"` (UU)
- `tick_hz`: 1_000_000 (KU), 0 (UU)
- `io_model`: `"nondet"` (KU) is safest for VM semantics

This makes the Ball "always total," while still tracking what's real.

## Composition Law (Merge = "Meet")

When you combine observations (multiple runs), define:

`mergeQ : QValue × QValue → QValue`

### Rules

1. **KK dominates** everything else
2. If both KK and equal value → keep KK
3. If both KK but **conflict** → reject (non-monotone Ball)
4. UK can fill KU/UU, but KK overrides UK
5. KU merged with KU stays KU (but may accumulate evidence)
6. UU merged with anything keeps the other (UU is "no info")

That gives you a proper directed refinement system.

## Implementation Example (Scheme)

```scheme
(define (merge-q a b)
  ;; Meet-like merge with conflict detection
  (let ((qa (q-of a)) (qb (q-of b))
        (va (v-of a)) (vb (v-of b)))
    (cond
      ;; KK wins
      ((string=? qa "KK")
       (if (and (string=? qb "KK") (not (equal? va vb)))
           (error "Non-monotone: KK conflict" va vb)
           (kk va (append (evidence-of a) (evidence-of b)))))
      ((string=? qb "KK") (merge-q b a))

      ;; UK fills KU/UU
      ((string=? qa "UK")
       (if (string=? qb "UK")
           (if (equal? va vb)
               (uk va (append (evidence-of a) (evidence-of b)))
               ;; derived conflict means adapter inconsistency
               (error "UK conflict (adapter inconsistency)" va vb))
           (uk va (append (evidence-of a) (evidence-of b)))))
      ((string=? qb "UK") (merge-q b a))

      ;; KU vs KU: keep KU, merge evidence
      ((and (string=? qa "KU") (string=? qb "KU"))
       (ku va (append (evidence-of a) (evidence-of b))))

      ;; UU is neutral ("no info")
      ((string=? qa "UU") b)
      ((string=? qb "UU") a)

      ;; KU with UU, etc.
      (else a))))
```

## Composable Spheres

Make the "Sphere" composable by defining it as:

> A Sphere = finite map `key ↦ QValue`, with merge `⊓` (meet) defined by `merge-q`.

Then:
- Ball observations produce a Sphere fragment (mostly KK + KU)
- Adapters produce Sphere fragments (UK)
- Composition is just repeated meet:  
  `S_total = S_ball ⊓ S_parity ⊓ S_prime ⊓ S_fano ⊓ ...`

That's your "extension adapters" story in one line.

## JSON Schema Definition

```json
{
  "$defs": {
    "quadrant": { "type": "string", "enum": ["KK", "KU", "UK", "UU"] },
    "qvalue_int": {
      "type": "object",
      "additionalProperties": false,
      "required": ["q", "v"],
      "properties": {
        "q": { "$ref": "#/$defs/quadrant" },
        "v": { "type": "integer" },
        "defaulted": { "type": "boolean" },
        "evidence": { "type": "array", "items": { "type": "string" } }
      }
    }
  }
}
```

## Principles

- **Explicit provenance**: Every value carries its quadrant and evidence
- **Deterministic defaults**: No drift from implicit assumptions
- **Monotone composition**: Merges preserve information ordering
- **Conflict detection**: Non-monotone states are rejected

## Related Concepts

- [Canonicalization](./canonicalization.md)
- [Adapter Pattern](./adapter-pattern.md)
- [Architecture: Sphere-Ball Model](../architecture/sphere-ball-model.md)

