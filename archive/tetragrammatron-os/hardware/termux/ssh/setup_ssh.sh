#!/usr/bin/env bash
# SSH Setup Script for Termux Devices
# Generates SSH keys and configures access to all devices
#
# Usage: ./setup_ssh.sh
#
# This script:
# - Generates SSH keys for all devices (ed25519 for Termux, RSA for router)
# - Copies public keys to devices (uses sshpass if available)
# - Updates ~/.ssh/config with device entries
# - Tests SSH connections
#
# Devices configured:
# - termux-101 (192.168.8.101:8022, user: u0_a164)
# - termux-102 (192.168.8.102:8022, user: u0_a201)
# - termux-103 (192.168.8.103:8022, user: u0_a171)
# - router (192.168.8.1:22, user: root, RSA key)
#
# Status: ✅ Working (devices 101, 102, router)
# Note: Device 103 may need manual key setup if device was reset

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
SSH_DIR="$HOME/.ssh"
PASSWORD="passwd84"

# Device configurations
declare -A DEVICES=(
  ["termux-101"]="192.168.8.101:u0_a164"
  ["termux-102"]="192.168.8.102:u0_a201"
  ["termux-103"]="192.168.8.103:u0_a171"
  ["router"]="192.168.8.1:root"
)

# Create SSH directory if it doesn't exist
mkdir -p "$SSH_DIR"
chmod 700 "$SSH_DIR"

# Function to generate SSH key if it doesn't exist
generate_key() {
  local key_name="$1"
  local key_path="$SSH_DIR/${key_name}"
  
  if [ ! -f "$key_path" ]; then
    echo "Generating SSH key: $key_name"
    # Router needs RSA keys (older OpenSSH), Termux devices can use ed25519
    if [[ "$key_name" == router_key ]]; then
      ssh-keygen -t rsa -b 4096 -f "$key_path" -N "" -C "router-setup-$(date +%Y%m%d)"
    else
      ssh-keygen -t ed25519 -f "$key_path" -N "" -C "termux-setup-$(date +%Y%m%d)"
    fi
    chmod 600 "$key_path"
  else
    echo "SSH key already exists: $key_name"
  fi
}

# Function to copy public key to device
copy_key_to_device() {
  local hostname="$1"
  local ip="$2"
  local user="$3"
  local key_name="$4"
  local key_path="$SSH_DIR/${key_name}"
  local pubkey_path="${key_path}.pub"
  
  if [ ! -f "$pubkey_path" ]; then
    echo "Error: Public key not found: $pubkey_path"
    return 1
  fi
  
  echo "Copying public key to $hostname ($user@$ip)..."
  
  # Determine SSH port (8022 for Termux devices, 22 for router)
  local ssh_port=22
  if [[ "$hostname" == termux-* ]]; then
    ssh_port=8022
  fi
  
  # Router needs RSA key algorithms
  local ssh_opts="-p $ssh_port -o IdentitiesOnly=yes -o StrictHostKeyChecking=no"
  if [[ "$hostname" == router ]]; then
    ssh_opts="$ssh_opts -o HostKeyAlgorithms=+ssh-rsa -o PubkeyAcceptedKeyTypes=+ssh-rsa"
  fi
  
  # Use sshpass if available, otherwise prompt for password
  # Use IdentitiesOnly=yes to prevent "too many authentication failures"
  if command -v sshpass >/dev/null 2>&1; then
    sshpass -p "$PASSWORD" ssh-copy-id -i "$pubkey_path" $ssh_opts "$user@$ip" || {
      echo "Warning: ssh-copy-id failed, trying manual method..."
      sshpass -p "$PASSWORD" ssh $ssh_opts "$user@$ip" \
        "mkdir -p ~/.ssh && chmod 700 ~/.ssh && grep -qF '$(cat "$pubkey_path")' ~/.ssh/authorized_keys 2>/dev/null || echo '$(cat "$pubkey_path")' >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"
    }
  else
    echo "Note: sshpass not installed. You'll need to enter password manually."
    echo "Password is: $PASSWORD"
    ssh-copy-id -i "$pubkey_path" $ssh_opts "$user@$ip" || {
      echo "Manual key copy method..."
      ssh $ssh_opts "$user@$ip" \
        "mkdir -p ~/.ssh && chmod 700 ~/.ssh && grep -qF '$(cat "$pubkey_path")' ~/.ssh/authorized_keys 2>/dev/null || echo '$(cat "$pubkey_path")' >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"
    }
  fi
}

