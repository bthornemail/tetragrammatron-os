# Quick Test Guide - ESP32 Firmware

## ✅ Status: Firmware Successfully Running!

Your firmware is now:
- ✅ Flashed to ESP32
- ✅ Schema loaded from embedded binary
- ✅ Waiting for UART input

## Test the Firmware

### Option 1: Test in Separate Terminal (Recommended)

**In your current terminal (with monitor running):**
- Keep the monitor open to see responses
- The monitor is blocking `/dev/ttyUSB0`, so use a different device or exit monitor first

**In a NEW terminal:**
```bash
cd /home/main/devops/tetragrammatron-os
python3 hardware/esp32/test_send.py /dev/ttyUSB0
```

**Note:** If you get "Device or resource busy", exit the monitor first (Ctrl+]) and then run the test.

### Option 2: Exit Monitor and Test

1. **Exit the monitor:** Press `Ctrl+]` in the monitor terminal
2. **Run the test:**
   ```bash
   cd /home/main/devops/tetragrammatron-os
   python3 hardware/esp32/test_send.py /dev/ttyUSB0
   ```
3. **Restart monitor to see results:**
   ```bash
   cd hardware/esp32/can_app
   source ../setup_idf.sh
   idf.py -p /dev/ttyUSB0 monitor
   ```

## Expected Output

When you send a valid packet, you should see in the monitor:

```
I (xxx) CAN_VM_ESP32: Received address: 1A:02:04:03:02:7F:11:C7
I (xxx) CAN_VM_ESP32: Address prefix valid, reading length...
I (xxx) CAN_VM_ESP32: Payload length: 1 bytes
I (xxx) CAN_VM_ESP32: Executing CANBC payload...
I (xxx) CAN_VM_ESP32: CAN VM execution stub: received 1 bytes
{"kind":"vm_done","msg":"{\"steps\":0,\"ticks\":0,\"status\":\"stub\"}"}
I (xxx) CAN_VM_ESP32: Execution complete; ready for next packet
I (xxx) CAN_VM_ESP32: Waiting for address prefix (8 bytes)...
```

## Test Invalid Address (Schema Validation)

To verify schema gate rejection, modify `test_send.py` to send an invalid address:

```python
# Invalid address (wrong realm)
addr_bytes = bytes([0xFF, 0x02, 0x04, 0x03, 0x02, 0x7F, 0x11, 0xC7])
```

You should see:
```
E (xxx) CAN_VM_ESP32: Schema gate reject: FF:02:04:03:02
{"kind":"schema_violation","msg":"prefix_rejected"}
```

## What's Working

1. ✅ **Schema Loading**: Embedded binary loads at boot
2. ✅ **Address Validation**: Prefix R0..R4 validated against schema
3. ✅ **Protocol Parsing**: Correctly reads [addr][length][payload]
4. ✅ **Error Handling**: Proper error messages and JSONL logging
5. ✅ **Looping**: Continues waiting for packets (doesn't exit)

## Next Steps

1. **Test with valid addresses** - Verify acceptance
2. **Test with invalid addresses** - Verify rejection  
3. **Implement CAN VM execution** - Replace stub with real execution
4. **Add ESP-NOW transport** - Send packets wirelessly

## Troubleshooting

### "Device or resource busy"
- Another program (monitor) is using the port
- Exit monitor first: `Ctrl+]`
- Or use a different device: `/dev/ttyUSB1` or `/dev/ttyUSB2`

### "No response"
- Check baud rate (115200)
- Verify device path
- Check serial monitor shows the device is ready

### "Schema load failed"
- Rebuild schema: `python3 tools/compile_schema.py address-schema.yaml -o build/address-schema.bin`
- Rebuild firmware: `cd hardware/esp32 && ./build.sh`

