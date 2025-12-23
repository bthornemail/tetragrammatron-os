#!/usr/bin/env python3
"""
Test script to send CanISA bytecode programs to ESP32.

Usage:
    python3 test_canisa.py <serial_port> [program_name]

Programs:
    - nop: NOP + HALT (minimal test)
    - load: LOAD8 + EMIT8 + HALT
    - math: ADD/SUB/AND/OR/XOR operations
    - jump: CMP8 + conditional jumps
    - hash: HASHREGS operation
    - addr: LOADADDR8 to load address into registers
"""

import serial
import struct
import sys

# CanISA opcodes (matches can_vm.h)
OP_NOP = 0x00
OP_HALT = 0x01
OP_MOV = 0x10
OP_LOAD8 = 0x11
OP_LOAD16 = 0x12
OP_LOAD32 = 0x13
OP_ADD = 0x20
OP_SUB = 0x21
OP_AND = 0x22
OP_OR = 0x23
OP_XOR = 0x24
OP_MOD8 = 0x30
OP_ADMISS_EXCEPT6 = 0x31
OP_MAP_PARITY = 0x32
OP_MAP_PRIME8 = 0x33
OP_CMP8 = 0x40
OP_JZ = 0x41
OP_JNZ = 0x42
OP_JMP = 0x43
OP_EMIT8 = 0x50
OP_EMITREGS = 0x51
OP_LOADADDR8 = 0x60
OP_HASHREGS = 0x61

def pack_regs(a, b):
    """Pack two 4-bit register indices into one byte."""
    return ((b & 0x0f) << 4) | (a & 0x0f)

def hex_to_bytes(hex_str):
    """Convert hex string to bytes."""
    return bytes.fromhex(hex_str.replace(':', ''))

def send_program(port, address_hex, program_bytes):
    """Send a program to ESP32."""
    addr_bytes = hex_to_bytes(address_hex)
    length_bytes = len(program_bytes).to_bytes(4, 'big')
    packet = addr_bytes + length_bytes + program_bytes
    
    print(f"Sending {len(packet)} bytes to {port}...")
    print(f"  Address: {address_hex}")
    print(f"  Program: {len(program_bytes)} bytes")
    print(f"  Bytecode: {' '.join(f'{b:02X}' for b in program_bytes)}")
    
    ser = serial.Serial(port, 115200, timeout=1)
    ser.write(packet)
    ser.close()
    print("Packet sent.")

# Test programs
PROGRAMS = {
    "nop": [
        OP_NOP,
        OP_HALT,
    ],
    
    "load": [
        OP_LOAD8, 0x00, 0x42,  # r0 = 0x42
        OP_LOAD8, 0x01, 0x1A,  # r1 = 0x1A
        OP_HALT,
    ],
    
    "math": [
        OP_LOAD8, 0x00, 0x0F,  # r0 = 0x0F
        OP_LOAD8, 0x01, 0x03,  # r1 = 0x03
        OP_ADD, 0x02, pack_regs(0x00, 0x01),  # r2 = r0 + r1
        OP_SUB, 0x03, pack_regs(0x02, 0x01),  # r3 = r2 - r1
        OP_AND, 0x04, pack_regs(0x00, 0x01),  # r4 = r0 & r1
        OP_OR,  0x05, pack_regs(0x00, 0x01),  # r5 = r0 | r1
        OP_XOR, 0x06, pack_regs(0x00, 0x01),  # r6 = r0 ^ r1
        OP_HALT,
    ],
    
    "jump": [
        OP_LOAD8, 0x00, 0x05,  # r0 = 5
        OP_CMP8, 0x00, 0x05,  # Compare r0 with 5 (sets ZF)
        OP_JZ, 0x02,          # Jump forward 2 bytes if ZF
        OP_LOAD8, 0x01, 0xFF, # r1 = 0xFF (skipped if jump works)
        OP_LOAD8, 0x01, 0xAA, # r1 = 0xAA (target of jump)
        OP_HALT,
    ],
    
    "mod8": [
        OP_LOAD8, 0x00, 0x0F,  # r0 = 15
        OP_MOD8, 0x00,        # r0 = r0 & 0x07 = 7
        OP_HALT,
    ],
    
    "admiss": [
        OP_LOAD8, 0x00, 0x06,  # r0 = 6 (should trap)
        OP_ADMISS_EXCEPT6, 0x00,  # Check admissibility
        OP_HALT,  # Should not reach here
    ],
    
    "hash": [
        OP_LOAD8, 0x00, 0x01,  # r0 = 1
        OP_LOAD8, 0x01, 0x02,  # r1 = 2
        OP_LOAD8, 0x02, 0x03,  # r2 = 3
        OP_HASHREGS, 0x00, 0x03, 0x03,  # Hash r0..r2 into r3
        OP_HALT,
    ],
    
    "addr": [
        OP_LOADADDR8, 0x00,  # Load address into r0..r7
        OP_HALT,
    ],
}

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 test_canisa.py <serial_port> [program_name]")
        print("\nAvailable programs:")
        for name in PROGRAMS.keys():
            print(f"  - {name}")
        sys.exit(1)
    
    port = sys.argv[1]
    program_name = sys.argv[2] if len(sys.argv) > 2 else "nop"
    
    if program_name not in PROGRAMS:
        print(f"Unknown program: {program_name}")
        print(f"Available: {', '.join(PROGRAMS.keys())}")
        sys.exit(1)
    
    # Valid address from schema: 1A:02:04:03:02 (R0-R4) + any instance
    test_address = "1A:02:04:03:02:7F:11:C7"
    program = bytes(PROGRAMS[program_name])
    
    send_program(port, test_address, program)

