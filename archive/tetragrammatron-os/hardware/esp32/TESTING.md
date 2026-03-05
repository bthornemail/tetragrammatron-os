# ESP32 Firmware Testing Guide

## Status: ✅ Firmware Successfully Flashed and Running

The firmware is working correctly! The "Missing address prefix" message you saw is **expected behavior** - it means the device is waiting for input.

## What the Firmware Does

1. **Loads the embedded schema** from `build/address-schema.bin`
2. **Waits for UART input** in this format:
   ```
   [8-byte address R0..R7][4-byte big-endian length][CANBC payload]
   ```
3. **Validates the address prefix** (R0..R4) against the schema
4. **Executes CANBC** if valid, or rejects if invalid

## Testing the Firmware

### Method 1: Use the Test Script

I've created a test script that sends a valid packet:

```bash
cd /home/main/devops/tetragrammatron-os/hardware/esp32

# Make sure pyserial is installed
pip3 install pyserial

# Send test packet to device
python3 test_send.py /dev/ttyUSB0
```

The test script sends:
- **Address**: `1A:02:04:03:02:7F:11:C7` (valid ULP schema)
- **Length**: 1 byte
- **CANBC**: `0x00` (NOP opcode)

### Method 2: Manual Serial Input

You can also send data manually using any serial terminal:

```bash
# Using minicom
minicom -D /dev/ttyUSB0 -b 115200

# Or using screen
screen /dev/ttyUSB0 115200
```

Then send binary data (8 bytes address + 4 bytes length + payload).

### Method 3: Using Python Serial Directly

```python
import serial
import struct

ser = serial.Serial('/dev/ttyUSB0', 115200)

# Valid address: 1A:02:04:03:02:7F:11:C7
addr = bytes([0x1A, 0x02, 0x04, 0x03, 0x02, 0x7F, 0x11, 0xC7])
payload = bytes([0x00])  # NOP
length = struct.pack(">I", len(payload))

ser.write(addr + length + payload)
ser.close()
```

## Expected Output

When you send a valid packet, you should see:

```
I (xxx) CAN_VM_ESP32: Received address: 1A:02:04:03:02:7F:11:C7
I (xxx) CAN_VM_ESP32: Address prefix valid, reading length...
I (xxx) CAN_VM_ESP32: Payload length: 1 bytes
I (xxx) CAN_VM_ESP32: Executing CANBC payload...
I (xxx) CAN_VM_ESP32: CAN VM execution stub: received 1 bytes
{"kind":"vm_done","msg":"{\"steps\":0,\"ticks\":0,\"status\":\"stub\"}"}
I (xxx) CAN_VM_ESP32: Execution complete; ready for next packet
```

## Testing Invalid Addresses

To test schema validation, try sending an invalid address:

```python
# Invalid address (wrong realm)
invalid_addr = bytes([0xFF, 0x02, 0x04, 0x03, 0x02, 0x7F, 0x11, 0xC7])
```

You should see:
```
E (xxx) CAN_VM_ESP32: Schema gate reject: FF:02:04:03:02
{"kind":"schema_violation","msg":"prefix_rejected"}
```

## Monitoring Serial Output

To watch the serial output in real-time:

```bash
cd /home/main/devops/tetragrammatron-os/hardware/esp32/can_app
source ../setup_idf.sh
idf.py -p /dev/ttyUSB0 monitor
```

Press `Ctrl+]` to exit the monitor.

## Next Steps

1. **Test with valid addresses** - Verify schema validation works
2. **Test with invalid addresses** - Verify rejection works
3. **Implement CAN VM execution** - Replace the stub with real execution
4. **Add ESP-NOW transport** - Send packets wirelessly between ESP32 nodes

## Troubleshooting

### "No input available" messages
- This is normal - the device is waiting for data
- Send a packet using one of the methods above

### "Schema load failed"
- Check that `build/address-schema.bin` exists
- Rebuild the firmware: `./build.sh`

### No response to packets
- Check baud rate matches (115200)
- Verify device is `/dev/ttyUSB0` (or correct port)
- Check serial monitor is not blocking the port


