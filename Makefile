# Makefile for Tetragrammatron-OS
# Builds VM core and tools

CC = gcc
CFLAGS = -Wall -Wextra -std=c11 -O2
SCHEME = guile
FANO_BASE ?= origin/main

# Directories
VM_DIR = vm
TOOLS_DIR = tools
EXAMPLES_DIR = examples
BYTECODE_DIR = bytecode

# VM object files
VM_OBJS = $(VM_DIR)/can_codec.o $(VM_DIR)/can_vm.o

.PHONY: all clean vm tools examples repo-lattice repo-check repo-verify agent0-check

all: vm tools

vm: $(VM_OBJS)

tools:
	@echo "Tools are Scheme scripts - use guile/racket directly"
	@echo "Example: guile -s $(TOOLS_DIR)/can-asm.scm $(EXAMPLES_DIR)/fold_min.canasm $(BYTECODE_DIR)/fold_min.canb"

examples: $(BYTECODE_DIR)
	@echo "Assembling example programs..."
	@echo "Run: guile -s $(TOOLS_DIR)/can-asm.scm $(EXAMPLES_DIR)/fold_min.canasm $(BYTECODE_DIR)/fold_min.canb"

$(BYTECODE_DIR):
	mkdir -p $(BYTECODE_DIR)

# VM compilation
$(VM_DIR)/can_codec.o: $(VM_DIR)/can_codec.c $(VM_DIR)/can_codec.h $(VM_DIR)/can_vm.h
	$(CC) $(CFLAGS) -c $< -o $@

$(VM_DIR)/can_vm.o: $(VM_DIR)/can_vm.c $(VM_DIR)/can_vm.h $(VM_DIR)/can_codec.h
	$(CC) $(CFLAGS) -c $< -o $@

repo-lattice:
	python3 tools/gen_repo_canvasl.py

repo-check:
	python3 tools/gen_repo_canvasl.py --check

repo-verify: repo-check
	python3 tools/fano-merge-check.py $(FANO_BASE) HEAD

agent0-check:
	python3 tools/agent0-observer.py $(FANO_BASE) HEAD

clean:
	rm -f $(VM_OBJS)
	rm -rf $(BYTECODE_DIR)
