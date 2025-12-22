# Signature Verification Pattern

## Overview

The signature verification pattern ensures schema integrity and trust for protected/public schemas. It uses Ed25519 signatures over schema binary bytes, with sidecar JSON files for metadata.

## Pattern Structure

### Signature Sidecar Format

**File:** `{key}.sig.json`

```json
{
  "k": "schema.sig",
  "v": {
    "realm": "1A",
    "schema_hash": "a9f3c21d9e4b0a77d1a5f0b3a9e7c2ff",
    "schema_class": "public",
    "epoch": 3,
    "abi": 2,
    "signed_over": "1A|a9f3c21d9e4b0a77d1a5f0b3a9e7c2ff.bin",
    "pubkey_ed25519": "a1b2c3d4e5f6...",
    "sig_ed25519": "1234567890abcdef..."
  }
}
```

### What Gets Signed

**Sign exactly the compiled binary bytes** of `schema.bin`:

```typescript
// Sign binary bytes directly
const sig = await crypto.subtle.sign(
  { name: "Ed25519" },
  privateKey,
  schemaBinBytes  // ArrayBuffer of schema.bin
);
```

**Not:**
- JSON string
- Canonicalized JSON
- Hash of binary

**Why:** Deterministic, runtime-verifiable, no canonicalization wars.

## Implementation

### Key Generation

```typescript
async function generateEd25519(): Promise<CryptoKeyPair> {
  return await crypto.subtle.generateKey(
    {
      name: "Ed25519",
      namedCurve: "Ed25519"
    },
    true,  // extractable
    ["sign", "verify"]
  );
}
```

### Signing

```typescript
async function signSchemaBin(
  schemaBin: ArrayBuffer,
  privateKey: CryptoKey
): Promise<ArrayBuffer> {
  return await crypto.subtle.sign(
    { name: "Ed25519" },
    privateKey,
    schemaBin
  );
}
```

### Verification

```typescript
async function verifySchemaSignature(
  schemaBin: ArrayBuffer,
  pubkey: ArrayBuffer,
  signature: ArrayBuffer
): Promise<boolean> {
  try {
    const key = await crypto.subtle.importKey(
      "raw",
      pubkey,
      { name: "Ed25519", namedCurve: "Ed25519" },
      false,
      ["verify"]
    );
    
    return await crypto.subtle.verify(
      { name: "Ed25519" },
      key,
      signature,
      schemaBin
    );
  } catch {
    return false;
  }
}
```

## Policy Enforcement

### Schema Class Requirements

```typescript
function requiresSignature(schemaClass: SchemaClass): boolean {
  return schemaClass === "protected" || schemaClass === "public";
}

async function loadSchemaWithVerification(
  schemaBin: ArrayBuffer,
  sigJson: SchemaSignature
): Promise<SchemaTable | null> {
  const schema = decodeSchemaBin(schemaBin);
  
  if (requiresSignature(schema.schemaClass)) {
    if (!sigJson) {
      console.error("Missing signature for protected/public schema");
      return null;
    }
    
    const pubkey = hexToU8(sigJson.pubkey_ed25519);
    const sig = hexToU8(sigJson.sig_ed25519);
    
    const valid = await verifySchemaSignature(schemaBin, pubkey, sig);
    if (!valid) {
      console.error("Invalid signature");
      return null;
    }
    
    // Check metadata matches
    if (sigJson.realm !== schema.realm ||
        sigJson.schema_hash !== schema.hash) {
      console.error("Signature metadata mismatch");
      return null;
    }
  }
  
  return schema;
}
```

## Trust Policy

### Trust Root Management

```typescript
interface TrustRoot {
  realm: string;
  pubkey: ArrayBuffer;
  class: "protected" | "public";
}

const trustRoots: TrustRoot[] = [
  {
    realm: "1A",
    pubkey: hexToU8("..."),  // Public trust root for ULP
    class: "public"
  }
];

function isTrustedPubkey(
  realm: string,
  pubkey: ArrayBuffer,
  class: SchemaClass
): boolean {
  for (const root of trustRoots) {
    if (root.realm === realm && 
        root.class === class &&
        arrayBufferEquals(root.pubkey, pubkey)) {
      return true;
    }
  }
  return false;
}
```

## ESP32 Implementation

### Using tweetnacl (Fallback)

```c
#include "tweetnacl.h"

bool verify_schema_signature(
  const uint8_t *schema_bin,
  size_t schema_len,
  const uint8_t *pubkey,
  const uint8_t *sig
) {
  return crypto_sign_open(
    NULL,  // message (we verify signature only)
    sig,
    schema_len + 64,  // sig includes message
    pubkey
  ) == 0;
}
```

## Related Patterns

- [Schema Compilation](./schema-compilation.md) - Binary format
- [Schema Registry](./schema-registry.md) - Runtime management
- [Schema Negotiation](./schema-negotiation.md) - Mesh protocol

## Related Documentation

- [Architecture: Triadic Law](../architecture/triadic-law.md)
- [Coding Principles: Signature Required](../coding-principles/signature-required.md)
- [Conventions: Schema Files](../conventions/schema-files.md)
- [Code Examples: Crypto Ed25519](../code-examples/typescript/web-viewer-integration.ts)

