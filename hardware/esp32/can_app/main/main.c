#include <stdio.h>
#include <string.h>

#include "esp_log.h"
#include "esp_system.h"
#include "esp_timer.h"
#include "nvs_flash.h"

#include "can_vm.h"
#include "can_codec.h"
#include "can_objpool.h"

static const char *TAG = "CAN_VM_ESP32";

#define UART_BUFFER_BYTES (4 * 1024)
#define OBJPOOL_MAX_POLYS 32

static can_objpool_t g_pool;
static uint8_t g_pool_storage[OBJPOOL_MAX_POLYS][CAN_OBJPOOL_SLOT_BYTES];

static void init_objpool(void) {
  memset(&g_pool, 0, sizeof(g_pool));
  g_pool.slots = &g_pool_storage[0][0];
  g_pool.slot_count = OBJPOOL_MAX_POLYS;
}

static void canvm_run_buffer(const uint8_t *buf, size_t len) {
  can_vm_t vm;
  can_vm_init(&vm);
  can_vm_set_objpool(&vm, &g_pool);

  int steps = can_vm_run(&vm, buf, len);
  if (steps < 0) {
    ESP_LOGE(TAG, "VM error: %s", can_vm_error_string(vm.last_error));
    return;
  }

  esp_timer_handle_t timer = 0;
  uint64_t ticks = can_time_ticks();
  ESP_LOGI(TAG, "VM complete: steps=%d, ticks=%llu", steps, (unsigned long long)ticks);
}

void app_main(void) {
  ESP_ERROR_CHECK(nvs_flash_init());
  init_objpool();

  ESP_LOGI(TAG, "Tetragrammatron CAN VM (ESP32) ready");
  ESP_LOGI(TAG, "Send CANBC bytes over UART0; terminate with EOF");

  static uint8_t uart_buf[UART_BUFFER_BYTES];
  size_t received = 0;

  while (received < sizeof(uart_buf)) {
    int c = getchar();
    if (c < 0) break;
    uart_buf[received++] = (uint8_t)c;
  }

  if (received > 0) {
    ESP_LOGI(TAG, "Received %zu bytes, executing...", received);
    canvm_run_buffer(uart_buf, received);
  } else {
    ESP_LOGW(TAG, "No CANBC payload received.");
  }

  ESP_LOGI(TAG, "Halting until next reset.");
}
