#!/bin/bash
# Check if firmware is built and ready to flash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$SCRIPT_DIR/can_app"

echo "Checking firmware build status..."
echo ""

# Check project directory
if [ ! -d "$PROJECT_DIR" ]; then
    echo "❌ Project directory not found: $PROJECT_DIR"
    exit 1
fi
echo "✓ Project directory exists"

# Check build directory
if [ ! -d "$PROJECT_DIR/build" ]; then
    echo "❌ Build directory not found"
    echo "   Run: ./build.sh"
    exit 1
fi
echo "✓ Build directory exists"

# Check for firmware binary
FIRMWARE_BIN=""
for bin_name in "tetragrammatron_can_vm.bin" "can_app.bin" "app.bin"; do
    if [ -f "$PROJECT_DIR/build/$bin_name" ]; then
        FIRMWARE_BIN="$PROJECT_DIR/build/$bin_name"
        break
    fi
done

if [ -z "$FIRMWARE_BIN" ]; then
    # Try to find any .bin file
    FIRMWARE_BIN=$(find "$PROJECT_DIR/build" -maxdepth 1 -name "*.bin" -type f 2>/dev/null | grep -v CMakeFiles | head -1)
fi

if [ -z "$FIRMWARE_BIN" ] || [ ! -f "$FIRMWARE_BIN" ]; then
    echo "❌ Firmware binary not found"
    echo ""
    echo "Build the firmware:"
    echo "  cd hardware/esp32"
    echo "  ./build.sh"
    echo ""
    exit 1
fi

echo "✓ Firmware binary found: $FIRMWARE_BIN"
echo "  Size: $(stat -c %s "$FIRMWARE_BIN" | numfmt --to=iec-i --suffix=B)"

# Check schema binary
SCHEMA_BIN="$(cd "$SCRIPT_DIR/../.." && pwd)/build/address-schema.bin"
if [ -f "$SCHEMA_BIN" ]; then
    echo "✓ Schema binary found: $SCHEMA_BIN"
    echo "  Size: $(stat -c %s "$SCHEMA_BIN" | numfmt --to=iec-i --suffix=B)"
else
    echo "⚠️  Schema binary not found: $SCHEMA_BIN"
    echo "   (This may be OK if schema is embedded differently)"
fi

# Check devices
echo ""
echo "Available ESP32 devices:"
DEVICES=0
for dev in /dev/ttyUSB*; do
    if [ -c "$dev" ]; then
        echo "  ✓ $dev"
        DEVICES=$((DEVICES + 1))
    fi
done

if [ $DEVICES -eq 0 ]; then
    echo "  ❌ No devices found"
    echo "     Connect your ESP32 device(s) via USB"
else
    echo "  Found $DEVICES device(s)"
fi

echo ""
echo "Status: Ready to flash!"
echo "  Run: ./flash.sh /dev/ttyUSB0"

