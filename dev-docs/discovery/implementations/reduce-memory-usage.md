# Reduce memory usage
pico_set_binary_type(clbc_poly_demo no_flash)

pico_add_extra_outputs(clbc_poly_demo)
```

File: platform_pico.c (Pico-specific SHA256)

```c
// platform_pico.c - Pico W2 specific implementations
#include "clbc_poly_final.h"
#include "hardware/sha256.h"

void sha256(const uint8_t *data, size_t len, uint8_t hash[32]) {
    sha256_hardware_init();
    sha256_hardware_hash(data, len, hash);
}

// UART output for test results
void platform_init() {
    stdio_init_all();
    printf("Pico W2 CLBC-POLY Test
");
}

int main() {
    platform_init();
    return test_golden_main(); // Your test entry point
}
```

File: component.mk (ESP-IDF)

```makefile
COMPONENT_SRCDIRS := .
COMPONENT_ADD_INCLUDEDIRS := .
COMPONENT_SRCS := clbc_poly_final.c test_golden.c platform_esp32.c

CFLAGS += -DF2POLY_MAX_DEGREE=1023 -DESP_PLATFORM
