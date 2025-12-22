export type SchemaClass = "private" | "protected" | "public";

export type JsonlEvent = {
  t?: string;
  a?: string; // addr "AA:BB:.."
  k?: string;
  v?: any;
};

export type ExecAttest = {
  t?: string;
  k?: string;
  v?: {
    addr?: string;
    realm?: string;           // "1A"
    schema_hash?: string;     // hex string (32 chars for 16 bytes) OR longer
    schema_class?: SchemaClass;
    canbc_hash?: string;
    in_hash?: string;
    out_hash?: string;
    status?: string;
    node_id?: string;
  };
};

export type Addr8 = {
  bytes: number[]; // length 8
  text: string;    // "AA:.."
  realm: number;   // R0
  prefix40: string; // "AA:BB:CC:DD:EE::/40"
};

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

export function schemaKey(realmHex: string, hashHex: string) {
  return `${realmHex.toUpperCase()}|${hashHex.toLowerCase()}`;
}

export function inferSchemaClass(att: ExecAttest): SchemaClass {
  return att.v?.schema_class ?? "public";
}