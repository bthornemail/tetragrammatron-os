#!/usr/bin/env sh
# Termux Setup Script
# Installs dependencies and configures environment for hardware probing
#
# Usage: Run this script ON the Termux device (not from Linux host)
#
# For remote setup from Linux host, use: ../setup_device.sh <ip> <username>
#
# This script:
# - Installs required packages (coreutils, procps-ng, openssh, rsync)
# - Creates directory structure
# - Sets up probe script
# - Configures periodic probing (optional)

set -e

echo "=== Termux Environment Setup ==="

# Update package lists
echo "Updating package lists..."
pkg update -y

# Install required packages
echo "Installing required packages..."
pkg install -y coreutils procps-ng openssh rsync

# Create directory structure
PROBE_DIR="$HOME/tetragrammatron-os/hardware"
echo "Creating directory structure: $PROBE_DIR"
mkdir -p "$PROBE_DIR"

# Copy probe script if it exists in the project
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
if [ -f "$SCRIPT_DIR/probe_termux.sh" ]; then
  echo "Installing probe script..."
  cp "$SCRIPT_DIR/probe_termux.sh" "$HOME/bin/probe_termux.sh" 2>/dev/null || \
    cp "$SCRIPT_DIR/probe_termux.sh" "$PROBE_DIR/probe_termux.sh"
  chmod +x "$HOME/bin/probe_termux.sh" 2>/dev/null || \
    chmod +x "$PROBE_DIR/probe_termux.sh"
  echo "✓ Probe script installed"
else
  echo "Warning: probe_termux.sh not found in script directory"
fi

# Test probe script
echo ""
echo "Testing probe script..."
if [ -f "$HOME/bin/probe_termux.sh" ]; then
  "$HOME/bin/probe_termux.sh"
elif [ -f "$PROBE_DIR/probe_termux.sh" ]; then
  "$PROBE_DIR/probe_termux.sh"
else
  echo "Error: Probe script not found"
  exit 1
fi

# Check if probe.jsonl was created
if [ -f "$PROBE_DIR/probe.jsonl" ]; then
  echo "✓ Probe script executed successfully"
  echo "Probe data location: $PROBE_DIR/probe.jsonl"
  echo ""
  echo "Sample output:"
  head -3 "$PROBE_DIR/probe.jsonl" || true
else
  echo "Warning: probe.jsonl not created"
fi

# Setup SSH server (optional)
echo ""
read -p "Do you want to enable SSH server? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "Setting up SSH server..."
  if [ ! -f ~/.ssh/authorized_keys ]; then
    mkdir -p ~/.ssh
    chmod 700 ~/.ssh
    echo "Note: Add your public key to ~/.ssh/authorized_keys"
  fi
  
  # Start SSH server
  if command -v sshd >/dev/null 2>&1; then
    echo "Starting SSH server..."
    sshd || echo "SSH server may already be running"
    echo "SSH server status: $(pgrep sshd >/dev/null && echo 'running' || echo 'not running')"
  fi
fi

echo ""
echo "=== Setup Complete ==="
echo "To run probe manually:"
echo "  $HOME/bin/probe_termux.sh"
echo ""
echo "To set up periodic probing, use termux-tasker or cron:"
echo "  termux-job-scheduler --period-ms 3600000 --job-id 1 --script $HOME/bin/probe_termux.sh"

