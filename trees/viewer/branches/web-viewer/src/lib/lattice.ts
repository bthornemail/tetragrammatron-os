import { Addr8, ExecAttest, JsonlEvent, SchemaClass, inferSchemaClass, parseAddr8, schemaKey } from "./model";

import { SchemaBin } from "./schema";
import { Validation, validateAddr } from "./validate";

export type NodeRecord = {
  addr: Addr8;
  lastSeenUtc?: string;
  class: SchemaClass;
  schemaHash?: string;
  attestCount: number;
  lastStatus?: string;
  validation?: Validation;
};
export type GroupRecord = {
  key: string;          // realm|hash
  realmHex: string;
  schemaHash: string;
  class: SchemaClass;
  prefix40: string;
  nodes: NodeRecord[];
};

function maxClass(a: SchemaClass, b: SchemaClass): SchemaClass {
  const rank: Record<SchemaClass, number> = { private: 0, protected: 1, public: 2 };
  return rank[a] >= rank[b] ? a : b;
}
export function applySchemaValidation(
  nodes: NodeRecord[],
  schemaMap: Map<string, SchemaBin>
) {
  for (const n of nodes) {
    const realmHex = n.addr.bytes[0]!.toString(16).toUpperCase().padStart(2, "0");
    const hash = (n.schemaHash ?? "unknown").toLowerCase();
    const key = `${realmHex}|${hash}`;
    const schema = schemaMap.get(key) ?? null;
    n.validation = validateAddr(n.addr, schema);
  }
}
export function buildLattice(events: JsonlEvent[], atts: ExecAttest[]) {
  const nodesByAddr = new Map<string, NodeRecord>();

  // From events.jsonl: record "seen" + addr presence
  for (const e of events) {
    if (!e?.a) continue;
    const addr = parseAddr8(e.a);
    if (!addr) continue;
    const cur = nodesByAddr.get(addr.text);
    if (!cur) {
      nodesByAddr.set(addr.text, {
        addr,
        lastSeenUtc: e.t,
        class: "public",
        schemaHash: undefined,
        attestCount: 0
      });
    } else {
      if (e.t && (!cur.lastSeenUtc || e.t > cur.lastSeenUtc)) cur.lastSeenUtc = e.t;
    }
  }

  // From attestations: bind schema hash + class + status
  for (const a of atts) {
    const v = a?.v;
    const addrS = v?.addr;
    const realmS = v?.realm;
    const hash = v?.schema_hash;
    if (!addrS || !realmS || !hash) continue;
    const addr = parseAddr8(addrS);
    if (!addr) continue;
    const cls = inferSchemaClass(a);
    const cur = nodesByAddr.get(addr.text) ?? {
      addr,
      lastSeenUtc: a.t,
      class: cls,
      schemaHash: hash,
      attestCount: 0
    };
    cur.attestCount += 1;
    cur.class = maxClass(cur.class, cls);
    cur.schemaHash = hash;
    cur.lastStatus = v?.status ?? cur.lastStatus;
    if (a.t && (!cur.lastSeenUtc || a.t > cur.lastSeenUtc)) cur.lastSeenUtc = a.t;
    nodesByAddr.set(addr.text, cur);
  }

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

  const groups = [...groupsByKey.values()].sort((a, b) => {
    const ak = `${a.realmHex}|${a.schemaHash}|${a.prefix40}`;
    const bk = `${b.realmHex}|${b.schemaHash}|${b.prefix40}`;
    return ak.localeCompare(bk);
  });

  return { nodes: [...nodesByAddr.values()], groups };
}