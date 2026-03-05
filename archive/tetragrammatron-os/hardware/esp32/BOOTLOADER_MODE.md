# ESP32 Bootloader Mode Instructions

## The Problem
When you see "No serial data received", it means the ESP32 is not in bootloader mode.

## Solution: Manual Bootloader Entry

### Method 1: Button Sequence (Most Common)
1. **Hold down the BOOT button** (also called IO0 or FLASH button)
2. **Press and release the RESET button** (also called EN or RST button)
3. **Release the BOOT button**
4. **Immediately run the flash command** (within a few seconds)

### Method 2: Using esptool.py Directly
If the button method doesn't work, you can manually enter bootloader mode:

```bash
cd /home/main/devops/tetragrammatron-os/hardware/esp32/can_app
source ../setup_idf.sh

# Try to enter bootloader mode manually
python $IDF_PATH/components/esptool_py/esptool/esptool.py --chip esp32 -p /dev/ttyUSB0 --before default_reset --after hard_reset chip_id

# If that works, then flash:
idf.py -p /dev/ttyUSB0 flash
```

### Method 3: Lower Baud Rate
Sometimes a lower baud rate helps:

```bash
cd /home/main/devops/tetragrammatron-os/hardware/esp32/can_app
source ../setup_idf.sh
idf.py -p /dev/ttyUSB0 -b 115200 flash
```

## Quick Flash After Bootloader Mode

Once the device is in bootloader mode:

```bash
cd /home/main/devops/tetragrammatron-os/hardware/esp32
./flash.sh /dev/ttyUSB0
```

## Troubleshooting

### Device Not Responding
- Check USB cable (must be data cable, not charging-only)
- Try a different USB port
- Try a different device: `/dev/ttyUSB1` or `/dev/ttyUSB2`

### Permission Issues
If you see "Permission denied":
```bash
sudo usermod -a -G dialout $USER
# Log out and log back in for changes to take effect
```

### Auto-Reset Circuit
Some ESP32 boards have auto-reset circuits that should work automatically. If yours doesn't:
- Use the manual button sequence above
- Or check if your board has a jumper/switch for bootloader mode

## Verify Device is Ready
```bash
# Check if device is accessible
ls -la /dev/ttyUSB0

# Try to read chip ID (this will fail if not in bootloader, but confirms device exists)
python $IDF_PATH/components/esptool_py/esptool/esptool.py --chip esp32 -p /dev/ttyUSB0 chip_id
```


