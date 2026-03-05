#!/usr/bin/env bash
# Setup MQTT Broker on Termux Device
# Installs and configures Mosquitto on a Termux device
# 
# Usage:
#   On Termux device: ./setup_mqtt_broker_termux.sh [device_ip]
#   From Linux host: ./setup_mqtt_broker_termux.sh [device_ip] [username]
#
# Examples:
#   On device: ./setup_mqtt_broker_termux.sh 192.168.8.101
#   From host: ./setup_mqtt_broker_termux.sh 192.168.8.101 u0_a164
#
# This script:
# - Auto-detects if running on Termux or Linux host
# - Installs Mosquitto on Termux device
# - Configures MQTT broker on port 1883
# - Sets up bridge to router broker (192.168.8.1)
# - Creates startup script
# - Tests connectivity
#
# Status: ✅ Working on devices 101, 102, 103

set -e

DEVICE_IP="${1}"
DEVICE_USER="${2}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_TEMPLATE="$SCRIPT_DIR/mosquitto_config_termux.conf"

# Detect if running on Termux (has pkg command) or Linux host
if command -v pkg >/dev/null 2>&1; then
  # Running on Termux device
  RUNNING_ON_TERMUX=true
  DEVICE_IP="${DEVICE_IP:-$(ip route get 1.1.1.1 2>/dev/null | grep -oP 'src \K\S+' || echo 'unknown')}"
  CONFIG_DIR="$HOME/.config/mosquitto"
  CONFIG_FILE="$CONFIG_DIR/mosquitto.conf"
else
  # Running on Linux host - need to execute remotely
  RUNNING_ON_TERMUX=false
  
  if [ -z "$DEVICE_IP" ] || [ -z "$DEVICE_USER" ]; then
    echo "Error: When running from Linux host, both IP and username are required:"
    echo "  $0 <device_ip> <username>"
    echo ""
    echo "Examples:"
    echo "  $0 192.168.8.101 u0_a164"
    echo "  $0 192.168.8.102 u0_a201"
    echo "  $0 192.168.8.103 u0_a171"
    exit 1
  fi
  
  # Map IPs to usernames if not provided
  declare -A IP_TO_USER=(
    ["192.168.8.101"]="u0_a164"
    ["192.168.8.102"]="u0_a201"
    ["192.168.8.103"]="u0_a171"
  )
  
  if [ -z "$DEVICE_USER" ] && [ -n "${IP_TO_USER[$DEVICE_IP]}" ]; then
    DEVICE_USER="${IP_TO_USER[$DEVICE_IP]}"
  fi
fi

echo "=== Setting up MQTT Broker on Termux Device ==="
echo "Device IP: $DEVICE_IP"
if [ "$RUNNING_ON_TERMUX" = false ]; then
  echo "Device User: $DEVICE_USER"
  echo "Executing remotely via SSH..."
fi
echo ""

# Validate device IP
if [ "$DEVICE_IP" = "unknown" ] || ! [[ "$DEVICE_IP" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "Error: Invalid device IP: $DEVICE_IP"
  exit 1
fi

# Function to get SSH key path for device
get_ssh_key() {
  local ip="$1"
  # Map IP to device name
  case "$ip" in
    192.168.8.101) echo "~/.ssh/termux-101_key" ;;
    192.168.8.102) echo "~/.ssh/termux-102_key" ;;
    192.168.8.103) echo "~/.ssh/termux-103_key" ;;
    *) echo "~/.ssh/termux-$(echo "$ip" | tr '.' '-')_key" ;;
  esac
}

# Function to run command on device (if remote)
run_on_device() {
  if [ "$RUNNING_ON_TERMUX" = true ]; then
    eval "$@"
  else
    local key_path=$(eval echo $(get_ssh_key "$DEVICE_IP"))
    ssh -i "$key_path" -p 8022 -o IdentitiesOnly=yes "$DEVICE_USER@$DEVICE_IP" "$@"
  fi
}

