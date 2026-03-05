#ifndef WIFI_MQTT_H
#define WIFI_MQTT_H

#include <stdbool.h>
#include <stdint.h>
#include <stddef.h>

#ifdef __cplusplus
extern "C" {
#endif

// Include mqtt_client.h for the proper type definition (when WiFi/MQTT is enabled)
#include "config.h"
#if ENABLE_WIFI_MQTT
#include "mqtt_client.h"
#else
// Forward declaration when WiFi/MQTT is disabled
typedef void* esp_mqtt_client_handle_t;
#endif

// WiFi and MQTT configuration
typedef struct {
    char ssid[32];
    char password[64];
    char broker_host[64];
    uint16_t broker_port;
    char client_id[32];
    char device_id[32];  // "esp32-<mac>" or friendly alias
} wifi_mqtt_config_t;

// Callback for received CANBC packets via MQTT
// Parameters: addr (8 bytes), payload (CANBC bytes), payload_len
typedef void (*canbc_mqtt_callback_t)(const uint8_t *addr, const uint8_t *payload, size_t payload_len);

// Initialize WiFi and MQTT
bool wifi_mqtt_init(const wifi_mqtt_config_t *config, canbc_mqtt_callback_t callback);

// Get MQTT client handle (for publishing)
esp_mqtt_client_handle_t wifi_mqtt_get_client(void);

// Check if connected
bool wifi_mqtt_is_connected(void);

// Publish execution attestation
bool wifi_mqtt_publish_attestation(
    const uint8_t *addr,
    const char *schema_hash,
    const char *schema_class,
    const char *canbc_hash,
    const char *status,
    uint32_t steps,
    uint32_t ticks
);

// Get device ID
const char *wifi_mqtt_device_id(void);

#ifdef __cplusplus
}
#endif

#endif  // WIFI_MQTT_H
