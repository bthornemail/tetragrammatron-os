# ESP32 Quick Start Guide

## Complete Setup (Proxy + Tools + Build + Flash)

### 1. Configure Proxy (One Time)

If you're behind a proxy like `http://10.140.8.169:8888`:

**Option A: Use your existing proxy script**
```bash
source ~/.proxy-env.sh
```

**Option B: Set manually**
```bash
export HTTP_PROXY=http://10.140.8.169:8888
export HTTPS_PROXY=http://10.140.8.169:8888
export http_proxy=$HTTP_PROXY
export https_proxy=$HTTPS_PROXY
```

### 2. Install ESP-IDF Tools (One Time)

```bash
cd hardware/esp32

# With proxy from ~/.proxy-env.sh
./install_tools.sh

# OR with explicit proxy
HTTP_PROXY=http://10.140.8.169:8888 HTTPS_PROXY=http://10.140.8.169:8888 ./install_tools.sh

# OR quick install with proxy argument
./quick_install_tools.sh http://10.140.8.169:8888
```

This installs:
- Toolchains (xtensa-esp-elf, riscv32-esp-elf)
- GDB debuggers
- OpenOCD
- ROM ELFs

### 3. Build Firmware

```bash
cd hardware/esp32
./build.sh
```

This will:
- Compile schema binary (if needed)
- Build ESP32 firmware
- Embed ABI v2 schema

### 4. Flash Device(s)

**Single device:**
```bash
./flash.sh /dev/ttyUSB0
```

**All devices:**
```bash
./flash.sh all
```

**Flash + Monitor:**
```bash
./flash.sh /dev/ttyUSB0 monitor
```

**Quick build + flash:**
```bash
./quick_flash.sh /dev/ttyUSB0
```

## Your ESP32 Devices

Detected devices:
- `/dev/ttyUSB0` - CP2102
- `/dev/ttyUSB1` - CP2102
- `/dev/ttyUSB2` - CP2102

## Troubleshooting

### Proxy Issues

If tool installation fails:
1. Verify proxy works:
   ```bash
   curl -x http://10.140.8.169:8888 https://github.com
   ```

2. Check environment:
   ```bash
   env | grep -i proxy
   ```

3. Test Python proxy:
   ```bash
   python3 -c "import urllib.request; print(urllib.request.getproxies())"
   ```

### Permission Issues

If you get permission denied on `/dev/ttyUSB*`:
```bash
sudo usermod -a -G dialout $USER
# Log out and back in
```

### Build Errors

If build fails:
1. Check schema binary exists:
   ```bash
   ls -lh build/address-schema.bin
   ```

2. Verify ESP-IDF environment:
   ```bash
   cd hardware/esp32
   source setup_idf.sh
   idf.py --version
   ```

## Scripts Overview

| Script | Purpose |
|--------|---------|
| `setup_idf.sh` | Sets up ESP-IDF environment + proxy |
| `install_tools.sh` | Installs ESP-IDF tools (with proxy) |
| `build.sh` | Builds firmware |
| `flash.sh` | Flashes firmware |
| `quick_flash.sh` | Build + flash in one command |
| `quick_install_tools.sh` | Install tools with proxy argument |
| `test_build.sh` | Verifies setup |

## Next Steps

After flashing, monitor serial output:
```bash
cd hardware/esp32/can_app
source ../setup_idf.sh
idf.py -p /dev/ttyUSB0 monitor
```

Expected output:
```
I (xxx) CAN_VM_ESP32: Tetragrammatron CAN VM ready
I (xxx) CAN_VM_ESP32: Protocol: [8-byte addr][4-byte BE length][CANBC bytes]
```

## Documentation

- `README_FLASHING.md` - Detailed flashing instructions
- `FLASHING_SETUP.md` - Complete setup summary
- `PROXY_SETUP.md` - Proxy configuration guide
- `README.md` - Original ESP32 integration docs

