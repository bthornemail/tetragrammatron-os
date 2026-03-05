#!/bin/bash
# Quick flash script - builds and flashes to specified device

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEVICE="${1:-/dev/ttyUSB0}"

echo "=========================================="
echo "Tetragrammatron-OS ESP32 Quick Flash"
echo "=========================================="
echo ""

# Step 1: Compile schema
echo "Step 1: Compiling schema binary..."
cd "$SCRIPT_DIR/../.."
python3 tools/compile_schema.py address-schema.yaml -o build/address-schema.bin
echo "✓ Schema binary ready"
echo ""

# Step 2: Build firmware
echo "Step 2: Building firmware..."
cd "$SCRIPT_DIR"
./build.sh
echo "✓ Firmware built"
echo ""

# Step 3: Flash
echo "Step 3: Flashing to $DEVICE..."
./flash.sh "$DEVICE" "${2:-}"
echo ""
echo "=========================================="
echo "Flash complete!"
echo "=========================================="

