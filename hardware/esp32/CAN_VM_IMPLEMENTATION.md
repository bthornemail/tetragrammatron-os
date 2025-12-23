# CAN VM Implementation

## Overview

The CAN VM (Virtual Machine) executes CanISA bytecode on ESP32 devices. It implements all CanISA opcodes matching the JavaScript reference interpreter in `tools/canbc/interpreter.js` for deterministic execution.

## Component Structure

```
components/can_vm/
├── CMakeLists.txt
├── include/
│   └── can_vm.h          # VM API and opcode definitions
└── can_vm.c              # VM implementation
```

## Supported Opcodes

All CanISA v1 opcodes are implemented:

### Control Flow
- `NOP` (0x00) - No operation
- `HALT` (0x01) - Halt execution

### Data Movement
- `MOV` (0x10) - Move register to register
- `LOAD8` (0x11) - Load 8-bit immediate
- `LOAD16` (0x12) - Load 16-bit immediate
- `LOAD32` (0x13) - Load 32-bit immediate
- `LOADADDR8` (0x60) - Load 8-byte address into registers

### Arithmetic/Logic
- `ADD` (0x20) - Add two registers
- `SUB` (0x21) - Subtract two registers
- `AND` (0x22) - Bitwise AND
- `OR` (0x23) - Bitwise OR
- `XOR` (0x24) - Bitwise XOR

### Projection Operations
- `MOD8` (0x30) - Modulo 8 (r & 0x07)
- `ADMISS_EXCEPT6` (0x31) - Admissibility check (trap if == 6)
- `MAP_PARITY` (0x32) - Map to parity (r & 1)
- `MAP_PRIME8` (0x33) - Map to prime boolean

### Control Flow
- `CMP8` (0x40) - Compare register with 8-bit immediate (sets ZF)
- `JZ` (0x41) - Jump if zero flag set
- `JNZ` (0x42) - Jump if zero flag not set
- `JMP` (0x43) - Unconditional jump

### Telemetry
- `EMIT8` (0x50) - Emit single value (calls emit callback)
- `EMITREGS` (0x51) - Emit register array (calls emit callback)

### Hashing
- `HASHREGS` (0x61) - SHA-256 hash of register range

## VM State

- **16 registers** (r0..r15), each 32-bit
- **Zero flag** (ZF) - set by CMP8
- **Program counter** (PC) - current instruction offset
- **Step counter** - number of instructions executed
- **Tick counter** - execution time metric

## Execution Model

1. **Schema validation** (enforced before VM execution)
   - Address prefix R0..R4 must be valid
   - Invalid prefixes are rejected before execution

2. **VM execution**
   - Executes bytecode instruction by instruction
   - Tracks state (registers, flags, PC)
   - Calls emit callback for EMIT8/EMITREGS

3. **Telemetry output**
   - JSONL format for all events
   - Execution start/end events
   - EMIT8/EMITREGS events
   - Execution statistics (steps, ticks, status)

## Integration

The VM is integrated into `hardware/esp32/can_app/main/main.c`:

```c
#include "can_vm.h"

// Execute bytecode
can_vm_ctx_t ctx = {0};
ctx.code = bytecode;
ctx.code_len = len;
ctx.addr8 = addr->r;
ctx.emit_cb = emit_callback;  // For JSONL output
can_vm_result_t result = can_vm_execute(&ctx);
```

## Protocol

The ESP32 firmware receives:

```
[8-byte address R0..R7][4-byte big-endian length][CANBC bytecode]
```

- Address is validated against schema (R0..R4)
- Length specifies bytecode size
- Bytecode is executed by the VM

## Determinism

The VM implementation matches the JavaScript reference interpreter (`tools/canbc/interpreter.js`) to ensure:
- Same execution semantics
- Same register behavior
- Same projection operations
- Deterministic results across platforms

## Testing

Test the VM with sample CanISA programs:

```bash
# Build and flash
cd hardware/esp32/can_app
source ../setup_idf.sh
idf.py build
idf.py -p /dev/ttyUSB0 flash monitor

# Send test program (NOP + HALT)
python3 ../test_send.py /dev/ttyUSB0
```

## Future Enhancements

- [ ] Support CANBC container format (with constant pool)
- [ ] Add execution fuel limits
- [ ] Add register dump on trap
- [ ] Support for signed execution attestations
- [ ] Integration with ESP-NOW mesh transport

