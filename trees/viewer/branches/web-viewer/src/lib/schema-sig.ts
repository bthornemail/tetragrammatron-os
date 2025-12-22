import { hexToU8, verifyBytes } from "./crypto-ed25519";

export type SchemaSig = {
  realm: string;           // hex "1A"
  schema_hash: string;     // hex
  schema_class: "private" | "protected" | "public";
  epoch: number;
  pubkey_ed25519: string;  // hex
  sig_ed25519: string;     // hex
  abi: number;
};

export async function fetchSchemaSig(url: string): Promise<SchemaSig | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const obj = await res.json();
    if (obj?.k !== "schema.sig") return null;
    return obj.v as SchemaSig;
  } catch {
    return null;
  }
}

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