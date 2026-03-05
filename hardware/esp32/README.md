# ESP32 Hardware Integration (Agent 7 – `HW-TIME-REAL`)

This directory hosts the ESP-IDF application scaffold that runs the
Tetragrammatron Origami Fold VM (`vm/can_vm.c`) natively on ESP32-class MCUs.
The goal is byte-identical execution compared to the host VM: same CAN opcode
semantics, same canonical polynomials, same `state_hash`.

## Project layout

```
hardware/esp32/
├── README.md               ← this file
└── can_app/                ← ESP-IDF application skeleton
    ├── CMakeLists.txt
    ├── idf_component.yml   ← pin ESP-IDF release
    └── main/
        ├── CMakeLists.txt
        └── main.c          ← VM bridge + UART control loop
```

`main.c` wires three subsystems:

1. **VM core** – includes `vm/can_vm.c`, `vm/can_codec.c`, `vm/can_poly.c`,
   `vm/can_objpool.c`, `vm/can_time_esp32.c`.
2. **Object pool** – stores canonical polynomials in ESP-IDF’s virtual memory
   (SRAM by default; PSRAM optional). The current stub uses a fixed pool; hook
   it to NVS or PSRAM later.
3. **Transport** – reads `.canbc` programs over UART0 and emits JSONL events
   over UART0 (compatible with the mesh anchor).

## Building

1. Install ESP-IDF 5.x and export the toolchain:
   ```bash
   cd ~/esp/esp-idf
   source export.sh
   ```
2. Configure + build the app:
   ```bash
   cd /home/main/devops/tetragrammatron-os/hardware/esp32/can_app
   idf.py set-target esp32s3   # or esp32 / esp32c6
   idf.py build
   ```

## Flashing

Connect the ESP32 over USB (verify `/dev/ttyUSB*`) and run:
```bash
idf.py -p /dev/ttyUSB0 flash monitor
```

The UART monitor prints JSONL records for every VM run (opcode trace,
`state_hash`, timing diagnostics). Exit with `Ctrl+]`.

## Host workflow

1. Assemble CAN source → `.canbc`:
   ```bash
   guile tools/can-asm.scm examples/fold_min.canasm artifacts/fold_min.canbc
   ```
2. Pipe the bytes to the ESP32 over serial (e.g., `pyserial-miniterm`,
   `scripts/esp32_send_canbc.py` TBD).
3. ESP32 prints deterministic JSONL:
   ```json
   {"kind":"VM_EXEC","state_hash":"sha256:…","elapsed_us":1234}
   ```
4. Compare `state_hash` with the host VM (`vm/can_vm_test`) to confirm parity.

## Next steps

- Replace the static object pool with an NVS-backed allocator so programs can
  survive reboots (mirrors the ESP-NOW NRR strategy from bicf-production).
- Add Wi-Fi / ESP-NOW transports for OTA CANBC delivery.
- Enforce hardware timing invariants (`BARRIER_T`) by programming clock grades
  into the UART/mesh telemetry.
- Extend the build to support Pico and Android Termux cross-compiles (shared
  interface already lives in `can_time_*`).

This scaffold keeps the hardware plan inside the Tetragrammatron repo, letting
Agent 7 flash/test without hopping to another project. Fill in the TODOs in
`main.c` as you hook up real transports and storage.
