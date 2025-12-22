# Canonicalization

**Extracted from:** CONVERSATION.md (lines 20000-20460)

## Overview

Canonicalization is the process of reducing hardware probe JSONL to a single canonical record with quadrant-tagged values, ensuring deterministic output even under partial knowledge.

## Core Process

1. **Read JSONL events** from hardware probe
2. **Index latest values** per key (monotone in time)
3. **Apply quadrant resolution** (KK/KU/UK/UU)
4. **Resolve defaults** deterministically
5. **Output canonical record** with provenance

## Canonical Record Structure

```json
{
  "meta": {
    "schema_version": "1.0",
    "generated_at_utc": "2025-01-01T00:00:00Z",
    "source_set": ["probe.jsonl"]
  },
  "fields": {
    "word_bits": { "q": "UK", "v": 64, "defaulted": false, "evidence": ["derived:arch->word_bits"] },
    "endian": { "q": "KU", "v": "little", "defaulted": true, "evidence": ["default:endian=little"] },
    ...
  }
}
```

## Quadrant Resolution

Each field is a **QValue**: `{ q, v, defaulted?, evidence[] }`

### Resolution Policy

- **KK** → take `v`, `defaulted=false`
- **UK** → take `v`, `defaulted=false`, mark evidence "derived:adapter/X"
- **KU** → choose conservative default, `defaulted=true`
- **UU** → choose model default, `defaulted=true`, keep `q=UU`

## Default Values

Example canonical defaults (safe + stable):

- `word_bits`: default 64 (KU/UU)
- `endian`: default `"little"` on Linux/Android; else `"unknown"`
- `addr_bits`: default = `word_bits` (derived ⇒ UK)
- `cpu_cores`: default 1 (KU/UU)
- `mem_upper_bytes`: default = observed mem if present else 0
- `time_model`: `"tick"` (KU), `"unknown"` (UU)
- `tick_hz`: 1_000_000 (KU), 0 (UU)
- `io_model`: `"nondet"` (KU) is safest for VM semantics

## Implementation (Scheme)

```scheme
(define (canonize ht)
  ;; Observations (Ball)
  (let* ((cpu-arch (getv ht "cpu.arch"))
         (kernel   (getv ht "os.kernel"))
         (mem      (getv ht "mem.total_bytes"))
         (cores    (getv ht "cpu.cores")))

    ;; word_bits: prefer 64 on aarch64/x86_64; else default 64 (KU)
    (define word-bits
      (cond
        ((and (string? cpu-arch) (or (string=? cpu-arch "aarch64") (string=? cpu-arch "x86_64")))
         (uk 64 (list "derived:arch->word_bits")))
        ((string? cpu-arch)
         (uk 64 (list "derived:arch->word_bits:default64")))
        (else
         (ku 64 (list "default:word_bits=64")))))

    ;; ... more fields ...

    ;; Return canonical record
    `((meta . ((schema_version . "1.0")
               (generated_at_utc . ,(now-utc))
               (source_set . ("probe.jsonl"))))
      (fields . ((word_bits . ,word-bits)
                 ...)))))
```

## Principles

- **Deterministic**: Same inputs → same outputs
- **Explicit provenance**: Every value carries quadrant and evidence
- **Safe defaults**: Conservative choices when unknown
- **Total output**: Ball is "always total" while tracking what's real

## Related Concepts

- [Quadrant System](./quadrant-system.md)
- [Coding Principles: Determinism](../coding-principles/determinism.md)
- [Architecture: Sphere-Ball Model](../architecture/sphere-ball-model.md)

