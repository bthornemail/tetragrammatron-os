# Triadic Law Architecture

## Overview

The Triadic Law establishes three schema visibility classes that unify cryptographic, geometric, and algebraic perspectives into a single canonical model. This triad governs schema visibility, negotiation, trust, and execution admissibility.

## Core Identification

The triadic law collapses three layers into one canonical triad:

| Tier | Name        | Crypto Analog     | Geometry | Algebra     | Address Scope | Who Can See |
|-----:|-------------|-------------------|----------|-------------|---------------|-------------|
| T1   | **Private** | privateKey        | Point    | Monomial    | R5–R7 only    | Self        |
| T2   | **Protected** | sharedKey       | Line     | Binomial    | R3–R4 + R5–7  | Group       |
| T3   | **Public**  | publicKey         | Plane    | Trinomial   | R0–R4 + R5–7  | Everyone    |

This is not poetic—it is a **structural isomorphism**.

## Schema Classes

### Private (Point / Monomial)

**Definition:**
- Single observer
- No negotiation
- Identity only
- Local-only execution

**Properties:**
- Schema never shared
- Never negotiated
- Signature optional
- Execution requires `ctx.isSelf`

**Address Scope:**
- Only instance bytes (R5-R7) are meaningful
- Schema bytes (R0-R4) are local convention only

**Use Cases:**
- Personal notes
- Local development
- Private experiments
- Self-contained processes

### Protected (Line / Binomial)

**Definition:**
- Relation between two or more
- Shared constraints
- Agreement required
- Authenticated group access

**Properties:**
- Schema negotiated only with authenticated peers
- Requires shared key verification
- Signature required (group key)
- Execution requires `ctx.sharedKeyOK`

**Address Scope:**
- Process and context (R3-R4) define group boundaries
- Instance bytes (R5-R7) identify within group

**Use Cases:**
- Team collaboration
- Private networks
- Authenticated services
- Group consensus

### Public (Plane / Trinomial)

**Definition:**
- Shared field
- Global consensus
- Projection invariant
- Freely accessible

**Properties:**
- Schema freely shared
- Globally cacheable
- Signature required (public trust root)
- Execution requires public verification

**Address Scope:**
- Full address (R0-R7) is public
- All bytes are meaningful and routable

**Use Cases:**
- Public mesh networks
- Open protocols
- Global consensus
- Public documentation

## Geometric Mapping

The geometric interpretation is **literal**, not analogical:

### Private = Point
- Zero-dimensional
- No relations
- Isolated identity
- No shared structure

### Protected = Line
- One-dimensional
- Connects two points
- Shared direction
- Bounded relation

### Public = Plane
- Two-dimensional
- Contains infinite points
- Shared coordinate system
- Unbounded consensus

## Algebraic Mapping

The algebraic structure reflects the geometric:

### Private = Monomial
- Single term: `x`
- No composition
- Atomic
- Irreducible

### Protected = Binomial
- Two terms: `x + y`
- Composition of two
- Relation
- Reducible to sum

### Public = Trinomial
- Three terms: `x + y + z`
- Composition of three
- Consensus structure
- Projective closure

## Cryptographic Mapping

The cryptographic interpretation enforces the trust model:

### Private = privateKey
- Secret, never shared
- Self-authentication
- No verification needed
- Local trust

### Protected = sharedKey
- Shared secret
- Group authentication
- Mutual verification
- Group trust

### Public = publicKey
- Public verification
- Global authentication
- Anyone can verify
- Public trust

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

This is the **crypto → semantics → execution bridge**.

## Routing Behavior

Routing happens at different layers by class:

### Private
- **Local only**: No mesh routing
- Direct connection required
- No prefix advertisement

### Protected
- **Tunnelled**: Overlay network
- Encrypted tunnels
- Group-scoped routing

### Public
- **Mesh-routed**: Full mesh participation
- Public prefix advertisement
- Global routing tables

This gives you:
- Onion-like privacy
- Lawful isolation
- Zero confusion

## Schema Class in Binary Format

### ABI v2 Header

```c
struct SchemaHeader {
  uint32_t magic;        // 'TADR'
  uint16_t version;      // ABI version
  uint8_t  rows;         // 8
  uint8_t  schema_rows;  // 5
  uint8_t  class;        // 0=private, 1=protected, 2=public
  uint8_t  realm;        // R0 byte
  uint16_t epoch;        // monotonic
  uint8_t  hash[16];     // schema fingerprint
  uint8_t  sig[32];      // optional signature
};
```

### Signature Requirements

- **Private**: `sig` unused (optional local signature)
- **Protected**: `sig` verified with shared group key
- **Public**: `sig` verified with public trust root

## Formal Statement

The formal property we prove:

```lean
inductive SchemaClass | private | protected | public

def classAdmissible (cls : SchemaClass) (ctx : TrustCtx) : Prop :=
  match cls with
  | .private   => ctx.isSelf
  | .protected => ctx.sharedKeyOK
  | .public    => True

theorem exec_implies_triad
  (reg : SchemaRegistry) (pkt : Packet) (ctx : TrustCtx) :
  executes reg ctx pkt →
    ∃ tab,
      reg.lookup pkt.schemaKey = some tab ∧
      schemaValid tab pkt.addr pkt.residue ∧
      classAdmissible tab.schemaClass ctx
```

This is **the proof boundary** of the system.

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

## Three.js Visualization

### Private = Points
- `THREE.Points` geometry
- Individual nodes
- No connections
- Low opacity

### Protected = Lines
- `THREE.LineSegments` geometry
- Connected nodes
- Group boundaries
- Medium opacity

### Public = Planes
- `THREE.PlaneGeometry` or billboards
- Consensus surfaces
- Prefix groups
- High opacity

## Naming Convention

Use these exact names in all documentation and code:

- **Schema Class**
  - `private` (point)
  - `protected` (line)
  - `public` (plane)

They align with:
- Crypto terminology
- Geometric intuition
- Algebraic structure
- Execution semantics

## Final Lock Statement

> Execution is not a right.  
> It is a consequence of valid schema, admissible class, and shared trust.  
> Private truths remain private.  
> Shared truths require agreement.  
> Public truths must withstand the plane.

## Related Documentation

- [Address Schema](./address-schema.md) - Schema format with class field
- [Schema Negotiation](./schema-negotiation.md) - Class-based negotiation rules
- [Coding Principles: Triadic Trust](../coding-principles/triadic-trust.md)
- [Formal Verification: Triadic Law Proofs](../formal-verification/triadic-law-proofs.md)
- [Implementation Patterns: Signature Verification](../implementation-patterns/signature-verification.md)

