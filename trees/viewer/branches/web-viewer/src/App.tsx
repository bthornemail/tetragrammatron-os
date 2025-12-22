import React, { useEffect, useState } from "react";
import { fetchJsonl } from "./lib/jsonl";
import { buildLattice } from "./lib/lattice";
import { JsonlEvent, ExecAttest } from "./lib/model";
import { SceneView } from "./components/SceneView";
import { Hud } from "./components/Hud";
import { fetchSchemaBin } from "./lib/schema";
import { applySchemaValidation } from "./lib/lattice";
import { fetchSchemasJsonl } from "./lib/schema-jsonl";
import { fetchSchemaSig, verifySchemaSignature } from "./lib/schema-sig";
import { SchemaCompiler } from "./components/SchemaCompiler";

const DEV_SCHEMA_JSONL = true;
export default function App() {
  const [schemas, setSchemas] = useState<Map<string, any>>(new Map());
  const [events, setEvents] = useState<JsonlEvent[]>([]);
  const [atts, setAtts] = useState<ExecAttest[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [e, a] = await Promise.all([
          fetchJsonl("/data/events.jsonl"),
          fetchJsonl("/data/attestations.jsonl")
        ]);

        // Load all schema bins referenced by attestations
        let schemaMap = new Map<string, any>();
        let schemaStatus = new Map<string, "ok" | "unsigned" | "invalid">();

        if (DEV_SCHEMA_JSONL) {
          schemaMap = await fetchSchemasJsonl("/schemas/schema.jsonl");
          console.log(schemaMap)
        } else {
          // Runtime BIN + SIG (signatures enforced)
          for (const att of atts) {
            const v = att.v;
            if (!v?.realm || !v?.schema_hash || !v?.schema_class) continue;

            const key = `${v.realm.toUpperCase()}|${v.schema_hash.toLowerCase()}`;
            if (schemaMap.has(key)) continue;

            try {
              const binRes = await fetch(`/schemas/${key}.bin`);
              if (!binRes.ok) throw new Error("bin missing");
              const binBuf = new Uint8Array(await binRes.arrayBuffer());

              const sig = await fetchSchemaSig(`/schemas/${key}.sig.json`);

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

              // Accepted
              const schema = await fetchSchemaBin(`/schemas/${key}.bin`);
              schemaMap.set(key, schema);
              schemaStatus.set(key, "ok");

            } catch {
              // ignore
            }
          }
        }



        setSchemas(schemaMap);

        const built = buildLattice(e, a);
        applySchemaValidation(built.nodes, schemaMap);

        setEvents(e);
        setAtts(a);
      } catch (err: any) {
        setErr(String(err?.message ?? err));
      }
    })();
  }, []);

  const { nodes, groups } = buildLattice(events, atts);

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      <Hud nodes={nodes} groups={groups} />
      <SchemaCompiler schemas={schemas} />
      {err ? (
        <div style={{ color: "white", padding: 16 }}>
          Error loading JSONL: {err}
        </div>
      ) : (
        <SceneView nodes={nodes} groups={groups} />
      )}
      <div>schema source: <b>{DEV_SCHEMA_JSONL ? "jsonl (dev)" : "bin (prod)"}</b></div>
    </div>
  );
}