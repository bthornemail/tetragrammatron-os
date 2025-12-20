# 8) VM Loop — `vm/can_vm.c`

This is the core execution loop. It’s written so you can wire it to:
- your **CLBC-POLY canonical decoder**
- your **poly gcd/lcm**
- your **Fano projection validator**
- your **hash function** (SHA-256)

```c
// vm/can_vm.c
#include "can_vm.h"
#include "can_codec.h"
#include <string.h>

enum {
  ERR_OK = 0,
  ERR_DECODE = 1,
  ERR_BADTAG = 2,
  ERR_PROOF  = 3,
  ERR_OP     = 4,
  ERR_LOAD   = 5,
  ERR_ASSERT = 6,
};

static void reg_clear(can_reg_t* r) {
  r->tag = TAG_EMPTY;
  memset(&r->as, 0, sizeof(r->as));
}

void can_vm_init(can_vm_t* vm) {
  memset(vm, 0, sizeof(*vm));
  for (int i=0;i<256;i++) reg_clear(&vm->regs[i]);
  vm->last_error = ERR_OK;
}

static int ensure_poly(can_vm_t* vm, uint8_t rix, f2poly_t** out) {
  can_reg_t* r = &vm->regs[rix];
  if (r->tag != TAG_POLY || r->as.poly == NULL) return ERR_BADTAG;
  *out = r->as.poly;
  return ERR_OK;
}

static int ensure_fano(can_vm_t* vm, uint8_t rix, fano_obj_t** out) {
  can_reg_t* r = &vm->regs[rix];
  if (r->tag != TAG_FANO) return ERR_BADTAG;
  *out = &r->as.fano;
  return ERR_OK;
}

static int op_canon(can_vm_t* vm, const can_inst_t* in) {
  // If REF32 is nonzero and RA is empty, allow loading into RA or treating RA as preloaded.
  // Minimal convention for demos: if ref32 != 0, load poly from ref32 into RA (if RA empty),
  // then canon into RDST.
  f2poly_t* a = NULL;

  if (in->ref32 != 0) {
    // load into RA register (overwrite allowed in demo mode)
    if (can_load_poly_from_ref(vm, in->ref32, &a) != 0) return ERR_LOAD;
    vm->regs[in->ra].tag = TAG_POLY;
    vm->regs[in->ra].as.poly = a;
  }

  if (ensure_poly(vm, in->ra, &a) != ERR_OK) return ERR_BADTAG;

  f2poly_t* out = NULL;
  if (can_poly_canon(a, &out) != 0) return ERR_OP;

  vm->regs[in->rdst].tag = TAG_POLY;
  vm->regs[in->rdst].as.poly = out;
  return ERR_OK;
}

static int op_meet(can_vm_t* vm, const can_inst_t* in) {
  f2poly_t* a=NULL; f2poly_t* b=NULL;
  if (ensure_poly(vm, in->ra, &a)!=ERR_OK) return ERR_BADTAG;
  if (ensure_poly(vm, in->rb, &b)!=ERR_OK) return ERR_BADTAG;

  f2poly_t* out=NULL;
  if (can_poly_gcd(a,b,&out)!=0) return ERR_OP;

  vm->regs[in->rdst].tag = TAG_POLY;
  vm->regs[in->rdst].as.poly = out;
  return ERR_OK;
}

static int op_join(can_vm_t* vm, const can_inst_t* in) {
  f2poly_t* a=NULL; f2poly_t* b=NULL;
  if (ensure_poly(vm, in->ra, &a)!=ERR_OK) return ERR_BADTAG;
  if (ensure_poly(vm, in->rb, &b)!=ERR_OK) return ERR_BADTAG;

  f2poly_t* out=NULL;
  if (can_poly_lcm(a,b,&out)!=0) return ERR_OP;

  vm->regs[in->rdst].tag = TAG_POLY;
  vm->regs[in->rdst].as.poly = out;
  return ERR_OK;
}

static int op_proj_fano(can_vm_t* vm, const can_inst_t* in) {
  f2poly_t* a=NULL;
  if (ensure_poly(vm, in->ra, &a)!=ERR_OK) return ERR_BADTAG;

  fano_obj_t fo;
  memset(&fo, 0, sizeof(fo));

  if (can_proj_fano(a, &fo) != 0) return ERR_OP;

  if ((in->flags & FL_PROOF_REQ) != 0) {
    if (!can_fano_valid(fo.triads, fo.triads_len)) return ERR_PROOF;
  }

  vm->regs[in->rdst].tag = TAG_FANO;
  vm->regs[in->rdst].as.fano = fo;
  return ERR_OK;
}

static int op_assert_idemp(can_vm_t* vm, const can_inst_t* in) {
  // Asserts op(op(x)) == op(x) for selected op in IMM16.
  // IMM16 codes from RFC-0012:
  // 0x0010 CANON, 0x0030 PROJ_FANO, 0x0020 MEET, 0x0021 JOIN
  const uint16_t sel = in->imm16;

  // We'll compute y=op(x) and z=op(y) and compare canonical bytes via commit_hash placeholder.
  // In a real implementation: compare canonical encodings byte-for-byte.
  uint8_t h_y[32], h_z[32];
  memset(h_y,0,32); memset(h_z,0,32);

  if (sel == 0x0010) {
    // CANON idempotence on Ra
    can_inst_t t = *in;
    t.opcode = OP_CANON;
    t.rdst = 250; t.ra = in->ra; t.rb = 0; t.ref32 = 0;
    if (op_canon(vm, &t)!=ERR_OK) return ERR_ASSERT;
    can_reg_t* ry = &vm->regs[250];
    if (can_commit_hash(ry, h_y)!=0) return ERR_ASSERT;

    t.rdst = 251; t.ra = 250;
    if (op_canon(vm, &t)!=ERR_OK) return ERR_ASSERT;
    can_reg_t* rz = &vm->regs[251];
    if (can_commit_hash(rz, h_z)!=0) return ERR_ASSERT;

  } else if (sel == 0x0030) {
    // PROJ_FANO idempotence on Ra (project twice)
    can_inst_t t = *in;
    t.opcode = OP_PROJ_FANO;
    t.rdst = 250; t.ra = in->ra; t.ref32 = 0;
    if (op_proj_fano(vm, &t)!=ERR_OK) return ERR_ASSERT;
    can_reg_t* ry = &vm->regs[250];
    if (can_commit_hash(ry, h_y)!=0) return ERR_ASSERT;

    // second projection uses the poly inside fano object
    fano_obj_t* fo=NULL;
    if (ensure_fano(vm, 250, &fo)!=ERR_OK) return ERR_ASSERT;
    // overwrite temp poly reg 252 with fo->poly then project again
    vm->regs[252].tag = TAG_POLY;
    vm->regs[252].as.poly = fo->poly;

    t.rdst = 251; t.ra = 252;
    if (op_proj_fano(vm, &t)!=ERR_OK) return ERR_ASSERT;
    can_reg_t* rz = &vm->regs[251];
    if (can_commit_hash(rz, h_z)!=0) return ERR_ASSERT;

  } else if (sel == 0x0020) {
    // MEET idempotence variant: meet(meet(x,b),b)=meet(x,b)
    can_inst_t t = *in;
    t.opcode = OP_MEET;
    t.rdst = 250; t.ra = in->ra; t.rb = in->rb;
    if (op_meet(vm, &t)!=ERR_OK) return ERR_ASSERT;
    if (can_commit_hash(&vm->regs[250], h_y)!=0) return ERR_ASSERT;

    t.rdst = 251; t.ra = 250; t.rb = in->rb;
    if (op_meet(vm, &t)!=ERR_OK) return ERR_ASSERT;
    if (can_commit_hash(&vm->regs[251], h_z)!=0) return ERR_ASSERT;

  } else if (sel == 0x0021) {
    // JOIN idempotence variant: join(join(x,b),b)=join(x,b)
    can_inst_t t = *in;
    t.opcode = OP_JOIN;
    t.rdst = 250; t.ra = in->ra; t.rb = in->rb;
    if (op_join(vm, &t)!=ERR_OK) return ERR_ASSERT;
    if (can_commit_hash(&vm->regs[250], h_y)!=0) return ERR_ASSERT;

    t.rdst = 251; t.ra = 250; t.rb = in->rb;
    if (op_join(vm, &t)!=ERR_OK) return ERR_ASSERT;
    if (can_commit_hash(&vm->regs[251], h_z)!=0) return ERR_ASSERT;

  } else {
    return ERR_ASSERT;
  }

  if (memcmp(h_y, h_z, 32) != 0) return ERR_ASSERT;
  return ERR_OK;
}

static int op_commit(can_vm_t* vm, const can_inst_t* in) {
  can_reg_t* a = &vm->regs[in->ra];
  uint8_t h[32];
  if (can_commit_hash(a, h)!=0) return ERR_OP;
  vm->regs[in->rdst].tag = TAG_HASH;
  memcpy(vm->regs[in->rdst].as.hash.bytes, h, 32);
  return ERR_OK;
}

static int op_emit_geom(can_vm_t* vm, const can_inst_t* in) {
  if (!vm->emit_geom) return ERR_OK;

  // For this vertical slice: emit a tiny event blob (opcode + reg tag).
  // Replace with deterministic SVG/OBJ/GLB event stream later.
  uint8_t evt[8];
  evt[0] = 0xEE;
  evt[1] = vm->regs[in->ra].tag;
  evt[2] = in->opcode;
  evt[3] = in->flags;
  evt[4] = in->ra;
  evt[5] = 0;
  evt[6] = 0;
  evt[7] = 0;
  vm->emit_geom(evt, (uint32_t)sizeof(evt), vm->emit_user);
  return ERR_OK;
}

int can_vm_exec_stream(can_vm_t* vm, const uint8_t* code, uint32_t code_len) {
  uint32_t pc = 0;
  vm->last_error = ERR_OK;

  while (pc + 16 <= code_len) {
    can_inst_t inst;
    if (!can_decode_inst(code + pc, code_len - pc, &inst)) {
      vm->last_error = ERR_DECODE;
      return vm->last_error;
    }

    int rc = ERR_OK;
    switch (inst.opcode) {
      case OP_CANON:        rc = op_canon(vm, &inst); break;
      case OP_MEET:         rc = op_meet(vm, &inst); break;
      case OP_JOIN:         rc = op_join(vm, &inst); break;
      case OP_PROJ_FANO:    rc = op_proj_fano(vm, &inst); break;
      case OP_ASSERT_IDEMP: rc = op_assert_idemp(vm, &inst); break;
      case OP_COMMIT:       rc = op_commit(vm, &inst); break;
      case OP_EMIT_GEOM:    rc = op_emit_geom(vm, &inst); break;
      default:
        rc = ERR_OP; break;
    }

    if (rc != ERR_OK) {
      vm->last_error = rc;
      return rc;
    }

    pc += 16;
  }
  return ERR_OK;
}
```

---
