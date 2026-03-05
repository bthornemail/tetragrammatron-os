import React, { useState, useEffect } from "react";
import { getMqttClient } from "../../lib/mqtt";
import { sendCanbcCommand, validateAddress, validatePayload, formatAddress, type CanbcCommand } from "../../lib/mqtt-commands";

interface CommandsTabProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

interface CommandHistory {
  command: CanbcCommand;
  timestamp: number;
  success: boolean;
  error?: string;
}

export function CommandsTab({ collapsed, onToggleCollapse }: CommandsTabProps) {
  const [deviceId, setDeviceId] = useState("");
  const [address, setAddress] = useState("");
  const [payload, setPayload] = useState("");
  const [history, setHistory] = useState<CommandHistory[]>([]);
  const [sending, setSending] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [payloadError, setPayloadError] = useState<string | null>(null);

  const mqttClient = getMqttClient();
  const [connectedDevices, setConnectedDevices] = useState<string[]>([]);

  useEffect(() => {
    const updateDevices = () => {
      setConnectedDevices(Array.from(mqttClient.connectedDevices));
    };
    const unsubscribe = mqttClient.onDeviceConnected(() => {
      updateDevices();
    });
    updateDevices();
    return unsubscribe;
  }, [mqttClient]);

  useEffect(() => {
    if (address.length === 0) {
      setAddressError(null);
      return;
    }
    const validation = validateAddress(address);
    setAddressError(validation.valid ? null : (validation.error || null));
  }, [address]);

  useEffect(() => {
    if (payload.length === 0) {
      setPayloadError(null);
      return;
    }
    const validation = validatePayload(payload);
    setPayloadError(validation.valid ? null : (validation.error || null));
  }, [payload]);

  const handleSend = async () => {
    if (!deviceId.trim()) {
      alert("Please enter a device ID");
      return;
    }
    const addrValidation = validateAddress(address);
    if (!addrValidation.valid) {
      setAddressError(addrValidation.error || null);
      return;
    }
    const payloadValidation = validatePayload(payload);
    if (!payloadValidation.valid) {
      setPayloadError(payloadValidation.error || null);
      return;
    }

    setSending(true);
    const command: CanbcCommand = { deviceId: deviceId.trim(), address, payload };
    const result = await sendCanbcCommand(command);
    const historyEntry: CommandHistory = { command, timestamp: Date.now(), success: result.success, error: result.error };
    setHistory(prev => [historyEntry, ...prev].slice(0, 20));
    setSending(false);
    if (result.success) {
      setAddress("");
      setPayload("");
    }
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
        <div style={{ fontSize: 13, fontWeight: 500 }}>Commands</div>
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
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", marginBottom: 4, fontSize: 12, opacity: 0.9 }}>
              Device ID {connectedDevices.length > 0 && `(${connectedDevices.length} connected)`}
            </label>
            {connectedDevices.length > 0 && (
              <select
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
                style={{
                  width: "100%",
                  padding: "6px 8px",
                  background: "rgba(255,255,255,0.1)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: 6,
                  color: "white",
                  fontSize: 12,
                  marginBottom: 8
                }}
              >
                <option value="">Select device...</option>
                {connectedDevices.map(dev => (
                  <option key={dev} value={dev}>{dev}</option>
                ))}
              </select>
            )}
            <input
              type="text"
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
              placeholder="esp32-aabbccddeeff"
              style={{
                width: "100%",
                padding: "6px 8px",
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: 6,
                color: "white",
                fontSize: 12
              }}
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", marginBottom: 4, fontSize: 12, opacity: 0.9 }}>
              Address (8 bytes, hex)
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="1A020403027F11C7"
              style={{
                width: "100%",
                padding: "6px 8px",
                background: "rgba(255,255,255,0.1)",
                border: addressError ? "1px solid #ff6b6b" : "1px solid rgba(255,255,255,0.2)",
                borderRadius: 6,
                color: "white",
                fontSize: 12
              }}
            />
            {addressError && (
              <div style={{ color: "#ff6b6b", fontSize: 10, marginTop: 4 }}>{addressError}</div>
            )}
            {address && !addressError && (
              <div style={{ color: "#51cf66", fontSize: 10, marginTop: 4 }}>
                {formatAddress(address)}
              </div>
            )}
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", marginBottom: 4, fontSize: 12, opacity: 0.9 }}>
              Payload (CANBC bytecode, hex)
            </label>
            <textarea
              value={payload}
              onChange={(e) => setPayload(e.target.value)}
              placeholder="0001 (NOP, HALT)"
              rows={2}
              style={{
                width: "100%",
                padding: "6px 8px",
                background: "rgba(255,255,255,0.1)",
                border: payloadError ? "1px solid #ff6b6b" : "1px solid rgba(255,255,255,0.2)",
                borderRadius: 6,
                color: "white",
                fontSize: 12,
                fontFamily: "monospace",
                resize: "vertical"
              }}
            />
            {payloadError && (
              <div style={{ color: "#ff6b6b", fontSize: 10, marginTop: 4 }}>{payloadError}</div>
            )}
            {payload && !payloadError && (
              <div style={{ color: "#51cf66", fontSize: 10, marginTop: 4 }}>
                {payload.replace(/[:\s-]/g, '').length / 2} byte(s)
              </div>
            )}
          </div>

          <button
            onClick={handleSend}
            disabled={sending || !deviceId.trim() || !!addressError || !!payloadError}
            style={{
              width: "100%",
              padding: "8px 16px",
              background: sending || !deviceId.trim() || !!addressError || !!payloadError
                ? "rgba(255,255,255,0.2)"
                : "rgba(77, 171, 247, 0.8)",
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: sending || !deviceId.trim() || !!addressError || !!payloadError ? "not-allowed" : "pointer",
              fontSize: 12,
              fontWeight: 500,
              marginBottom: 12
            }}
          >
            {sending ? "Sending..." : "Send Command"}
          </button>

          {history.length > 0 && (
            <div>
              <div style={{ fontSize: 11, opacity: 0.9, marginBottom: 6 }}>Recent Commands:</div>
              <div style={{ maxHeight: 150, overflow: "auto" }}>
                {history.map((entry, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "4px 6px",
                      background: entry.success ? "rgba(81, 207, 102, 0.2)" : "rgba(255, 107, 107, 0.2)",
                      borderRadius: 4,
                      marginBottom: 4,
                      fontSize: 10
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                      <span style={{ fontWeight: 500 }}>{entry.command.deviceId}</span>
                      <span style={{ opacity: 0.7, fontSize: 9 }}>
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div style={{ fontFamily: "monospace", fontSize: 9, opacity: 0.9 }}>
                      {formatAddress(entry.command.address)} → {entry.command.payload.slice(0, 16)}
                      {entry.command.payload.length > 16 ? "..." : ""}
                    </div>
                    {entry.error && (
                      <div style={{ color: "#ff6b6b", fontSize: 9, marginTop: 2 }}>{entry.error}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

