#include <stdio.h>
#include <string.h>

#include "esp_log.h"
#include "esp_system.h"
#include "esp_timer.h"
#include "nvs_flash.h"

#include "can_vm.h"
#include "can_codec.h"
#include "can_objpool.h"
#include "tetragrammatron_schema.h"

static const char *TAG = "CAN_VM_ESP32";

#define UART_BUFFER_BYTES (4 * 1024)
#define OBJPOOL_MAX_POLYS 32

static can_objpool_t g_pool;
static void init_objpool(void) {
  can_objpool_init(&g_pool);
}

static void log_jsonl(const char *kind, const char *msg) {
  printf("{\"kind\":\"%s\",\"msg\":%s}\n", kind, msg);
}

static bool read_exact(uint8_t *dst, size_t len) {
  size_t total = 0;
  while (total < len) {
    int c = getchar();
    if (c < 0) return false;
    dst[total++] = (uint8_t)c;
  }
  return true;
}

static void canvm_run_buffer(const uint8_t *buf, size_t len) {
  can_vm_t vm;
  can_vm_init(&vm);
  can_vm_set_objpool(&vm, &g_pool);

  int steps = can_vm_run(&vm, buf, len);
  if (steps < 0) {
    ESP_LOGE(TAG, "VM error: %s", can_vm_error_string(vm.last_error));
    log_jsonl("vm_error", "\"exec_failed\"");
    return;
  }

  uint64_t ticks = can_time_ticks();
  ESP_LOGI(TAG, "VM complete: steps=%d, ticks=%llu", steps, (unsigned long long)ticks);
  char payload[96];
  snprintf(payload, sizeof(payload),
           "{\\\"steps\\\":%d,\\\"ticks\\\":%llu}",
           steps, (unsigned long long)ticks);
  log_jsonl("vm_done", payload);
}

void app_main(void) {
  ESP_ERROR_CHECK(nvs_flash_init());
  init_objpool();

  if (!tg_schema_load_embedded()) {
    ESP_LOGE(TAG, "Schema load failed");
    log_jsonl("schema_error", "\"load_failed\"");
    return;
  }

  ESP_LOGI(TAG, "Tetragrammatron CAN VM ready");
  ESP_LOGI(TAG, "Protocol: [8-byte addr][4-byte BE length][CANBC bytes]");

  static uint8_t uart_buf[UART_BUFFER_BYTES];
  tg_addr8_t addr = {0};
  uint8_t len_be[4];

  if (!read_exact(addr.r, sizeof(addr.r))) {
    ESP_LOGE(TAG, "Missing address prefix");
    log_jsonl("input_error", "\"address_missing\"");
    return;
  }

  if (!tg_schema_prefix_valid_global(&addr)) {
    ESP_LOGE(TAG, "Schema gate reject: %02X:%02X:%02X:%02X:%02X",
             addr.r[0], addr.r[1], addr.r[2], addr.r[3], addr.r[4]);
    log_jsonl("schema_violation", "\"prefix_rejected\"");
    return;
  }

  if (!read_exact(len_be, sizeof(len_be))) {
    ESP_LOGE(TAG, "Missing length");
    log_jsonl("input_error", "\"length_missing\"");
    return;
  }

  uint32_t prog_len = (len_be[0] << 24) | (len_be[1] << 16) | (len_be[2] << 8) | len_be[3];
  if (prog_len == 0 || prog_len > sizeof(uart_buf)) {
    ESP_LOGE(TAG, "Invalid length %u", (unsigned)prog_len);
    log_jsonl("input_error", "\"length_invalid\"");
    return;
  }

  if (!read_exact(uart_buf, prog_len)) {
    ESP_LOGE(TAG, "Payload truncated (expected %u bytes)", (unsigned)prog_len);
    log_jsonl("input_error", "\"payload_missing\"");
    return;
  }

  canvm_run_buffer(uart_buf, prog_len);
  ESP_LOGI(TAG, "Execution complete; reset to run again");
}
