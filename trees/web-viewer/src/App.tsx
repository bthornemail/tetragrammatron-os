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
import { getWebSocketClient, WebSocketStatus } from "./lib/websocket";
import { getMqttClient, MqttStatus } from "./lib/mqtt";
import { Esp32TelemetryData, createTelemetryData, updateTelemetryData } from "./lib/esp32-telemetry";
import { CommandSender } from "./components/CommandSender";

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

  // Combined telemetry state (merged from WebSocket and MQTT)
  const [combinedTelemetry, setCombinedTelemetry] = useState<Esp32TelemetryData>(createTelemetryData());

  // WebSocket connection for real-time ESP32 telemetry
  useEffect(() => {
    const wsClient = getWebSocketClient();
    
    // Subscribe to status changes
    const unsubscribeStatus = wsClient.onStatusChange((status) => {
      setWsStatus(status);
    });
    
    // Subscribe to events and merge into combined telemetry
    const unsubscribeEvent = wsClient.onEvent((event) => {
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
    
    return () => {
      unsubscribeStatus();
      unsubscribeEvent();
      // Don't disconnect on unmount - keep connection alive
    };
  }, []);

  // MQTT connection for real-time ESP32 telemetry
  useEffect(() => {
    const mqttClient = getMqttClient();
    
    // Subscribe to status changes
    const unsubscribeStatus = mqttClient.onStatusChange((status) => {
      setMqttStatus(status);
    });
    
    // Subscribe to events and merge into combined telemetry
    const unsubscribeEvent = mqttClient.onEvent((event) => {
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
    
    return () => {
      unsubscribeStatus();
      unsubscribeEvent();
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
      <Hud 
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
      <CommandSender />
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
