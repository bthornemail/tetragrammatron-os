#ifndef CONFIG_H
#define CONFIG_H

// Include local config if it exists (for user-specific settings)
#ifdef __has_include
  #if __has_include("config_local.h")
    #include "config_local.h"
  #endif
#endif

// WiFi Configuration
// Set these via menuconfig or override in config_local.h
#ifndef WIFI_SSID
#define WIFI_SSID "YOUR_WIFI_SSID"
#endif

#ifndef WIFI_PASSWORD
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"
#endif

// MQTT Configuration
#ifndef MQTT_BROKER_HOST
#define MQTT_BROKER_HOST "gateway"  // Use "gateway" for phone hotspot, or IP/hostname
#endif

#ifndef MQTT_BROKER_PORT
#define MQTT_BROKER_PORT 1883
#endif

#ifndef DEVICE_ID
#define DEVICE_ID ""  // Empty = auto-derive from MAC
#endif

// Enable/disable WiFi/MQTT (set to 0 to use UART only)
#ifndef ENABLE_WIFI_MQTT
#define ENABLE_WIFI_MQTT 1
#endif

#endif  // CONFIG_H

