#!/usr/bin/env bash
# Fix SSH access for device 103 after reset

DEVICE_IP="192.168.8.103"
DEVICE_USER="u0_a171"
PASSWORD="passwd84"
KEY_FILE="$HOME/.ssh/termux-103_key.pub"

echo "=== Fixing SSH Access for Device 103 ==="
echo "Device: $DEVICE_USER@$DEVICE_IP:8022"
echo ""

# Check if key exists
if [ ! -f "$KEY_FILE" ]; then
  echo "Error: SSH key not found: $KEY_FILE"
  exit 1
fi

PUBKEY=$(cat "$KEY_FILE")
echo "Adding SSH key to device..."

# Try with sshpass if available, otherwise prompt
if command -v sshpass >/dev/null 2>&1; then
  sshpass -p "$PASSWORD" ssh -p 8022 -o StrictHostKeyChecking=no "$DEVICE_USER@$DEVICE_IP" \
    "mkdir -p ~/.ssh && chmod 700 ~/.ssh && \
     grep -qF '$PUBKEY' ~/.ssh/authorized_keys 2>/dev/null || echo '$PUBKEY' >> ~/.ssh/authorized_keys && \
     chmod 600 ~/.ssh/authorized_keys && \
     echo 'Key added successfully'" 2>&1
else
  echo "Note: sshpass not installed. You'll need to enter password manually."
  echo "Password is: $PASSWORD"
  ssh -p 8022 -o StrictHostKeyChecking=no "$DEVICE_USER@$DEVICE_IP" \
    "mkdir -p ~/.ssh && chmod 700 ~/.ssh && \
     grep -qF '$PUBKEY' ~/.ssh/authorized_keys 2>/dev/null || echo '$PUBKEY' >> ~/.ssh/authorized_keys && \
     chmod 600 ~/.ssh/authorized_keys && \
     echo 'Key added successfully'" 2>&1
fi

echo ""
echo "Testing SSH connection..."
if ssh -i ~/.ssh/termux-103_key -p 8022 -o IdentitiesOnly=yes -o StrictHostKeyChecking=no -o ConnectTimeout=5 "$DEVICE_USER@$DEVICE_IP" "echo 'Connection successful'" 2>/dev/null; then
  echo "✓ SSH connection successful!"
  echo ""
  echo "You can now run setup scripts:"
  echo "  hardware/termux/ssh/setup_ssh.sh  (to verify all devices)"
  echo "  hardware/mqtt/setup_mqtt_broker_termux.sh 192.168.8.103 u0_a171"
else
  echo "✗ SSH connection failed. Please check manually."
  exit 1
fi
