#!/bin/bash
# Test build script - verifies setup without flashing

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "=========================================="
echo "Tetragrammatron-OS ESP32 Build Test"
echo "=========================================="
echo ""

# Check schema binary
echo "1. Checking schema binary..."
SCHEMA_BIN="$REPO_ROOT/build/address-schema.bin"
if [ ! -f "$SCHEMA_BIN" ]; then
    echo "   ⚠️  Schema binary missing, compiling..."
    cd "$REPO_ROOT"
    python3 tools/compile_schema.py address-schema.yaml -o build/address-schema.bin
    cd - > /dev/null
else
    SIZE=$(stat -c%s "$SCHEMA_BIN" 2>/dev/null || stat -f%z "$SCHEMA_BIN" 2>/dev/null)
    echo "   ✓ Schema binary exists: $SIZE bytes"
    hexdump -C "$SCHEMA_BIN" | head -2
fi
echo ""

# Check ESP-IDF
echo "2. Checking ESP-IDF..."
IDF_PATH="$REPO_ROOT/vendor/esp/idf-v5.4.1"
if [ ! -d "$IDF_PATH" ]; then
    echo "   ❌ ESP-IDF not found at $IDF_PATH"
    exit 1
fi
echo "   ✓ ESP-IDF found: $IDF_PATH"
echo ""

# Check devices
echo "3. Checking ESP32 devices..."
DEVICES=$(ls -1 /dev/ttyUSB* 2>/dev/null | wc -l)
if [ "$DEVICES" -eq 0 ]; then
    echo "   ⚠️  No ESP32 devices found"
else
    echo "   ✓ Found $DEVICES device(s):"
    ls -1 /dev/ttyUSB* 2>/dev/null | while read dev; do
        echo "     - $dev"
    done
fi
echo ""

# Test ESP-IDF environment
echo "4. Testing ESP-IDF environment..."
. "$SCRIPT_DIR/setup_idf.sh" > /dev/null 2>&1
if [ -z "$IDF_PATH" ]; then
    echo "   ❌ Failed to set up ESP-IDF environment"
    exit 1
fi
echo "   ✓ ESP-IDF environment ready"
echo "   ✓ idf.py: $(which idf.py)"
echo ""

# Test component path
echo "5. Checking component configuration..."
COMPONENT="$REPO_ROOT/components/tetragrammatron_schema"
if [ ! -f "$COMPONENT/CMakeLists.txt" ]; then
    echo "   ❌ Component CMakeLists.txt not found"
    exit 1
fi
echo "   ✓ Component found: $COMPONENT"
echo ""

# Test project structure
echo "6. Checking project structure..."
PROJECT_DIR="$SCRIPT_DIR/can_app"
if [ ! -f "$PROJECT_DIR/CMakeLists.txt" ]; then
    echo "   ❌ Project CMakeLists.txt not found"
    exit 1
fi
echo "   ✓ Project found: $PROJECT_DIR"
echo ""

echo "=========================================="
echo "All checks passed! Ready to build."
echo "=========================================="
echo ""
echo "Next steps:"
echo "  ./build.sh              # Build firmware"
echo "  ./flash.sh /dev/ttyUSB0 # Flash device"
echo "  ./quick_flash.sh /dev/ttyUSB0 # Build + flash"
echo ""

