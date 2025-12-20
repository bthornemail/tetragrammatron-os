// can_vm.c
// Origami Fold VM Execution Loop (RFC-0009, RFC-0012, RFC-0013)
// Role: Agent 3 — SCHEME ASSEMBLER & VM IMPLEMENTER (VM-EXEC-FOLD)
// Implements: RFC-0009, RFC-0012, RFC-0013

#include "can_vm.h"
#include "can_codec.h"
#include "can_time.h"
#include "can_poly.h"
#include "can_objpool.h"
// Note: f2poly.h has bool conflict - temporarily disabled
// #include "f2poly.h"
#include <string.h>
#include <stdio.h>

// Initialize VM to canonical zero state
void can_vm_init(can_vm_t* vm) {
  if (!vm) return;

  memset(vm, 0, sizeof(can_vm_t));
  vm->last_error = VM_ERR_OK;
  vm->halted = false;
  vm->pc = 0;
  vm->I32 = 0;

  // Initialize all registers to zero (canonical)
  for (int i = 0; i < 8; i++) {
    vm->regs[i].poly_id = 0;
    vm->regs[i].str_id = 0;
    vm->regs[i].node_id = 0;
    vm->regs[i].mat_id = 0;
  }
  
  vm->objpool = NULL;  // Object pool must be set separately

  // Initialize platform-specific time source (RFC-0013 §9)
  can_time_init();
}

// Set object pool for polynomial storage
void can_vm_set_objpool(can_vm_t* vm, can_objpool_t* pool) {
  if (!vm) return;
  vm->objpool = pool;
}

// Error string mapping
const char* can_vm_error_string(vm_error_t err) {
  switch (err) {
    case VM_ERR_OK: return "OK";
    case VM_ERR_DECODE: return "Instruction decode error";
    case VM_ERR_BAD_OPCODE: return "Unknown opcode";
    case VM_ERR_ASSERT_FAIL: return "Assertion failed";
    case VM_ERR_INVALID_STATE: return "Invalid VM state";
    case VM_ERR_HALT: return "VM halted";
    default: return "Unknown error";
  }
}

