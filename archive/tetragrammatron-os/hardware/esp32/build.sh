#!/bin/bash
# Build ESP32 firmware for Tetragrammatron-OS

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
PROJECT_DIR="$SCRIPT_DIR/can_app"

# Source ESP-IDF environment
. "$SCRIPT_DIR/setup_idf.sh"

# Ensure schema binary exists
SCHEMA_BIN="$REPO_ROOT/build/address-schema.bin"
if [ ! -f "$SCHEMA_BIN" ]; then
    echo "Compiling schema binary..."
    cd "$REPO_ROOT"
    python3 tools/compile_schema.py address-schema.yaml -o build/address-schema.bin
    cd - > /dev/null
fi

echo "Building ESP32 firmware..."
cd "$PROJECT_DIR"

# Set target (default: esp32, can override with ESP32_TARGET env var)
TARGET="${ESP32_TARGET:-esp32}"
echo "Target: $TARGET"

idf.py set-target "$TARGET"
idf.py build

echo ""
echo "Build complete!"
echo "Firmware: $PROJECT_DIR/build/tetragrammatron_can_vm.bin"
echo ""
echo "To flash, run:"
echo "  ./hardware/esp32/flash.sh [device]"
echo ""
echo "Available devices:"
ls -1 /dev/ttyUSB* 2>/dev/null | while read dev; do
    echo "  - $dev"
done

