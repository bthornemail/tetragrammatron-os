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

  const map = new Map<string, SchemaJson>();
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  
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

  return map;
}

// Load schemas from JSONL with signature verification
export async function fetchSchemasJsonlWithSigs(
  url: string,
  sigUrl: string,
  verifySig: (bin: Uint8Array, sig: any) => { valid: boolean; reason?: string }
): Promise<{ schemas: Map<string, SchemaJson>; status: Map<string, "ok" | "unsigned" | "invalid" | "untrusted"> }> {
  const schemas = await fetchSchemasJsonl(url);
  const status = new Map<string, "ok" | "unsigned" | "invalid" | "untrusted">();
  const accepted = new Map<string, SchemaJson>();

  // Try to load signatures
  let sigs: Map<string, any> = new Map();
  try {
    const sigRes = await fetch(sigUrl);
    if (sigRes.ok) {
      const sigText = await sigRes.text();
      const sigLines = sigText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      for (const line of sigLines) {
        try {
          const obj = JSON.parse(line);
          if (obj.k === "schema.sig") {
            const v = obj.v;
            const key = `${v.realm.toUpperCase()}|${v.schema_hash.toLowerCase()}`;
            sigs.set(key, v);
          }
        } catch {}
      }
    }
  } catch {}

  // Verify each schema
  for (const [key, schema] of schemas.entries()) {
    const sig = sigs.get(key);
    const realmHex = schema.realm.toString(16).toUpperCase().padStart(2, "0");

    // Check if signature is required
    const requiresSig = schema.schemaClass === "public" || schema.schemaClass === "protected";

    if (requiresSig) {
      if (!sig) {
        status.set(key, "unsigned");
        continue;
      }

      // Compile schema to binary for verification
      const { compileSchemaBin } = await import("./schema-compile");
      const bin = compileSchemaBin(schema);
      const binU8 = new Uint8Array(bin);

      const result = verifySig(binU8, sig);
      if (!result.valid) {
        status.set(key, result.reason === "untrusted_pubkey" ? "untrusted" : "invalid");
        continue;
      }
    }

    accepted.set(key, schema);
    status.set(key, "ok");
  }

  return { schemas: accepted, status };
}