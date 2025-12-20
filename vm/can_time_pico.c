// can_time_pico.c
// Raspberry Pi Pico Time Source Implementation (RFC-0013)
// Role: Agent 7 — HARDWARE & REAL-WORLD INTEGRATION (HW-TIME-REAL)
// Implements: RFC-0013 §9.2 (Raspberry Pi Pico Time Source)

#ifdef PICO_PLATFORM

#include "can_time.h"
#include "pico/time.h"
#include <stdint.h>
#include <stdbool.h>

static bool time_initialized = false;

// Initialize Pico time source
bool can_time_init(void) {
  // Pico time is always available, no initialization needed
  time_initialized = true;
  return true;
}

// Get current monotonic tick count (microseconds)
// RFC-0013 §9.2: Use time_us_64()
uint64_t can_time_ticks(void) {
  if (!time_initialized) {
    can_time_init();
  }
  // time_us_64() returns microseconds since boot
  return (uint64_t)time_us_64();
}

// Get time source resolution (nanoseconds per tick)
uint64_t can_time_resolution_ns(void) {
  // Pico timer resolution is 1 microsecond = 1000 nanoseconds
  return 1000;
}

// Check if time source is available
bool can_time_available(void) {
  return time_initialized;
}

// Get current platform
can_time_platform_t can_time_get_platform(void) {
  return CAN_TIME_PLATFORM_PICO;
}

#endif // PICO_PLATFORM

