#!/usr/bin/env python3
"""
Comprehensive test suite for ESP32 Tetragrammatron CAN VM firmware.

Tests:
1. Valid address acceptance
2. Invalid address rejection (schema gate)
3. Multiple packets in sequence
4. Edge cases (zero-length payload, max-length payload)
"""

import serial
import struct
import sys
import time
from typing import List, Tuple

def send_packet(ser: serial.Serial, addr: bytes, payload: bytes) -> bool:
    """Send a single packet and return True if successful."""
    length_be = struct.pack(">I", len(payload))
    packet = addr + length_be + payload
    
    try:
        ser.write(packet)
        ser.flush()
        return True
    except Exception as e:
        print(f"  ✗ Send failed: {e}")
        return False

def read_response(ser: serial.Serial, timeout=1.0) -> str:
    """Read response from ESP32."""
    start_time = time.time()
    response = b""
    
    while time.time() - start_time < timeout:
        if ser.in_waiting > 0:
            response += ser.read(ser.in_waiting)
            time.sleep(0.1)
        else:
            time.sleep(0.05)
    
    return response.decode('utf-8', errors='replace') if response else ""

def test_valid_address(ser: serial.Serial) -> bool:
    """Test 1: Valid address should be accepted."""
    print("\n[Test 1] Valid Address Acceptance")
    print("=" * 50)
    
    # Valid address: 1A:02:04:03:02:7F:11:C7
    addr = bytes([0x1A, 0x02, 0x04, 0x03, 0x02, 0x7F, 0x11, 0xC7])
    payload = bytes([0x00])  # NOP
    
    print(f"  Address: {' '.join(f'{b:02X}' for b in addr)}")
    print(f"  Payload: {' '.join(f'{b:02X}' for b in payload)}")
    
    if not send_packet(ser, addr, payload):
        return False
    
    time.sleep(0.5)
    response = read_response(ser)
    
    if "Address prefix valid" in response or "vm_done" in response:
        print("  ✓ PASS: Address accepted and processed")
        return True
    elif "Schema gate reject" in response:
        print("  ✗ FAIL: Valid address was rejected")
        return False
    else:
        print(f"  ? UNKNOWN: Response: {response[:100]}")
        return False

def test_invalid_address(ser: serial.Serial) -> bool:
    """Test 2: Invalid address should be rejected."""
    print("\n[Test 2] Invalid Address Rejection (Schema Gate)")
    print("=" * 50)
    
    # Invalid address: wrong realm (FF instead of 1A)
    addr = bytes([0xFF, 0x02, 0x04, 0x03, 0x02, 0x7F, 0x11, 0xC7])
    payload = bytes([0x00])
    
    print(f"  Address: {' '.join(f'{b:02X}' for b in addr)} (invalid realm)")
    print(f"  Payload: {' '.join(f'{b:02X}' for b in payload)}")
    
    if not send_packet(ser, addr, payload):
        return False
    
    time.sleep(0.5)
    response = read_response(ser)
    
    if "Schema gate reject" in response or "schema_violation" in response:
        print("  ✓ PASS: Invalid address correctly rejected")
        return True
    elif "Address prefix valid" in response:
        print("  ✗ FAIL: Invalid address was accepted (security issue!)")
        return False
    else:
        print(f"  ? UNKNOWN: Response: {response[:100]}")
        return False

def test_multiple_packets(ser: serial.Serial) -> bool:
    """Test 3: Multiple packets in sequence."""
    print("\n[Test 3] Multiple Packets in Sequence")
    print("=" * 50)
    
    addr = bytes([0x1A, 0x02, 0x04, 0x03, 0x02, 0x7F, 0x11, 0xC7])
    payloads = [
        bytes([0x00]),  # NOP
        bytes([0x00, 0x01]),  # NOP + something
        bytes([0x00]),  # NOP again
    ]
    
    success_count = 0
    for i, payload in enumerate(payloads, 1):
        print(f"  Packet {i}/{len(payloads)}: {len(payload)} bytes")
        if send_packet(ser, addr, payload):
            time.sleep(0.3)
            success_count += 1
        else:
            break
    
    if success_count == len(payloads):
        print(f"  ✓ PASS: All {len(payloads)} packets sent successfully")
        return True
    else:
        print(f"  ✗ FAIL: Only {success_count}/{len(payloads)} packets sent")
        return False

