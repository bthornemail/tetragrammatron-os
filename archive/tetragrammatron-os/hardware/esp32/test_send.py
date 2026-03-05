#!/usr/bin/env python3
"""
Test script to send a valid address + CANBC payload to ESP32 over UART.

Protocol: [8-byte addr][4-byte BE length][CANBC bytes]

Example valid address: 1A:02:04:03:02:7F:11:C7
- R0=0x1A (ULP realm)
- R1=0x02 (device)
- R2=0x04 (route)
- R3=0x03 (consensus)
- R4=0x02 (public)
- R5-R7: instance bytes
"""

import serial
import struct
import sys
import time

def send_test_packet(port="/dev/ttyUSB0", baud=115200):
    """Send a test packet with valid schema prefix."""
    
    # Valid address: 1A:02:04:03:02:7F:11:C7
    addr_bytes = bytes([0x1A, 0x02, 0x04, 0x03, 0x02, 0x7F, 0x11, 0xC7])
    
    # Minimal CANBC payload (just a NOP for testing)
    canbc_payload = bytes([0x00])  # NOP opcode
    
    # Length as 4-byte big-endian
    length_be = struct.pack(">I", len(canbc_payload))
    
    # Full packet
    packet = addr_bytes + length_be + canbc_payload
    
    print(f"Connecting to {port} at {baud} baud...")
    try:
        ser = serial.Serial(port, baud, timeout=2)
        time.sleep(0.5)  # Wait for connection
        
        print(f"Sending packet:")
        print(f"  Address: {' '.join(f'{b:02X}' for b in addr_bytes)}")
        print(f"  Length: {len(canbc_payload)} bytes")
        print(f"  CANBC: {' '.join(f'{b:02X}' for b in canbc_payload)}")
        
        ser.write(packet)
        ser.flush()
        
        print("\nWaiting for response...")
        time.sleep(0.5)
        
        # Read any response
        if ser.in_waiting > 0:
            response = ser.read(ser.in_waiting)
            print(f"Response ({len(response)} bytes):")
            print(response.decode('utf-8', errors='replace'))
        else:
            print("No immediate response (check serial monitor)")
        
        ser.close()
        print("\n✓ Packet sent successfully")
        
    except serial.SerialException as e:
        print(f"Error: {e}")
        print(f"\nMake sure:")
        print(f"  1. Device is connected at {port}")
        print(f"  2. Device is not in use by another program")
        print(f"  3. You have permissions (user in dialout group)")
        sys.exit(1)

if __name__ == "__main__":
    port = sys.argv[1] if len(sys.argv) > 1 else "/dev/ttyUSB0"
    send_test_packet(port)


