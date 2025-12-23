# Trust Hardening Features

This document describes the three trust hardening features implemented in the web viewer.

## 1. Pinned Trusted Pubkeys Per Realm

### Overview
The viewer now supports pinning trusted Ed25519 public keys per realm. This prevents arbitrary public schemas from being accepted without verification against a known trust root.

### Configuration
Create `/public/trust-config.json`:

```json
{
  "trusted_pubkeys": {
    "1A": [
      "a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456"
    ],
    "00": [
      "deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef"
    ]
  },
  "require_private_sig": {
    "1A": false
  }
}
```

### Behavior
- **Public schemas**: Must be signed by a pubkey in the `trusted_pubkeys` list for that realm
- **Protected schemas**: Must be signed by a pubkey in the `trusted_pubkeys` list for that realm
- **Private schemas**: Signature optional (unless `require_private_sig[realm]` is `true`)

### Implementation
- `src/lib/trust-config.ts`: Trust configuration loader and verification
- `src/lib/schema-sig.ts`: Extended signature verification with trust checking
- `src/App.tsx`: Integrates trust config into schema loading pipeline

## 2. Require Signatures Even in Dev JSONL Mode

### Overview
Previously, dev mode (JSONL schemas) bypassed signature verification. Now signatures are required for `protected` and `public` schemas even in dev mode.

### Behavior
- Dev mode loads schemas from `schema.jsonl`
- Also loads signatures from `schema.sig.jsonl` (or individual `.sig.json` files)
- Verifies signatures against trusted pubkeys
- Rejects schemas without valid signatures (for protected/public)

### Implementation
- `src/lib/schema-jsonl.ts`: `fetchSchemasJsonlWithSigs()` function
- `src/App.tsx`: Uses signature verification in both dev and prod modes

### File Format
`/public/schemas/schema.sig.jsonl`:
```json
{"k":"schema.sig","v":{"realm":"1A","schema_hash":"a9f3c2...","schema_class":"public","epoch":3,"pubkey_ed25519":"...","sig_ed25519":"...","abi":2}}
```

## 3. Trust Graph Visualization in 3D

### Overview
The viewer now displays a trust graph showing the relationship between schemas and their trust anchors. This provides visual feedback about which schemas are trusted and which are not.

### Visualization Elements
- **Trusted lines**: Green lines connecting trusted schemas to a trust anchor point
- **Untrusted lines**: Orange lines for schemas with valid signatures but untrusted pubkeys
- **Trust anchor**: A green sphere at the top of the scene representing the trust root

### Implementation
- `src/components/SceneView.tsx`: `TrustGraph` component
- Renders lines from schema group centers to trust anchor points
- Color-codes by trust status

### HUD Display
The HUD now shows:
- Trusted schemas count
- Unsigned rejected count
- Invalid signature count
- Untrusted pubkey count

## Usage

### Setting Up Trust Configuration

1. Generate Ed25519 keypairs for each realm:
   ```bash
   # Use the SchemaCompiler UI to generate and export pubkeys
   ```

2. Create `/public/trust-config.json` with trusted pubkeys

3. Sign schemas using the SchemaCompiler UI (download `.sig.json`)

4. Place signed schemas in `/public/schemas/`

### Dev Mode Workflow

1. Edit `/public/schemas/schema.jsonl` in Obsidian
2. Sign schemas using SchemaCompiler UI
3. Save signatures to `/public/schemas/schema.sig.jsonl` or individual `.sig.json` files
4. Viewer will verify signatures against trust config
5. Trust graph will visualize trust relationships

### Production Mode Workflow

1. Compile schemas to `.bin` files
2. Sign binaries (download `.sig.json`)
3. Place in `/public/schemas/` as `{realm}|{hash}.bin` and `{realm}|{hash}.sig.json`
4. Viewer loads and verifies against trust config

## Security Properties

1. **No arbitrary public schemas**: Public schemas must be signed by trusted pubkeys
2. **No signature bypass in dev mode**: Dev mode enforces signatures for protected/public
3. **Visual trust feedback**: Trust graph makes trust relationships visible
4. **Fail-closed**: Unsigned or invalid schemas are rejected, not degraded

## Files Modified/Created

### New Files
- `src/lib/trust-config.ts`: Trust configuration management
- `public/trust-config.json`: Example trust configuration
- `TRUST_HARDENING.md`: This document

### Modified Files
- `src/lib/schema-sig.ts`: Added `verifySchemaSignatureWithTrust()`
- `src/lib/schema-jsonl.ts`: Added `fetchSchemasJsonlWithSigs()`
- `src/App.tsx`: Integrated trust config and signature verification
- `src/components/Hud.tsx`: Added trust status display
- `src/components/SceneView.tsx`: Added trust graph visualization

## Next Steps

Possible enhancements:
- Web-of-trust visualization (pubkey → pubkey relationships)
- Trust chain display (show which pubkeys signed which schemas)
- Interactive trust config editor in the viewer
- Export/import trust config from signed sources

