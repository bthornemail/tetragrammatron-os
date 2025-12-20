#include "can_vm.h"

void can_vm_run(can_vm_t *vm, uint32_t max_steps) {
    uint32_t steps = 0;
    while (!vm->halted && !vm->faulted && steps < max_steps) {
        can_vm_step(vm);
        steps++;
    }
}
