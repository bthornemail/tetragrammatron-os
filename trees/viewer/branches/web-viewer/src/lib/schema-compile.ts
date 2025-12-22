import { SchemaClass } from "./model";

export type SchemaJson = {
  realm: number;
  schemaHash: string;
  schemaClass: SchemaClass;
  epoch: number;
  allowedPrefixes: string[];
};

function classToByte(cls: SchemaClass): number {
  if (cls === "private") return 0;
  if (cls === "protected") return 1;
  return 2;
}

function parsePrefix40(p: string): Uint8Array {
  // "AA:BB:CC:DD:EE::/40"
  const parts = p.split("::")[0].split(":");
  if (parts.length !== 5) throw new Error(`invalid prefix40: ${p}`);
  const out = new Uint8Array(5);
  parts.forEach((x, i) => {
    const v = parseInt(x, 16);
    if (Number.isNaN(v) || v < 0 || v > 255)
      throw new Error(`invalid byte ${x} in ${p}`);
    out[i] = v;
  });
  return out;
}

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