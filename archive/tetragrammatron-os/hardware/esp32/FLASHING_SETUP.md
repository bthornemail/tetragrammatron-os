# ESP32 Flashing Setup - Complete

## ✅ Setup Complete

All ESP32 flashing infrastructure is now configured and ready to use.

## Files Created

### Scripts
- `setup_idf.sh` - Sets up ESP-IDF v5.4.1 environment
- `build.sh` - Builds firmware (compiles schema + builds project)
- `flash.sh` - Flashes firmware to device(s)
- `quick_flash.sh` - One-command build + flash

### Documentation
- `README_FLASHING.md` - Detailed flashing instructions
- `FLASHING_SETUP.md` - This file

## Component Configuration

### ✅ Schema Component (`components/tetragrammatron_schema/`)
- **CMakeLists.txt**: Updated to use absolute path for schema binary
- **ABI Version**: v2 (fully migrated)
- **Embedded Binary**: `build/address-schema.bin` (18 bytes, ABI v2)

### ✅ ESP32 Project (`hardware/esp32/can_app/`)
- **Main Application**: Uses `tg_schema_load_embedded()` at boot
- **Schema Validation**: Enforces prefix validation before execution
- **Component Dependency**: Properly references `tetragrammatron_schema`

## Quick Start

### Option 1: Quick Flash (Recommended)
```bash
cd hardware/esp32
./quick_flash.sh /dev/ttyUSB0
```

This will:
1. Compile schema binary (if needed)
2. Build firmware
3. Flash to device

### Option 2: Step by Step

**1. Compile Schema:**
```bash
cd /home/main/devops/tetragrammatron-os
python3 tools/compile_schema.py address-schema.yaml -o build/address-schema.bin
```

**2. Build Firmware:**
```bash
cd hardware/esp32
./build.sh
```

**3. Flash Device:**
```bash
./flash.sh /dev/ttyUSB0
```

## Your ESP32 Devices

Detected devices:
- `/dev/ttyUSB0` - CP2102 (SerialNumber: 0001)
- `/dev/ttyUSB1` - CP2102 (SerialNumber: 0001)  
- `/dev/ttyUSB2` - CP2102 (SerialNumber: 0001)

## Flash All Devices

```bash
cd hardware/esp32
./flash.sh all
```

## Monitor Serial Output

After flashing, monitor serial output:
```bash
cd hardware/esp32/can_app
source ../setup_idf.sh
idf.py -p /dev/ttyUSB0 monitor
```

Or flash with monitor:
```bash
./flash.sh /dev/ttyUSB0 monitor
```

## Expected Boot Output

When the device boots, you should see:
```
I (xxx) CAN_VM_ESP32: Tetragrammatron CAN VM ready
I (xxx) CAN_VM_ESP32: Protocol: [8-byte addr][4-byte BE length][CANBC bytes]
```

If schema load fails, you'll see:
```
E (xxx) CAN_VM_ESP32: Schema load failed
{"kind":"schema_error","msg":"load_failed"}
```

## Schema Binary Verification

The schema binary is embedded at compile time:
- **Location**: `build/address-schema.bin`
- **Size**: 18 bytes (ABI v2)
- **Format**: ABI v2 with prefix list
- **Embedded as**: `_binary_address_schema_bin_start[]` / `_binary_address_schema_bin_end[]`

## Build Output

Firmware binary location:
```
hardware/esp32/can_app/build/tetragrammatron_can_vm.bin
```

## Troubleshooting

### Permission Issues
```bash
sudo usermod -a -G dialout $USER
# Log out and back in
```

### ESP-IDF Not Found
The scripts automatically source ESP-IDF from:
```
vendor/esp/idf-v5.4.1/
```

### Schema Binary Missing
The build script automatically compiles it, but you can manually:
```bash
cd /home/main/devops/tetragrammatron-os
python3 tools/compile_schema.py address-schema.yaml -o build/address-schema.bin
```

### Component Path Issues
The component CMakeLists.txt uses absolute paths, so it should work from any build directory.

## Next Steps

1. **Test Build:**
   ```bash
   cd hardware/esp32
   ./build.sh
   ```

2. **Flash Device:**
   ```bash
   ./flash.sh /dev/ttyUSB0
   ```

3. **Monitor Output:**
   ```bash
   cd can_app
   source ../setup_idf.sh
   idf.py -p /dev/ttyUSB0 monitor
   ```

4. **Test Schema Validation:**
   Send a test address via UART and verify it validates correctly.

## Architecture

```
┌─────────────────────────────────────┐
│  ESP32 Firmware (can_app)            │
│                                       │
│  ┌───────────────────────────────┐   │
│  │  Main Application (main.c)    │   │
│  │  - Loads embedded schema      │   │
│  │  - Validates addresses        │   │
│  │  - Executes CANBC             │   │
│  └───────────────────────────────┘   │
│              │                        │
│              ▼                        │
│  ┌───────────────────────────────┐   │
│  │  Schema Component             │   │
│  │  - Embedded: schema.bin       │   │
│  │  - ABI v2 format              │   │
│  │  - Prefix validation          │   │
│  └───────────────────────────────┘   │
└─────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│  Embedded Binary                    │
│  build/address-schema.bin (18 bytes)│
│  ABI v2: TADR + v2 + class + realm │
└─────────────────────────────────────┘
```

## Summary

✅ **ESP-IDF v5.4.1** - Configured and ready  
✅ **Schema Component** - ABI v2, properly embedded  
✅ **Build Scripts** - Automated build process  
✅ **Flash Scripts** - Support for single/all devices  
✅ **Documentation** - Complete setup guide  

**Ready to build and flash!**

