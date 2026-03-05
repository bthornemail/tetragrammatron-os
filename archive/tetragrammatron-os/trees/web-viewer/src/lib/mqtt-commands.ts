/**
 * MQTT Command Publishing Utilities
 * 
 * Helper functions for formatting and validating CANBC commands
 * to be sent to ESP32 devices via MQTT.
 */

import { getMqttClient } from "./mqtt";

export interface CanbcCommand {
  deviceId: string;
  address: string;  // 8-byte address as hex string (16 chars)
  payload: string;  // CANBC bytecode as hex string
}

/**
 * Validate an address string (must be 16 hex characters = 8 bytes)
 */
export function validateAddress(addr: string): { valid: boolean; error?: string } {
  const cleaned = addr.replace(/[:\s-]/g, '').toUpperCase();
  
  if (cleaned.length !== 16) {
    return { valid: false, error: "Address must be 16 hex characters (8 bytes)" };
  }
  
  if (!/^[0-9A-F]{16}$/.test(cleaned)) {
    return { valid: false, error: "Address must contain only hex characters (0-9, A-F)" };
  }
  
  return { valid: true };
}

/**
 * Validate a payload string (must be hex characters)
 */
export function validatePayload(payload: string): { valid: boolean; error?: string } {
  const cleaned = payload.replace(/[:\s-]/g, '').toUpperCase();
  
  if (cleaned.length === 0) {
    return { valid: false, error: "Payload cannot be empty" };
  }
  
  if (cleaned.length % 2 !== 0) {
    return { valid: false, error: "Payload must have even number of hex characters (bytes)" };
  }
  
  if (!/^[0-9A-F]+$/.test(cleaned)) {
    return { valid: false, error: "Payload must contain only hex characters (0-9, A-F)" };
  }
  
  return { valid: true };
}

/**
 * Normalize an address string (remove separators, uppercase)
 */
export function normalizeAddress(addr: string): string {
  return addr.replace(/[:\s-]/g, '').toUpperCase();
}

/**
 * Normalize a payload string (remove separators, uppercase)
 */
export function normalizePayload(payload: string): string {
  return payload.replace(/[:\s-]/g, '').toUpperCase();
}

/**
 * Format address with colons for display (AA:BB:CC:DD:EE:FF:00:11)
 */
export function formatAddress(addr: string): string {
  const cleaned = normalizeAddress(addr);
  if (cleaned.length !== 16) return addr;
  return cleaned.match(/.{2}/g)?.join(':') || cleaned;
}

/**
 * Send a CANBC command to an ESP32 device via MQTT
 */
export async function sendCanbcCommand(command: CanbcCommand): Promise<{ success: boolean; error?: string }> {
  // Validate address
  const addrValidation = validateAddress(command.address);
  if (!addrValidation.valid) {
    return { success: false, error: addrValidation.error };
  }

  // Validate payload
  const payloadValidation = validatePayload(command.payload);
  if (!payloadValidation.valid) {
    return { success: false, error: payloadValidation.error };
  }

  // Validate device ID
  if (!command.deviceId || command.deviceId.trim().length === 0) {
    return { success: false, error: "Device ID is required" };
  }

  // Normalize inputs
  const normalizedCommand: CanbcCommand = {
    deviceId: command.deviceId.trim(),
    address: normalizeAddress(command.address),
    payload: normalizePayload(command.payload)
  };

  // Send via MQTT
  const mqttClient = getMqttClient();
  const success = await mqttClient.publishCommand(
    normalizedCommand.deviceId,
    normalizedCommand.address,
    normalizedCommand.payload
  );

  if (success) {
    return { success: true };
  } else {
    return { success: false, error: "Failed to publish MQTT message" };
  }
}

/**
 * Create a command from address bytes array
 */
export function commandFromBytes(deviceId: string, addressBytes: number[], payloadBytes: number[]): CanbcCommand {
  const address = addressBytes.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
  const payload = payloadBytes.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
  
  return {
    deviceId,
    address,
    payload
  };
}


