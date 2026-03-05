#include "wifi_mqtt.h"
#include "config.h"

#if ENABLE_WIFI_MQTT

#include <string.h>
#include <stdio.h>
#include "esp_log.h"
#include "esp_wifi.h"
#include "esp_netif.h"
#include "esp_event.h"
#include "esp_mac.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "mqtt_client.h"
#include "cJSON.h"

// Cast the handle type properly
#define ESP_MQTT_CLIENT_HANDLE(x) ((esp_mqtt_client_handle_t)(x))

static const char *TAG = "wifi_mqtt";

static void* g_mqtt_client = NULL;
static bool g_connected = false;
static char g_device_id[32] = {0};
static char g_mqtt_uri[128] = {0};
static char g_broker_host[64] = {0};
static int g_broker_port = 1883;
static bool g_broker_is_gateway = false;
static bool g_mqtt_started = false;
static canbc_mqtt_callback_t g_callback = NULL;

// Derive device ID from MAC if not provided
static void derive_device_id(char *out, size_t out_len) {
    uint8_t mac[6] = {0};
    if (esp_read_mac(mac, ESP_MAC_WIFI_STA) != ESP_OK) {
        snprintf(out, out_len, "esp32-unknown");
        return;
    }
    snprintf(out, out_len, "esp32-%02x%02x%02x%02x%02x%02x",
             mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);
}

static void mqtt_event_handler_internal(void *handler_args, esp_event_base_t base,
                                        int32_t event_id, void *event_data);

static void mqtt_start_with_uri(const char* uri) {
    if (g_mqtt_started || g_mqtt_client) return;
    if (!uri || !uri[0]) return;

    esp_mqtt_client_config_t mqtt_cfg = {0};
    mqtt_cfg.broker.address.uri = uri;
    mqtt_cfg.credentials.client_id = g_device_id[0] ? g_device_id : NULL;

    void* client = esp_mqtt_client_init(&mqtt_cfg);
    if (!client) {
        ESP_LOGE(TAG, "Failed to initialize MQTT client");
        return;
    }
    g_mqtt_client = client;

    esp_mqtt_client_register_event((esp_mqtt_client_handle_t)client, ESP_EVENT_ANY_ID, mqtt_event_handler_internal, NULL);
    esp_mqtt_client_start((esp_mqtt_client_handle_t)client);
    g_mqtt_started = true;
}

static void wifi_event_handler(void* arg, esp_event_base_t event_base,
                               int32_t event_id, void* event_data) {
    if (event_base == WIFI_EVENT && event_id == WIFI_EVENT_STA_START) {
        esp_wifi_connect();
    } else if (event_base == WIFI_EVENT && event_id == WIFI_EVENT_STA_DISCONNECTED) {
        ESP_LOGI(TAG, "WiFi disconnected, retrying...");
        esp_wifi_connect();
        g_connected = false;
    } else if (event_base == IP_EVENT && event_id == IP_EVENT_STA_GOT_IP) {
        ip_event_got_ip_t* event = (ip_event_got_ip_t*) event_data;
        ESP_LOGI(TAG, "WiFi connected, IP: " IPSTR, IP2STR(&event->ip_info.ip));
        g_connected = true;

        if (g_broker_is_gateway && !g_mqtt_started) {
            snprintf(g_mqtt_uri, sizeof(g_mqtt_uri), "mqtt://" IPSTR ":%d", IP2STR(&event->ip_info.gw), g_broker_port);
            ESP_LOGI(TAG, "Starting MQTT broker at gateway: %s", g_mqtt_uri);
            mqtt_start_with_uri(g_mqtt_uri);
        }
    }
}

