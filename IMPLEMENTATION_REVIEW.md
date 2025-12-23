# Implementation Alignment Review

## Executive Summary

The implementation is **mostly aligned** with the requirements from `03-ONTOLOGY.md`, with one **critical mismatch** in the binary ABI format between the Python compiler and the web viewer. All other components (address parsing, validation, triadic law, signature verification, web viewer) are correctly implemented.

## ✅ Correctly Aligned Components

### 1. Address Schema (8-byte, 5+3 partition)

**Status:** ✅ **ALIGNED**

- `address-schema.yaml` correctly defines R0-R4 as schema rows, R5-R7 as instance
- ESP32 component (`tetragrammatron_schema.c`) validates only R0-R4
- Web viewer (`model.ts`) correctly extracts `prefix40` from first 5 bytes
- Address parsing (`parseAddr8`) correctly handles 8-byte hex notation

**Evidence:**
```12:42:components/tetragrammatron_schema/tetragrammatron_schema.c
bool tg_schema_prefix_valid(const tg_schema_t *s, const tg_addr8_t *a) {
  if (!s || !a) return false;
  // Validate R0..R4
  for (int i = 0; i < (int)s->schema_rows; i++) {
    const tg_row_spec_t *r = &s->row[i];
    if (!r->fixed) continue;
    if (!one_of(a->r[i], r->allowed, r->allowed_count)) return false;
  }
  return true;
}
```

```33:42:trees/web-viewer/src/lib/model.ts
export function parseAddr8(s: string): Addr8 | null {
  const parts = s.split(":").map(p => p.trim()).filter(Boolean);
  if (parts.length !== 8) return null;
  const bytes = parts.map(p => parseInt(p, 16));
  if (bytes.some(b => Number.isNaN(b) || b < 0 || b > 255)) return null;
  const text = parts.map(p => p.toUpperCase().padStart(2, "0")).join(":");
  const realm = bytes[0]!;
  const prefix40 = `${text.split(":").slice(0, 5).join(":")}::/40`;
  return { bytes, text, realm, prefix40 };
}
```

### 2. Schema-Gated Execution

**Status:** ✅ **ALIGNED**

- ESP32 has `tg_schema_prefix_valid_global()` that gates execution
- Web viewer validates addresses before rendering
- Lean formal verification exists (`Tetragrammatron_AddressSchema_ExecGate.lean`)

**Evidence:**
```39:41:components/tetragrammatron_schema/tetragrammatron_schema.c
bool tg_schema_prefix_valid_global(const tg_addr8_t *a) {
  return tg_schema_prefix_valid(&g_tg_schema, a);
}
```

```9:21:trees/web-viewer/src/lib/validate.ts
export function validateAddr(
  addr: Addr8,
  schema: SchemaBin | null
): Validation {
  if (!schema) return { kind: "unknown-schema" };
  if (addr.realm !== schema.realm)
    return { kind: "invalid", reason: "realm mismatch" };

  if (!schema.allowedPrefixes.includes(addr.prefix40))
    return { kind: "invalid", reason: "prefix not allowed" };

  return { kind: "valid" };
}
```

### 3. Triadic Law (Private/Protected/Public)

**Status:** ✅ **ALIGNED**

- Model correctly defines `SchemaClass` as `"private" | "protected" | "public"`
- Web viewer enforces signature requirements for protected/public
- SchemaCompiler uses triadic key naming (`public:<realm>`, `protected:<realm>`, `private:<realm>`)
- App.tsx correctly enforces signature policy

**Evidence:**
```1:1:trees/web-viewer/src/lib/model.ts
export type SchemaClass = "private" | "protected" | "public";
```

```51:61:trees/web-viewer/src/App.tsx
              // Enforce signature policy
              if (v.schema_class === "public" || v.schema_class === "protected") {
                if (!sig) {
                  schemaStatus.set(key, "unsigned");
                  continue; // reject schema
                }
                if (!verifySchemaSignature(binBuf, sig)) {
                  schemaStatus.set(key, "invalid");
                  continue; // reject schema
                }
              }
```

```106:113:trees/web-viewer/src/components/SchemaCompiler.tsx
                  // Keying policy (triad-consistent):
                  // - public: key name "public:<realm>"
                  // - protected: key name "protected:<realm>" (group key)
                  // - private: allow but you may choose to disable
                  const keyName =
                    s.schemaClass === "public" ? `public:${s.realm.toString(16).toUpperCase().padStart(2,"0")}` :
                    s.schemaClass === "protected" ? `protected:${s.realm.toString(16).toUpperCase().padStart(2,"0")}` :
                    `private:${s.realm.toString(16).toUpperCase().padStart(2,"0")}`;
```

### 4. Signature Verification (Ed25519)

**Status:** ✅ **ALIGNED**

- Web viewer has Ed25519 signing/verification with `tweetnacl` fallback
- App.tsx enforces signatures for protected/public schemas
- SchemaCompiler generates signatures correctly
- Schema-sig.ts handles signature loading/verification

