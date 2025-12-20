#include "can_vm.h"
#include <string.h>

void can_vm_init(can_vm_t *vm) {
    memset(vm->regs, 0, sizeof(vm->regs));
    vm->pc = vm->entry_pc;
    vm->halted = false;
    vm->faulted = false;

    // Enforce R0 = zero polynomial
    f2poly_zero(&vm->regs[0]);
}
