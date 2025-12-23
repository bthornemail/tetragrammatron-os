#include <stdio.h>
#include <string.h>

#include "esp_log.h"
#include "nvs_flash.h"

#include "tetragrammatron_schema.h"

static const char *TAG = "CAN_VM_ESP32";

#define UART_BUFFER_BYTES (4 * 1024)

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

// TODO: Implement CAN VM execution
// For now, this is a minimal stub that validates addresses and logs
static void canvm_run_buffer(const uint8_t *buf, size_t len) {
  ESP_LOGI(TAG, "CAN VM execution stub: received %zu bytes", len);
  log_jsonl("vm_done", "{\"steps\":0,\"ticks\":0,\"status\":\"stub\"}");
}

void app_main(void) {
  ESP_ERROR_CHECK(nvs_flash_init());

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
