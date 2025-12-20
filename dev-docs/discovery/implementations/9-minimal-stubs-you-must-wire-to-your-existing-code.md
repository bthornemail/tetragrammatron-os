# 9) Minimal “stubs” you must wire to your existing code

Create `vm/can_poly_stub.c` (temporary) and replace stubs with your real:

- `clbc_poly_decode`
- `f2poly_normalize`
- `f2poly_gcd`
- `f2poly_lcm`
- `sha256`

```c
// vm/can_poly_stub.c
#include "can_vm.h"
#include <string.h>

// IMPORTANT: Replace f2poly_t with your real type.
struct f2poly { uint32_t dummy; };

int can_load_poly_from_ref(can_vm_t* vm, uint32_t ref, f2poly_t** out_poly) {
  // TODO: interpret vm->obj_pool as a container; locate object "ref".
  // For now: just return a non-null pointer to show the pipeline works.
  static f2poly_t P;
  *out_poly = &P;
  return 0;
}

int can_poly_canon(const f2poly_t* in, f2poly_t** out) {
  *out = (f2poly_t*)in;
  return 0;
}

int can_poly_gcd(const f2poly_t* a, const f2poly_t* b, f2poly_t** out) {
  *out = (f2poly_t*)a;
  return 0;
}

int can_poly_lcm(const f2poly_t* a, const f2poly_t* b, f2poly_t** out) {
  *out = (f2poly_t*)a;
  return 0;
}

int can_proj_fano(const f2poly_t* in, fano_obj_t* out) {
  static uint8_t triads[3] = {1,2,4}; // placeholder
  out->poly = (f2poly_t*)in;
  out->triads = triads;
  out->triads_len = 3;
  return 0;
}

bool can_fano_valid(const uint8_t* triads, uint32_t len) {
  // TODO: validate against your canonical 7 triads
  (void)triads; (void)len;
  return true;
}

int can_commit_hash(const can_reg_t* obj, uint8_t out32[32]) {
  // TODO: replace with SHA256(canonical-bytes(obj))
  memset(out32, 0, 32);
  out32[0] = (uint8_t)obj->tag;
  return 0;
}
```

---