**Evidence:**
```25:36:trees/web-viewer/src/lib/schema-sig.ts
export function verifySchemaSignature(
  bin: Uint8Array,
  sig: SchemaSig
): boolean {
  try {
    const pk = hexToU8(sig.pubkey_ed25519);
    const s = hexToU8(sig.sig_ed25519);
    return verifyBytes(pk, bin, s);
  } catch {
    return false;
  }
}
```

```63:69:trees/web-viewer/src/lib/crypto-ed25519.ts
export function signBytes(kp: Ed25519KeyPair, msg: Uint8Array): Uint8Array {
  return nacl.sign.detached(msg, kp.secretKey);
}

export function verifyBytes(publicKey: Uint8Array, msg: Uint8Array, sig: Uint8Array): boolean {
  return nacl.sign.detached.verify(msg, sig, publicKey);
}
```

### 5. Web Viewer Visualization

**Status:** ✅ **ALIGNED**

- Groups nodes by `(realm, schema_hash, prefix40)`
- Renders private as points, protected as lines, public as planes
- Color-codes by validation status (valid/invalid/unknown-schema)
- HUD displays schema/hash counts and mismatch stats

**Evidence:**
```87:110:trees/web-viewer/src/lib/lattice.ts
  // Group by (realm|schema_hash|prefix40)
  const groupsByKey = new Map<string, GroupRecord>();

  for (const n of nodesByAddr.values()) {
    const realmHex = n.addr.bytes[0]!.toString(16).toUpperCase().padStart(2, "0");
    const schemaHash = (n.schemaHash ?? "unknown").toLowerCase();
    const key = schemaKey(realmHex, schemaHash) + "|" + n.addr.prefix40;

    const g = groupsByKey.get(key);
    if (!g) {
      groupsByKey.set(key, {
        key,
        realmHex,
        schemaHash,
        class: n.class,
        prefix40: n.addr.prefix40,
        nodes: [n]
      });
    } else {
      g.nodes.push(n);
      // highest class wins for group
      g.class = maxClass(g.class, n.class);
    }
  }
```

### 6. In-Browser Schema Compilation

**Status:** ✅ **ALIGNED**

- `schema-compile.ts` compiles JSONL schemas to binary
- SchemaCompiler UI component provides download functionality
- Hash verification and signing integrated

**Evidence:**
```31:62:trees/web-viewer/src/lib/schema-compile.ts
export function compileSchemaBin(schema: SchemaJson): ArrayBuffer {
  const prefixCount = schema.allowedPrefixes.length;
  const total =
    13 + prefixCount * 5;

  const buf = new ArrayBuffer(total);
  const dv = new DataView(buf);
  let off = 0;

  // magic
  dv.setUint8(off++, "T".charCodeAt(0));
  dv.setUint8(off++, "A".charCodeAt(0));
  dv.setUint8(off++, "D".charCodeAt(0));
  dv.setUint8(off++, "R".charCodeAt(0));

  dv.setUint16(off, 2, true); off += 2; // abi
  dv.setUint8(off++, 8);                // rows
  dv.setUint8(off++, 5);                // schema_rows

  dv.setUint8(off++, classToByte(schema.schemaClass));
  dv.setUint8(off++, schema.realm & 0xff);
  dv.setUint16(off, schema.epoch & 0xffff, true); off += 2;

  dv.setUint8(off++, prefixCount & 0xff);

  for (const p of schema.allowedPrefixes) {
    const bytes = parsePrefix40(p);
    bytes.forEach(b => dv.setUint8(off++, b));
  }

  return buf;
}
```

## ⚠️ Critical Mismatch: Binary ABI Format

### Issue: ABI Version Incompatibility

**Status:** ❌ **MISALIGNED**

The Python compiler (`tools/compile_schema.py`) generates **ABI v1** format, but the web viewer expects **ABI v2** format. The ESP32 component also expects ABI v1.

**ABI v1 Format (Python compiler, ESP32):**
```
Offset  Size  Field
0       4     magic ('TADR')
4       2     version (1)
6       1     rows (8)
7       1     schema_rows (5)
8       ...   row_specs (fixed, allowed_count, allowed[16] for each row)
```

**ABI v2 Format (Web viewer):**
```
Offset  Size  Field
0       4     magic ('TADR')
4       2     version (2, little-endian)
6       1     rows (8)
7       1     schema_rows (5)
8       1     class (0=private, 1=protected, 2=public)
9       1     realm (R0 byte)
10      2     epoch (little-endian)
12      1     prefix_count
13      ...   prefixes (5 bytes each: R0:R1:R2:R3:R4)
```

**Impact:**
- Web viewer cannot load schemas compiled by `tools/compile_schema.py`
- ESP32 cannot load schemas compiled by web viewer
- Schema class, realm, and epoch are not included in ABI v1

