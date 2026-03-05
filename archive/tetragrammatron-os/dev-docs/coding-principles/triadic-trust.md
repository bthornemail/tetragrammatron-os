# Triadic Trust

## Core Principle

> **Private schemas: local-only, never negotiated**  
> **Protected schemas: require shared key, authenticated peers**  
> **Public schemas: freely shared, globally cacheable**  
> **Class determines execution admissibility**

## The Triadic Law

Three schema visibility classes unify cryptographic, geometric, and algebraic perspectives:

| Class | Crypto | Geometry | Algebra | Execution |
|-------|--------|----------|---------|-----------|
| **Private** | privateKey | Point | Monomial | `ctx.isSelf` |
| **Protected** | sharedKey | Line | Binomial | `ctx.sharedKeyOK` |
| **Public** | publicKey | Plane | Trinomial | Always |

This is not poetic—it is a **structural isomorphism**.

## Private Schemas

### Properties

- **Local-only**: Never shared, never negotiated
- **Self-authentication**: Only `ctx.isSelf` can execute
- **No routing**: Not mesh-routable
- **Signature optional**: Local trust only

### Use Cases

- Personal notes
- Local development
- Private experiments
- Self-contained processes

### Address Scope

Only instance bytes (R5-R7) are meaningful. Schema bytes (R0-R4) are local convention only.

## Protected Schemas

### Properties

- **Group-authenticated**: Require shared key verification
- **Negotiated**: Only with authenticated peers
- **Signature required**: Group key verification
- **Tunnelled**: Overlay network, encrypted

### Use Cases

- Team collaboration
- Private networks
- Authenticated services
- Group consensus

### Address Scope

Process and context (R3-R4) define group boundaries. Instance bytes (R5-R7) identify within group.

## Public Schemas

### Properties

- **Freely shared**: Globally cacheable
- **Signature required**: Public trust root verification
- **Mesh-routed**: Full mesh participation
- **Always admissible**: No trust context check needed

### Use Cases

- Public mesh networks
- Open protocols
- Global consensus
- Public documentation

### Address Scope

Full address (R0-R7) is public. All bytes are meaningful and routable.

## Execution Admissibility

Execution requires **all three** conditions:

```
schema present
∧ prefix valid
∧ class admissible
```

### Class Admissibility Function

```c
bool schema_class_ok(schema_class_t c, trust_ctx_t *ctx) {
  switch (c) {
    case SCHEMA_PRIVATE:
      return ctx->is_self;
    case SCHEMA_PROTECTED:
      return ctx->shared_key_ok;
    case SCHEMA_PUBLIC:
      return true;
  }
}
```

## Negotiation Matrix

Schema class determines negotiation behavior:

| Local \ Remote | Private | Protected | Public |
|----------------|---------|-----------|--------|
| **Private**    | ❌      | ❌        | ❌     |
| **Protected** | ❌      | ✅ (auth) | ❌     |
| **Public**    | ❌      | ❌        | ✅     |

**Meaning:**
- Private schemas: Never negotiated
- Protected schemas: Require shared trust
- Public schemas: Globally cacheable

## Routing Behavior

Routing happens at different layers by class:

- **Private**: Local only, no mesh routing
- **Protected**: Tunnelled (overlay network)
- **Public**: Mesh-routed (full mesh participation)

This gives you:
- Onion-like privacy
- Lawful isolation
- Zero confusion

## Information Flow

### No Downward Flow

Protected and private information cannot leak into public:

```lean
theorem no_downflow_protected :
  (w1 w2 : World) →
  publicEquivalentExceptProtected w1 w2 →
  publicView w1 = publicView w2
```

**Meaning:**
- Changing protected data does not change public observations
- Public observer cannot see protected/private schema tables
- No privilege escalation

## Formal Statement

The formal property we prove:

```lean
theorem exec_implies_triad
  (reg : SchemaRegistry) (pkt : Packet) (ctx : TrustCtx) :
  executes reg ctx pkt →
    ∃ tab,
      reg.lookup pkt.schemaKey = some tab ∧
      schemaValid tab pkt.addr pkt.residue ∧
      classAdmissible tab.schemaClass ctx
```

This is **the proof boundary** of the system.

## Implementation Requirements

### Schema Loading

When loading a schema:

1. Check schema class
2. If protected/public: require signature verification
3. If private: signature optional
4. Store in registry with class metadata

### Execution Gate

When executing:

1. Lookup schema in registry
2. Validate schema prefix
3. Check class admissibility
4. Only then execute

### Negotiation

When negotiating schemas:

1. Check class compatibility
2. Private: reject (never negotiated)
3. Protected: require authentication
4. Public: accept if signature valid

## Related Principles

- [Schema Before Instance](./schema-before-instance.md) - Schema validation first
- [Signature Required](./signature-required.md) - Protected/public require signatures
- [Boundary Preservation](./boundary-preservation.md) - Class boundaries are preserved

## Related Documentation

- [Architecture: Triadic Law](../architecture/triadic-law.md)
- [Architecture: Schema Negotiation](../architecture/schema-negotiation.md)
- [Formal Verification: Triadic Law Proofs](../formal-verification/triadic-law-proofs.md)
- [Implementation Patterns: Signature Verification](../implementation-patterns/signature-verification.md)

