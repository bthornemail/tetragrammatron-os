
// collision.c (sketch)
#include "addr_schema.h"
#include <string.h>

typedef struct {
  addr8_t addr;
  uint8_t mac[6];
  uint32_t nonce;
} hello_t;

// return <0 if a wins, >0 if b wins
static int tie_cmp(const uint8_t macA[6], uint32_t nonceA,
                   const uint8_t macB[6], uint32_t nonceB) {
  // lexicographic compare of (mac||nonce)
  for (int i=0;i<6;i++) { if (macA[i]!=macB[i]) return (macA[i]<macB[i])?-1:1; }
  if (nonceA == nonceB) return 0;
  return (nonceA < nonceB) ? -1 : 1;
}

bool addr_handle_collision(addr8_t *self, const hello_t *other,
                           const uint8_t selfMac[6], uint32_t selfNonce,
                           uint32_t realm_id) {
  if (memcmp(self->r, other->addr.r, 8) != 0) return false; // no collision

  int c = tie_cmp(selfMac, selfNonce, other->mac, other->nonce);
  if (c < 0) {
    // we win, keep address
    return true;
  } else {
    // we lose: re-key instance bytes by incrementing salt until no collision
    for (uint8_t salt = 1; salt != 0; salt++) {
      addr_assign_instance(self, realm_id, salt);
      if (memcmp(self->r, other->addr.r, 8) != 0) break;
    }
    return true;
  }
}