# Function to copy file to device (if remote)
copy_to_device() {
  local local_file="$1"
  local remote_path="$2"
  if [ "$RUNNING_ON_TERMUX" = true ]; then
    cp "$local_file" "$remote_path"
  else
    local key_path=$(eval echo $(get_ssh_key "$DEVICE_IP"))
    cat "$local_file" | ssh -i "$key_path" -p 8022 -o IdentitiesOnly=yes "$DEVICE_USER@$DEVICE_IP" "cat > $remote_path"
  fi
}

# Update package lists
echo "Updating package lists..."
if [ "$RUNNING_ON_TERMUX" = true ]; then
  pkg update -y
else
  run_on_device "pkg update -y"
fi

# Install Mosquitto
echo "Installing Mosquitto..."
if [ "$RUNNING_ON_TERMUX" = true ]; then
  pkg install -y mosquitto || {
    echo "Error: Failed to install Mosquitto"
    exit 1
  }
else
  run_on_device "pkg install -y mosquitto" || {
    echo "Error: Failed to install Mosquitto on device"
    exit 1
  }
fi
echo "✓ Mosquitto installed"
echo ""

# Create configuration directory
echo "Creating configuration directory..."
if [ "$RUNNING_ON_TERMUX" = true ]; then
  mkdir -p "$CONFIG_DIR"
  mkdir -p "$HOME/var/lib/mosquitto"
  mkdir -p "$HOME/var/log"
else
  run_on_device "mkdir -p ~/.config/mosquitto ~/var/lib/mosquitto ~/var/log"
fi
echo "✓ Directories created"
echo ""

# Generate configuration file from template
echo "Generating configuration file..."
if [ ! -f "$CONFIG_TEMPLATE" ]; then
  echo "Error: Configuration template not found: $CONFIG_TEMPLATE"
  exit 1
fi

# Replace DEVICE_IP placeholder in template and copy to device
TEMP_CONFIG=$(mktemp)
sed "s/DEVICE_IP/$DEVICE_IP/g" "$CONFIG_TEMPLATE" > "$TEMP_CONFIG"

if [ "$RUNNING_ON_TERMUX" = true ]; then
  cp "$TEMP_CONFIG" "$CONFIG_FILE"
  echo "✓ Configuration file created: $CONFIG_FILE"
else
  copy_to_device "$TEMP_CONFIG" "~/.config/mosquitto/mosquitto.conf"
  echo "✓ Configuration file created on device"
fi
rm "$TEMP_CONFIG"
echo ""

# Test configuration
echo "Testing configuration..."
if [ "$RUNNING_ON_TERMUX" = true ]; then
  if mosquitto -c "$CONFIG_FILE" -t 2>&1 | grep -q "Error"; then
    echo "Warning: Configuration test found errors, but continuing..."
  else
    echo "✓ Configuration is valid"
  fi
else
  run_on_device "mosquitto -c ~/.config/mosquitto/mosquitto.conf -t 2>&1 | grep -q Error && echo 'Warning: Config test found errors' || echo '✓ Configuration is valid'"
fi
echo ""

# Create startup script
STARTUP_SCRIPT="~/bin/start_mosquitto.sh"
echo "Creating startup script..."

if [ "$RUNNING_ON_TERMUX" = true ]; then
  mkdir -p "$HOME/bin"
  cat > "$HOME/bin/start_mosquitto.sh" << 'EOF'
#!/usr/bin/env sh
# Start Mosquitto broker
CONFIG_FILE="$HOME/.config/mosquitto/mosquitto.conf"
PID_FILE="$HOME/var/run/mosquitto.pid"

if [ -f "$PID_FILE" ]; then
  PID=$(cat "$PID_FILE")
  if kill -0 "$PID" 2>/dev/null; then
    echo "Mosquitto is already running (PID: $PID)"
    exit 0
  fi
fi

mkdir -p "$(dirname "$PID_FILE")"
mosquitto -c "$CONFIG_FILE" -d
echo "Mosquitto started (PID: $(cat "$PID_FILE"))"
EOF
  chmod +x "$HOME/bin/start_mosquitto.sh"
else
  # Create temporary file with startup script content
  TEMP_STARTUP=$(mktemp)
  cat > "$TEMP_STARTUP" << 'EOF'
