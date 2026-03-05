#!/bin/bash
# Setup ESP-IDF v5.4.1 environment for Tetragrammatron-OS

set -e

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
IDF_PATH="$REPO_ROOT/vendor/esp/idf-v5.4.1"

if [ ! -d "$IDF_PATH" ]; then
    echo "Error: ESP-IDF not found at $IDF_PATH"
    exit 1
fi

# Configure proxy for Python/ESP-IDF tools if available
# Check for proxy in common locations
if [ -f "$HOME/.update-proxy.sh" ]; then
    echo "Loading proxy configuration from ~/.update-proxy.sh..."
    source "$HOME/.update-proxy.sh" 2>/dev/null || true
fi

# Set proxy environment variables if not already set
# Python's urllib uses HTTP_PROXY and HTTPS_PROXY
if [ -n "${http_proxy:-}" ] && [ -z "${HTTP_PROXY:-}" ]; then
    export HTTP_PROXY="$http_proxy"
fi
if [ -n "${https_proxy:-}" ] && [ -z "${HTTPS_PROXY:-}" ]; then
    export HTTPS_PROXY="$https_proxy"
fi

# Also set for Python urllib (lowercase versions)
if [ -n "${HTTP_PROXY:-}" ]; then
    export http_proxy="${HTTP_PROXY}"
fi
if [ -n "${HTTPS_PROXY:-}" ]; then
    export https_proxy="${HTTPS_PROXY}"
fi

# Display proxy status
if [ -n "${HTTP_PROXY:-}" ] || [ -n "${HTTPS_PROXY:-}" ]; then
    echo "Proxy configured:"
    [ -n "${HTTP_PROXY:-}" ] && echo "  HTTP_PROXY: ${HTTP_PROXY}"
    [ -n "${HTTPS_PROXY:-}" ] && echo "  HTTPS_PROXY: ${HTTPS_PROXY}"
else
    echo "No proxy configured (set HTTP_PROXY/HTTPS_PROXY if needed)"
fi

echo ""
echo "Setting up ESP-IDF v5.4.1 environment..."
echo "IDF_PATH: $IDF_PATH"

# Source ESP-IDF export script
# This may fail if tools aren't installed yet - that's expected
TMP_LOG=$(mktemp)
set +e  # Temporarily allow errors
. "$IDF_PATH/export.sh" > "$TMP_LOG" 2>&1
EXPORT_STATUS=$?
set -e  # Re-enable error checking

# Check if export failed due to missing tools
if [ $EXPORT_STATUS -ne 0 ]; then
    # Check if the error is about missing tools
    if grep -q "has no installed versions" "$TMP_LOG" 2>/dev/null; then
        echo ""
        echo "⚠️  ESP-IDF tools are not installed yet."
        echo ""
        echo "   To install tools, run:"
        echo "     cd hardware/esp32"
        echo "     ./install_tools.sh"
        echo ""
        echo "   This will download and install all required toolchains."
        echo "   Make sure HTTP_PROXY/HTTPS_PROXY are set if you're behind a proxy."
        echo ""
        rm -f "$TMP_LOG"
        exit 1
    else
        # Show the actual error
        cat "$TMP_LOG" >&2
        echo ""
        echo "⚠️  ESP-IDF environment setup failed."
        echo "   Check the error messages above."
        echo ""
        rm -f "$TMP_LOG"
        exit 1
    fi
fi

# Clean up log file on success
rm -f "$TMP_LOG"

# Verify setup
if [ -z "$IDF_PATH" ]; then
    echo "Error: IDF_PATH not set after sourcing export.sh"
    exit 1
fi

echo "ESP-IDF environment ready!"
echo "IDF_PATH: $IDF_PATH"
echo "Python: $(which python)"
echo "idf.py: $(which idf.py)"

# Check if schema binary exists
SCHEMA_BIN="$REPO_ROOT/build/address-schema.bin"
if [ ! -f "$SCHEMA_BIN" ]; then
    echo "Warning: Schema binary not found at $SCHEMA_BIN"
    echo "Run: python3 tools/compile_schema.py address-schema.yaml -o build/address-schema.bin"
fi

