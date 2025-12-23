/**
 * WebSocket Client for ESP32 CAN VM Telemetry
 * 
 * Manages WebSocket connection to bridge server and handles
 * reconnection logic and event parsing.
 */

import { getConfig } from "./config";
import { parseEsp32Event, Esp32Event, updateTelemetryData, Esp32TelemetryData, createTelemetryData } from "./esp32-telemetry";

export type WebSocketStatus = "disconnected" | "connecting" | "connected" | "error";

export interface WebSocketClient {
  status: WebSocketStatus;
  telemetry: Esp32TelemetryData;
  connect: () => void;
  disconnect: () => void;
  onStatusChange: (callback: (status: WebSocketStatus) => void) => void;
  onEvent: (callback: (event: Esp32Event) => void) => void;
  onError: (callback: (error: Error) => void) => void;
}

class WebSocketClientImpl implements WebSocketClient {
  private ws: WebSocket | null = null;
  private statusListeners: Set<(status: WebSocketStatus) => void> = new Set();
  private eventListeners: Set<(event: Esp32Event) => void> = new Set();
  private errorListeners: Set<(error: Error) => void> = new Set();
  private reconnectTimer: number | null = null;
  private reconnectAttempts = 0;
  
  public status: WebSocketStatus = "disconnected";
  public telemetry: Esp32TelemetryData = createTelemetryData();

  constructor() {
    // Auto-connect if enabled
    const config = getConfig();
    if (config.enableRealtime) {
      this.connect();
    }
  }

  private setStatus(newStatus: WebSocketStatus) {
    if (this.status !== newStatus) {
      this.status = newStatus;
      this.statusListeners.forEach(cb => cb(newStatus));
    }
  }

  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN)) {
      return; // Already connecting or connected
    }

    const config = getConfig();
    this.setStatus("connecting");

    try {
      this.ws = new WebSocket(config.websocketUrl);

      this.ws.onopen = () => {
        console.log("WebSocket connected to", config.websocketUrl);
        this.setStatus("connected");
        this.reconnectAttempts = 0;
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const esp32Event = parseEsp32Event(data);
          
          if (esp32Event) {
            // Update telemetry data
            updateTelemetryData(this.telemetry, esp32Event);
            
            // Notify listeners
            this.eventListeners.forEach(cb => cb(esp32Event));
          }
        } catch (err) {
          console.error("Failed to parse WebSocket message:", err);
        }
      };

      this.ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        this.setStatus("error");
        const err = new Error("WebSocket connection error");
        this.errorListeners.forEach(cb => cb(err));
      };

      this.ws.onclose = (event) => {
        console.log("WebSocket closed", event.code, event.reason);
        this.setStatus("disconnected");
        this.ws = null;

        // Attempt reconnection if enabled
        const config = getConfig();
        if (config.enableRealtime && this.reconnectAttempts < config.maxReconnectAttempts) {
          this.reconnectAttempts++;
          console.log(`Reconnecting in ${config.reconnectDelay}ms (attempt ${this.reconnectAttempts}/${config.maxReconnectAttempts})...`);
          
          this.reconnectTimer = window.setTimeout(() => {
            this.connect();
          }, config.reconnectDelay);
        } else if (this.reconnectAttempts >= config.maxReconnectAttempts) {
          console.error("Max reconnection attempts reached");
          const err = new Error("Max reconnection attempts reached");
          this.errorListeners.forEach(cb => cb(err));
        }
      };
    } catch (err) {
      console.error("Failed to create WebSocket:", err);
      this.setStatus("error");
      const error = err instanceof Error ? err : new Error(String(err));
      this.errorListeners.forEach(cb => cb(error));
    }
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.setStatus("disconnected");
    this.reconnectAttempts = 0;
  }

  onStatusChange(callback: (status: WebSocketStatus) => void) {
    this.statusListeners.add(callback);
    // Immediately call with current status
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
}

// Singleton instance
let clientInstance: WebSocketClient | null = null;

/**
 * Get or create the WebSocket client instance
 */
export function getWebSocketClient(): WebSocketClient {
  if (!clientInstance) {
    clientInstance = new WebSocketClientImpl();
  }
  return clientInstance;
}

/**
 * Reset the WebSocket client (useful for testing)
 */
export function resetWebSocketClient(): void {
  if (clientInstance) {
    clientInstance.disconnect();
    clientInstance = null;
  }
}

