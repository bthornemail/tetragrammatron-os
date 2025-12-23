#include <stdio.h>
#include <string.h>
#include <inttypes.h>

#include "esp_log.h"
#include "nvs_flash.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"

#include "tetragrammatron_schema.h"
#include "can_vm.h"

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

// Format address as hex string for JSONL
static void format_addr_hex(const tg_addr8_t *addr, char *out, size_t out_len) {
  snprintf(out, out_len, "%02X:%02X:%02X:%02X:%02X:%02X:%02X:%02X",
           addr->r[0], addr->r[1], addr->r[2], addr->r[3],
           addr->r[4], addr->r[5], addr->r[6], addr->r[7]);
}

// Emit callback for EMIT8/EMITREGS opcodes
static bool emit_callback(const char* key, const uint8_t* values, size_t count, void* user_data) {
  const tg_addr8_t* addr = (const tg_addr8_t*)user_data;
  char addr_str[32];
  format_addr_hex(addr, addr_str, sizeof(addr_str));

  // Format JSONL: {"t":"<iso-time>","a":"<addr>","k":"<key>","v":<value>}
  // For simplicity, we'll use a basic format without timestamp
  if (count == 1) {
    // Single value (EMIT8)
    char json_buf[128];
    snprintf(json_buf, sizeof(json_buf),
             "{\"a\":\"%s\",\"k\":\"%s\",\"v\":%u}", addr_str, key, values[0]);
    printf("%s\n", json_buf);
  } else {
    // Array of values (EMITREGS)
    char json_buf[256];
    char values_str[128] = "[";
    for (size_t i = 0; i < count; i++) {
      char val_str[8];
      snprintf(val_str, sizeof(val_str), "%u", values[i]);
      if (i > 0) strcat(values_str, ",");
      strcat(values_str, val_str);
    }
    strcat(values_str, "]");
    snprintf(json_buf, sizeof(json_buf),
             "{\"a\":\"%s\",\"k\":\"%s\",\"v\":%s}", addr_str, key, values_str);
    printf("%s\n", json_buf);
  }
  return true;  // Continue execution
}

// Execute CANBC bytecode using the CAN VM
static void canvm_run_buffer(const uint8_t *code, size_t code_len, const tg_addr8_t *addr) {
  can_vm_ctx_t ctx = {0};
  ctx.code = code;
  ctx.code_len = code_len;
  ctx.addr8 = addr->r;
  ctx.const_bytes = NULL;  // No constant pool for raw bytecode
  ctx.const_len = 0;
  ctx.emit_cb = emit_callback;
  ctx.emit_user_data = (void*)addr;  // Pass address for JSONL formatting

  char addr_str[32];
  format_addr_hex(addr, addr_str, sizeof(addr_str));

  ESP_LOGI(TAG, "Starting CAN VM execution: %zu bytes", code_len);
  log_jsonl("exec.start", "{}");

  can_vm_result_t result = can_vm_execute(&ctx);

  // Emit execution result
  const char *status_str;
  switch (result) {
    case CAN_VM_OK:
      status_str = "ok";
      break;
    case CAN_VM_HALT:
      status_str = "halt";
      break;
    case CAN_VM_TRAP:
      status_str = "trap";
      break;
    case CAN_VM_ERROR_PC_OVERFLOW:
      status_str = "pc_overflow";
      break;
    case CAN_VM_ERROR_UNKNOWN_OPCODE:
      status_str = "unknown_opcode";
      break;
    case CAN_VM_ERROR_ADMISS_VIOLATION:
      status_str = "admiss_violation";
      break;
    default:
      status_str = "error";
      break;
  }

  // Format JSONL output
  char json_buf[256];
  snprintf(json_buf, sizeof(json_buf),
           "{\"steps\":%zu,\"ticks\":%" PRIu32 ",\"status\":\"%s\",\"pc\":%zu}",
           ctx.state.steps, ctx.state.ticks, status_str, ctx.state.pc);
  log_jsonl("vm_done", json_buf);

  if (result == CAN_VM_HALT) {
    ESP_LOGI(TAG, "Execution halted normally: %zu steps, %" PRIu32 " ticks",
             ctx.state.steps, ctx.state.ticks);
  } else if (result != CAN_VM_OK) {
    ESP_LOGW(TAG, "Execution ended with status: %d", result);
  }

  // Free constant pool if allocated
  can_vm_free_const_pool(&ctx.const_pool);
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
  ESP_LOGI(TAG, "Waiting for input...");

  static uint8_t uart_buf[UART_BUFFER_BYTES];

  // Main loop: process packets continuously
  while (1) {
    tg_addr8_t addr = {0};
    uint8_t len_be[4];

    ESP_LOGI(TAG, "Waiting for address prefix (8 bytes)...");
    
    if (!read_exact(addr.r, sizeof(addr.r))) {
      ESP_LOGW(TAG, "No input available, continuing to wait...");
      vTaskDelay(pdMS_TO_TICKS(100));  // Wait 100ms before retrying
      continue;
    }

    ESP_LOGI(TAG, "Received address: %02X:%02X:%02X:%02X:%02X:%02X:%02X:%02X",
             addr.r[0], addr.r[1], addr.r[2], addr.r[3],
             addr.r[4], addr.r[5], addr.r[6], addr.r[7]);

    if (!tg_schema_prefix_valid_global(&addr)) {
      ESP_LOGE(TAG, "Schema gate reject: %02X:%02X:%02X:%02X:%02X",
               addr.r[0], addr.r[1], addr.r[2], addr.r[3], addr.r[4]);
      log_jsonl("schema_violation", "\"prefix_rejected\"");
      continue;  // Continue waiting for next packet
    }

    ESP_LOGI(TAG, "Address prefix valid, reading length...");

    if (!read_exact(len_be, sizeof(len_be))) {
      ESP_LOGE(TAG, "Missing length");
      log_jsonl("input_error", "\"length_missing\"");
      continue;
    }

    uint32_t prog_len = (len_be[0] << 24) | (len_be[1] << 16) | (len_be[2] << 8) | len_be[3];
    ESP_LOGI(TAG, "Payload length: %u bytes", (unsigned)prog_len);

    if (prog_len == 0 || prog_len > sizeof(uart_buf)) {
      ESP_LOGE(TAG, "Invalid length %u", (unsigned)prog_len);
      log_jsonl("input_error", "\"length_invalid\"");
      continue;
    }

    if (!read_exact(uart_buf, prog_len)) {
      ESP_LOGE(TAG, "Payload truncated (expected %u bytes)", (unsigned)prog_len);
      log_jsonl("input_error", "\"payload_missing\"");
      continue;
    }

    ESP_LOGI(TAG, "Executing CANBC payload...");
    canvm_run_buffer(uart_buf, prog_len, &addr);
    ESP_LOGI(TAG, "Execution complete; ready for next packet");
  }
}
