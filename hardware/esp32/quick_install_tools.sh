#!/bin/bash
# Quick tool installation with proxy setup

set -e

# Set proxy if provided as argument
if [ -n "${1:-}" ]; then
    export HTTP_PROXY="$1"
    export HTTPS_PROXY="$1"
    export http_proxy="$1"
    export https_proxy="$1"
    echo "Proxy set to: $1"
fi

# Run install script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
"$SCRIPT_DIR/install_tools.sh"

