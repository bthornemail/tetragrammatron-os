import { SchemaClass } from "./model";

export type SchemaBin = {
  realm: number;
  schemaClass: SchemaClass;
  epoch: number;
  allowedPrefixes: string[]; // "AA:BB:CC:DD:EE::/40"
};

function bytesToPrefix40(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).toUpperCase().padStart(2, "0"))
    .join(":") + "::/40";
}

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