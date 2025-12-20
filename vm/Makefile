# Makefile for Origami Fold VM
# Role B: COMPILER / VM IMPLEMENTER

CC = gcc
CFLAGS = -Wall -Wextra -std=c11 -O2
INCLUDES = -I.

OBJS = can_vm.o can_codec.o can_vm_test.o
TARGET = can_vm_test

.PHONY: all clean test

all: $(TARGET)

can_vm.o: can_vm.c can_vm.h can_codec.h
	$(CC) $(CFLAGS) $(INCLUDES) -c can_vm.c -o can_vm.o

can_codec.o: can_codec.c can_codec.h
	$(CC) $(CFLAGS) $(INCLUDES) -c can_codec.c -o can_codec.o

can_vm_test.o: can_vm_test.c can_vm.h can_codec.h
	$(CC) $(CFLAGS) $(INCLUDES) -c can_vm_test.c -o can_vm_test.o

$(TARGET): $(OBJS)
	$(CC) $(CFLAGS) -o $(TARGET) $(OBJS)

clean:
	rm -f $(OBJS) $(TARGET)

test: $(TARGET)
	./$(TARGET)

