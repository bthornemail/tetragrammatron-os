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
  const lines = text.split(/\r?/).map(l => l.trim()).filter(Boolean);
  console.log(lines)
  
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