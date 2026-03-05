// addr_assign.c
// NOTE: This file should be moved to components/tetragrammatron_schema/ or similar
// Currently uses canonical header for ABI v2 compatibility

#include "../../components/tetragrammatron_schema/include/tetragrammatron_schema.h"
#include <string.h>
#include "esp_wifi.h"
#include "mbedtls/sha256.h"

typedef struct {
  uint32_t realm_id; // e.g. 0x74B2E1C0
} addr_realm_t;

static void sha256_bytes(const uint8_t *in, size_t inlen, uint8_t out32[32]) {
  mbedtls_sha256_context ctx;
  mbedtls_sha256_init(&ctx);
  mbedtls_sha256_starts_ret(&ctx, 0);
  mbedtls_sha256_update_ret(&ctx, in, inlen);
  mbedtls_sha256_finish_ret(&ctx, out32);
  mbedtls_sha256_free(&ctx);
}

bool addr_assign_instance(tg_addr8_t *a, uint32_t realm_id, uint8_t salt) {
  // Assumes R0..R4 already set to legal schema.
  if (!tg_schema_prefix_valid_global(a)) return false;

  uint8_t mac[6];
  esp_read_mac(mac, ESP_MAC_WIFI_STA);

  uint8_t buf[4 + 6 + 1 + 5];
  // realm_id
  buf[0] = (realm_id >> 24) & 0xFF;
  buf[1] = (realm_id >> 16) & 0xFF;
  buf[2] = (realm_id >>  8) & 0xFF;
  buf[3] = (realm_id >>  0) & 0xFF;
  // mac
  memcpy(buf + 4, mac, 6);
  // salt
  buf[10] = salt;
  // schema prefix (R0..R4) included to bind instance to schema
  memcpy(buf + 11, a->r, 5);

  uint8_t h[32];
  sha256_bytes(buf, sizeof(buf), h);

  a->r[5] = h[0];
  a->r[6] = h[1];
  a->r[7] = h[2];
  return true;
}