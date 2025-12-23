import React, { useEffect, useState } from "react";
import { fetchJsonl } from "./lib/jsonl";
import { buildLattice } from "./lib/lattice";
import { JsonlEvent, ExecAttest } from "./lib/model";
import { SceneView } from "./components/SceneView";
import { Hud } from "./components/Hud";
import { fetchSchemaBin } from "./lib/schema";
import { applySchemaValidation } from "./lib/lattice";
import { fetchSchemasJsonl, fetchSchemasJsonlWithSigs } from "./lib/schema-jsonl";
import { fetchSchemaSig, verifySchemaSignatureWithTrust } from "./lib/schema-sig";
import { SchemaCompiler } from "./components/SchemaCompiler";
import { loadTrustConfig, isPubkeyTrusted, TrustConfig } from "./lib/trust-config";

const DEV_SCHEMA_JSONL = false; //true;
export default function App() {
  const [schemas, setSchemas] = useState<Map<string, any>>(new Map());
  const [events, setEvents] = useState<JsonlEvent[]>([]);
  const [atts, setAtts] = useState<ExecAttest[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [schemaStatus, setSchemaStatus] = useState<Map<string, "ok" | "unsigned" | "invalid" | "untrusted">>(new Map());
  const [trustConfig, setTrustConfig] = useState<TrustConfig | null>(null);

  useEffect(() => {
    (async () => {
      try {
        // Load trust configuration first
        const config = await loadTrustConfig();
        setTrustConfig(config);

        const [e, a] = await Promise.all([
          fetchJsonl("/data/events.jsonl"),
          fetchJsonl("/data/attestations.jsonl")
        ]);

        // Load all schema bins referenced by attestations
        let schemaMap = new Map<string, any>();
        let statusMap = new Map<string, "ok" | "unsigned" | "invalid" | "untrusted">();

        // Create trust verification function
        const verifyWithTrust = (bin: Uint8Array, sig: any) => {
          return verifySchemaSignatureWithTrust(bin, sig, (realm, pubkey) => 
            isPubkeyTrusted(config, realm, pubkey)
          );
        };

        if (DEV_SCHEMA_JSONL) {
          // Dev mode: require signatures even in JSONL
          const result = await fetchSchemasJsonlWithSigs(
            "/schemas/schema.jsonl",
            "/schemas/schema.sig.jsonl",
            verifyWithTrust
          );
          schemaMap = result.schemas;
          statusMap = result.status;
        } else {
          // Runtime BIN + SIG (signatures enforced with trust)
          for (const att of a) {
            const v = att.v;
            if (!v?.realm || !v?.schema_hash || !v?.schema_class) continue;

            const key = `${v.realm.toUpperCase()}|${v.schema_hash.toLowerCase()}`;
            if (schemaMap.has(key)) continue;

            try {
              const binRes = await fetch(`/schemas/${key}.bin`);
              if (!binRes.ok) throw new Error("bin missing");
              const binBuf = new Uint8Array(await binRes.arrayBuffer());

              const sig = await fetchSchemaSig(`/schemas/${key}.sig.json`);

              // Enforce signature policy with trust
              if (v.schema_class === "public" || v.schema_class === "protected") {
                if (!sig) {
                  statusMap.set(key, "unsigned");
                  continue; // reject schema
                }
                const result = verifyWithTrust(binBuf, sig);
                if (!result.valid) {
                  statusMap.set(key, result.reason === "untrusted_pubkey" ? "untrusted" : "invalid");
                  continue; // reject schema
                }
              }

              // Accepted
              const schema = await fetchSchemaBin(`/schemas/${key}.bin`);
              schemaMap.set(key, schema);
              statusMap.set(key, "ok");

            } catch {
              // ignore
            }
          }
        }

        setSchemas(schemaMap);
        setSchemaStatus(statusMap);

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
      <Hud nodes={nodes} groups={groups} schemaStatus={schemaStatus} trustConfig={trustConfig} />
      <SchemaCompiler schemas={schemas} />
      {err ? (
        <div style={{ color: "white", padding: 16 }}>
          Error loading JSONL: {err}
        </div>
      ) : (
        <SceneView nodes={nodes} groups={groups} schemaStatus={schemaStatus} trustConfig={trustConfig} />
      )}
      <div style={{ position: "absolute", bottom: 12, left: 12, zIndex: 10, color: "white", fontSize: 12, opacity: 0.7 }}>
        schema source: <b>{DEV_SCHEMA_JSONL ? "jsonl (dev)" : "bin (prod)"}</b>
      </div>
    </div>
  );
}