// Handle MQTT messages - parse CANBC commands
static void mqtt_event_handler_internal(void *handler_args, esp_event_base_t base,
                                        int32_t event_id, void *event_data) {
    esp_mqtt_event_handle_t event = (esp_mqtt_event_handle_t)event_data;
    void* client = (void*)event->client;

    switch ((esp_mqtt_event_id_t)event_id) {
    case MQTT_EVENT_CONNECTED:
        ESP_LOGI(TAG, "MQTT connected");
        {
            char topic[96];
            // Subscribe to CANBC command topic
            snprintf(topic, sizeof(topic), "tetragrammatron/%s/canbc/command", g_device_id);
            esp_mqtt_client_subscribe((esp_mqtt_client_handle_t)client, topic, 1);
            ESP_LOGI(TAG, "Subscribed to: %s", topic);
        }
        g_connected = true;
        break;
    case MQTT_EVENT_DISCONNECTED:
        ESP_LOGI(TAG, "MQTT disconnected");
        g_connected = false;
        break;
    case MQTT_EVENT_DATA:
        {
            // Parse incoming CANBC command
            // Format: JSON with "addr" (hex string) and "payload" (hex string)
            char topic[128] = {0};
            int topic_len = event->topic_len < sizeof(topic) - 1 ? event->topic_len : sizeof(topic) - 1;
            memcpy(topic, event->topic, topic_len);
            topic[topic_len] = '\0';

            char data[4096] = {0};
            int data_len = event->data_len < sizeof(data) - 1 ? event->data_len : sizeof(data) - 1;
            memcpy(data, event->data, data_len);
            data[data_len] = '\0';

            ESP_LOGI(TAG, "Received MQTT message on topic: %s", topic);

            cJSON *json = cJSON_ParseWithLength(data, data_len);
            if (!json) {
                ESP_LOGE(TAG, "Failed to parse JSON");
                break;
            }

            const char *addr_hex = cJSON_GetStringValue(cJSON_GetObjectItem(json, "addr"));
            const char *payload_hex = cJSON_GetStringValue(cJSON_GetObjectItem(json, "payload"));

            if (addr_hex && payload_hex && g_callback) {
                // Parse address (8 bytes hex)
                uint8_t addr[8] = {0};
                size_t addr_str_len = strlen(addr_hex);
                if (addr_str_len >= 16) {  // 8 bytes = 16 hex chars
                    for (int i = 0; i < 8 && (i * 2 + 1) < addr_str_len; i++) {
                        char hex_byte[3] = {addr_hex[i * 2], addr_hex[i * 2 + 1], '\0'};
                        addr[i] = (uint8_t)strtol(hex_byte, NULL, 16);
                    }

                    // Parse payload (hex string)
                    size_t payload_str_len = strlen(payload_hex);
                    if (payload_str_len > 0 && payload_str_len <= 8192) {  // Max 4KB payload
                        uint8_t payload[4096] = {0};
                        size_t payload_bytes = payload_str_len / 2;
                        if (payload_bytes > sizeof(payload)) payload_bytes = sizeof(payload);

                        for (size_t i = 0; i < payload_bytes && (i * 2 + 1) < payload_str_len; i++) {
                            char hex_byte[3] = {payload_hex[i * 2], payload_hex[i * 2 + 1], '\0'};
                            payload[i] = (uint8_t)strtol(hex_byte, NULL, 16);
                        }

                        ESP_LOGI(TAG, "Parsed CANBC command: addr=%02X:%02X:%02X:%02X:%02X:%02X:%02X:%02X, payload_len=%zu",
                                 addr[0], addr[1], addr[2], addr[3], addr[4], addr[5], addr[6], addr[7], payload_bytes);
                        g_callback(addr, payload, payload_bytes);
                    }
                }
            }

            cJSON_Delete(json);
        }
        break;
    case MQTT_EVENT_ERROR:
        ESP_LOGI(TAG, "MQTT error");
        break;
    default:
        break;
    }
}

