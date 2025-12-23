# WiFi/MQTT Implementation for ESP32 CAN VM

## Overview

The ESP32 CAN VM firmware now supports **WiFi and MQTT** communication in addition to UART. This allows:

- **Remote execution**: Send CANBC programs to ESP32 devices over the network
- **Execution attestations**: Receive execution results via MQTT
- **Mesh integration**: Multiple ESP32 devices can participate in a mesh network
- **Dual input**: Supports both UART (serial) and MQTT simultaneously

## Architecture

### Components

1. **`wifi_mqtt.h` / `wifi_mqtt.c`**: WiFi station and MQTT client implementation
2. **`config.h`**: Configuration header with defaults
3. **`config_local.h`**: User-specific configuration (git-ignored)
4. **`main.c`**: Updated to support both UART and MQTT input

### Protocol

#### MQTT Topics

**Command Topic** (Subscribe):
- `tetragrammatron/{device_id}/canbc/command`
- Format: JSON with `addr` (hex) and `payload` (hex)

**Attestation Topic** (Publish):
- `tetragrammatron/{device_id}/canbc/attestation`
- Format: JSON with execution results

#### Message Format

**Command**:
```json
{
  "addr": "1A020403027F11C7",
  "payload": "0001"
}
```

**Attestation**:
```json
{
  "device": "esp32-aabbccddeeff",
  "addr": "1A020403027F11C7",
  "status": "halt",
  "steps": 42,
  "ticks": 42
}
```

## Configuration

### Quick Setup

1. Copy example config:
   ```bash
   cd hardware/esp32/can_app/main
   cp config_local.example.h config_local.h
   ```

2. Edit `config_local.h`:
   ```c
   #define WIFI_SSID "YourNetwork"
   #define WIFI_PASSWORD "YourPassword"
   #define MQTT_BROKER_HOST "gateway"  // or specific IP
   #define MQTT_BROKER_PORT 1883
   #define ENABLE_WIFI_MQTT 1
   ```

3. Build and flash:
   ```bash
   cd hardware/esp32/can_app
   source ../setup_idf.sh
   idf.py build
   idf.py -p /dev/ttyUSB0 flash
   ```

## Features

### WiFi

- **Station Mode**: Connects to existing WiFi network
- **Auto-reconnect**: Automatically retries on disconnect
- **Gateway Detection**: Supports "gateway" hostname for phone hotspots

### MQTT

- **Auto-subscribe**: Automatically subscribes to command topic on connect
- **JSON Parsing**: Parses incoming JSON commands
- **Hex Decoding**: Converts hex strings to binary for address and payload
- **Attestation Publishing**: Publishes execution results automatically

### Dual Input

- **UART**: Still works for local development/testing
- **MQTT**: Network-based remote execution
- **Both Active**: Can receive commands from either source simultaneously

## Usage Examples

### Send Command via MQTT

Using `mosquitto_pub`:
```bash
mosquitto_pub -h localhost \
  -t "tetragrammatron/esp32-aabbccddeeff/canbc/command" \
  -m '{"addr":"1A020403027F11C7","payload":"0001"}'
```

Using Python:
```python
import paho.mqtt.client as mqtt
import json

client = mqtt.Client()
client.connect("localhost", 1883, 60)

cmd = {
    "addr": "1A020403027F11C7",
    "payload": "0001"  # NOP, HALT
}
client.publish("tetragrammatron/esp32-aabbccddeeff/canbc/command", json.dumps(cmd))
```

### Receive Attestations

```bash
mosquitto_sub -h localhost -t "tetragrammatron/+/canbc/attestation" -v
```

### Test Script

Use the provided test script:
```bash
python3 hardware/esp32/can_app/test_mqtt_canbc.py localhost esp32-aabbccddeeff nop
```

## Implementation Details

### WiFi/MQTT Module

- **Conditional Compilation**: Can be disabled via `ENABLE_WIFI_MQTT` flag
- **Stub Functions**: Provides stub implementations when disabled
- **Type Safety**: Uses forward declarations to avoid header dependencies

### Main Application

- **Unified Processing**: `process_canbc_packet()` handles both UART and MQTT
- **Schema Validation**: All packets (UART or MQTT) are validated against schema
- **Attestation Publishing**: Automatically publishes results when MQTT is enabled

### Error Handling

- **Connection Retry**: WiFi and MQTT automatically retry on disconnect
- **Invalid Commands**: Malformed JSON or invalid addresses are logged and ignored
- **Schema Violations**: Invalid addresses are rejected with JSONL log

## Dependencies

### ESP-IDF Components

- `esp_wifi`: WiFi station mode
- `esp_netif`: Network interface
- `mqtt`: MQTT client
- `json`: JSON parsing (cJSON)

### Build Configuration

All dependencies are automatically included in `CMakeLists.txt`. The code compiles with or without WiFi/MQTT enabled.

## Future Enhancements

Potential additions:

1. **BLE Support**: Add Bluetooth Low Energy for device-to-device communication
2. **OTA Updates**: Update firmware via MQTT
3. **Schema Negotiation**: Exchange schemas via MQTT
4. **Mesh Routing**: Multi-hop routing for mesh networks
5. **TLS/SSL**: Secure MQTT connections

## Troubleshooting

See `WIFI_MQTT_SETUP.md` for detailed troubleshooting steps.


