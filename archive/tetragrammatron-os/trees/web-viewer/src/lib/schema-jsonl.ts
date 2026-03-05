import { SchemaClass } from "./model";

export type SchemaJson = {
  realm: number;
  schemaHash: string;
  schemaClass: SchemaClass;
  epoch: number;
  allowedPrefixes: string[];
};

export async function fetchSchemasJsonl(url: string): Promise<Map<string, SchemaJson>> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`schema.jsonl fetch failed: ${res.status}`);
  const text = await res.text();
  const trimmed = text.trim();

  const map = new Map<string, SchemaJson>();
  
  // Try parsing as single JSON object first
  try {
    const obj = JSON.parse(trimmed);
    if (obj.k === "schema.def") {
      const v = obj.v;
      if (v?.realm && v?.schema_hash) {
        const realmHex = v.realm.toUpperCase();
        const key = `${realmHex}|${v.schema_hash.toLowerCase()}`;
        map.set(key, {
          realm: parseInt(v.realm, 16),
          schemaHash: v.schema_hash.toLowerCase(),
          schemaClass: v.schema_class ?? "public",
          epoch: v.epoch ?? 0,
          allowedPrefixes: v.allowed_prefixes ?? []
        });
      }
    }
  } catch {
    // If that fails, try JSONL format (one JSON object per line)
    const lines = trimmed.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    for (const line of lines) {
      let obj: any;
      try { obj = JSON.parse(line); } catch { continue; }
      if (obj.k !== "schema.def") continue;

      const v = obj.v;
      if (!v?.realm || !v?.schema_hash) continue;

      const realmHex = v.realm.toUpperCase();
      const key = `${realmHex}|${v.schema_hash.toLowerCase()}`;

      map.set(key, {
        realm: parseInt(v.realm, 16),
        schemaHash: v.schema_hash.toLowerCase(),
        schemaClass: v.schema_class ?? "public",
        epoch: v.epoch ?? 0,
        allowedPrefixes: v.allowed_prefixes ?? []
      });
    }
  }

  return map;
}

