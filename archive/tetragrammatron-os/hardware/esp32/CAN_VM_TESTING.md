# CAN VM Testing Guide

## Quick Test

Test the CAN VM with a simple NOP + HALT program:

```bash
cd /home/main/devops/tetragrammatron-os
python3 hardware/esp32/test_canisa.py /dev/ttyUSB0 nop
```

## Available Test Programs

### 1. `nop` - Minimal Test
- NOP + HALT
- Verifies basic VM execution

### 2. `load` - Load Immediate
- LOAD8 operations
- Tests register loading

### 3. `math` - Arithmetic Operations
- ADD, SUB, AND, OR, XOR
- Tests all arithmetic/logic opcodes

### 4. `jump` - Control Flow
- CMP8 + JZ
- Tests conditional branching

### 5. `mod8` - Projection
- MOD8 operation
- Tests modulo 8 projection

### 6. `admiss` - Admissibility Check
- ADMISS_EXCEPT6
- Should trap if value == 6

### 7. `hash` - Hashing
- HASHREGS operation
- Tests SHA-256 hashing

### 8. `addr` - Address Loading
- LOADADDR8
- Loads 8-byte address into registers

## Expected Output

For a successful execution, you should see:

```
I (XXX) CAN_VM_ESP32: Starting CAN VM execution: N bytes
{"kind":"exec.start","msg":{}}
{"kind":"vm_done","msg":{"steps":N,"ticks":M,"status":"halt","pc":P}}
I (XXX) CAN_VM_ESP32: Execution halted normally: N steps, M ticks
```

## Testing Admissibility Violation

The `admiss` program should trigger a trap:

```bash
python3 hardware/esp32/test_canisa.py /dev/ttyUSB0 admiss
```

Expected output:
```
{"kind":"vm_done","msg":{"steps":2,"ticks":2,"status":"admiss_violation","pc":3}}
```

## Comparing with JavaScript Reference

To verify determinism, compare ESP32 execution with the JavaScript interpreter:

```bash
# Run on ESP32
python3 hardware/esp32/test_canisa.py /dev/ttyUSB0 math

# Run on host (if interpreter supports raw bytecode)
# node tools/canbc/interpreter.js program.canbc
```

Both should produce the same register state and execution steps.

## Troubleshooting

### "unknown_opcode" error
- Check that bytecode matches CanISA opcode definitions
- Verify opcode values match `can_vm.h`

### "pc_overflow" error
- Program counter went out of bounds
- Check for malformed bytecode or infinite loops

### "admiss_violation" error
- ADMISS_EXCEPT6 detected value == 6
- This is expected behavior for the `admiss` test program

### No output
- Check serial port connection
- Verify firmware is running (check monitor)
- Ensure schema validation passed

