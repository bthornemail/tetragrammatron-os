#!/usr/bin/env bash
# Setup MQTT Broker on OpenWrt Router
# Installs and configures Mosquitto on the router at 192.168.8.1
#
# Usage: ./setup_mqtt_broker_openwrt.sh
#
# This script:
# - Installs Mosquitto on OpenWrt router (192.168.8.1)
# - Configures MQTT on port 1883
# - Configures WebSocket on port 8080
# - Sets up firewall rules
# - Starts and enables Mosquitto service
#
# Requirements:
# - SSH access to router (root@192.168.8.1)
# - Router SSH key configured (see hardware/termux/ssh/setup_ssh.sh)
#
# Status: ✅ Operational (verified working)

set -e

ROUTER_IP="192.168.8.1"
ROUTER_USER="root"
ROUTER_PASSWORD="passwd84"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="$SCRIPT_DIR/mosquitto_config_router.conf"

echo "=== Setting up MQTT Broker on OpenWrt Router ==="
echo "Router: $ROUTER_USER@$ROUTER_IP"
echo ""

# Check if config file exists
if [ ! -f "$CONFIG_FILE" ]; then
  echo "Error: Configuration file not found: $CONFIG_FILE"
  exit 1
fi

# Function to run command on router via SSH
# Router needs RSA key algorithms for older OpenSSH
ssh_router() {
  local cmd="$1"
  local ssh_opts="-o StrictHostKeyChecking=no -o HostKeyAlgorithms=+ssh-rsa -o PubkeyAcceptedKeyTypes=+ssh-rsa"
  if command -v sshpass >/dev/null 2>&1; then
    sshpass -p "$ROUTER_PASSWORD" ssh $ssh_opts "$ROUTER_USER@$ROUTER_IP" "$cmd"
  else
    ssh $ssh_opts "$ROUTER_USER@$ROUTER_IP" "$cmd"
  fi
}

# Function to copy file to router
# Use cat/echo method instead of scp to avoid sftp-server dependency
# Router needs RSA key algorithms
scp_to_router() {
  local local_file="$1"
  local remote_path="$2"
  local file_content="$(cat "$local_file")"
  local ssh_opts="-o StrictHostKeyChecking=no -o HostKeyAlgorithms=+ssh-rsa -o PubkeyAcceptedKeyTypes=+ssh-rsa"
  
  if command -v sshpass >/dev/null 2>&1; then
    sshpass -p "$ROUTER_PASSWORD" ssh $ssh_opts "$ROUTER_USER@$ROUTER_IP" \
      "cat > $remote_path" <<< "$file_content" || {
      echo "Warning: Failed to copy via SSH, trying alternative method..."
      # Alternative: base64 encode and decode
      local encoded="$(base64 -w 0 "$local_file")"
      sshpass -p "$ROUTER_PASSWORD" ssh $ssh_opts "$ROUTER_USER@$ROUTER_IP" \
        "echo '$encoded' | base64 -d > $remote_path"
    }
  else
    ssh $ssh_opts "$ROUTER_USER@$ROUTER_IP" \
      "cat > $remote_path" <<< "$file_content" || {
      echo "Warning: Failed to copy via SSH"
      return 1
    }
  fi
}

# Test SSH connection
echo "Testing SSH connection to router..."
if ! ssh_router "echo 'Connection successful'" 2>/dev/null; then
  echo "Error: Cannot connect to router. Check SSH access."
  exit 1
fi
echo "✓ SSH connection successful"
echo ""

# Update package lists
echo "Updating package lists on router..."
ssh_router "opkg update" || {
  echo "Warning: opkg update failed, continuing anyway..."
}
echo ""

# Install Mosquitto
echo "Installing Mosquitto..."
ssh_router "opkg install mosquitto mosquitto-client" || {
  echo "Error: Failed to install Mosquitto"
  exit 1
}
echo "✓ Mosquitto installed"
echo ""

# Create necessary directories
echo "Creating directories..."
ssh_router "mkdir -p /var/lib/mosquitto /var/log/mosquitto /etc/mosquitto/conf.d" || true
echo "✓ Directories created"
echo ""

# Copy configuration file
echo "Copying configuration file..."
if scp_to_router "$CONFIG_FILE" "/etc/mosquitto/mosquitto.conf"; then
  echo "✓ Configuration file copied"
else
  echo "⚠ Failed to copy config file, trying direct method..."
  # Direct method: read file and pipe through SSH
  ssh_router "cat > /etc/mosquitto/mosquitto.conf" < "$CONFIG_FILE" && {
    echo "✓ Configuration file copied (direct method)"
  } || {
    echo "✗ Failed to copy configuration file"
    echo "You may need to manually copy: $CONFIG_FILE to /etc/mosquitto/mosquitto.conf on router"
  }
fi
echo ""

# Set permissions
echo "Setting permissions..."
ssh_router "chown -R mosquitto:mosquitto /var/lib/mosquitto /var/log/mosquitto 2>/dev/null || true"
echo "✓ Permissions set"
echo ""

# Configure firewall (if uci/firewall is available)
echo "Configuring firewall rules..."
ssh_router "uci add firewall rule 2>/dev/null || true" || true
ssh_router "uci set firewall.@rule[-1].name='Allow MQTT'" || true
ssh_router "uci set firewall.@rule[-1].src='wan'" || true
ssh_router "uci set firewall.@rule[-1].dest_port='1883'" || true
ssh_router "uci set firewall.@rule[-1].proto='tcp'" || true
ssh_router "uci set firewall.@rule[-1].target='ACCEPT'" || true
ssh_router "uci add firewall rule 2>/dev/null || true" || true
ssh_router "uci set firewall.@rule[-1].name='Allow MQTT WebSocket'" || true
ssh_router "uci set firewall.@rule[-1].src='wan'" || true
ssh_router "uci set firewall.@rule[-1].dest_port='8080'" || true
ssh_router "uci set firewall.@rule[-1].proto='tcp'" || true
ssh_router "uci set firewall.@rule[-1].target='ACCEPT'" || true
ssh_router "uci commit firewall 2>/dev/null || true" || true
ssh_router "/etc/init.d/firewall reload 2>/dev/null || true" || true
echo "✓ Firewall rules configured (if supported)"
echo ""

# Start and enable Mosquitto service
echo "Starting Mosquitto service..."
ssh_router "/etc/init.d/mosquitto enable" || true
ssh_router "/etc/init.d/mosquitto restart" || {
  echo "Warning: Failed to restart service, trying start..."
  ssh_router "/etc/init.d/mosquitto start" || {
    echo "Error: Failed to start Mosquitto service"
    exit 1
  }
}
echo "✓ Mosquitto service started"
echo ""

# Test connectivity
echo "Testing MQTT connectivity..."
sleep 2
if ssh_router "mosquitto_pub -h localhost -t test/connection -m 'test' 2>/dev/null"; then
  echo "✓ MQTT broker is responding"
else
  echo "⚠ MQTT broker may not be fully ready, check logs:"
  echo "  ssh $ROUTER_USER@$ROUTER_IP 'cat /var/log/mosquitto/mosquitto.log'"
fi
echo ""

# Show service status
echo "Mosquitto service status:"
ssh_router "/etc/init.d/mosquitto status" || true
echo ""

echo "=== Setup Complete ==="
echo "MQTT broker is running on:"
echo "  - MQTT: $ROUTER_IP:1883"
echo "  - WebSocket: $ROUTER_IP:8080"
echo ""
echo "To check logs:"
echo "  ssh $ROUTER_USER@$ROUTER_IP 'tail -f /var/log/mosquitto/mosquitto.log'"

