#include "esp_system.h"
#include "esp_timer.h"
#include "esp_wifi.h"
#include "freertos/FreeRTOS.h"

void emit_canvasl_hw_context(void) {
    printf("{
");
    printf("  "device": {
");
    printf("    "class": "embedded",
");
    printf("    "arch": "xtensa",
");
    printf("    "model": "esp32-s3",
");
    printf("    "cores": %d,
", esp_cpu_get_count());
    printf("    "freq_hz": %d
", esp_clk_cpu_freq());
    printf("  },
");

    printf("  "memory": {
");
    printf("    "ram_bytes": %d,
", esp_get_free_heap_size());
    printf("    "heap_free_bytes": %d,
", esp_get_free_heap_size());
    printf("    "flash_bytes": %d
", spi_flash_get_chip_size());
    printf("  },
");

    printf("  "timing": {
");
    printf("    "clock_source": "crystal",
");
    printf("    "tick_hz": %llu,
", esp_timer_get_time());
    printf("    "drift_ppm": 40
");
    printf("  },
");

    printf("  "constraints": {
");
    printf("    "deterministic": true,
");
    printf("    "self_modify": "sealed",
");
    printf("    "visual_dim": "2D"
");
    printf("  }
");
    printf("}
");
}
```

This prints a **CanvasL-compatible context record** over serial.

---

## 5. Mapping Hardware → VM Behavior (this is the key)

Your VM should treat this file as **live constraints**.

### Example rules