bool wifi_mqtt_init(const wifi_mqtt_config_t *config, canbc_mqtt_callback_t callback) {
    if (!config) return false;

    g_callback = callback;

    // Use provided device_id or derive from MAC
    if (config->device_id[0]) {
        strncpy(g_device_id, config->device_id, sizeof(g_device_id) - 1);
        g_device_id[sizeof(g_device_id) - 1] = '\0';
    } else {
        derive_device_id(g_device_id, sizeof(g_device_id));
    }

    strncpy(g_broker_host, config->broker_host, sizeof(g_broker_host) - 1);
    g_broker_host[sizeof(g_broker_host) - 1] = '\0';
    g_broker_port = config->broker_port;
    g_broker_is_gateway = strcmp(g_broker_host, "gateway") == 0;

    // Initialize network interface (if not already done)
    esp_err_t ret = esp_netif_init();
    if (ret != ESP_OK && ret != ESP_ERR_INVALID_STATE) {
        ESP_LOGE(TAG, "Failed to initialize netif: %s", esp_err_to_name(ret));
        return false;
    }

    ret = esp_event_loop_create_default();
    if (ret != ESP_OK && ret != ESP_ERR_INVALID_STATE) {
        ESP_LOGE(TAG, "Failed to create event loop: %s", esp_err_to_name(ret));
        return false;
    }

    // Initialize WiFi
    esp_netif_create_default_wifi_sta();
    wifi_init_config_t cfg = WIFI_INIT_CONFIG_DEFAULT();
    ret = esp_wifi_init(&cfg);
    if (ret != ESP_OK) {
        ESP_LOGE(TAG, "Failed to initialize WiFi: %s", esp_err_to_name(ret));
        return false;
    }

    ret = esp_event_handler_register(WIFI_EVENT, ESP_EVENT_ANY_ID, &wifi_event_handler, NULL);
    if (ret != ESP_OK && ret != ESP_ERR_INVALID_STATE) {
        ESP_LOGE(TAG, "Failed to register WiFi event handler: %s", esp_err_to_name(ret));
        return false;
    }

    ret = esp_event_handler_register(IP_EVENT, IP_EVENT_STA_GOT_IP, &wifi_event_handler, NULL);
    if (ret != ESP_OK && ret != ESP_ERR_INVALID_STATE) {
        ESP_LOGE(TAG, "Failed to register IP event handler: %s", esp_err_to_name(ret));
        return false;
    }

    wifi_config_t wifi_config = {0};
    strncpy((char*)wifi_config.sta.ssid, config->ssid, sizeof(wifi_config.sta.ssid) - 1);
    strncpy((char*)wifi_config.sta.password, config->password, sizeof(wifi_config.sta.password) - 1);
    wifi_config.sta.threshold.authmode = WIFI_AUTH_WPA2_PSK;

    ret = esp_wifi_set_mode(WIFI_MODE_STA);
    if (ret != ESP_OK) {
        ESP_LOGE(TAG, "Failed to set WiFi mode: %s", esp_err_to_name(ret));
        return false;
    }

    ret = esp_wifi_set_config(WIFI_IF_STA, &wifi_config);
    if (ret != ESP_OK) {
        ESP_LOGE(TAG, "Failed to set WiFi config: %s", esp_err_to_name(ret));
        return false;
    }

    ret = esp_wifi_start();
    if (ret != ESP_OK) {
        ESP_LOGE(TAG, "Failed to start WiFi: %s", esp_err_to_name(ret));
        return false;
    }

    ESP_LOGI(TAG, "WiFi initialization finished, connecting to: %s", config->ssid);
    ESP_LOGI(TAG, "Device ID: %s", g_device_id);

    // Initialize MQTT client (if not using gateway)
    if (!g_broker_is_gateway) {
        snprintf(g_mqtt_uri, sizeof(g_mqtt_uri), "mqtt://%s:%d", g_broker_host, g_broker_port);
        mqtt_start_with_uri(g_mqtt_uri);
    }

    return true;
}

esp_mqtt_client_handle_t wifi_mqtt_get_client(void) {
    return (esp_mqtt_client_handle_t)g_mqtt_client;
}

bool wifi_mqtt_is_connected(void) {
    return g_connected && g_mqtt_client != NULL;
}

bool wifi_mqtt_publish_attestation(
    const uint8_t *addr,
    const char *schema_hash,
    const char *schema_class,
    const char *canbc_hash,
    const char *status,
    uint32_t steps,
    uint32_t ticks
) {
    if (!g_mqtt_client || !wifi_mqtt_is_connected()) {
        return false;
    }

    cJSON *json = cJSON_CreateObject();
    cJSON_AddStringToObject(json, "device", g_device_id);
    
    // Format address as hex string
    char addr_hex[24] = {0};
    snprintf(addr_hex, sizeof(addr_hex), "%02X%02X%02X%02X%02X%02X%02X%02X",
             addr[0], addr[1], addr[2], addr[3], addr[4], addr[5], addr[6], addr[7]);
    cJSON_AddStringToObject(json, "addr", addr_hex);

    if (schema_hash) cJSON_AddStringToObject(json, "schema_hash", schema_hash);
    if (schema_class) cJSON_AddStringToObject(json, "schema_class", schema_class);
    if (canbc_hash) cJSON_AddStringToObject(json, "canbc_hash", canbc_hash);
    if (status) cJSON_AddStringToObject(json, "status", status);
    cJSON_AddNumberToObject(json, "steps", steps);
    cJSON_AddNumberToObject(json, "ticks", ticks);

    char *json_str = cJSON_PrintUnformatted(json);
    if (!json_str) {
        cJSON_Delete(json);
        return false;
    }

    char topic[128];
    snprintf(topic, sizeof(topic), "tetragrammatron/%s/canbc/attestation", g_device_id);

    int msg_id = esp_mqtt_client_publish((esp_mqtt_client_handle_t)g_mqtt_client, topic, json_str, 0, 1, 0);
    free(json_str);
    cJSON_Delete(json);

    return msg_id >= 0;
}

const char *wifi_mqtt_device_id(void) {
    return g_device_id;
}

#endif  // ENABLE_WIFI_MQTT

