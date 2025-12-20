# 6) VM C Skeleton — `vm/can_vm.h`

```c
// vm/can_vm.h
#pragma once
#include <stdint.h>
#include <stddef.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

// --- CANB v1 constants ---
#define CANB_MAGIC0 0x43u
#define CANB_MAGIC1 0x41u
#define CANB_MAGIC2 0x4Eu
#define CANB_MAGIC3 0x42u

#define CANB_VER_V1 0x01u

// Opcodes (RFC-0012)
#define OP_CANON       0x10u
#define OP_MEET        0x20u
#define OP_JOIN        0x21u
#define OP_PROJ_FANO   0x30u
#define OP_ASSERT_IDEMP 0x31u
#define OP_COMMIT      0x40u
#define OP_EMIT_GEOM   0x50u

// Flags
#define FL_CANON_IN      (1u<<0)
#define FL_CANON_OUT     (1u<<1)
#define FL_PROOF_REQ     (1u<<2)
#define FL_EMIT          (1u<<3)

// Tag types for registers
typedef enum {
  TAG_EMPTY = 0,
  TAG_POLY  = 1,
  TAG_FANO  = 2,   // projected poly + triads
  TAG_HASH  = 3,
  TAG_GEOM  = 4
} can_tag_t;

// Forward declarations for canonical objects
typedef struct f2poly f2poly_t;

// Minimal Fano projection container
typedef struct {
  f2poly_t* poly;        // canonical poly
  uint8_t* triads;       // witness bytes
  uint32_t triads_len;
} fano_obj_t;

// Register cell
typedef struct {
  can_tag_t tag;
  union {
    f2poly_t* poly;
    fano_obj_t fano;
    struct { uint8_t bytes[32]; } hash;
    struct { uint32_t dummy; } geom;
  } as;
} can_reg_t;

// VM state
typedef struct {
  can_reg_t regs[256];

  // object pool (VM-specific): map REF32 -> canonical poly bytes / parsed poly
  const uint8_t* obj_pool;
  uint32_t obj_pool_len;

  // output hooks
  void (*emit_geom)(const uint8_t* evt, uint32_t len, void* user);
  void* emit_user;

  // error reporting
  int last_error;
} can_vm_t;

// Instruction decoded view (CANB v1)
typedef struct {
  uint8_t ver;
  uint8_t opcode;
  uint8_t flags;
  uint8_t rdst;
  uint8_t ra;
  uint8_t rb;
  uint16_t imm16;
  uint32_t ref32;
} can_inst_t;

// API
void can_vm_init(can_vm_t* vm);
int  can_vm_exec_stream(can_vm_t* vm, const uint8_t* code, uint32_t code_len);

// Implementations you provide (poly + codec + projection)
int can_load_poly_from_ref(can_vm_t* vm, uint32_t ref, f2poly_t** out_poly);   // MUST return canonical poly
int can_poly_canon(const f2poly_t* in, f2poly_t** out);
int can_poly_gcd(const f2poly_t* a, const f2poly_t* b, f2poly_t** out);
int can_poly_lcm(const f2poly_t* a, const f2poly_t* b, f2poly_t** out);
int can_proj_fano(const f2poly_t* in, fano_obj_t* out);                        // MUST fill triads
bool can_fano_valid(const uint8_t* triads, uint32_t len);
int can_commit_hash(const can_reg_t* obj, uint8_t out32[32]);

#ifdef __cplusplus
}
#endif
```

---
