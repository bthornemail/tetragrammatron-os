#!/bin/bash
# Install ESP-IDF tools with proxy support
# NOTE: This script installs tools BEFORE setting up the full ESP-IDF environment
# because the environment setup requires tools to be installed first.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
IDF_PATH="$REPO_ROOT/vendor/esp/idf-v5.4.1"

if [ ! -d "$IDF_PATH" ]; then
    echo "Error: ESP-IDF not found at $IDF_PATH"
    exit 1
fi

# Configure proxy FIRST (before trying to activate ESP-IDF environment)
# Check for proxy in common locations
if [ -f "$HOME/.update-proxy.sh" ]; then
    echo "Loading proxy configuration from ~/.update-proxy.sh..."
    source "$HOME/.update-proxy.sh" 2>/dev/null || true
fi

# Set proxy environment variables if not already set
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
echo "Installing ESP-IDF tools..."
echo "This may take several minutes depending on your connection."
echo ""

# Use the ESP-IDF Python environment directly (don't try to activate full environment)
# The Python venv should already exist from ESP-IDF installation
PYTHON_ENV="$HOME/.espressif/python_env/idf5.4_py3.12_env/bin/python"

if [ ! -f "$PYTHON_ENV" ]; then
    echo "Error: ESP-IDF Python environment not found at $PYTHON_ENV"
    echo "This should have been created when ESP-IDF was installed."
    echo "Trying to use system Python as fallback..."
    PYTHON_ENV="python3"
fi

echo "Using Python: $PYTHON_ENV"
echo "IDF_PATH: $IDF_PATH"
echo ""

# Install tools - this will download and install all required toolchains
"$PYTHON_ENV" "$IDF_PATH/tools/idf_tools.py" install

echo ""
echo "Tool installation complete!"
echo ""
echo "To verify installed tools, run:"
echo "  $PYTHON_ENV $IDF_PATH/tools/idf_tools.py list"
echo ""
echo "Now you can run:"
echo "  cd hardware/esp32"
echo "  source setup_idf.sh"
echo "  cd can_app"
echo "  idf.py build"
echo ""

