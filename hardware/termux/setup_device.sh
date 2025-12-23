#!/usr/bin/env bash
# Setup a Termux device with probe script and MQTT broker
# Usage: ./setup_device.sh <device_ip> <username>
# Example: ./setup_device.sh 192.168.8.101 u0_a164

set -e

DEVICE_IP="$1"
DEVICE_USER="$2"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

if [ -z "$DEVICE_IP" ] || [ -z "$DEVICE_USER" ]; then
  echo "Usage: $0 <device_ip> <username>"
  echo "Example: $0 192.168.8.101 u0_a164"
  exit 1
fi

# Map IP to key name
case "$DEVICE_IP" in
  192.168.8.101) KEY_NAME="termux-101_key" ;;
  192.168.8.102) KEY_NAME="termux-102_key" ;;
  192.168.8.103) KEY_NAME="termux-103_key" ;;
  *) KEY_NAME="termux-$(echo "$DEVICE_IP" | tr '.' '-')_key" ;;
esac

KEY_PATH="$HOME/.ssh/$KEY_NAME"
SSH_OPTS="-i $KEY_PATH -p 8022 -o IdentitiesOnly=yes -o StrictHostKeyChecking=no"

echo "=== Setting up Device: $DEVICE_IP ($DEVICE_USER) ==="
echo ""

# Test SSH connection
echo "1. Testing SSH connection..."
if ! ssh $SSH_OPTS "$DEVICE_USER@$DEVICE_IP" "echo 'SSH OK'" 2>/dev/null; then
  echo "✗ SSH connection failed. Please check:"
  echo "  - SSH server running on device: sshd -p 8022"
  echo "  - Key is authorized on device"
  exit 1
fi
echo "✓ SSH connection successful"
echo ""

# Create directories
echo "2. Creating directory structure..."
ssh $SSH_OPTS "$DEVICE_USER@$DEVICE_IP" << 'REMOTE'
mkdir -p ~/tetragrammatron-os/hardware/termux
mkdir -p ~/tetragrammatron-os/hardware
mkdir -p ~/.config/mosquitto
mkdir -p ~/var/lib/mosquitto
mkdir -p ~/var/log
mkdir -p ~/bin
echo "Directories created"
REMOTE
echo "✓ Directories created"
echo ""

# Copy probe script
echo "3. Installing probe script..."
cat "$PROJECT_ROOT/hardware/termux/probe_termux.sh" | \
  ssh $SSH_OPTS "$DEVICE_USER@$DEVICE_IP" \
    "cat > ~/tetragrammatron-os/hardware/termux/probe_termux.sh && \
     chmod +x ~/tetragrammatron-os/hardware/termux/probe_termux.sh && \
     echo 'Probe script installed'"
echo "✓ Probe script installed"
echo ""

# Test probe
echo "4. Testing probe script..."
ssh $SSH_OPTS "$DEVICE_USER@$DEVICE_IP" \
  "~/tetragrammatron-os/hardware/termux/probe_termux.sh >/dev/null 2>&1 && \
   wc -l ~/tetragrammatron-os/hardware/probe.jsonl && \
   echo 'Probe test successful'"
echo "✓ Probe script working"
echo ""

# Setup MQTT broker
echo "5. Setting up MQTT broker..."
cd "$PROJECT_ROOT/hardware/mqtt"
./setup_mqtt_broker_termux.sh "$DEVICE_IP" "$DEVICE_USER" 2>&1 | \
  grep -E "(Setting up|Installing|Configuration|Starting|Testing|Setup Complete|✓|✗|⚠|Error)" | \
  head -15
echo ""

# Verify MQTT
echo "6. Verifying MQTT broker..."
sleep 3
if ssh $SSH_OPTS "$DEVICE_USER@$DEVICE_IP" "pgrep mosquitto >/dev/null && echo 'running'" 2>/dev/null | grep -q "running"; then
  echo "✓ MQTT broker is running"
else
  echo "⚠ MQTT broker not running, attempting to start..."
  ssh $SSH_OPTS "$DEVICE_USER@$DEVICE_IP" << 'REMOTE'
# Fix config if needed
sed -i 's/listener 127\.0\.0\.1 1883/listener 0.0.0.0 1883/' ~/.config/mosquitto/mosquitto.conf 2>/dev/null || true
# Start mosquitto
mosquitto -c ~/.config/mosquitto/mosquitto.conf -d 2>&1
sleep 2
pgrep mosquitto && echo "Started" || echo "Failed"
REMOTE
fi
echo ""

# Final test
echo "7. Final verification..."
echo -n "  SSH: "
ssh $SSH_OPTS "$DEVICE_USER@$DEVICE_IP" "echo 'OK'" 2>/dev/null && echo "✓" || echo "✗"

echo -n "  Probe: "
ssh $SSH_OPTS "$DEVICE_USER@$DEVICE_IP" \
  "test -f ~/tetragrammatron-os/hardware/probe.jsonl && echo '✓' || echo '✗'" 2>/dev/null

echo -n "  MQTT: "
ssh $SSH_OPTS "$DEVICE_USER@$DEVICE_IP" \
  "pgrep mosquitto >/dev/null && echo '✓' || echo '✗'" 2>/dev/null

echo ""
echo "=== Setup Complete for $DEVICE_IP ==="
echo ""
echo "Test commands:"
echo "  ssh -i $KEY_PATH -p 8022 $DEVICE_USER@$DEVICE_IP '~/tetragrammatron-os/hardware/termux/probe_termux.sh'"
echo "  rsync -avz -e \"ssh -i $KEY_PATH -p 8022 -o IdentitiesOnly=yes\" $DEVICE_USER@$DEVICE_IP:~/tetragrammatron-os/hardware/probe.jsonl hardware/probe.jsonl"
echo "  mosquitto_pub -h $DEVICE_IP -p 1883 -t test/device -m 'test'"

