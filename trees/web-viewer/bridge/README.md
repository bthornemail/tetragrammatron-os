# ESP32 CAN VM Bridge Server

Bridge server that reads JSONL telemetry from ESP32 UART and forwards to WebSocket clients.

## Installation

```bash
npm install
```

## Usage

```bash
# Default: port 8080, /dev/ttyUSB0, 115200 baud
npm start

# Custom configuration
node server.js --port 8080 --serial /dev/ttyUSB0 --baud 115200
```

## Configuration

- `--port`: WebSocket server port (default: 8080)
- `--serial`: Serial port path (default: /dev/ttyUSB0)
- `--baud`: Baud rate (default: 115200)

## Protocol

The bridge server:
1. Reads JSONL lines from ESP32 serial port
2. Parses each line as JSON
3. Broadcasts parsed events to all connected WebSocket clients

## WebSocket Messages

The bridge sends ESP32 telemetry events as-is, plus bridge control messages:

- `{"kind":"bridge.connected","msg":{...}}` - Client connected
- `{"kind":"bridge.serial.connected","msg":{...}}` - Serial port connected
- `{"kind":"bridge.serial.disconnected","msg":{...}}` - Serial port disconnected
- `{"kind":"bridge.serial.error","msg":"..."}` - Serial port error
- `{"kind":"esp32.log","msg":"..."}` - Raw ESP-IDF log line (non-JSON)

ESP32 telemetry events are forwarded as-is:
- `{"kind":"exec.start","msg":"{}"}`
- `{"a":"...","k":"...","v":...}`
- `{"kind":"vm_done","msg":"{...}"}`
- `{"kind":"schema_violation","msg":"..."}`
- `{"kind":"input_error","msg":"..."}`

## Requirements

- Node.js >= 18.0.0
- Access to serial port (may require permissions on Linux)

## Troubleshooting

**Permission denied on serial port:**
```bash
sudo usermod -a -G dialout $USER
# Then logout/login or:
newgrp dialout
```

**Port already in use:**
- Change WebSocket port: `--port 8081`
- Or stop other services using port 8080

**Serial port not found:**
- Check device: `ls -l /dev/ttyUSB*`
- Verify ESP32 is connected
- Try different port path