# Function to test SSH connection
test_connection() {
  local hostname="$1"
  local ip="$2"
  local user="$3"
  local key_name="$4"
  local key_path="$SSH_DIR/${key_name}"
  
  # Determine SSH port (8022 for Termux devices, 22 for router)
  local ssh_port=22
  if [[ "$hostname" == termux-* ]]; then
    ssh_port=8022
  fi
  
  # Router needs RSA key algorithms
  local ssh_opts="-i $key_path -p $ssh_port -o IdentitiesOnly=yes -o StrictHostKeyChecking=no -o ConnectTimeout=5"
  if [[ "$hostname" == router ]]; then
    ssh_opts="$ssh_opts -o HostKeyAlgorithms=+ssh-rsa -o PubkeyAcceptedKeyTypes=+ssh-rsa"
  fi
  
  echo "Testing SSH connection to $hostname (port $ssh_port)..."
  if ssh $ssh_opts "$user@$ip" "echo 'Connection successful'" 2>/dev/null; then
    echo "✓ Successfully connected to $hostname"
    return 0
  else
    echo "✗ Failed to connect to $hostname"
    return 1
  fi
}

# Generate keys for all devices
echo "=== Generating SSH Keys ==="
for device_name in "${!DEVICES[@]}"; do
  key_name="${device_name}_key"
  generate_key "$key_name"
done

# Copy keys to devices
echo ""
echo "=== Copying Public Keys to Devices ==="
for device_name in "${!DEVICES[@]}"; do
  IFS=':' read -r ip user <<< "${DEVICES[$device_name]}"
  key_name="${device_name}_key"
  copy_key_to_device "$device_name" "$ip" "$user" "$key_name"
done

# Update SSH config
echo ""
echo "=== Updating SSH Config ==="
SSH_CONFIG="$SSH_DIR/config"
CONFIG_EXAMPLE="$SCRIPT_DIR/ssh_config.example"

if [ -f "$CONFIG_EXAMPLE" ]; then
  if [ ! -f "$SSH_CONFIG" ] || ! grep -q "termux-101" "$SSH_CONFIG" 2>/dev/null; then
    echo "Adding Termux device entries to SSH config..."
    # Validate config before appending
    if ssh -F "$SSH_CONFIG" -T nonexistent-host 2>&1 | grep -q "Bad forwarding specification"; then
      echo "Warning: Existing SSH config has errors. Backing up and fixing..."
      cp "$SSH_CONFIG" "${SSH_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)"
      # Remove malformed LocalForward lines (missing destination)
      sed -i '/LocalForward.*0\.0\.0\.0:[0-9]*$/d' "$SSH_CONFIG"
      sed -i '/LocalForward.*0\.0\.0\.0:[0-9]*#/d' "$SSH_CONFIG"
    fi
    # Append with a newline separator
    echo "" >> "$SSH_CONFIG"
    cat "$CONFIG_EXAMPLE" >> "$SSH_CONFIG"
    chmod 600 "$SSH_CONFIG"
    
    # Validate the updated config
    if ssh -F "$SSH_CONFIG" -T nonexistent-host 2>&1 | grep -q "Bad forwarding specification"; then
      echo "⚠ Warning: SSH config still has errors after update"
    else
      echo "✓ SSH config updated and validated"
    fi
  else
    echo "SSH config already contains Termux entries"
  fi
else
  echo "Warning: ssh_config.example not found, skipping config update"
fi

# Test connections
echo ""
echo "=== Testing SSH Connections ==="
SUCCESS_COUNT=0
TOTAL_COUNT=${#DEVICES[@]}

for device_name in "${!DEVICES[@]}"; do
  IFS=':' read -r ip user <<< "${DEVICES[$device_name]}"
  key_name="${device_name}_key"
  if test_connection "$device_name" "$ip" "$user" "$key_name"; then
    ((SUCCESS_COUNT++))
  fi
done

echo ""
echo "=== Summary ==="
echo "Successfully configured: $SUCCESS_COUNT/$TOTAL_COUNT devices"
if [ $SUCCESS_COUNT -eq $TOTAL_COUNT ]; then
  echo "✓ All devices configured successfully!"
  exit 0
else
  echo "⚠ Some devices failed. Check the output above for details."
  exit 1
fi