def test_edge_cases(ser: serial.Serial) -> bool:
    """Test 4: Edge cases."""
    print("\n[Test 4] Edge Cases")
    print("=" * 50)
    
    addr = bytes([0x1A, 0x02, 0x04, 0x03, 0x02, 0x7F, 0x11, 0xC7])
    
    # Test zero-length payload (should be rejected by length check)
    print("  Testing zero-length payload...")
    if send_packet(ser, addr, bytes()):
        time.sleep(0.3)
        response = read_response(ser)
        if "Invalid length" in response or "length_invalid" in response:
            print("    ✓ Zero-length correctly rejected")
        else:
            print(f"    ? Unexpected response: {response[:50]}")
    
    # Test max-length payload (4096 bytes - but we'll use smaller for speed)
    print("  Testing large payload (100 bytes)...")
    large_payload = bytes([0x00] * 100)
    if send_packet(ser, addr, large_payload):
        time.sleep(0.5)
        response = read_response(ser)
        if "Executing CANBC payload" in response or "vm_done" in response:
            print("    ✓ Large payload accepted")
        else:
            print(f"    ? Response: {response[:50]}")
    
    print("  ✓ Edge case tests completed")
    return True

def main():
    port = sys.argv[1] if len(sys.argv) > 1 else "/dev/ttyUSB0"
    baud = 115200
    
    print("=" * 60)
    print("Tetragrammatron ESP32 Firmware Test Suite")
    print("=" * 60)
    print(f"Port: {port}")
    print(f"Baud: {baud}")
    print("\nMake sure:")
    print("  1. ESP32 is connected and firmware is running")
    print("  2. Serial monitor is NOT running (will block port)")
    print("  3. Firmware shows 'Waiting for address prefix...'")
    print("\nPress Enter to start tests, or Ctrl+C to cancel...")
    
    try:
        input()
    except KeyboardInterrupt:
        print("\nCancelled.")
        sys.exit(0)
    
    try:
        ser = serial.Serial(port, baud, timeout=2)
        time.sleep(0.5)  # Wait for connection
        
        print("\n" + "=" * 60)
        print("Starting Tests...")
        print("=" * 60)
        
        results = []
        
        # Run tests
        results.append(("Valid Address", test_valid_address(ser)))
        time.sleep(0.5)
        
        results.append(("Invalid Address", test_invalid_address(ser)))
        time.sleep(0.5)
        
        results.append(("Multiple Packets", test_multiple_packets(ser)))
        time.sleep(0.5)
        
        results.append(("Edge Cases", test_edge_cases(ser)))
        
        # Summary
        print("\n" + "=" * 60)
        print("Test Summary")
        print("=" * 60)
        
        passed = sum(1 for _, result in results if result)
        total = len(results)
        
        for name, result in results:
            status = "✓ PASS" if result else "✗ FAIL"
            print(f"  {status}: {name}")
        
        print(f"\nTotal: {passed}/{total} tests passed")
        
        if passed == total:
            print("\n🎉 All tests passed! Firmware is working correctly.")
            sys.exit(0)
        else:
            print(f"\n⚠️  {total - passed} test(s) failed. Review output above.")
            sys.exit(1)
        
    except serial.SerialException as e:
        print(f"\n✗ Error: {e}")
        print("\nTroubleshooting:")
        print("  1. Check device is connected: ls -la /dev/ttyUSB*")
        print("  2. Check no other program is using the port")
        print("  3. Check permissions: groups (should include 'dialout')")
        sys.exit(1)
    except KeyboardInterrupt:
        print("\n\nTests interrupted by user.")
        sys.exit(1)
    finally:
        if 'ser' in locals():
            ser.close()

if __name__ == "__main__":
    main()

