# Flash Script Error Codes

## Exit Code 2: Common Causes

The flash script exits with code 2 in these situations:

### 1. Firmware Not Built

**Error:**
```
Error: Firmware binary not found.
Searched in: .../can_app/build/
```

**Solution:**
```bash
cd hardware/esp32
./build.sh
```

Or use quick flash (builds automatically):
```bash
cd hardware/esp32
./quick_flash.sh /dev/ttyUSB0
```

### 2. ESP-IDF Environment Setup Failed

**Error:**
```
Error: ESP-IDF environment setup failed (exit code X)
```

**Cause:** Tools not installed or environment misconfigured.

**Solution:**
```bash
cd hardware/esp32
./install_tools.sh
source setup_idf.sh
```

### 3. Project Directory Not Found

**Error:**
```
Error: Project directory not found: .../can_app
```

**Cause:** ESP-IDF project structure missing.

**Solution:** Ensure `hardware/esp32/can_app/` exists with:
- `CMakeLists.txt`
- `idf_component.yml`
- `main/` directory

### 4. Device Not Found

**Error:**
```
Error: Device /dev/ttyUSB0 not found or not a character device
```

**Solutions:**
1. **Check device is connected:**
   ```bash
   ls -l /dev/ttyUSB*
   ```

2. **Check permissions:**
   ```bash
   groups | grep dialout || echo "Not in dialout group"
   sudo usermod -a -G dialout $USER
   # Log out and back in
   ```

3. **Try different device:**
   ```bash
   ./flash.sh /dev/ttyUSB1
   ```

### 5. Flash Command Failed

**Error:**
```
Error: Flash failed for /dev/ttyUSB0 (exit code X)
```

**Common causes:**
- Device not in bootloader mode
- Wrong baud rate
- Device disconnected during flash
- Permission denied

**Solutions:**
1. **Put device in bootloader mode:**
   - Hold BOOT button
   - Press and release RESET button
   - Release BOOT button

2. **Check device permissions:**
   ```bash
   ls -l /dev/ttyUSB0
   sudo chmod 666 /dev/ttyUSB0  # Temporary fix
   ```

3. **Try manual flash:**
   ```bash
   cd hardware/esp32/can_app
   source ../setup_idf.sh
   idf.py -p /dev/ttyUSB0 flash
   ```

## Diagnostic Commands

**Check build status:**
```bash
cd hardware/esp32
./check_build.sh
```

**Check ESP-IDF environment:**
```bash
cd hardware/esp32
source setup_idf.sh
idf.py --version
```

**List available devices:**
```bash
ls -l /dev/ttyUSB*
```

**Test device access:**
```bash
stty -F /dev/ttyUSB0 115200
```

## Quick Troubleshooting Flow

1. **Check if firmware is built:**
   ```bash
   cd hardware/esp32
   ./check_build.sh
   ```

2. **If not built, build it:**
   ```bash
   ./build.sh
   ```

3. **Check ESP-IDF environment:**
   ```bash
   source setup_idf.sh
   ```

4. **Check device:**
   ```bash
   ls -l /dev/ttyUSB0
   ```

5. **Try flash:**
   ```bash
   ./flash.sh /dev/ttyUSB0
   ```

## Most Common Issue

**"Firmware binary not found"** - This means you need to build first:

```bash
cd hardware/esp32
./build.sh
./flash.sh /dev/ttyUSB0
```

Or use the all-in-one command:
```bash
cd hardware/esp32
./quick_flash.sh /dev/ttyUSB0
```