#!/usr/bin/env sh
# Start Mosquitto broker
CONFIG_FILE="$HOME/.config/mosquitto/mosquitto.conf"
PID_FILE="$HOME/var/run/mosquitto.pid"

if [ -f "$PID_FILE" ]; then
  PID=$(cat "$PID_FILE")
  if kill -0 "$PID" 2>/dev/null; then
    echo "Mosquitto is already running (PID: $PID)"
    exit 0
  fi
fi

mkdir -p "$(dirname "$PID_FILE")"
mosquitto -c "$CONFIG_FILE" -d
echo "Mosquitto started (PID: $(cat "$PID_FILE"))"
EOF
  copy_to_device "$TEMP_STARTUP" "~/bin/start_mosquitto.sh"
  run_on_device "chmod +x ~/bin/start_mosquitto.sh"
  rm "$TEMP_STARTUP"
fi
echo "✓ Startup script created: $STARTUP_SCRIPT"
echo ""

# Start Mosquitto
echo "Starting Mosquitto broker..."
if [ "$RUNNING_ON_TERMUX" = true ]; then
  "$HOME/bin/start_mosquitto.sh" || {
    echo "Warning: Failed to start Mosquitto, you may need to start it manually:"
    echo "  $HOME/bin/start_mosquitto.sh"
  }
else
  run_on_device "~/bin/start_mosquitto.sh" || {
    echo "Warning: Failed to start Mosquitto on device"
  }
fi
echo ""

# Test local connectivity
echo "Testing local MQTT connectivity..."
sleep 2
if [ "$RUNNING_ON_TERMUX" = true ]; then
  if mosquitto_pub -h 127.0.0.1 -t test/connection -m "test" 2>/dev/null; then
    echo "✓ Local MQTT broker is responding"
  else
    echo "⚠ Local MQTT broker may not be ready"
  fi
else
  if run_on_device "mosquitto_pub -h 127.0.0.1 -t test/connection -m 'test' 2>/dev/null && echo 'OK' || echo 'FAIL'" | grep -q "OK"; then
    echo "✓ Local MQTT broker is responding"
  else
    echo "⚠ Local MQTT broker may not be ready"
  fi
fi
echo ""

# Test bridge connectivity to router
echo "Testing bridge connectivity to router..."
if [ "$RUNNING_ON_TERMUX" = true ]; then
  if timeout 5 mosquitto_pub -h 192.168.8.1 -t test/bridge -m "test" 2>/dev/null; then
    echo "✓ Can connect to router broker"
  else
    echo "⚠ Cannot connect to router broker (may be normal if router broker not set up yet)"
  fi
else
  run_on_device "timeout 5 mosquitto_pub -h 192.168.8.1 -t test/bridge -m 'test' 2>/dev/null && echo 'OK' || echo 'FAIL'" | grep -q "OK" && {
    echo "✓ Can connect to router broker"
  } || {
    echo "⚠ Cannot connect to router broker (may be normal if router broker not set up yet)"
  }
fi
echo ""

echo "=== Setup Complete ==="
echo "MQTT broker configuration:"
echo "  - Local: 127.0.0.1:1883"
echo "  - Network: $DEVICE_IP:1883"
echo "  - Bridge to: 192.168.8.1:1883"
echo ""
if [ "$RUNNING_ON_TERMUX" = true ]; then
  echo "To start Mosquitto:"
  echo "  $HOME/bin/start_mosquitto.sh"
  echo ""
  echo "To check if running:"
  echo "  pgrep mosquitto"
  echo ""
  echo "To view logs:"
  echo "  tail -f ~/var/log/mosquitto.log"
else
  echo "To start Mosquitto on device:"
  echo "  ssh -p 8022 $DEVICE_USER@$DEVICE_IP '~/bin/start_mosquitto.sh'"
  echo ""
  echo "To check if running:"
  echo "  ssh -p 8022 $DEVICE_USER@$DEVICE_IP 'pgrep mosquitto'"
  echo ""
  echo "To view logs:"
  echo "  ssh -p 8022 $DEVICE_USER@$DEVICE_IP 'tail -f ~/var/log/mosquitto.log'"
fi

