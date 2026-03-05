import React from "react";
import { GroupRecord, NodeRecord } from "../lib/lattice";
import { TrustConfig } from "../lib/trust-config";
import { Esp32TelemetryData } from "../lib/esp32-telemetry";
import { WebSocketStatus } from "../lib/websocket";
import { MqttStatus } from "../lib/mqtt";

export function Hud({ 
  nodes, 
  groups, 
  schemaStatus,
  trustConfig,
  telemetry,
  wsStatus,
  mqttStatus,
  mqttDeviceCount,
  mqttMessageCount
}: { 
  nodes: NodeRecord[]; 
  groups: GroupRecord[];
  schemaStatus?: Map<string, "ok" | "unsigned" | "invalid" | "untrusted">;
  trustConfig?: TrustConfig | null;
  telemetry?: Esp32TelemetryData | null;
  wsStatus?: WebSocketStatus;
  mqttStatus?: MqttStatus;
  mqttDeviceCount?: number;
  mqttMessageCount?: number;
}) {
  const byClass = (cls: string) => groups.filter(g => g.class === cls).length;
  const unknownSchema = groups.filter(g => g.schemaHash === "unknown").length;
  const invalid = nodes.filter(n => n.validation?.kind === "invalid").length;
  const unknown = nodes.filter(n => n.validation?.kind === "unknown-schema").length;
  
  const unsigned = schemaStatus ? [...schemaStatus.values()].filter(s => s === "unsigned").length : 0;
  const invalidSig = schemaStatus ? [...schemaStatus.values()].filter(s => s === "invalid").length : 0;
  const untrusted = schemaStatus ? [...schemaStatus.values()].filter(s => s === "untrusted").length : 0;
  const trustedCount = schemaStatus ? [...schemaStatus.values()].filter(s => s === "ok").length : 0;
  return (
    <div style={{
      position: "absolute", top: 12, left: 12, zIndex: 10,
      background: "rgba(0,0,0,0.6)", color: "white",
      padding: "10px 12px", borderRadius: 10, width: 320,
      fontFamily: "system-ui, sans-serif", fontSize: 13
    }}>
      <div style={{ fontSize: 14, marginBottom: 6 }}><b>Tetragrammatron Web Viewer</b></div>
      <div>nodes: <b>{nodes.length}</b></div>
      <div>groups: <b>{groups.length}</b></div>
      <div style={{ marginTop: 6 }}>
        <div>valid nodes: <b>{nodes.length - invalid - unknown}</b></div>
        <div style={{ color: "#ff6b6b" }}>invalid nodes: <b>{invalid}</b></div>
        <div style={{ color: "#ffa94d" }}>unknown schema: <b>{unknown}</b></div>
      </div>
      <div style={{ marginTop: 6 }}>
        <div>public planes: <b>{byClass("public")}</b></div>
        <div>protected linesets: <b>{byClass("protected")}</b></div>
        <div>private pointsets: <b>{byClass("private")}</b></div>
      </div>
      <div style={{ marginTop: 6 }}>
        <div>unknown schema groups: <b>{unknownSchema}</b></div>
      </div>
      {schemaStatus && (
        <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.2)" }}>
          <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 4 }}>Trust Status:</div>
          <div style={{ color: "#51cf66" }}>trusted schemas: <b>{trustedCount}</b></div>
          <div style={{ color: "#ffa94d" }}>unsigned rejected: <b>{unsigned}</b></div>
          <div style={{ color: "#ff6b6b" }}>invalid signature: <b>{invalidSig}</b></div>
          <div style={{ color: "#ff8787" }}>untrusted pubkey: <b>{untrusted}</b></div>
        </div>
      )}
      {trustConfig && trustConfig.trustedPubkeys.size > 0 && (
        <div style={{ marginTop: 6, fontSize: 11, opacity: 0.7 }}>
          Trust config: {trustConfig.trustedPubkeys.size} realm(s) with pinned pubkeys
        </div>
      )}
      {telemetry && (
        <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.2)" }}>
          <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 4 }}>
            CAN VM Execution:
            {wsStatus && (
              <span style={{ 
                marginLeft: 8, 
                fontSize: 10,
                color: wsStatus === "connected" ? "#51cf66" : wsStatus === "connecting" ? "#ffa94d" : "#ff6b6b"
              }}>
                WS({wsStatus})
              </span>
            )}
            {mqttStatus && (
              <span style={{ 
                marginLeft: 4, 
                fontSize: 10,
                color: mqttStatus === "connected" ? "#51cf66" : mqttStatus === "connecting" ? "#ffa94d" : "#ff6b6b"
              }}>
                MQTT({mqttStatus})
              </span>
            )}
          </div>
          <div>active executions: <b>{telemetry.executions.size}</b></div>
          <div>total executions: <b>{telemetry.stats.totalExecutions}</b></div>
          <div>total steps: <b>{telemetry.stats.totalSteps.toLocaleString()}</b></div>
          <div>total ticks: <b>{telemetry.stats.totalTicks.toLocaleString()}</b></div>
          {telemetry.completedExecutions.length > 0 && (
            <div style={{ marginTop: 4, fontSize: 11, opacity: 0.8 }}>
              last status: <b>{telemetry.completedExecutions[telemetry.completedExecutions.length - 1]?.status || "unknown"}</b>
            </div>
          )}
          {(telemetry.stats.errorCount > 0 || telemetry.errors.length > 0) && (
            <div style={{ marginTop: 4 }}>
              <div style={{ color: "#ff6b6b" }}>errors: <b>{telemetry.stats.errorCount}</b></div>
              <div style={{ color: "#ffa94d", fontSize: 11 }}>schema violations: <b>{telemetry.stats.schemaViolations}</b></div>
              <div style={{ color: "#ffa94d", fontSize: 11 }}>input errors: <b>{telemetry.stats.inputErrors}</b></div>
              {telemetry.errors.length > 0 && (
                <div style={{ marginTop: 4, fontSize: 10, opacity: 0.7, maxHeight: 60, overflow: "auto" }}>
                  {telemetry.errors.slice(-3).map((err, i) => (
                    <div key={i} style={{ marginTop: 2 }}>
                      {err.kind}: {err.msg}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
      {mqttStatus && (
        <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.2)" }}>
          <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 4 }}>
            MQTT:
            <span style={{ 
              marginLeft: 8, 
              fontSize: 10,
              color: mqttStatus === "connected" ? "#51cf66" : mqttStatus === "connecting" ? "#ffa94d" : "#ff6b6b"
            }}>
              {mqttStatus}
            </span>
          </div>
          {mqttDeviceCount !== undefined && (
            <div>devices: <b>{mqttDeviceCount}</b></div>
          )}
          {mqttMessageCount !== undefined && (
            <div>messages: <b>{mqttMessageCount}</b></div>
          )}
        </div>
      )}
      <div style={{ marginTop: 10, opacity: 0.85, fontSize: 11 }}>
        Data: <code>/public/data/events.jsonl</code> and <code>/public/data/attestations.jsonl</code>
        {telemetry && <span style={{ display: "block", marginTop: 2 }}>+ real-time ESP32 telemetry</span>}
      </div>
    </div>
  );
}