/**
 * MQTT Client for ESP32 CAN VM Telemetry
 * 
 * Manages MQTT connection to broker and handles subscription to
 * ESP32 attestation topics. For browser compatibility, uses MQTT over WebSocket.
 */

import mqtt, { MqttClient, IClientOptions } from 'mqtt';
import { getConfig } from "./config";
import { parseEsp32Event, Esp32Event, updateTelemetryData, Esp32TelemetryData, createTelemetryData } from "./esp32-telemetry";

export type MqttStatus = "disconnected" | "connecting" | "connected" | "error";

export interface MqttClientInterface {
  status: MqttStatus;
  telemetry: Esp32TelemetryData;
  connectedDevices: Set<string>;
  messageCount: number;
  connect: () => void;
  disconnect: () => void;
  publishCommand: (deviceId: string, address: string, payload: string) => Promise<boolean>;
  onStatusChange: (callback: (status: MqttStatus) => void) => void;
  onEvent: (callback: (event: Esp32Event) => void) => void;
  onError: (callback: (error: Error) => void) => void;
  onDeviceConnected: (callback: (deviceId: string) => void) => void;
}

class MqttClientImpl implements MqttClientInterface {
  private client: MqttClient | null = null;
  private statusListeners: Set<(status: MqttStatus) => void> = new Set();
  private eventListeners: Set<(event: Esp32Event) => void> = new Set();
  private errorListeners: Set<(error: Error) => void> = new Set();
  private deviceListeners: Set<(deviceId: string) => void> = new Set();
  
  public status: MqttStatus = "disconnected";
  public telemetry: Esp32TelemetryData = createTelemetryData();
  public connectedDevices: Set<string> = new Set();
  public messageCount = 0;

  constructor() {
    // Auto-connect if enabled
    const config = getConfig();
    if (config.mqttEnabled) {
      this.connect();
    }
  }

  private setStatus(newStatus: MqttStatus) {
    if (this.status !== newStatus) {
      this.status = newStatus;
      this.statusListeners.forEach(cb => cb(newStatus));
    }
  }

  connect() {
    if (this.client && this.client.connected) {
      return; // Already connected
    }

    const config = getConfig();
    if (!config.mqttEnabled) {
      console.log("MQTT is disabled in configuration");
      return;
    }

    this.setStatus("connecting");

    try {
      // For browser compatibility, use WebSocket transport
      // Most MQTT brokers expose WebSocket on a different port (e.g., 9001)
      const isBrowser = typeof window !== 'undefined';
      
      let connectUrl: string;
      if (isBrowser) {
        // Browser: use WebSocket transport
        const protocol = config.mqttBrokerWsPort === 9443 ? 'wss' : 'ws';
        // Common WebSocket paths: /mqtt, /ws, or just the port
        connectUrl = `${protocol}://${config.mqttBrokerHost}:${config.mqttBrokerWsPort}/mqtt`;
      } else {
        // Node.js: use direct MQTT protocol
        const protocol = config.mqttBrokerPort === 8883 ? 'mqtts' : 'mqtt';
        connectUrl = `${protocol}://${config.mqttBrokerHost}:${config.mqttBrokerPort}`;
      }

      const options: IClientOptions = {
        clientId: config.mqttClientId,
        clean: true,
        reconnectPeriod: 5000,
        connectTimeout: 10000,
      };

      console.log(`Connecting to MQTT broker: ${connectUrl}`);
      this.client = mqtt.connect(connectUrl, options);

      this.client.on('connect', () => {
        console.log("MQTT connected");
        this.setStatus("connected");
        
        // Subscribe to all device attestations
        const attestationTopic = 'tetragrammatron/+/canbc/attestation';
        this.client?.subscribe(attestationTopic, (err) => {
          if (err) {
            console.error("Failed to subscribe to attestations:", err);
          } else {
            console.log(`Subscribed to: ${attestationTopic}`);
          }
        });
      });

      this.client.on('message', (topic, message) => {
        try {
          const data = JSON.parse(message.toString());
          
          // Extract device ID from topic: tetragrammatron/{device_id}/canbc/attestation
          const topicParts = topic.split('/');
          if (topicParts.length >= 2) {
            const deviceId = topicParts[1];
            if (!this.connectedDevices.has(deviceId)) {
              this.connectedDevices.add(deviceId);
              this.deviceListeners.forEach(cb => cb(deviceId));
            }
          }

          // Convert MQTT attestation to ESP32 event format
          const event = this.parseMqttAttestation(data);
          if (event) {
            this.messageCount++;
            updateTelemetryData(this.telemetry, event);
            this.eventListeners.forEach(cb => cb(event));
          }
        } catch (err) {
          console.error("Failed to parse MQTT message:", err);
        }
      });

      this.client.on('error', (error) => {
        console.error("MQTT error:", error);
        this.setStatus("error");
        const err = error instanceof Error ? error : new Error(String(error));
        this.errorListeners.forEach(cb => cb(err));
      });

      this.client.on('close', () => {
        console.log("MQTT connection closed");
        this.setStatus("disconnected");
      });

      this.client.on('offline', () => {
        console.log("MQTT client offline");
        this.setStatus("disconnected");
      });

      this.client.on('reconnect', () => {
        console.log("MQTT reconnecting...");
        this.setStatus("connecting");
      });

    } catch (err) {
      console.error("Failed to create MQTT client:", err);
      this.setStatus("error");
      const error = err instanceof Error ? err : new Error(String(err));
      this.errorListeners.forEach(cb => cb(error));
    }
  }

