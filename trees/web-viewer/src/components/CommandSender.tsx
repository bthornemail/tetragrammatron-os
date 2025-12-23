import React, { useState, useEffect } from "react";
import { getMqttClient } from "../lib/mqtt";
import { sendCanbcCommand, validateAddress, validatePayload, formatAddress, type CanbcCommand } from "../lib/mqtt-commands";

interface CommandHistory {
  command: CanbcCommand;
  timestamp: number;
  success: boolean;
  error?: string;
}

export function CommandSender() {
  const [deviceId, setDeviceId] = useState("");
  const [address, setAddress] = useState("");
  const [payload, setPayload] = useState("");
  const [history, setHistory] = useState<CommandHistory[]>([]);
  const [sending, setSending] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [payloadError, setPayloadError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const mqttClient = getMqttClient();

  // Get connected devices
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

  // Validate address on change
  useEffect(() => {
    if (address.length === 0) {
      setAddressError(null);
      return;
    }

    const validation = validateAddress(address);
    if (!validation.valid) {
      setAddressError(validation.error || null);
    } else {
      setAddressError(null);
    }
  }, [address]);

  // Validate payload on change
  useEffect(() => {
    if (payload.length === 0) {
      setPayloadError(null);
      return;
    }

    const validation = validatePayload(payload);
    if (!validation.valid) {
      setPayloadError(validation.error || null);
    } else {
      setPayloadError(null);
    }
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

    const command: CanbcCommand = {
      deviceId: deviceId.trim(),
      address,
      payload
    };

    const result = await sendCanbcCommand(command);

    const historyEntry: CommandHistory = {
      command,
      timestamp: Date.now(),
      success: result.success,
      error: result.error
    };

    setHistory(prev => [historyEntry, ...prev].slice(0, 20)); // Keep last 20
    setSending(false);

    if (result.success) {
      // Clear form on success
      setAddress("");
      setPayload("");
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: "absolute",
          bottom: 12,
          right: 12,
          zIndex: 10,
          padding: "8px 16px",
          background: "rgba(77, 171, 247, 0.8)",
          color: "white",
          border: "none",
          borderRadius: 8,
          cursor: "pointer",
          fontSize: 13,
          fontWeight: 500
        }}
      >
        Send CANBC Command
      </button>
    );
  }

  return (
    <div style={{
      position: "absolute",
      bottom: 12,
      right: 12,
      zIndex: 10,
      width: 400,
      maxHeight: "80vh",
      background: "rgba(0, 0, 0, 0.85)",
      color: "white",
      padding: "16px",
      borderRadius: 10,
      fontFamily: "system-ui, sans-serif",
      fontSize: 13,
      overflow: "auto"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontSize: 14, fontWeight: "bold" }}>Send CANBC Command</div>
        <button
          onClick={() => setIsOpen(false)}
          style={{
            background: "transparent",
            border: "none",
            color: "white",
            cursor: "pointer",
            fontSize: 18,
            padding: 0,
            width: 24,
            height: 24
          }}
        >
          ×
        </button>
      </div>

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
              fontSize: 13,
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
            fontSize: 13
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
          placeholder="1A020403027F11C7 or 1A:02:04:03:02:7F:11:C7"
          style={{
            width: "100%",
            padding: "6px 8px",
            background: "rgba(255,255,255,0.1)",
            border: addressError ? "1px solid #ff6b6b" : "1px solid rgba(255,255,255,0.2)",
            borderRadius: 6,
            color: "white",
            fontSize: 13
          }}
        />
        {addressError && (
          <div style={{ color: "#ff6b6b", fontSize: 11, marginTop: 4 }}>{addressError}</div>
        )}
        {address && !addressError && (
          <div style={{ color: "#51cf66", fontSize: 11, marginTop: 4 }}>
            Formatted: {formatAddress(address)}
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
          rows={3}
          style={{
            width: "100%",
            padding: "6px 8px",
            background: "rgba(255,255,255,0.1)",
            border: payloadError ? "1px solid #ff6b6b" : "1px solid rgba(255,255,255,0.2)",
            borderRadius: 6,
            color: "white",
            fontSize: 13,
            fontFamily: "monospace",
            resize: "vertical"
          }}
        />
        {payloadError && (
          <div style={{ color: "#ff6b6b", fontSize: 11, marginTop: 4 }}>{payloadError}</div>
        )}
        {payload && !payloadError && (
          <div style={{ color: "#51cf66", fontSize: 11, marginTop: 4 }}>
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
          fontSize: 13,
          fontWeight: 500,
          marginBottom: 12
        }}
      >
        {sending ? "Sending..." : "Send Command"}
      </button>

      {history.length > 0 && (
        <div>
          <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 8 }}>Recent Commands:</div>
          <div style={{ maxHeight: 200, overflow: "auto" }}>
            {history.map((entry, i) => (
              <div
                key={i}
                style={{
                  padding: "6px 8px",
                  background: entry.success ? "rgba(81, 207, 102, 0.2)" : "rgba(255, 107, 107, 0.2)",
                  borderRadius: 6,
                  marginBottom: 6,
                  fontSize: 11
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                  <span style={{ fontWeight: 500 }}>{entry.command.deviceId}</span>
                  <span style={{ opacity: 0.7 }}>
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div style={{ fontFamily: "monospace", fontSize: 10, opacity: 0.9 }}>
                  {formatAddress(entry.command.address)} → {entry.command.payload.slice(0, 20)}
                  {entry.command.payload.length > 20 ? "..." : ""}
                </div>
                {entry.error && (
                  <div style={{ color: "#ff6b6b", fontSize: 10, marginTop: 2 }}>{entry.error}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

