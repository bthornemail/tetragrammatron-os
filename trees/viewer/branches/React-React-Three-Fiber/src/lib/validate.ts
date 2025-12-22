import { Addr8 } from "./model";
import { SchemaBin } from "./schema";

export type Validation =
  | { kind: "valid" }
  | { kind: "invalid"; reason: string }
  | { kind: "unknown-schema" };

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