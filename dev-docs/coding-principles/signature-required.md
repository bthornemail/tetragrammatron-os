# Signature Required

## Core Principle

> **Protected/public schemas require valid signatures**  
> **Private schemas: signature optional**  
> **Signature verification over schema binary bytes**  
> **Trust policy enforcement**

## Policy

**Schema acceptance rule:**

| Schema class | Signature required | Behavior if missing/invalid |
|--------------|--------------------|-----------------------------|
| private      | ❌ no              | Accept (local-only)         |
| protected    | ✅ yes             | Reject schema               |
| public       | ✅ yes             | Reject schema               |

**"Reject schema" means:**
- Schema is **not loaded**
- Nodes referencing it become **`unknown-schema`**
- Planes/lines do **not** render for that schema
- Execution cannot occur

## Signature Format

### Sidecar Format (Recommended)

Signature stored in separate `.sig.json` file:

```json
{
  "k": "schema.sig",
  "v": {
    "realm": "1A",
    "schema_hash": "a9f3c21d9e4b0a77d1a5f0b3a9e7c2ff",
    "schema_class": "public",
    "epoch": 3,
    "abi": 2,
    "signed_over": "1A|a9f3c2....bin",
    "pubkey_ed25519": "<hex-32-bytes>",
    "sig_ed25519": "<hex-64-bytes>"
  }
}
```

### What Gets Signed

**Sign exactly the compiled binary bytes** of `schema.bin` (ABI v2), no JSON string signing.

That means:
- Deterministic
- Runtime-verifiable
- No "canonicalization wars"

So: `sig = Ed25519.sign(schemaBinBytes, privateKey)`

## Signature Verification

### Verification Process

1. Load schema binary
2. Load signature sidecar
3. Extract public key and signature
4. Verify: `Ed25519.verify(pubkey, schemaBinBytes, sig)`
5. Check metadata matches (realm, hash, epoch, class)

### Trust Policy

Each node has a local policy:

- **Allowed realms**: Which realm bytes to accept
- **Pinned pubkeys**: Trusted public keys per realm/class
- **Required signature**: For protected/public
- **Max schema size**: Prevent DoS

If schema fails policy → **REJECT**.

## Private Schemas

Private schemas:
- Signature **optional**
- Local-only trust
- No verification needed
- Can be self-signed or unsigned

## Protected Schemas

Protected schemas:
- Signature **required**
- Verified with **shared group key**
- Group members must have group pubkey
- Authentication required before negotiation

## Public Schemas

Public schemas:
- Signature **required**
- Verified with **public trust root**
- Can use web-of-trust or pinned keys
- Globally cacheable after verification

## Implementation Requirements

### Schema Loading

When loading a schema:

```c
if (schema_class == PROTECTED || schema_class == PUBLIC) {
  if (!sig) {
    reject("unsigned");
  }
  if (!verify_schema_signature(schema_bin, sig)) {
    reject("invalid_signature");
  }
}
```

### Trust Context

Trust context must include:
- `isSelf`: Is this node the owner?
- `sharedKeyOK`: Does node have group shared key?
- `publicKeyOK`: Is public key in trust root?

### Execution Gate

Execution requires:
1. Schema present
2. Prefix valid
3. **Signature valid** (if protected/public)
4. Class admissible

## Formal Statement

The formal property we prove:

```lean
theorem exec_implies_signature
  (reg : SchemaRegistry) (pkt : Packet) :
  executes reg pkt →
    (pkt.schemaClass = .private ∨ 
     (∃ sig, sigValid sig pkt.schemaBin ∧ sigVerified sig))
```

This proves that protected/public schemas cannot execute without valid signatures.

## Key Management

### Key Naming

Keys are named by class and realm:

- **Public**: `public:{realm}` (e.g., `public:1A`)
- **Protected**: `protected:{realm}` (e.g., `protected:1A`)
- **Private**: `private:{realm}` (e.g., `private:1A`)

### Key Storage

- **Development**: localStorage (web viewer)
- **Production**: Secure key storage (ESP32 secure element, HSM)
- **Never**: Commit private keys to repository

### Key Rotation

- Public keys can be rotated via schema epoch
- Protected keys require group coordination
- Private keys are local-only

## Related Principles

- [Triadic Trust](./triadic-trust.md) - Class-based trust model
- [Schema Before Instance](./schema-before-instance.md) - Schema validation first
- [Immutability](./immutability.md) - Schema binary is immutable

## Related Documentation

- [Architecture: Triadic Law](../architecture/triadic-law.md)
- [Architecture: Schema Negotiation](../architecture/schema-negotiation.md)
- [Implementation Patterns: Signature Verification](../implementation-patterns/signature-verification.md)
- [Formal Verification: Triadic Law Proofs](../formal-verification/triadic-law-proofs.md)

