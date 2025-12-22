import React, { useEffect, useState } from "react";
import { fetchJsonl } from "./lib/jsonl";
import { buildLattice } from "./lib/lattice";
import { JsonlEvent, ExecAttest } from "./lib/model";
import { SceneView } from "./components/SceneView";
import { Hud } from "./components/Hud";
import { fetchSchemaBin } from "./lib/schema";
import { applySchemaValidation } from "./lib/lattice";
import { fetchSchemasJsonl } from "./lib/schema-jsonl";

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

        if (DEV_SCHEMA_JSONL) {
          schemaMap = await fetchSchemasJsonl("/schemas/schema.jsonl");
        } else {
          for (const att of a) {
            const v = att.v;
            if (!v?.realm || !v?.schema_hash) continue;
            const key = `${v.realm.toUpperCase()}|${v.schema_hash.toLowerCase()}`;
            if (schemaMap.has(key)) continue;
            try {
              const bin = await fetchSchemaBin(`/schemas/${key}.bin`);
              schemaMap.set(key, bin);
            } catch {
              // missing schema is OK (unknown-schema)
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