  disconnect() {
    if (this.client) {
      this.client.end();
      this.client = null;
    }
    this.setStatus("disconnected");
    this.connectedDevices.clear();
    this.messageCount = 0;
  }

  async publishCommand(deviceId: string, address: string, payload: string): Promise<boolean> {
    if (!this.client || !this.client.connected) {
      console.error("MQTT client not connected");
      return false;
    }

    try {
      // Validate address (should be 16 hex chars = 8 bytes)
      if (!/^[0-9A-Fa-f]{16}$/.test(address)) {
        throw new Error("Address must be 16 hex characters (8 bytes)");
      }

      // Validate payload (hex string)
      if (!/^[0-9A-Fa-f]*$/.test(payload)) {
        throw new Error("Payload must be a hex string");
      }

      const command = {
        addr: address.toUpperCase(),
        payload: payload.toUpperCase()
      };

      const topic = `tetragrammatron/${deviceId}/canbc/command`;
      const message = JSON.stringify(command);

      return new Promise((resolve) => {
        this.client?.publish(topic, message, { qos: 1 }, (err) => {
          if (err) {
            console.error("Failed to publish command:", err);
            resolve(false);
          } else {
            console.log(`Published command to ${topic}:`, command);
            resolve(true);
          }
        });
      });
    } catch (err) {
      console.error("Error publishing command:", err);
      return false;
    }
  }

  private parseMqttAttestation(data: any): Esp32Event | null {
    // MQTT attestation format:
    // { "device": "esp32-...", "addr": "1A020403027F11C7", "status": "halt", "steps": 42, "ticks": 42 }
    
    if (!data || typeof data !== "object") {
      return null;
    }

    if (!data.addr || !data.status) {
      return null;
    }

    // Convert address from hex string to colon-separated format
    const addrHex = String(data.addr).toUpperCase();
    if (addrHex.length !== 16) {
      return null; // Invalid address length
    }

    const addrFormatted = addrHex.match(/.{2}/g)?.join(':') || addrHex;

    // Map MQTT status to ESP32 VM status
    const statusMap: Record<string, Esp32VmDone["msg"]["status"]> = {
      "ok": "ok",
      "halt": "halt",
      "trap": "trap",
      "error": "error"
    };

    const vmStatus = statusMap[String(data.status).toLowerCase()] || "error";

    // Create a vm_done event from MQTT attestation
    return {
      kind: "vm_done",
      msg: {
        steps: Number(data.steps) || 0,
        ticks: Number(data.ticks) || 0,
        status: vmStatus,
        pc: 0  // MQTT attestation doesn't include PC
      }
    };
  }

  onStatusChange(callback: (status: MqttStatus) => void) {
    this.statusListeners.add(callback);
    callback(this.status);
    
    return () => {
      this.statusListeners.delete(callback);
    };
  }

  onEvent(callback: (event: Esp32Event) => void) {
    this.eventListeners.add(callback);
    
    return () => {
      this.eventListeners.delete(callback);
    };
  }

  onError(callback: (error: Error) => void) {
    this.errorListeners.add(callback);
    
    return () => {
      this.errorListeners.delete(callback);
    };
  }

  onDeviceConnected(callback: (deviceId: string) => void) {
    this.deviceListeners.add(callback);
    
    return () => {
      this.deviceListeners.delete(callback);
    };
  }
}

// Singleton instance
let clientInstance: MqttClientInterface | null = null;

/**
 * Get or create the MQTT client instance
 */
export function getMqttClient(): MqttClientInterface {
  if (!clientInstance) {
    clientInstance = new MqttClientImpl();
  }
  return clientInstance;
}

/**
 * Reset the MQTT client (useful for testing)
 */
export function resetMqttClient(): void {
  if (clientInstance) {
    clientInstance.disconnect();
    clientInstance = null;
  }
}

