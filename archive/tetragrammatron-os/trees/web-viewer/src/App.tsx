import React, { useEffect, useState } from "react";
import { fetchJsonl } from "./lib/jsonl";
import { buildLattice } from "./lib/lattice";
import { JsonlEvent, ExecAttest } from "./lib/model";
import { SceneView } from "./components/SceneView";
import { fetchSchemaBin } from "./lib/schema";
import { applySchemaValidation } from "./lib/lattice";
import { fetchSchemasJsonl, fetchSchemasJsonlWithSigs } from "./lib/schema-jsonl";
import { fetchSchemaSig, verifySchemaSignatureWithTrust } from "./lib/schema-sig";
import { SchemaCompiler } from "./components/SchemaCompiler";
import { loadTrustConfig, isPubkeyTrusted, TrustConfig } from "./lib/trust-config";
import { getWebSocketClient, WebSocketStatus } from "./lib/websocket";
import { getMqttClient, MqttStatus } from "./lib/mqtt";
import { Esp32TelemetryData, createTelemetryData, updateTelemetryData } from "./lib/esp32-telemetry";
import { waitForProbeInit } from "./lib/config";
import { Dashboard } from "./components/Dashboard";

const DEV_SCHEMA_JSONL = false; //true;
export default function App() {
  const [schemas, setSchemas] = useState<Map<string, any>>(new Map());
  const [events, setEvents] = useState<JsonlEvent[]>([]);
  const [atts, setAtts] = useState<ExecAttest[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [schemaStatus, setSchemaStatus] = useState<Map<string, "ok" | "unsigned" | "invalid" | "untrusted">>(new Map());
  const [trustConfig, setTrustConfig] = useState<TrustConfig | null>(null);
  const [wsStatus, setWsStatus] = useState<WebSocketStatus>("disconnected");
  const [mqttStatus, setMqttStatus] = useState<MqttStatus>("disconnected");
  const [telemetry, setTelemetry] = useState<Esp32TelemetryData | null>(null);

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
          // Check if .bin files exist and are valid by trying to load the first schema
          let useBinFiles = false;
          if (a.length > 0) {
            const firstAtt = a[0];
            const v = firstAtt.v;
            if (v?.realm && v?.schema_hash) {
              const testKey = `${v.realm.toUpperCase()}|${v.schema_hash.toLowerCase()}`;
              try {
                const testRes = await fetch(`/schemas/${testKey}.bin`);
                if (testRes.ok) {
                  // Try to actually parse it to verify it's valid
                  const testBin = await fetchSchemaBin(`/schemas/${testKey}.bin`);
                  if (testBin) {
                    useBinFiles = true;
                  }
                }
              } catch {
                // .bin files don't exist or are invalid, will use JSONL
                console.log("No valid .bin files found, will use JSONL");
              }
            }
          }

          if (useBinFiles) {
            // Load from .bin files
            let binLoadSuccess = false;
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
                const schemaBin = await fetchSchemaBin(`/schemas/${key}.bin`);
                // Convert SchemaBin to SchemaJson by adding schemaHash from key
                // SchemaCompiler expects SchemaJson which includes schemaHash
                const schemaJson = {
                  realm: schemaBin.realm,
                  schemaHash: v.schema_hash.toLowerCase(),
                  schemaClass: schemaBin.schemaClass,
                  epoch: schemaBin.epoch,
                  allowedPrefixes: schemaBin.allowedPrefixes
                };
                schemaMap.set(key, schemaJson);
                statusMap.set(key, "ok");
                binLoadSuccess = true;

              } catch (err) {
                console.warn(`Failed to load schema ${key} from .bin:`, err);
                // If any .bin file fails, fall back to JSONL
                useBinFiles = false;
                break;
              }
            }
            
            // If no schemas were successfully loaded from .bin files, fall back to JSONL
            if (!binLoadSuccess || schemaMap.size === 0) {
              useBinFiles = false;
            }
          }
          
          if (!useBinFiles) {
            // Fallback to JSONL if .bin files don't exist
            console.log("No .bin files found, loading schemas from JSONL");
            try {
              // Try .sig.jsonl first, fallback to .sig.json
              let sigUrl = "/schemas/schema.sig.jsonl";
              try {
                const testSig = await fetch(sigUrl);
                if (!testSig.ok) {
                  sigUrl = "/schemas/schema.sig.json";
                }
              } catch {
                sigUrl = "/schemas/schema.sig.json";
              }
              
              const jsonlResult = await fetchSchemasJsonlWithSigs(
                "/schemas/schema.jsonl",
                sigUrl,
                verifyWithTrust
              );
              console.log(`Loaded ${jsonlResult.schemas.size} schemas from JSONL, status map size: ${jsonlResult.status.size}`);
              console.log("Schema keys:", Array.from(jsonlResult.schemas.keys()));
              console.log("Status entries:", Array.from(jsonlResult.status.entries()));
              schemaMap = jsonlResult.schemas;
              statusMap = jsonlResult.status;
            } catch (jsonlErr) {
              console.error(`Failed to load schemas from JSONL:`, jsonlErr);
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

  // Combined telemetry state (merged from WebSocket and MQTT)
  const [combinedTelemetry, setCombinedTelemetry] = useState<Esp32TelemetryData>(createTelemetryData());

  // WebSocket connection for real-time ESP32 telemetry
  useEffect(() => {
    let unsubscribeStatus: (() => void) | null = null;
    let unsubscribeEvent: (() => void) | null = null;
    
    (async () => {
      // Wait for probe-based config to initialize
      await waitForProbeInit();
      
      const wsClient = getWebSocketClient();
      
      // Subscribe to status changes
      unsubscribeStatus = wsClient.onStatusChange((status) => {
        setWsStatus(status);
      });
      
      // Subscribe to events and merge into combined telemetry
      unsubscribeEvent = wsClient.onEvent((event) => {
        setCombinedTelemetry(prev => {
          const updated = { ...prev };
          updateTelemetryData(updated, event);
          return updated;
        });
      });
      
      // Initial telemetry state
      setCombinedTelemetry({ ...wsClient.telemetry });
      
      // Connect if not already connected
      if (wsStatus === "disconnected") {
        wsClient.connect();
      }
    })();
    
    return () => {
      if (unsubscribeStatus) unsubscribeStatus();
      if (unsubscribeEvent) unsubscribeEvent();
      // Don't disconnect on unmount - keep connection alive
    };
  }, []);

  // MQTT connection for real-time ESP32 telemetry
  useEffect(() => {
    let unsubscribeStatus: (() => void) | null = null;
    let unsubscribeEvent: (() => void) | null = null;
    
    (async () => {
      // Wait for probe-based config to initialize
      await waitForProbeInit();
      
      const mqttClient = getMqttClient();
    
      // Subscribe to status changes
      unsubscribeStatus = mqttClient.onStatusChange((status) => {
        setMqttStatus(status);
      });
      
      // Subscribe to events and merge into combined telemetry
      unsubscribeEvent = mqttClient.onEvent((event) => {
        setCombinedTelemetry(prev => {
          const updated = { ...prev };
          updateTelemetryData(updated, event);
          return updated;
        });
      });
      
      // Initial telemetry state
      setCombinedTelemetry(prev => {
        const updated = { ...prev };
        // Merge MQTT telemetry stats
        updated.stats.totalExecutions += mqttClient.telemetry.stats.totalExecutions;
        updated.stats.totalSteps += mqttClient.telemetry.stats.totalSteps;
        updated.stats.totalTicks += mqttClient.telemetry.stats.totalTicks;
        updated.stats.errorCount += mqttClient.telemetry.stats.errorCount;
        updated.stats.schemaViolations += mqttClient.telemetry.stats.schemaViolations;
        updated.stats.inputErrors += mqttClient.telemetry.stats.inputErrors;
        return updated;
      });
      
      // Connect if not already connected
      if (mqttStatus === "disconnected") {
        mqttClient.connect();
      }
    })();
    
    return () => {
      if (unsubscribeStatus) unsubscribeStatus();
      if (unsubscribeEvent) unsubscribeEvent();
      // Don't disconnect on unmount - keep connection alive
    };
  }, []);

  // Update telemetry state for components
  useEffect(() => {
    setTelemetry(combinedTelemetry);
  }, [combinedTelemetry]);

  const { nodes, groups } = buildLattice(events, atts);

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      <Dashboard
        nodes={nodes}
        groups={groups}
        schemaStatus={schemaStatus}
        trustConfig={trustConfig}
        telemetry={telemetry}
        wsStatus={wsStatus}
        mqttStatus={mqttStatus}
        mqttDeviceCount={getMqttClient().connectedDevices.size}
        mqttMessageCount={getMqttClient().messageCount}
      />
      <SchemaCompiler schemas={schemas} />
      {err ? (
        <div style={{ color: "white", padding: 16 }}>
          Error loading JSONL: {err}
        </div>
      ) : (
        <SceneView 
          nodes={nodes} 
          groups={groups} 
          schemaStatus={schemaStatus} 
          trustConfig={trustConfig}
          telemetry={telemetry}
        />
      )}
      <div style={{ position: "absolute", bottom: 12, left: 12, zIndex: 10, color: "white", fontSize: 12, opacity: 0.7 }}>
        schema source: <b>{DEV_SCHEMA_JSONL ? "jsonl (dev)" : "bin (prod)"}</b>
        {telemetry && (
          <span style={{ display: "block", marginTop: 2 }}>
            ESP32 telemetry: WS({wsStatus}){mqttStatus && ` MQTT(${mqttStatus})`}
          </span>
        )}
      </div>
    </div>
  );
}
