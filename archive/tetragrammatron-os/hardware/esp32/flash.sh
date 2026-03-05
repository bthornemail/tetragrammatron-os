#!/bin/bash
# Flash ESP32 firmware to device(s)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
PROJECT_DIR="$SCRIPT_DIR/can_app"

# Check if project directory exists
if [ ! -d "$PROJECT_DIR" ]; then
    echo "Error: Project directory not found: $PROJECT_DIR"
    echo "Expected ESP-IDF project at: hardware/esp32/can_app/"
    exit 2
fi

# Source ESP-IDF environment (may fail if tools not installed)
set +e  # Temporarily allow errors
. "$SCRIPT_DIR/setup_idf.sh" 2>&1
SETUP_STATUS=$?
set -e  # Re-enable error checking

if [ $SETUP_STATUS -ne 0 ]; then
    echo ""
    echo "Error: ESP-IDF environment setup failed (exit code $SETUP_STATUS)"
    echo "Make sure tools are installed: ./hardware/esp32/install_tools.sh"
    exit 2
fi

cd "$PROJECT_DIR"

# Check if build directory exists
if [ ! -d "build" ]; then
    echo "Error: Build directory not found."
    echo "Expected: $PROJECT_DIR/build/"
    echo ""
    echo "Build the firmware first:"
    echo "  cd hardware/esp32"
    echo "  ./build.sh"
    echo ""
    exit 2
fi

# Find the actual firmware binary (ESP-IDF projects use project name as binary name)
# Common names: project.bin, app.bin, or custom name from CMakeLists.txt
FIRMWARE_BIN=""
for bin_name in "tetragrammatron_can_vm.bin" "can_app.bin" "app.bin" "project.bin"; do
    if [ -f "build/$bin_name" ]; then
        FIRMWARE_BIN="build/$bin_name"
        break
    fi
done

# If not found, try to find any .bin file in build directory
if [ -z "$FIRMWARE_BIN" ]; then
    FIRMWARE_BIN=$(find build -maxdepth 1 -name "*.bin" -type f 2>/dev/null | head -1)
fi

if [ -z "$FIRMWARE_BIN" ] || [ ! -f "$FIRMWARE_BIN" ]; then
    echo ""
    echo "=========================================="
    echo "Error: Firmware binary not found"
    echo "=========================================="
    echo ""
    echo "Searched in: $PROJECT_DIR/build/"
    echo ""
    echo "The firmware needs to be built before flashing."
    echo ""
    echo "Quick fix - Build and flash in one command:"
    echo "  cd hardware/esp32"
    echo "  ./quick_flash.sh /dev/ttyUSB0"
    echo ""
    echo "Or build separately:"
    echo "  cd hardware/esp32"
    echo "  ./build.sh"
    echo "  ./flash.sh /dev/ttyUSB0"
    echo ""
    echo "Or manually:"
    echo "  cd hardware/esp32/can_app"
    echo "  source ../setup_idf.sh"
    echo "  idf.py build"
    echo ""
    exit 2
fi

echo "✓ Found firmware: $FIRMWARE_BIN ($(stat -c %s "$FIRMWARE_BIN" | numfmt --to=iec-i --suffix=B 2>/dev/null || stat -c %s "$FIRMWARE_BIN") bytes)"

# Parse arguments
DEVICE="${1:-}"
MONITOR="${2:-}"

# If no device specified, list available devices
if [ -z "$DEVICE" ]; then
    echo "Available ESP32 devices:"
    ls -1 /dev/ttyUSB* 2>/dev/null | while read dev; do
        echo "  - $dev"
    done
    echo ""
    echo "Usage: $0 [device] [monitor]"
    echo "  device: /dev/ttyUSB0, /dev/ttyUSB1, /dev/ttyUSB2, or 'all'"
    echo "  monitor: 'monitor' to start serial monitor after flashing"
    echo ""
    echo "Examples:"
    echo "  $0 /dev/ttyUSB0              # Flash device 0"
    echo "  $0 /dev/ttyUSB0 monitor      # Flash device 0 and monitor"
    echo "  $0 all                       # Flash all devices"
    exit 0
fi

# Flash function
flash_device() {
    local dev="$1"
    if [ ! -c "$dev" ]; then
        echo "Error: Device $dev not found or not a character device"
        echo "Available devices:"
        ls -1 /dev/ttyUSB* 2>/dev/null | while read d; do
            echo "  - $d"
        done || echo "  (none found)"
        return 2
    fi
    
    echo ""
    echo "=========================================="
    echo "Flashing $dev..."
    echo "=========================================="
    
    set +e  # Allow idf.py to handle its own errors
    if [ "$MONITOR" = "monitor" ]; then
        idf.py -p "$dev" flash monitor
        FLASH_STATUS=$?
    else
        idf.py -p "$dev" flash
        FLASH_STATUS=$?
        if [ $FLASH_STATUS -eq 0 ]; then
            echo "Flash complete for $dev"
        fi
    fi
    set -e
    
    if [ $FLASH_STATUS -ne 0 ]; then
        echo ""
        echo "Error: Flash failed for $dev (exit code $FLASH_STATUS)"
        echo ""
        echo "Common issues:"
        echo "  - Device not in bootloader mode (hold BOOT button, press RESET)"
        echo "  - Wrong device path"
        echo "  - Permission denied (add user to dialout group)"
        echo "  - Device disconnected"
        echo ""
        return $FLASH_STATUS
    fi
    
    return 0
}

# Flash all devices
if [ "$DEVICE" = "all" ]; then
    DEVICES_FOUND=0
    for dev in /dev/ttyUSB*; do
        if [ -c "$dev" ]; then
            DEVICES_FOUND=1
            flash_device "$dev" || true
        fi
    done
    
    if [ $DEVICES_FOUND -eq 0 ]; then
        echo "Error: No ESP32 devices found"
        echo "Connect your ESP32 device(s) via USB"
        exit 2
    fi
    
    echo ""
    echo "All devices flashed!"
else
    flash_device "$DEVICE"
    FLASH_EXIT=$?
    if [ $FLASH_EXIT -ne 0 ]; then
        exit $FLASH_EXIT
    fi
fi

