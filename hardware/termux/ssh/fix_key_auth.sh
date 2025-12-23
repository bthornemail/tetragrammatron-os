#!/usr/bin/env bash
# Fix SSH Key Authentication for Termux Devices
# Adds public keys to authorized_keys on devices if they're missing

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SSH_DIR="$HOME/.ssh"
PASSWORD="passwd84"

# Device configurations
declare -A DEVICES=(
  ["termux-101"]="192.168.8.101:u0_a164:termux-101_key"
  ["termux-102"]="192.168.8.102:u0_a201:termux-102_key"
  ["termux-103"]="192.168.8.103:u0_a171:termux-103_key"
)

echo "=== Fixing SSH Key Authentication ==="
echo ""

# Function to add key to device
add_key_to_device() {
  local hostname="$1"
  local ip="$2"
  local user="$3"
  local key_name="$4"
  local pubkey_path="$SSH_DIR/${key_name}.pub"
  
  if [ ! -f "$pubkey_path" ]; then
    echo "Error: Public key not found: $pubkey_path"
    return 1
  fi
  
  local pubkey_content="$(cat "$pubkey_path")"
  
  echo "Adding key to $hostname ($user@$ip:8022)..."
  
  if command -v sshpass >/dev/null 2>&1; then
    sshpass -p "$PASSWORD" ssh -p 8022 -o StrictHostKeyChecking=no "$user@$ip" \
      "mkdir -p ~/.ssh && chmod 700 ~/.ssh && \
       if ! grep -qF '$pubkey_content' ~/.ssh/authorized_keys 2>/dev/null; then \
         echo '$pubkey_content' >> ~/.ssh/authorized_keys && \
         chmod 600 ~/.ssh/authorized_keys && \
         echo 'Key added successfully'; \
       else \
         echo 'Key already exists'; \
       fi" 2>&1 && {
      echo "  ✓ Key added/verified on $hostname"
      return 0
    } || {
      echo "  ✗ Failed to add key to $hostname"
      return 1
    }
  else
    echo "  Error: sshpass not installed. Install with: sudo apt install sshpass"
    echo "  Or manually run:"
    echo "    ssh -p 8022 $user@$ip"
    echo "    Then: echo '$(cat "$pubkey_path")' >> ~/.ssh/authorized_keys"
    return 1
  fi
}

# Add keys to all devices
SUCCESS_COUNT=0
for device_name in "${!DEVICES[@]}"; do
  IFS=':' read -r ip user key_name <<< "${DEVICES[$device_name]}"
  if add_key_to_device "$device_name" "$ip" "$user" "$key_name"; then
    ((SUCCESS_COUNT++))
  fi
  echo ""
done

# Test connections
echo "=== Testing Connections ==="
for device_name in "${!DEVICES[@]}"; do
  IFS=':' read -r ip user key_name <<< "${DEVICES[$device_name]}"
  key_path="$SSH_DIR/${key_name}"
  
  echo -n "Testing $device_name... "
  if ssh -i "$key_path" -p 8022 -o IdentitiesOnly=yes -o StrictHostKeyChecking=no -o ConnectTimeout=5 "$user@$ip" "echo 'OK'" 2>/dev/null; then
    echo "✓ Connected"
  else
    echo "✗ Failed"
  fi
done

echo ""
echo "=== Summary ==="
echo "Successfully configured: $SUCCESS_COUNT/${#DEVICES[@]} devices"

