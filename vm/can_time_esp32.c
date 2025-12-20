// can_time_esp32.c
// ESP32 Time Source Implementation (RFC-0013)
// Role: Agent 7 — HARDWARE & REAL-WORLD INTEGRATION (HW-TIME-REAL)
// Implements: RFC-0013 §9.1 (ESP32 Time Source)

#ifdef ESP_PLATFORM

#include "can_time.h"
#include "esp_timer.h"
#include <stdint.h>
#include <stdbool.h>

static bool time_initialized = false;

// Initialize ESP32 time source
bool can_time_init(void) {
  // ESP32 timer is always available, no initialization needed
  time_initialized = true;
  return true;
}

// Get current monotonic tick count (microseconds)
// RFC-0013 §9.1: Use esp_timer_get_time()
uint64_t can_time_ticks(void) {
  if (!time_initialized) {
    can_time_init();
  }
  // esp_timer_get_time() returns microseconds since boot
  return (uint64_t)esp_timer_get_time();
}

// Get time source resolution (nanoseconds per tick)
uint64_t can_time_resolution_ns(void) {
  // ESP32 timer resolution is 1 microsecond = 1000 nanoseconds
  return 1000;
}

// Check if time source is available
bool can_time_available(void) {
  return time_initialized;
}

// Get current platform
can_time_platform_t can_time_get_platform(void) {
  return CAN_TIME_PLATFORM_ESP32;
}

#endif // ESP_PLATFORM

