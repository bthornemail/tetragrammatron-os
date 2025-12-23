# ESP32 Flashing Setup

This directory contains the ESP32 firmware project and flashing scripts for Tetragrammatron-OS.

## Quick Start

### 1. Compile Schema Binary

```bash
cd /home/main/devops/tetragrammatron-os
python3 tools/compile_schema.py address-schema.yaml -o build/address-schema.bin
```

### 2. Build Firmware

```bash
cd hardware/esp32
./build.sh
```

Or manually:
```bash
source setup_idf.sh
cd can_app
idf.py set-target esp32  # or esp32s3, esp32c6
idf.py build
```

### 3. Flash Device(s)

**Flash single device:**
```bash
./flash.sh /dev/ttyUSB0
```

**Flash and monitor:**
```bash
./flash.sh /dev/ttyUSB0 monitor
```

**Flash all devices:**
```bash
./flash.sh all
```

## Available Devices

Your ESP32 devices are connected on:
- `/dev/ttyUSB0` - CP2102 (SerialNumber: 0001)
- `/dev/ttyUSB1` - CP2102 (SerialNumber: 0001)
- `/dev/ttyUSB2` - CP2102 (SerialNumber: 0001)

## Project Structure

```
hardware/esp32/
├── setup_idf.sh          # ESP-IDF environment setup
├── build.sh               # Build firmware
├── flash.sh               # Flash firmware
├── README_FLASHING.md     # This file
└── can_app/               # ESP-IDF project
    ├── CMakeLists.txt     # Project root
    ├── idf_component.yml  # Component dependencies
    └── main/
        ├── CMakeLists.txt # Main component
        └── main.c          # Application entry point
```

## Component Integration

The `tetragrammatron_schema` component:
- Location: `components/tetragrammatron_schema/`
- Embeds: `build/address-schema.bin` (ABI v2 format)
- Provides: Schema validation functions

## Build Output

After building, firmware is located at:
```
hardware/esp32/can_app/build/tetragrammatron_can_vm.bin
```

## Serial Monitor

To monitor serial output after flashing:
```bash
cd hardware/esp32/can_app
idf.py -p /dev/ttyUSB0 monitor
```

Or use the flash script with monitor:
```bash
./flash.sh /dev/ttyUSB0 monitor
```

## Protocol

The firmware expects UART input in this format:
```
[8-byte address R0..R7][4-byte big-endian length][CANBC payload]
```

- Address prefix (R0..R4) must pass `tg_schema_prefix_valid_global()`
- Length must be ≤ 4096 bytes
- Payload is CANBC bytecode

## Troubleshooting

### Permission Denied

If you get permission errors on `/dev/ttyUSB*`:
```bash
sudo usermod -a -G dialout $USER
# Then log out and back in
```

### Schema Binary Missing

If build fails with "schema binary not found":
```bash
cd /home/main/devops/tetragrammatron-os
python3 tools/compile_schema.py address-schema.yaml -o build/address-schema.bin
```

### ESP-IDF Not Found

Make sure ESP-IDF is at:
```
vendor/esp/idf-v5.4.1/
```

The setup script will automatically source it.

### Build Errors

If you get component errors, check:
1. Component path in `can_app/idf_component.yml`
2. Schema binary exists at `build/address-schema.bin`
3. ESP-IDF environment is properly sourced

## Multiple Devices

To flash all 3 devices sequentially:
```bash
./flash.sh all
```

To flash specific devices:
```bash
./flash.sh /dev/ttyUSB0
./flash.sh /dev/ttyUSB1
./flash.sh /dev/ttyUSB2
```

## Verification

After flashing, the device should:
1. Load the embedded schema binary
2. Print "Tetragrammatron CAN VM ready"
3. Wait for UART input with address + CANBC payload
4. Validate address prefix before execution
5. Execute CANBC and emit JSONL telemetry

Check serial monitor to verify:
```bash
idf.py -p /dev/ttyUSB0 monitor
```