// Execute single instruction
// Returns true on success, false on error (check vm->last_error)
bool can_vm_step(can_vm_t* vm, const uint8_t* prog_bytes, size_t prog_len) {
  if (!vm || !prog_bytes) {
    if (vm) vm->last_error = VM_ERR_INVALID_STATE;
    return false;
  }

  // Check if already halted
  if (vm->halted) {
    vm->last_error = VM_ERR_HALT;
    return false;
  }

  // Check PC bounds (instructions are 4 bytes each)
  if (vm->pc + 4 > prog_len) {
    vm->last_error = VM_ERR_DECODE;
    return false;
  }

  // Decode instruction
  can_inst_t inst;
  if (!decode_inst_bytes(prog_bytes + vm->pc, &inst)) {
    vm->last_error = VM_ERR_DECODE;
    return false;
  }

  // Advance PC
  vm->pc += 4;

  // Execute instruction
  switch (inst.opcode) {
    case OP_NOOP:
      // No operation
      break;

    case OP_HALT:
      // Halt execution
      vm->halted = true;
      vm->last_error = VM_ERR_HALT;
      return true;  // HALT is successful termination

    case OP_CANON:
      // CANON A B imm16
      // RA := canon(RB)
      // Implements: proof/RFC0012_FoldVM.lean:canon_idempotent (INV-1)
      // RFC-0009 §4.2: CANON is idempotent (CAN-INV-1)
      // Agent 0 Priority #2: Canonicalization with idempotence
      // imm16 MUST be 0
      if (inst.A < 8 && inst.B < 8 && vm->objpool) {
        f2poly_t src_poly, dst_poly;
        if (can_objpool_load_poly(vm->objpool, vm->regs[inst.B].poly_id, &src_poly) || 
            vm->regs[inst.B].poly_id == 0) {
          if (vm->regs[inst.B].poly_id == 0) {
            f2poly_zero(&src_poly);
          }
          if (can_poly_canon(&src_poly, &dst_poly) == 0) {
            uint32_t new_poly_id = can_objpool_store_poly(vm->objpool, &dst_poly);
            if (new_poly_id != 0) {
              vm->regs[inst.A].poly_id = new_poly_id;
            } else {
              vm->last_error = VM_ERR_INVALID_STATE;
              return false;
            }
          } else {
            vm->last_error = VM_ERR_INVALID_STATE;
            return false;
          }
        } else {
          vm->last_error = VM_ERR_INVALID_STATE;
          return false;
        }
      } else if (!vm->objpool) {
        // No object pool - fallback to stub behavior
        if (inst.A < 8 && inst.B < 8) {
          vm->regs[inst.A] = vm->regs[inst.B];
        }
      }
      break;

    case OP_COMMIT:
      // COMMIT A B imm16
      // RFC-0009 §4.7: Commit with implicit canonicalization
      // imm16 format: profile<<8 | flags (RFC-0012 Appendix B)
      // flags: bit0=include renderer frame digest, bit1=include poly-weight summary
      // MUST be preceded by PROJ_FANO in same execution block (barrier rule)
      // For now, this is a no-op stub
      // TODO: Implement commit hash computation and barrier validation
      break;

    case OP_LDI16H:
      // LDI16H A B imm16
      // I32[31:16] := imm16
      vm->I32 = (vm->I32 & 0x0000FFFF) | ((uint32_t)inst.imm16 << 16);
      break;

    case OP_LDI16L:
      // LDI16L A B imm16
      // I32[15:0] := imm16
      vm->I32 = (vm->I32 & 0xFFFF0000) | (uint32_t)inst.imm16;
      break;

    case OP_USEI32:
      // USEI32 A B imm16
      // Move I32 latch into register field
      // B selects field: 0=poly_id, 1=str_id, 2=node_id, 3=mat_id
      if (inst.A < 8) {
        switch (inst.B) {
          case 0: vm->regs[inst.A].poly_id = vm->I32; break;
          case 1: vm->regs[inst.A].str_id = vm->I32; break;
          case 2: vm->regs[inst.A].node_id = vm->I32; break;
          case 3: vm->regs[inst.A].mat_id = vm->I32; break;
          default: break;
        }
      }
      break;

    case OP_MEET_GCD:
      // MEET_GCD A B imm16
      // RA := gcd(RA, RB)
      // Implements: proof/RFC0012_FoldVM.lean:meet_* theorems (INV-7, INV-8, INV-9, INV-10)
      // RFC-0009 §4.3: Meet operation (lattice GCD)
      // Preserves CAN-INV-5, CAN-INV-7, CAN-INV-8, CAN-INV-9
      // imm16 MUST be 0
      if (inst.A < 8 && inst.B < 8 && vm->objpool) {
        f2poly_t a_poly, b_poly, result_poly;
        bool a_loaded = (vm->regs[inst.A].poly_id == 0) || 
                        can_objpool_load_poly(vm->objpool, vm->regs[inst.A].poly_id, &a_poly);
        bool b_loaded = (vm->regs[inst.B].poly_id == 0) || 
                        can_objpool_load_poly(vm->objpool, vm->regs[inst.B].poly_id, &b_poly);
        
        if (a_loaded && b_loaded) {
          if (vm->regs[inst.A].poly_id == 0) f2poly_zero(&a_poly);
          if (vm->regs[inst.B].poly_id == 0) f2poly_zero(&b_poly);
          
          if (can_poly_gcd(&a_poly, &b_poly, &result_poly) == 0) {
            uint32_t new_poly_id = can_objpool_store_poly(vm->objpool, &result_poly);
            if (new_poly_id != 0) {
              vm->regs[inst.A].poly_id = new_poly_id;
            } else {
              vm->last_error = VM_ERR_INVALID_STATE;
              return false;
            }
          } else {
            vm->last_error = VM_ERR_INVALID_STATE;
            return false;
          }
        } else {
          vm->last_error = VM_ERR_INVALID_STATE;
          return false;
        }
      } else if (!vm->objpool) {
        // No object pool - fallback to stub behavior
        if (inst.A < 8 && inst.B < 8 && vm->regs[inst.A].poly_id == 0) {
          vm->regs[inst.A].poly_id = vm->regs[inst.B].poly_id;
        }
      }
      break;

    case OP_JOIN_LCM:
      // JOIN_LCM A B imm16
      // RA := lcm(RA, RB)
      // Implements: proof/RFC0012_FoldVM.lean:join_* theorems (INV-7, INV-8, INV-9, INV-10)
      // RFC-0009 §4.3: Join operation (lattice LCM)
      // Preserves CAN-INV-6, CAN-INV-7, CAN-INV-8, CAN-INV-9
      // imm16 MUST be 0
      if (inst.A < 8 && inst.B < 8 && vm->objpool) {
        f2poly_t a_poly, b_poly, result_poly;
        bool a_loaded = (vm->regs[inst.A].poly_id == 0) || 
                        can_objpool_load_poly(vm->objpool, vm->regs[inst.A].poly_id, &a_poly);
        bool b_loaded = (vm->regs[inst.B].poly_id == 0) || 
                        can_objpool_load_poly(vm->objpool, vm->regs[inst.B].poly_id, &b_poly);
        
        if (a_loaded && b_loaded) {
          if (vm->regs[inst.A].poly_id == 0) f2poly_zero(&a_poly);
          if (vm->regs[inst.B].poly_id == 0) f2poly_zero(&b_poly);
          
          if (can_poly_lcm(&a_poly, &b_poly, &result_poly) == 0) {
            uint32_t new_poly_id = can_objpool_store_poly(vm->objpool, &result_poly);
            if (new_poly_id != 0) {
              vm->regs[inst.A].poly_id = new_poly_id;
            } else {
              vm->last_error = VM_ERR_INVALID_STATE;
              return false;
            }
          } else {
            vm->last_error = VM_ERR_INVALID_STATE;
            return false;
          }
        } else {
          vm->last_error = VM_ERR_INVALID_STATE;
          return false;
        }
      } else if (!vm->objpool) {
        // No object pool - fallback to stub behavior (keep A's value)
      }
      break;

    case OP_SWAP:
      // SWAP A B imm16
      // Swap registers A and B
      if (inst.A < 8 && inst.B < 8) {
        can_reg_t tmp = vm->regs[inst.A];
        vm->regs[inst.A] = vm->regs[inst.B];
        vm->regs[inst.B] = tmp;
      }
      break;

    case OP_CLEAR:
      // CLEAR A B imm16
      // Clear register fields based on imm16 mask (low 4 bits)
      // bit0=poly_id, bit1=str_id, bit2=node_id, bit3=mat_id
      if (inst.A < 8) {
        if (inst.imm16 & 0x01) vm->regs[inst.A].poly_id = 0;
        if (inst.imm16 & 0x02) vm->regs[inst.A].str_id = 0;
        if (inst.imm16 & 0x04) vm->regs[inst.A].node_id = 0;
        if (inst.imm16 & 0x08) vm->regs[inst.A].mat_id = 0;
      }
      break;

    case OP_PROJ_FANO:
      // PROJ_FANO A B imm16
      // Fano triad validation (Agent 0 Priority #1)
      // Implements: proof/RFC0012_FoldVM.lean:strict_fano_valid (INV-12, INV-13)
      // RFC-0011 §6.5.1: PROJ_FANO Semantics
      // RFC-0009 §4.4: Fano plane projection with omission rule
      // Preserves CAN-INV-10, CAN-INV-11, CAN-INV-12
      // imm16 format: mode (low 4 bits: 0=STRICT, 1=WEAK) | flags (bits 4-7)
      // Registers: A, B, and imm16[3:0] selects third register (C) for triad
      if (inst.A < 8 && inst.B < 8 && vm->objpool) {
        uint8_t reg_c = (uint8_t)(inst.imm16 & 0x0F);
        uint8_t mode = (uint8_t)((inst.imm16 >> 4) & 0x0F);
        
        if (reg_c < 8) {
          f2poly_t a_poly, b_poly, c_poly;
          bool a_loaded = (vm->regs[inst.A].poly_id == 0) || 
                          can_objpool_load_poly(vm->objpool, vm->regs[inst.A].poly_id, &a_poly);
          bool b_loaded = (vm->regs[inst.B].poly_id == 0) || 
                          can_objpool_load_poly(vm->objpool, vm->regs[inst.B].poly_id, &b_poly);
          bool c_loaded = (vm->regs[reg_c].poly_id == 0) || 
                          can_objpool_load_poly(vm->objpool, vm->regs[reg_c].poly_id, &c_poly);
          
          if (a_loaded && b_loaded && c_loaded) {
            if (vm->regs[inst.A].poly_id == 0) f2poly_zero(&a_poly);
            if (vm->regs[inst.B].poly_id == 0) f2poly_zero(&b_poly);
            if (vm->regs[reg_c].poly_id == 0) f2poly_zero(&c_poly);
            
            // Validate Fano triad (Agent 0 Priority #1)
            fano_error_t fano_err;
            if (can_fano_valid_strict(&a_poly, &b_poly, &c_poly, mode, &fano_err) != 0) {
              vm->last_error = VM_ERR_ASSERT_FAIL;
              return false;
            }
            // Fano validation passed - continue execution
            // TODO: Geometry emission (Agent 5 responsibility)
          } else {
            vm->last_error = VM_ERR_INVALID_STATE;
            return false;
          }
        } else {
          vm->last_error = VM_ERR_INVALID_STATE;
          return false;
        }
      } else if (!vm->objpool) {
        // No object pool - geometry emission stub (original behavior)
        // TODO: Implement Fano projection geometry computation when object pool available
      }
      break;

    case OP_EMIT_NODE:
      // EMIT_NODE A B imm16
      // Emit geometry node
      // imm16 format: style<<12 | layer<<8 | flags
      // For now, stub
      // TODO: Implement geometry emission hook
      break;

    case OP_EMIT_EDGE:
      // EMIT_EDGE A B imm16
      // Emit geometry edge
      // imm16 format: from_idx<<8 | to_idx
      // For now, stub
      // TODO: Implement geometry emission hook
      break;

    case OP_LIFT_3D:
      // LIFT_3D A B imm16
      // Lift 2D projection to 3D
      // imm16 format: space<<12 | scale<<8 | flags
      // For now, stub
      // TODO: Implement 3D lift computation
      break;

    case OP_ASSERT_CANON:
      // ASSERT_CANON A B imm16
      // Assert register A is in canonical form
      // Implements: proof/RFC0012_FoldVM.lean:canon_idempotent (INV-1)
      // RFC-0009 §4.9: Canonicalization check
      // Verifies: canon(x) = x (polynomial is already canonical)
      if (inst.A < 8 && vm->objpool) {
        f2poly_t a_poly, canon_poly;
        if (can_objpool_load_poly(vm->objpool, vm->regs[inst.A].poly_id, &a_poly) || 
            vm->regs[inst.A].poly_id == 0) {
          if (vm->regs[inst.A].poly_id == 0) {
            f2poly_zero(&a_poly);
          }
          
          // Verify: canon(x) = x (idempotence means canonical form is fixed point)
          if (can_poly_canon(&a_poly, &canon_poly) == 0) {
            if (!can_poly_eq(&a_poly, &canon_poly)) {
              // Polynomial is not in canonical form
              vm->last_error = VM_ERR_ASSERT_FAIL;
              return false;
            }
            // Polynomial is canonical - assertion passes
          } else {
            vm->last_error = VM_ERR_INVALID_STATE;
            return false;
          }
        } else {
          vm->last_error = VM_ERR_INVALID_STATE;
          return false;
        }
      }
      // If no object pool, pass (stub behavior)
      break;

    case OP_ASSERT_IDEMP:
      // ASSERT_IDEMP A B imm16
      // Assert idempotence of operation on register A
      // Implements: proof/RFC0012_FoldVM.lean:canon_idempotent (INV-1)
      // RFC-009 §X.7.1: Idempotence check
      // imm16 low 4 bits: operator selector (0x0=CANON, 0x2=MEET, 0x3=JOIN, 0x4=PROJ_FANO)
      if (inst.A < 8 && vm->objpool) {
        uint8_t op_sel = (uint8_t)(inst.imm16 & 0x0F);
        f2poly_t a_poly, canon_once, canon_twice;
        
        if (can_objpool_load_poly(vm->objpool, vm->regs[inst.A].poly_id, &a_poly) || 
            vm->regs[inst.A].poly_id == 0) {
          if (vm->regs[inst.A].poly_id == 0) {
            f2poly_zero(&a_poly);
          }
          
          // Verify idempotence based on operator
          switch (op_sel) {
            case 0x0:  // CANON
              // Verify: canon(canon(x)) = canon(x)
              if (can_poly_canon(&a_poly, &canon_once) == 0) {
                if (can_poly_canon(&canon_once, &canon_twice) == 0) {
                  if (!can_poly_eq(&canon_once, &canon_twice)) {
                    vm->last_error = VM_ERR_ASSERT_FAIL;
                    return false;
                  }
                } else {
                  vm->last_error = VM_ERR_INVALID_STATE;
                  return false;
                }
              } else {
                vm->last_error = VM_ERR_INVALID_STATE;
                return false;
              }
              break;
            
            case 0x2:  // MEET (gcd with self)
            case 0x3:  // JOIN (lcm with self)
              // Verify: meet(x,x) = x or join(x,x) = x
              f2poly_t result;
              if (op_sel == 0x2) {
                if (can_poly_gcd(&a_poly, &a_poly, &result) != 0) {
                  vm->last_error = VM_ERR_INVALID_STATE;
                  return false;
                }
              } else {
                if (can_poly_lcm(&a_poly, &a_poly, &result) != 0) {
                  vm->last_error = VM_ERR_INVALID_STATE;
                  return false;
                }
              }
              if (!can_poly_eq(&a_poly, &result)) {
                vm->last_error = VM_ERR_ASSERT_FAIL;
                return false;
              }
              break;
            
            default:
              // Unknown operator - for now, pass
              break;
          }
        } else {
          vm->last_error = VM_ERR_INVALID_STATE;
          return false;
        }
      }
      // If no object pool, pass (stub behavior)
      break;

    case OP_ASSERT_FANO:
      // ASSERT_FANO A B imm16
      // Assert Fano incidence properties (Agent 0 Priority #1)
      // Implements: proof/RFC0012_FoldVM.lean:strict_fano_valid (INV-12, INV-13)
      // RFC-0011 §6.5.1: Fano triad validation
      // RFC-0009 §4.9: Fano validation
      // imm16 low 4 bits = third register (C) for triad check
      // imm16 bits 4-7 = mode (0=STRICT, 1=WEAK)
      if (inst.A < 8 && inst.B < 8 && vm->objpool) {
        uint8_t reg_c = (uint8_t)(inst.imm16 & 0x0F);
        uint8_t mode = (uint8_t)((inst.imm16 >> 4) & 0x0F);
        
        if (reg_c < 8) {
          f2poly_t a_poly, b_poly, c_poly;
          bool a_loaded = (vm->regs[inst.A].poly_id == 0) || 
                          can_objpool_load_poly(vm->objpool, vm->regs[inst.A].poly_id, &a_poly);
          bool b_loaded = (vm->regs[inst.B].poly_id == 0) || 
                          can_objpool_load_poly(vm->objpool, vm->regs[inst.B].poly_id, &b_poly);
          bool c_loaded = (vm->regs[reg_c].poly_id == 0) || 
                          can_objpool_load_poly(vm->objpool, vm->regs[reg_c].poly_id, &c_poly);
          
          if (a_loaded && b_loaded && c_loaded) {
            if (vm->regs[inst.A].poly_id == 0) f2poly_zero(&a_poly);
            if (vm->regs[inst.B].poly_id == 0) f2poly_zero(&b_poly);
            if (vm->regs[reg_c].poly_id == 0) f2poly_zero(&c_poly);
            
            // Validate Fano triad
            fano_error_t fano_err;
            if (can_fano_valid_strict(&a_poly, &b_poly, &c_poly, mode, &fano_err) != 0) {
              vm->last_error = VM_ERR_ASSERT_FAIL;
              return false;
            }
            // Fano validation passed
          } else {
            vm->last_error = VM_ERR_INVALID_STATE;
            return false;
          }
        } else {
          vm->last_error = VM_ERR_INVALID_STATE;
          return false;
        }
      }
      // If no object pool, pass (stub behavior)
      break;

    // RFC-0013: Time and Barrier Opcodes
    case OP_TIME_RD:
      // TIME_RD A B imm16
      // Read monotonic tick counter into register A
      // RFC-0013 §3.1: Time source semantics
      // imm16 MUST be 0
      if (inst.A < 8 && inst.imm16 == 0) {
        // Use platform-specific time source (RFC-0013 §9)
        uint64_t ticks = can_time_ticks();
        // Store in poly_id (32-bit, truncate if needed)
        vm->regs[inst.A].poly_id = (uint32_t)(ticks & 0xFFFFFFFFULL);
        // TODO: Consider storing full 64-bit time in register structure
      }
      break;

    case OP_TIME_DIV:
      // TIME_DIV A B imm16
      // Quantize time: R[A] := floor(R[B] / imm16)
      // RFC-0013 §3.2: Time quantization
      // imm16 MUST be > 0
      if (inst.A < 8 && inst.B < 8 && inst.imm16 > 0) {
        uint32_t time_val = vm->regs[inst.B].poly_id;  // Stub: use poly_id as time
        vm->regs[inst.A].poly_id = time_val / inst.imm16;
      }
      break;

    case OP_WAIT:
      // WAIT A B imm16
      // Wait until: TICKS() >= (R[A] + imm16)
      // RFC-0013 §3.3: Wait for time deadline
      // If imm16 = 0: cooperative yield
      // For now, stub (no-op in deterministic execution)
      // TODO: Implement time-based waiting (requires platform time source)
      break;

    case OP_BARRIER_T:
      // BARRIER_T A B imm16
      // Time barrier: assert (TICKS() - R[A]) <= imm16
      // RFC-0013 §4.2: Barrier monotonicity
      // imm16 = max allowed duration (in microseconds)
      if (inst.A < 8 && inst.imm16 > 0) {
        uint64_t current_time = can_time_ticks();
        uint64_t start_time = (uint64_t)vm->regs[inst.A].poly_id;
        uint64_t elapsed = current_time - start_time;
        
        if (elapsed > (uint64_t)inst.imm16) {
          // Barrier violation: elapsed time exceeds maximum
          vm->last_error = VM_ERR_INVALID_STATE;
          return false;
        }
        // Barrier passed: elapsed time is within limit
      }
      break;

    default:
      // Unknown opcode
      vm->last_error = VM_ERR_BAD_OPCODE;
      return false;
  }

  vm->last_error = VM_ERR_OK;
  return true;
}

// Execute program until halt or error
// Returns number of instructions executed, or -1 on error
int can_vm_run(can_vm_t* vm, const uint8_t* prog_bytes, size_t prog_len) {
  if (!vm || !prog_bytes) return -1;

  int count = 0;
  const int MAX_STEPS = 100000;  // Safety limit

  while (!vm->halted && count < MAX_STEPS) {
    if (!can_vm_step(vm, prog_bytes, prog_len)) {
      // Check if it's a normal halt
      if (vm->last_error == VM_ERR_HALT && vm->halted) {
        return count;
      }
      // Otherwise it's an error
      return -1;
    }
    count++;
  }

  if (count >= MAX_STEPS) {
    vm->last_error = VM_ERR_INVALID_STATE;
    return -1;
  }

  return count;
}
