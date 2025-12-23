/**
 * Configuration for web-viewer
 * 
 * Handles WebSocket connection settings and other runtime configuration.
 */

import { deriveDefaultsFromProbe } from './config-probe';

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

// Base defaults (will be overridden by probe-derived values if available)
const BASE_DEFAULT_CONFIG: ViewerConfig = {
  websocketUrl: import.meta.env.VITE_WEBSOCKET_URL || "ws://localhost:8080",
  enableRealtime: import.meta.env.VITE_ENABLE_REALTIME !== "false",
  reconnectDelay: 3000,  // 3 seconds
  maxReconnectAttempts: 10,
  mqttBrokerHost: import.meta.env.VITE_MQTT_BROKER_HOST || "192.168.8.1",
  mqttBrokerPort: parseInt(import.meta.env.VITE_MQTT_BROKER_PORT || "1883", 10),
  mqttBrokerWsPort: parseInt(import.meta.env.VITE_MQTT_BROKER_WS_PORT || "8080", 10),  // WebSocket port
  mqttEnabled: import.meta.env.VITE_MQTT_ENABLED !== "false",
  mqttClientId: generateClientId()
};

let config: ViewerConfig = { ...BASE_DEFAULT_CONFIG };

// Initialize config from probe data (async, non-blocking)
let probeInitPromise: Promise<void> | null = null;

async function initFromProbe() {
  try {
    const probeDefaults = await deriveDefaultsFromProbe();
    // Only override if environment variables are not set
    if (!import.meta.env.VITE_WEBSOCKET_URL) {
      config.websocketUrl = probeDefaults.websocketUrl;
    }
    if (!import.meta.env.VITE_MQTT_BROKER_HOST) {
      config.mqttBrokerHost = probeDefaults.mqttBrokerHost;
    }
    console.log('Configuration initialized from probe:', {
      websocketUrl: config.websocketUrl,
      mqttBrokerHost: config.mqttBrokerHost
    });
  } catch (err) {
    console.warn('Failed to initialize config from probe, using defaults:', err);
  }
}

// Start probe initialization (non-blocking)
if (typeof window !== 'undefined') {
  probeInitPromise = initFromProbe();
}

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
  config = { ...BASE_DEFAULT_CONFIG };
}

/**
 * Wait for probe-based configuration to initialize
 * Returns a promise that resolves when probe config is loaded (or immediately if already loaded)
 */
export async function waitForProbeInit(): Promise<void> {
  if (probeInitPromise) {
    await probeInitPromise;
  }
}