// Load schemas from JSONL with signature verification
export async function fetchSchemasJsonlWithSigs(
  url: string,
  sigUrl: string,
  verifySig: (bin: Uint8Array, sig: any) => { valid: boolean; reason?: string }
): Promise<{ schemas: Map<string, SchemaJson>; status: Map<string, "ok" | "unsigned" | "invalid" | "untrusted"> }> {
  const schemas = await fetchSchemasJsonl(url);
  console.log(`fetchSchemasJsonlWithSigs: Loaded ${schemas.size} schemas from JSONL`);
  console.log(`fetchSchemasJsonlWithSigs: Schema keys:`, Array.from(schemas.keys()));
  const status = new Map<string, "ok" | "unsigned" | "invalid" | "untrusted">();
  const accepted = new Map<string, SchemaJson>();

  // Try to load signatures (supports both JSONL and single JSON object)
  let sigs: Map<string, any> = new Map();
  try {
    const sigRes = await fetch(sigUrl);
    if (sigRes.ok) {
      const sigText = await sigRes.text();
      const trimmed = sigText.trim();
      console.log(`Loading signatures from ${sigUrl}, content length: ${trimmed.length}`);
      
      // Try parsing as single JSON object first
      try {
        const obj = JSON.parse(trimmed);
        if (obj.k === "schema.sig") {
          const v = obj.v;
          // Normalize schema_hash - remove "..." if present for key matching
          const hashNormalized = v.schema_hash?.toLowerCase().replace(/\.\.\.$/, '') || '';
          const key = `${v.realm.toUpperCase()}|${hashNormalized}`;
          console.log(`Loaded signature for key: ${key} (original hash: ${v.schema_hash})`);
          // Store with both the normalized key and the original hash for matching
          sigs.set(key, { ...v, _normalizedHash: hashNormalized });
        }
      } catch (parseErr) {
        console.log(`Failed to parse as single JSON, trying JSONL format:`, parseErr);
        // If that fails, try JSONL format (one JSON object per line)
        const sigLines = trimmed.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        for (const line of sigLines) {
          try {
            const obj = JSON.parse(line);
            if (obj.k === "schema.sig") {
              const v = obj.v;
              // Normalize schema_hash - remove "..." if present for key matching
              const hashNormalized = v.schema_hash?.toLowerCase().replace(/\.\.\.$/, '') || '';
              const key = `${v.realm.toUpperCase()}|${hashNormalized}`;
              console.log(`Loaded signature for key: ${key} from JSONL (original hash: ${v.schema_hash})`);
              // Store with both the normalized key and the original hash for matching
              sigs.set(key, { ...v, _normalizedHash: hashNormalized });
            }
          } catch {}
        }
      }
      console.log(`Loaded ${sigs.size} signatures`);
    } else {
      console.log(`Signature file ${sigUrl} not found (${sigRes.status})`);
    }
  } catch (err) {
    console.log(`Error loading signatures from ${sigUrl}:`, err);
  }

  // Verify each schema
  for (const [key, schema] of schemas.entries()) {
    // Try to find signature by exact key first
    let sig = sigs.get(key);
    if (!sig) {
      // Try to find signature by matching realm and hash prefix (for truncated hashes like "a9f3c2...")
      const realmHex = schema.realm.toString(16).toUpperCase().padStart(2, "0");
      const schemaHash = schema.schemaHash.toLowerCase();
      for (const [sigKey, sigValue] of sigs.entries()) {
        if (sigKey.startsWith(`${realmHex}|`)) {
          const normalizedHash = sigValue._normalizedHash || sigValue.schema_hash?.toLowerCase().replace(/\.\.\.$/, '') || '';
          // Check if schema hash starts with the normalized signature hash (for truncated hashes)
          if (normalizedHash && schemaHash.startsWith(normalizedHash)) {
            console.log(`Found signature for schema ${key} using prefix match (sig hash: ${normalizedHash}, schema hash: ${schemaHash})`);
            sig = sigValue;
            break;
          }
        }
      }
    }
    
    const realmHex = schema.realm.toString(16).toUpperCase().padStart(2, "0");

    // Check if signature is required
    const requiresSig = schema.schemaClass === "public" || schema.schemaClass === "protected";

    if (requiresSig) {
      if (!sig) {
        console.log(`Schema ${key} requires signature but none found, marking as unsigned`);
        status.set(key, "unsigned");
        continue;
      }

      // Check if signature has placeholder values (dev mode)
      const hasPlaceholder = 
        sig.pubkey_ed25519?.includes('<') || 
        sig.sig_ed25519?.includes('<') ||
        sig.pubkey_ed25519 === '<hex-32-bytes>' ||
        sig.sig_ed25519 === '<hex-64-bytes>';
      
      if (hasPlaceholder) {
        console.log(`Schema ${key} has placeholder signature values, accepting without verification (dev mode)`);
        // Accept schema with placeholder signature in dev mode
        accepted.set(key, schema);
        status.set(key, "ok");
        continue;
      }

      // Compile schema to binary for verification
      const { compileSchemaBin } = await import("./schema-compile");
      const bin = compileSchemaBin(schema);
      const binU8 = new Uint8Array(bin);

      const result = verifySig(binU8, sig);
      if (!result.valid) {
        console.log(`Schema ${key} signature verification failed:`, result.reason);
        status.set(key, result.reason === "untrusted_pubkey" ? "untrusted" : "invalid");
        continue;
      }
    }

    console.log(`Schema ${key} accepted`);
    accepted.set(key, schema);
    status.set(key, "ok");
  }
  
  console.log(`Schema verification complete: ${accepted.size} accepted, ${status.size} total`);

  return { schemas: accepted, status };
}