# WiFi/MQTT Setup for ESP32 CAN VM

The ESP32 CAN VM firmware now supports **WiFi and MQTT** in addition to UART input.

## Features

- **WiFi Station Mode**: Connects to your WiFi network
- **MQTT Client**: Subscribes to CANBC commands and publishes execution attestations
- **Dual Input**: Supports both UART (serial) and MQTT input simultaneously
- **Auto Device ID**: Derives device ID from MAC address if not specified

## Configuration

### 1. Create `main/config_local.h`

Copy the example file:

```bash
cd hardware/esp32/can_app/main
cp config_local.example.h config_local.h
```

### 2. Edit `config_local.h`

```c
#define WIFI_SSID "YourWiFiNetwork"
#define WIFI_PASSWORD "YourPassword"
#define MQTT_BROKER_HOST "gateway"  // or "192.168.1.100" for specific IP
#define MQTT_BROKER_PORT 1883
#define DEVICE_ID ""  // Auto-derive from MAC, or set like "esp32-canvm-01"
#define ENABLE_WIFI_MQTT 1  // Set to 0 to disable WiFi/MQTT
```

**Note**: `config_local.h` is ignored by git, so your credentials won't be committed.

### 3. MQTT Broker Setup

You need an MQTT broker running. Options:

- **Local Mosquitto**: `sudo apt install mosquitto mosquitto-clients`
- **Phone Hotspot**: Use `"gateway"` as broker host (auto-detects gateway IP)
- **Cloud Broker**: Use a public MQTT broker (e.g., `test.mosquitto.org`)

## MQTT Topics

### Subscribed (Receive Commands)

- `tetragrammatron/{device_id}/canbc/command`

**Message Format**:
```json
{
  "addr": "1A020403027F11C7",
  "payload": "00010203040506070809"
}
```

- `addr`: 8-byte address as hex string (16 hex chars)
- `payload`: CANBC bytecode as hex string

### Published (Send Attestations)

- `tetragrammatron/{device_id}/canbc/attestation`

**Message Format**:
```json
{
  "device": "esp32-aabbccddeeff",
  "addr": "1A020403027F11C7",
  "status": "halt",
  "steps": 42,
  "ticks": 42
}
```

## Usage

### Build and Flash

```bash
cd hardware/esp32/can_app
source ../setup_idf.sh
idf.py build
idf.py -p /dev/ttyUSB0 flash
```

### Monitor Output

```bash
idf.py -p /dev/ttyUSB0 monitor
```

You should see:
```
I (XXX) wifi_mqtt: WiFi initialization finished, connecting to: YourWiFiNetwork
I (XXX) wifi_mqtt: WiFi connected, IP: 192.168.1.123
I (XXX) wifi_mqtt: MQTT connected
I (XXX) wifi_mqtt: Subscribed to: tetragrammatron/esp32-aabbccddeeff/canbc/command
I (XXX) CAN_VM_ESP32: Tetragrammatron CAN VM ready
```

### Send CANBC via MQTT

Using `mosquitto_pub`:

```bash
mosquitto_pub -h localhost -t "tetragrammatron/esp32-aabbccddeeff/canbc/command" \
  -m '{"addr":"1A020403027F11C7","payload":"0001"}'
```

Or using Python:

```python
import paho.mqtt.client as mqtt
import json

client = mqtt.Client()
client.connect("localhost", 1883, 60)

cmd = {
    "addr": "1A020403027F11C7",  # 8-byte address as hex
    "payload": "0001"  # CANBC bytecode as hex (NOP, HALT)
}

client.publish("tetragrammatron/esp32-aabbccddeeff/canbc/command", json.dumps(cmd))
```

### Receive Attestations

Using `mosquitto_sub`:

```bash
mosquitto_sub -h localhost -t "tetragrammatron/+/canbc/attestation" -v
```

## Disable WiFi/MQTT

To use UART only, set in `config_local.h`:

```c
#define ENABLE_WIFI_MQTT 0
```

## Troubleshooting

### WiFi Not Connecting

- Check SSID and password in `config_local.h`
- Ensure WiFi network is 2.4GHz (ESP32 doesn't support 5GHz)
- Check signal strength

### MQTT Not Connecting

- Verify broker is running: `mosquitto_sub -h localhost -t test`
- Check broker host/port in `config_local.h`
- For "gateway" mode, ensure device has valid DHCP gateway

### No MQTT Messages Received

- Check device ID matches in topic subscription
- Verify JSON format is correct
- Check broker logs for connection status

## Example: Full Test Script

```python
#!/usr/bin/env python3
import paho.mqtt.client as mqtt
import json
import time

DEVICE_ID = "esp32-aabbccddeeff"  # Replace with your device ID
BROKER = "localhost"

def on_connect(client, userdata, flags, rc):
    print(f"Connected to MQTT broker: {rc}")
    # Subscribe to attestations
    client.subscribe(f"tetragrammatron/{DEVICE_ID}/canbc/attestation")

def on_message(client, userdata, msg):
    print(f"Received: {msg.topic} = {msg.payload.decode()}")

client = mqtt.Client()
client.on_connect = on_connect
client.on_message = on_message
client.connect(BROKER, 1883, 60)
client.loop_start()

# Send a test CANBC program (NOP, HALT)
cmd = {
    "addr": "1A020403027F11C7",
    "payload": "0001"  # NOP, HALT
}
client.publish(f"tetragrammatron/{DEVICE_ID}/canbc/command", json.dumps(cmd))
print("Sent command, waiting for attestation...")

time.sleep(5)
client.loop_stop()
```

