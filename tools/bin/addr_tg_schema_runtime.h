// addr_schema_runtime.h
#pragma once
#include <stdint.h>
#include <stdbool.h>

typedef struct {
  uint8_t fixed;
  uint8_t allowed_count;
  uint8_t mode;          // 0 any, 1 private7, 2 public4
  uint8_t allowed[16];
} tg_row_spec_t;

bool tg_schema_mode_ok(const tg_schema_t *s,
                       const tg_addr8_t *a,
                       uint8_t projected_residue /* 0..7 */) {
  for (int i = 0; i < s->schema_rows; i++) {
  uint8_t mode = s->row[i].mode;
    if (mode == 1) { // private7
      if (projected_residue == 6) return false;
    }
    if (mode == 2) { // public4
    // allowed residues {0,1,3,5}
    if (!(projected_residue==0 || projected_residue==1 ||
          projected_residue==3 || projected_residue==5))
      return false;
    }
  }
  return true;
}