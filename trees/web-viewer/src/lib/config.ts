/**
 * Configuration for web-viewer
 * 
 * Handles WebSocket connection settings and other runtime configuration.
 */

export interface ViewerConfig {
  websocketUrl: string;
  enableRealtime: boolean;
  reconnectDelay: number;
  maxReconnectAttempts: number;
  mqttBrokerHost: string;
  mqttBrokerPort: number;
  mqttBrokerWsPort: number;  // WebSocket port for browser compatibility
  mqttEnabled: boolean;
  mqttClientId: string;
}

// Generate unique client ID for MQTT
function generateClientId(): string {
  return `web-viewer-${Math.random().toString(36).substring(2, 11)}`;
}

const DEFAULT_CONFIG: ViewerConfig = {
  websocketUrl: import.meta.env.VITE_WEBSOCKET_URL || "ws://localhost:8080",
  enableRealtime: import.meta.env.VITE_ENABLE_REALTIME !== "false",
  reconnectDelay: 3000,  // 3 seconds
  maxReconnectAttempts: 10,
  mqttBrokerHost: import.meta.env.VITE_MQTT_BROKER_HOST || "localhost",
  mqttBrokerPort: parseInt(import.meta.env.VITE_MQTT_BROKER_PORT || "1883", 10),
  mqttBrokerWsPort: parseInt(import.meta.env.VITE_MQTT_BROKER_WS_PORT || "9001", 10),  // WebSocket port
  mqttEnabled: import.meta.env.VITE_MQTT_ENABLED !== "false",
  mqttClientId: generateClientId()
};

let config: ViewerConfig = { ...DEFAULT_CONFIG };

/**
 * Get current configuration
 */
export function getConfig(): ViewerConfig {
  return { ...config };
}

/**
 * Update configuration
 */
export function setConfig(updates: Partial<ViewerConfig>): void {
  config = { ...config, ...updates };
}

/**
 * Reset configuration to defaults
 */
export function resetConfig(): void {
  config = { ...DEFAULT_CONFIG };
}

