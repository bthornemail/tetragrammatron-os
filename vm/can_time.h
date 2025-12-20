// can_time.h
// Platform-Specific Time Source Abstraction (RFC-0013)
// Role: Agent 7 — HARDWARE & REAL-WORLD INTEGRATION (HW-TIME-REAL)
// Implements: RFC-0013 §9 (Platform-Specific Time Sources)

#pragma once

#include <stdint.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

// Time source abstraction
// Provides monotonic tick counter per RFC-0013 §2.2

// Initialize time source (platform-specific)
// Returns true on success, false on failure
bool can_time_init(void);

// Get current monotonic tick count (microseconds)
// RFC-0013 §2.2: Monotonic, platform-independent, deterministic when replayed
uint64_t can_time_ticks(void);

// Get time source resolution (nanoseconds per tick)
// Used for determining quantization precision
uint64_t can_time_resolution_ns(void);

// Check if time source is available
bool can_time_available(void);

// Platform detection
typedef enum {
  CAN_TIME_PLATFORM_UNKNOWN = 0,
  CAN_TIME_PLATFORM_LINUX,
  CAN_TIME_PLATFORM_ANDROID,
  CAN_TIME_PLATFORM_ESP32,
  CAN_TIME_PLATFORM_PICO,
  CAN_TIME_PLATFORM_MACOS,
  CAN_TIME_PLATFORM_WINDOWS
} can_time_platform_t;

// Get current platform
can_time_platform_t can_time_get_platform(void);

#ifdef __cplusplus
}
#endif

