import React from "react";
import { WebSocketStatus } from "../../lib/websocket";
import { MqttStatus } from "../../lib/mqtt";
import { getMqttClient } from "../../lib/mqtt";
import { getWebSocketClient } from "../../lib/websocket";
import { getConfig } from "../../lib/config";

interface ConnectionsTabProps {
  wsStatus?: WebSocketStatus;
  mqttStatus?: MqttStatus;
  mqttDeviceCount?: number;
  mqttMessageCount?: number;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function ConnectionsTab({ wsStatus, mqttStatus, mqttDeviceCount, mqttMessageCount, collapsed, onToggleCollapse }: ConnectionsTabProps) {
  const config = getConfig();
  const mqttClient = getMqttClient();
  const wsClient = getWebSocketClient();

  const statusColor = (status: string | undefined) => {
    if (status === "connected") return "#51cf66";
    if (status === "connecting") return "#ffa94d";
    return "#ff6b6b";
  };

  return (
    <div>
      <div
        onClick={onToggleCollapse}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "8px 0",
          cursor: "pointer",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          marginBottom: collapsed ? 0 : 8
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 500 }}>Connections</div>
        <button
          style={{
            background: "transparent",
            border: "none",
            color: "white",
            cursor: "pointer",
            fontSize: 14,
            padding: 0,
            width: 20
          }}
        >
          {collapsed ? "▶" : "▼"}
        </button>
      </div>

      {!collapsed && (
        <div style={{ paddingLeft: 8 }}>
          {/* WebSocket Connection */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 4 }}>WebSocket (UART Bridge):</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: statusColor(wsStatus)
              }} />
              <div>status: <b style={{ color: statusColor(wsStatus) }}>{wsStatus || "unknown"}</b></div>
            </div>
            <div style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>
              URL: <code>{config.websocketUrl}</code>
            </div>
          </div>

          {/* MQTT Connection */}
          <div style={{ marginBottom: 8, paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.1)" }}>
            <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 4 }}>MQTT (WiFi):</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: statusColor(mqttStatus)
              }} />
              <div>status: <b style={{ color: statusColor(mqttStatus) }}>{mqttStatus || "unknown"}</b></div>
            </div>
            <div style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>
              Broker: <code>{config.mqttBrokerHost}:{config.mqttBrokerPort}</code>
            </div>
            {mqttDeviceCount !== undefined && (
              <div style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>
                devices: <b>{mqttDeviceCount}</b>
              </div>
            )}
            {mqttMessageCount !== undefined && (
              <div style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>
                messages: <b>{mqttMessageCount}</b>
              </div>
            )}
          </div>

          {/* Connected Devices */}
          {mqttClient.connectedDevices.size > 0 && (
            <div style={{ marginBottom: 8, paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.1)" }}>
              <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 4 }}>Connected Devices:</div>
              {Array.from(mqttClient.connectedDevices).map(deviceId => (
                <div key={deviceId} style={{ fontSize: 11, padding: "4px 6px", background: "rgba(77,171,247,0.1)", borderRadius: 4, marginBottom: 4 }}>
                  <div style={{ fontFamily: "monospace" }}>{deviceId}</div>
                </div>
              ))}
            </div>
          )}

          {/* Connection Statistics */}
          <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.1)", fontSize: 11, opacity: 0.7 }}>
            <div>WebSocket enabled: {config.enableRealtime ? "yes" : "no"}</div>
            <div>MQTT enabled: {config.mqttEnabled ? "yes" : "no"}</div>
          </div>
        </div>
      )}
    </div>
  );
}

