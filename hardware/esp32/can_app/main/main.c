#include <stdio.h>
#include <string.h>
#include <inttypes.h>

#include "esp_log.h"
#include "nvs_flash.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"

#include "tetragrammatron_schema.h"
#include "can_vm.h"
#include "config.h"
#if ENABLE_WIFI_MQTT
#include "wifi_mqtt.h"
#endif

static const char *TAG = "CAN_VM_ESP32";

#define UART_BUFFER_BYTES (4 * 1024)

static void log_jsonl(const char *kind, const char *msg) {
  printf("{\"kind\":\"%s\",\"msg\":%s}\n", kind, msg);
}

static bool read_exact(uint8_t *dst, size_t len) {
  size_t total = 0;
  // Use fread from stdin (console UART) with blocking
  while (total < len) {
    size_t n = fread(dst + total, 1, len - total, stdin);
    if (n == 0) {
      // No data available, check if it's EOF or just no data yet
      if (feof(stdin)) {
        return false;
      }
      // Not EOF, just no data - wait a bit and retry
      vTaskDelay(pdMS_TO_TICKS(10));
      continue;
    }
    total += n;
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
// Returns execution result and updates ctx->state
static can_vm_result_t canvm_run_buffer(const uint8_t *code, size_t code_len, const tg_addr8_t *addr, can_vm_ctx_t *ctx) {
  memset(ctx, 0, sizeof(can_vm_ctx_t));
  ctx->code = code;
  ctx->code_len = code_len;
  ctx->addr8 = addr->r;
  ctx->const_bytes = NULL;  // No constant pool for raw bytecode
  ctx->const_len = 0;
  ctx->emit_cb = emit_callback;
  ctx->emit_user_data = (void*)addr;  // Pass address for JSONL formatting

  char addr_str[32];
  format_addr_hex(addr, addr_str, sizeof(addr_str));

  ESP_LOGI(TAG, "Starting CAN VM execution: %zu bytes", code_len);
  log_jsonl("exec.start", "{}");

  can_vm_result_t result = can_vm_execute(ctx);

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
           ctx->state.steps, ctx->state.ticks, status_str, ctx->state.pc);
  log_jsonl("vm_done", json_buf);

  if (result == CAN_VM_HALT) {
    ESP_LOGI(TAG, "Execution halted normally: %zu steps, %" PRIu32 " ticks",
             ctx->state.steps, ctx->state.ticks);
  } else if (result != CAN_VM_OK) {
    ESP_LOGW(TAG, "Execution ended with status: %d", result);
  }

  // Free constant pool if allocated
  can_vm_free_const_pool(&ctx->const_pool);

  return result;
}

// Process a CANBC packet (from UART or MQTT)
static void process_canbc_packet(const uint8_t *addr_bytes, const uint8_t *payload, size_t payload_len) {
  tg_addr8_t addr;
  memcpy(addr.r, addr_bytes, 8);

  // Validate schema prefix (tg_schema_prefix_valid_global already checks for NULL schema)
  if (!tg_schema_prefix_valid_global(&addr)) {
    ESP_LOGE(TAG, "Schema gate reject: %02X:%02X:%02X:%02X:%02X",
             addr.r[0], addr.r[1], addr.r[2], addr.r[3], addr.r[4]);
    log_jsonl("schema_violation", "\"prefix_rejected\"");
    return;
  }

  ESP_LOGI(TAG, "Executing CANBC payload: %zu bytes", payload_len);
  can_vm_ctx_t ctx;
  can_vm_result_t result = canvm_run_buffer(payload, payload_len, &addr, &ctx);

  // Publish attestation via MQTT if enabled
#if ENABLE_WIFI_MQTT
  if (wifi_mqtt_is_connected()) {
    const char *status_str = (result == CAN_VM_HALT) ? "halt" : 
                            (result == CAN_VM_TRAP) ? "trap" : "ok";
    wifi_mqtt_publish_attestation(
      addr.r,
      NULL,  // schema_hash (could be extracted from schema if available)
      NULL,  // schema_class
      NULL,  // canbc_hash (could compute SHA-256 of payload)
      status_str,
      ctx.state.steps,
      ctx.state.ticks
    );
  }
#endif

  ESP_LOGI(TAG, "Execution complete");
}

// MQTT callback for received CANBC packets
#if ENABLE_WIFI_MQTT
static void mqtt_canbc_callback(const uint8_t *addr, const uint8_t *payload, size_t payload_len) {
  ESP_LOGI(TAG, "Received CANBC packet via MQTT");
  process_canbc_packet(addr, payload, payload_len);
}
#endif

void app_main(void) {
  ESP_ERROR_CHECK(nvs_flash_init());

  bool schema_loaded = tg_schema_load_embedded();
  if (!schema_loaded) {
    ESP_LOGE(TAG, "Schema load failed - continuing but execution will be rejected");
    log_jsonl("schema_error", "\"load_failed\"");
  } else {
    ESP_LOGI(TAG, "Schema loaded successfully");
  }

  ESP_LOGI(TAG, "Tetragrammatron CAN VM ready");
  ESP_LOGI(TAG, "Protocol: [8-byte addr][4-byte BE length][CANBC bytes]");

#if ENABLE_WIFI_MQTT
  // Initialize WiFi/MQTT if enabled
  wifi_mqtt_config_t wifi_config = {0};
  strncpy(wifi_config.ssid, WIFI_SSID, sizeof(wifi_config.ssid) - 1);
  strncpy(wifi_config.password, WIFI_PASSWORD, sizeof(wifi_config.password) - 1);
  strncpy(wifi_config.broker_host, MQTT_BROKER_HOST, sizeof(wifi_config.broker_host) - 1);
  wifi_config.broker_port = MQTT_BROKER_PORT;
  if (strlen(DEVICE_ID) > 0) {
    strncpy(wifi_config.device_id, DEVICE_ID, sizeof(wifi_config.device_id) - 1);
  }
  strncpy(wifi_config.client_id, wifi_config.device_id, sizeof(wifi_config.client_id) - 1);

  if (wifi_mqtt_init(&wifi_config, mqtt_canbc_callback)) {
    ESP_LOGI(TAG, "WiFi/MQTT initialized");
  } else {
    ESP_LOGE(TAG, "WiFi/MQTT initialization failed");
  }
#endif

  ESP_LOGI(TAG, "Waiting for input (UART%s)...", ENABLE_WIFI_MQTT ? " or MQTT" : "");

  static uint8_t uart_buf[UART_BUFFER_BYTES];

  // Main loop: process packets continuously from UART
  while (1) {
    tg_addr8_t addr = {0};
    uint8_t len_be[4];

    ESP_LOGI(TAG, "Waiting for address prefix (8 bytes) via UART...");
    
    if (!read_exact(addr.r, sizeof(addr.r))) {
      ESP_LOGW(TAG, "No UART input available, continuing to wait...");
      vTaskDelay(pdMS_TO_TICKS(100));  // Wait 100ms before retrying
      continue;
    }

    ESP_LOGI(TAG, "Received address via UART: %02X:%02X:%02X:%02X:%02X:%02X:%02X:%02X",
             addr.r[0], addr.r[1], addr.r[2], addr.r[3],
             addr.r[4], addr.r[5], addr.r[6], addr.r[7]);

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

    process_canbc_packet(addr.r, uart_buf, prog_len);
  }
}