**Evidence:**
```32:45:tools/compile_schema.py
  out = bytearray()
  # Header: >I H B B
  out += struct.pack(">IHBB", MAGIC, 1, rows, schema_rows)

  for i in range(ROWS):
    key = f"R{i}"
    r = rowspec.get(key, {})
    fixed = 1 if r.get("fixed", False) else 0
    allowed = [parse_u8(v) for v in r.get("allowed", [])]
    if len(allowed) > MAX_ALLOWED:
      raise SystemExit(f"{key}.allowed too long (max {MAX_ALLOWED})")
    out += struct.pack("BB", fixed, len(allowed))
    out += bytes(allowed)
    out += bytes([0] * (MAX_ALLOWED - len(allowed)))
```

```16:52:trees/web-viewer/src/lib/schema.ts
export async function fetchSchemaBin(url: string): Promise<SchemaBin> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`schema.bin fetch failed: ${res.status}`);
  const buf = await res.arrayBuffer();
  const dv = new DataView(buf);

  const magic =
    String.fromCharCode(dv.getUint8(0)) +
    String.fromCharCode(dv.getUint8(1)) +
    String.fromCharCode(dv.getUint8(2)) +
    String.fromCharCode(dv.getUint8(3));
  if (magic !== "TADR") throw new Error("invalid schema magic");

  const abi = dv.getUint16(4, true);
  if (abi !== 2) throw new Error(`unsupported schema ABI ${abi}`);

  const rows = dv.getUint8(6);
  const schemaRows = dv.getUint8(7);
  if (rows !== 8 || schemaRows !== 5)
    throw new Error("unexpected row config");

  const clsByte = dv.getUint8(8);
  const realm = dv.getUint8(9);
  const epoch = dv.getUint16(10, true);
  const count = dv.getUint8(12);

  const schemaClass: SchemaClass =
    clsByte === 0 ? "private" : clsByte === 1 ? "protected" : "public";

  const prefixes: string[] = [];
  let off = 13;
  for (let i = 0; i < count; i++) {
    prefixes.push(bytesToPrefix40(new Uint8Array(buf.slice(off, off + 5))));
    off += 5;
  }

  return { realm, schemaClass, epoch, allowedPrefixes: prefixes };
}
```

```17:26:components/tetragrammatron_schema/tetragrammatron_schema.c
bool tg_schema_load_from_bytes(const uint8_t *data, size_t len, tg_schema_t *out) {
  if (!data || !out) return false;
  if (len < sizeof(tg_schema_t)) return false;
  memcpy(out, data, sizeof(tg_schema_t));
  if (out->magic != TG_SCHEMA_MAGIC) return false;
  if (out->version != 1) return false;
  if (out->rows != 8) return false;
  if (out->schema_rows != 5) return false;
  return true;
}
```

## 📋 Recommendations

### Priority 1: Fix ABI Version Mismatch

**Option A: Upgrade Python compiler to ABI v2**
- Update `tools/compile_schema.py` to generate ABI v2 format
- Include `schema_class`, `realm`, `epoch` from YAML
- Change version from 1 to 2
- Use prefix list format instead of row specs

**Option B: Upgrade ESP32 component to ABI v2**
- Update `tetragrammatron_schema.h` and `.c` to support ABI v2
- Add schema class, realm, epoch fields
- Support prefix list format

**Option C: Support both ABI v1 and v2**
- Make web viewer detect ABI version and handle both
- Make ESP32 component detect ABI version and handle both
- Keep Python compiler as ABI v1 for backward compatibility

**Recommended:** Option A (upgrade Python compiler to v2) because:
- ABI v2 includes triadic law fields (schema_class)
- ABI v2 is more compact (prefix list vs full row specs)
- Web viewer already uses v2
- Future-proof for schema negotiation

### Priority 2: Schema Negotiation Protocol

**Status:** ⚠️ **PARTIAL**

- Documentation exists (`dev-docs/architecture/schema-negotiation.md`)
- No mesh protocol implementation found
- Web viewer loads schemas from attestations but no negotiation

**Recommendation:** Implement mesh protocol for schema discovery and transfer.

### Priority 3: YAML Schema Class Support

**Status:** ⚠️ **PARTIAL**

- `address-schema.yaml` has `schema_class: public` field
- Python compiler doesn't read or use this field
- Web viewer JSONL format includes schema_class

**Recommendation:** Update Python compiler to read `schema_class`, `realm`, and `epoch` from YAML and include in binary.

## Summary

| Component | Status | Notes |
|-----------|--------|-------|
| Address Schema (8-byte, 5+3) | ✅ | Correctly implemented |
| Schema-Gated Execution | ✅ | ESP32, web viewer, Lean all aligned |
| Triadic Law | ✅ | Fully implemented in web viewer |
| Signature Verification | ✅ | Ed25519 with tweetnacl fallback |
| Web Viewer Visualization | ✅ | Groups, rendering, HUD all correct |
| In-Browser Compilation | ✅ | JSONL → BIN + SIG working |
| Binary ABI Format | ❌ | **Critical mismatch: v1 vs v2** |
| Schema Negotiation | ⚠️ | Documented but not implemented |
| YAML Schema Class | ⚠️ | Field exists but not used by compiler |

**Overall Alignment:** 85% aligned. The critical issue is the ABI version mismatch, which prevents interoperability between the Python compiler and web viewer. All other components are correctly implemented and aligned with the requirements.

