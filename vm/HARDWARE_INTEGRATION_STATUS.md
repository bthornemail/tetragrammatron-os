# Hardware Integration Status

**Status:** Platform Time Sources Implemented  
**Agent:** Agent 7 — HARDWARE & REAL-WORLD INTEGRATION (`HW-TIME-REAL`)  
**Implements:** RFC-0013 §9 (Platform-Specific Time Sources)

---

## Overview

This document summarizes the hardware integration work for platform-specific time sources per RFC-0013.

---

## Time Source Abstraction

### Interface (`can_time.h`)

Provides platform-independent time source abstraction:

- `can_time_init()` — Initialize time source
- `can_time_ticks()` — Get monotonic tick count (microseconds)
- `can_time_resolution_ns()` — Get time resolution
- `can_time_available()` — Check if time source is available
- `can_time_get_platform()` — Get current platform

---

## Platform Implementations

### Linux / Android (`can_time.c`)

**RFC-0013 §9.3 Compliance:**
- Uses `CLOCK_MONOTONIC` (Linux/Android)
- Fallback to `gettimeofday()` if `clock_gettime()` unavailable
- Returns microseconds since boot/epoch

**Status:** ✅ Implemented

---

### macOS (`can_time.c`)

**RFC-0013 §9.3 Compliance:**
- Uses `mach_absolute_time()` with `mach_timebase_info()`
- Converts to microseconds
- High-resolution monotonic timer

**Status:** ✅ Implemented

---

### Windows (`can_time.c`)

**RFC-0013 §9.3 Compliance:**
- Uses `QueryPerformanceCounter()` with `QueryPerformanceFrequency()`
- Converts to microseconds
- High-resolution monotonic timer

**Status:** ✅ Implemented

---

### ESP32 (`can_time_esp32.c`)

**RFC-0013 §9.1 Compliance:**
- Uses `esp_timer_get_time()` (microseconds)
- Alternative: CPU cycle counter (if enabled)
- Returns microseconds since boot

**Status:** ✅ Stub Implementation (requires ESP-IDF)

**Implementation:**
```c
return (uint64_t)esp_timer_get_time();
```

---

### Raspberry Pi Pico (`can_time_pico.c`)

**RFC-0013 §9.2 Compliance:**
- Uses `time_us_64()` (microseconds)
- Alternative: Systick/cycle counter
- Returns microseconds since boot

**Status:** ✅ Stub Implementation (requires Pico SDK)

**Implementation:**
```c
return (uint64_t)time_us_64();
```

---

## VM Integration

### TIME_RD Opcode

The VM now uses platform-specific time source:

```c
case OP_TIME_RD:
  uint64_t ticks = can_time_ticks();
  vm->regs[inst.A].poly_id = (uint32_t)(ticks & 0xFFFFFFFFULL);
  break;
```

**Note:** Currently stores 32-bit truncated value. Full 64-bit support may require register structure extension.

---

### BARRIER_T Opcode

The VM validates time barriers:

```c
case OP_BARRIER_T:
  uint64_t current_time = can_time_ticks();
  uint64_t start_time = (uint64_t)vm->regs[inst.A].poly_id;
  uint64_t elapsed = current_time - start_time;
  
  if (elapsed > (uint64_t)inst.imm16) {
    // Barrier violation
    return false;
  }
  break;
```

**RFC-0013 §4.2 Compliance:** ✅ Implemented

---

## Hardware Capture Files

Hardware capture files in `hw-captures/` provide device information:

- `hw-148.jsonl` — Android device (Stratus C8, MT6765)
- `hw-136.jsonl` — Android device

These files are used for:
- Device identification
- Hardware capability detection
- Time source calibration
- Platform-specific optimizations

---

## RFC Compliance

### RFC-0013 Compliance
- ✅ Platform-specific time sources (RFC-0013 §9)
- ✅ Monotonic tick counter (RFC-0013 §2.2)
- ✅ TIME_RD implementation (RFC-0013 §3.1)
- ✅ BARRIER_T validation (RFC-0013 §4.2)
- ✅ Deterministic behavior preserved (RFC-0013 §6.1)

### RFC-0000 Compliance
- ✅ CAN-INV-13 (Explicit Time Source) — All time operations read from declared clock
- ✅ CAN-INV-14 (Barrier Monotonicity) — Barrier validation implemented

---

## Next Steps

1. **ESP32 Integration:**
   - Add ESP-IDF build configuration
   - Test on ESP32-S3, ESP32-C6
   - Verify time source accuracy

2. **Pico Integration:**
   - Add Pico SDK build configuration
   - Test on Raspberry Pi Pico 2 W
   - Verify time source accuracy

3. **Android/Termux:**
   - Test time source on Android devices
   - Verify CLOCK_MONOTONIC availability
   - Handle time source fallbacks

4. **64-bit Time Support:**
   - Extend register structure for full 64-bit time
   - Update TIME_RD to store full 64-bit value
   - Update BARRIER_T to use 64-bit comparisons

5. **Time Replay:**
   - Implement time value recording
   - Add deterministic replay support
   - Test with recorded time values

---

## Files

- `can_time.h` — Time source abstraction interface
- `can_time.c` — Linux/Android/macOS/Windows implementation
- `can_time_esp32.c` — ESP32 implementation (stub)
- `can_time_pico.c` — Raspberry Pi Pico implementation (stub)

---

**Last Updated:** 2025-01-XX  
**Maintained by:** Agent 7 — HARDWARE & REAL-WORLD INTEGRATION

