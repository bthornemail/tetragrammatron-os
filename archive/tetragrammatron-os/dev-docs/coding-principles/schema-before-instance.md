# Schema Before Instance

## Core Principle

> **Schema rows (R0-R4) must be valid before instance assignment.**
> **Execution requires valid schema prefix.**
> **No interpretation of instance bytes (R5-R7).**
> **Schema is law, not opinion.**

## The Fundamental Invariant

The address schema enforces a strict ordering:

1. **Schema validation** (R0-R4) must succeed
2. **Then** instance assignment (R5-R7) can occur
3. **Then** execution can proceed

This ordering cannot be reversed or bypassed.

## Address Partition

An address is partitioned into two distinct layers:

```
R0 : R1 : R2 : R3 : R4 : R5 : R6 : R7
└──────── schema ────────┘ └── instance ──┘
```

### Schema Layer (R0-R4)

- **Fixed**: Values must be from predefined allowed sets
- **Meaningful**: Each byte has semantic meaning
- **Validated**: Must pass schema validation before use
- **Law**: Defined in `address-schema.yaml`, immutable source of truth

### Instance Layer (R5-R7)

- **Free**: Can be assigned arbitrarily (entropy, hash, counter)
- **Meaningless**: No semantic interpretation
- **Unvalidated**: No schema constraints
- **Entropy**: Only used for uniqueness within schema prefix

## Execution Gate

Execution is **schema-gated**:

```c
if (!tg_schema_prefix_valid_global(&addr)) {
  trap("invalid_schema");
} else {
  execute();
}
```

**Critical rule:** Invalid schema prefixes cannot:
- Execute
- Route
- Project
- Render (in web viewer)

They must trap immediately.

## No Interpretation of Instance Bytes

Instance bytes (R5-R7) are **pure entropy**:

- Do not infer meaning from instance bytes
- Do not use instance bytes for routing decisions
- Do not validate instance bytes against schema
- Do not display instance bytes as semantic labels

Instance bytes exist only for:
- Uniqueness within a schema prefix
- Collision avoidance
- Local identification

## Schema is Law

The address schema (`address-schema.yaml`) is:

- **Immutable**: Source of truth, not modified by agents
- **Authoritative**: All systems must respect it
- **Deterministic**: Same schema always produces same validation
- **Formal**: Proved in Lean, enforced in runtime

Agents MUST NOT:
- Guess schema values
- Infer schema from instance bytes
- Bypass schema validation
- Modify schema without human confirmation

## Pascal's Triangle Mapping

The schema/instance partition corresponds to Pascal's triangle:

- **Rows 0-4** (schema): Fixed, predefined, combinatorial structure
- **Row 5** (instance): Free, entropy-based, execution layer

This structural mapping ensures that:
- Schema is established before execution
- Execution cannot occur without schema
- Schema defines the space of valid addresses

## Implementation Requirements

### Address Assignment

When assigning a new address:

1. **First**: Choose valid schema prefix (R0-R4)
2. **Then**: Assign instance bytes (R5-R7) via:
   - Hash of MAC + time + salt
   - Counter
   - Nonce
   - Any entropy source

### Address Validation

When validating an address:

1. **First**: Check schema prefix (R0-R4) against schema
2. **Then**: Proceed with execution/routing/projection
3. **Never**: Validate or interpret instance bytes

### Address Parsing

When parsing an address:

1. Extract schema prefix (R0-R4)
2. Extract instance bytes (R5-R7)
3. Validate schema prefix
4. Use instance bytes as-is (no interpretation)

## Formal Statement

The Lean theorem expresses this principle:

```lean
theorem invalid_schema_no_execute (fuel : Nat) (code : Code) (vm : VM)
    (hbad : ¬ schemaValid vm.addr) :
    runChecked fuel code vm = Outcome.trap vm "invalid_schema"
```

This proves that execution cannot occur without valid schema.

## Related Principles

- [Immutability](./immutability.md) - Schema is immutable source of truth
- [Determinism](./determinism.md) - Schema validation is deterministic
- [Boundary Preservation](./boundary-preservation.md) - Schema defines boundaries

## Related Documentation

- [Architecture: Address Schema](../architecture/address-schema.md)
- [Architecture: ULP Addressing](../architecture/ulp-addressing.md)
- [Formal Verification: Schema Gate Theorems](../formal-verification/schema-gate-theorems.md)
- [Implementation Patterns: Schema Compilation](../implementation-patterns/schema-compilation.md)

