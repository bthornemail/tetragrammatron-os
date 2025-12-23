// Copy this file to config_local.h and set your WiFi/MQTT credentials
// config_local.h is ignored by git

#ifndef CONFIG_LOCAL_H
#define CONFIG_LOCAL_H

// Override defaults from config.h
#define WIFI_SSID "breezeway"
#define WIFI_PASSWORD "passwd84"
#define MQTT_BROKER_HOST "192.168.8.1"  // Use "gateway" for phone hotspot, or IP like "192.168.1.100"
#define MQTT_BROKER_PORT 1883
#define DEVICE_ID ""  // Empty = auto-derive from MAC, or set like "esp32-canvm-01"
#define ENABLE_WIFI_MQTT 1  // Set to 0 to disable WiFi/MQTT and use UART only

#endif  // CONFIG_LOCAL_H

