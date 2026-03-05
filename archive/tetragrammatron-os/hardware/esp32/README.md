# ESP32 Hardware Integration (`HW-TIME-REAL`)

This directory hosts the ESP-IDF scaffold for executing the Tetragrammatron CAN
VM (`vm/can_vm.c`) on ESP32-class MCUs. It enforces the address schema compiled
from `address-schema.yaml` and requires a valid prefix (R0..R4) before executing
any CAN bytecode.

## Layout

```
hardware/esp32/
├── README.md
└── can_app/
    ├── CMakeLists.txt
    ├── idf_component.yml
    └── main/
        ├── CMakeLists.txt
        └── main.c
```

## Prerequisites

1. Compile the address schema into `build/address-schema.bin`:
   ```bash
   python3 tools/compile_schema.py address-schema.yaml -o build/address-schema.bin
   ```
2. Install ESP-IDF 5.x and export the toolchain (`source $IDF/export.sh`).

## Build & Flash

```bash
cd hardware/esp32/can_app
idf.py set-target esp32s3   # or esp32 / esp32c6
idf.py build
idf.py -p /dev/ttyUSB0 flash monitor
```

## UART Protocol

The firmware expects the following payload on UART0:

```
[8-byte address R0..R7][4-byte big-endian length][CANBC payload]
```

- Address prefix must pass `tg_schema_prefix_valid_global()` (rows R0..R4)
- Length must be ≤ 4096 bytes
- Payload is the exact CANBC bytecode produced by `tools/can-asm.scm`

## Telemetry

Execution results are emitted both via ESP-IDF logs and JSONL records on UART,
e.g.:

```json
{"kind":"vm_done","msg":"{\"steps\":42,\"ticks\":12345}"}
```

Use the mesh portal / anchor scripts to capture these lines and compare
`state_hash` with the host VM to prove parity.

## Next Steps

- Replace the static object pool with NVS-backed storage
- Add Wi-Fi / ESP-NOW transports for CANBC delivery
- Extend telemetry with full `state_hash` and schema provenance
