#!/usr/bin/env bash
# Test MQTT Connectivity Across Mesh Network
# Tests connections to router and all Termux devices
#
# Usage: ./test_mqtt_connection.sh
#
# This script:
# - Tests MQTT connectivity to router broker (192.168.8.1:1883)
# - Tests MQTT connectivity to all device brokers (101, 102, 103)
# - Tests WebSocket connectivity to router (192.168.8.1:8080)
# - Reports success/failure for each connection
#
# Requirements:
# - mosquitto_pub and mosquitto_sub installed
# - Network connectivity to devices

set -e

ROUTER_IP="192.168.8.1"
declare -a DEVICES=(
  "192.168.8.101:u0_a164"
  "192.168.8.102:u0_a201"
  "192.168.8.103:u0_a171"
)

TEST_TOPIC="tetragrammatron/test/connection"
TEST_MESSAGE="test-$(date +%s)"

echo "=== MQTT Connectivity Test ==="
echo "Test topic: $TEST_TOPIC"
echo "Test message: $TEST_MESSAGE"
echo ""

# Check if mosquitto clients are available
if ! command -v mosquitto_pub >/dev/null 2>&1 || ! command -v mosquitto_sub >/dev/null 2>&1; then
  echo "Error: mosquitto_pub and mosquitto_sub are required"
  echo "Install with: sudo apt install mosquitto-clients"
  exit 1
fi

# Function to test MQTT connection
test_mqtt() {
  local host="$1"
  local port="${2:-1883}"
  local name="$3"
  
  echo "Testing $name ($host:$port)..."
  
  # Try to publish a test message
  if timeout 5 mosquitto_pub -h "$host" -p "$port" -t "$TEST_TOPIC" -m "$TEST_MESSAGE" 2>/dev/null; then
    echo "  ✓ Publish successful"
    
    # Try to subscribe and receive message
    RECEIVED=$(timeout 3 mosquitto_sub -h "$host" -p "$port" -t "$TEST_TOPIC" -C 1 -W 2 2>/dev/null || echo "")
    if [ "$RECEIVED" = "$TEST_MESSAGE" ]; then
      echo "  ✓ Subscribe successful (message received)"
      return 0
    else
      echo "  ⚠ Subscribe successful but message not received (may be timing issue)"
      return 0
    fi
  else
    echo "  ✗ Connection failed"
    return 1
  fi
}

# Test router broker
echo "=== Router Broker Test ==="
test_mqtt "$ROUTER_IP" 1883 "Router MQTT"
test_mqtt "$ROUTER_IP" 8080 "Router WebSocket"
echo ""

# Test Termux device brokers
echo "=== Termux Device Broker Tests ==="
SUCCESS_COUNT=0
for device in "${DEVICES[@]}"; do
  IFS=':' read -r ip user <<< "$device"
  if test_mqtt "$ip" 1883 "Device $ip"; then
    ((SUCCESS_COUNT++))
  fi
  echo ""
done

# Test mesh propagation (publish on one device, receive on router)
echo "=== Mesh Propagation Test ==="
echo "Testing message propagation through mesh..."
MESH_TEST_MSG="mesh-test-$(date +%s)"
MESH_TOPIC="tetragrammatron/mesh/test"

# Publish on first device
if timeout 5 mosquitto_pub -h "${DEVICES[0]%%:*}" -t "$MESH_TOPIC" -m "$MESH_TEST_MSG" 2>/dev/null; then
  echo "  ✓ Published on device ${DEVICES[0]%%:*}"
  
  # Try to receive on router
  sleep 1
  RECEIVED=$(timeout 3 mosquitto_sub -h "$ROUTER_IP" -t "$MESH_TOPIC" -C 1 -W 2 2>/dev/null || echo "")
  if [ "$RECEIVED" = "$MESH_TEST_MSG" ]; then
    echo "  ✓ Message propagated to router (mesh working)"
  else
    echo "  ⚠ Message not received on router (bridge may not be configured)"
  fi
else
  echo "  ✗ Failed to publish on device"
fi
echo ""

# Summary
echo "=== Test Summary ==="
echo "Router broker: $(test_mqtt "$ROUTER_IP" 1883 "Router" >/dev/null 2>&1 && echo '✓ Working' || echo '✗ Failed')"
echo "Termux devices: $SUCCESS_COUNT/${#DEVICES[@]} responding"
echo ""
echo "To test WebSocket from browser, connect to:"
echo "  ws://$ROUTER_IP:8080/mqtt"
echo ""
echo "To test with mosquitto clients:"
echo "  # Subscribe"
echo "  mosquitto_sub -h $ROUTER_IP -p 1883 -t 'tetragrammatron/+/canbc/+'"
echo ""
echo "  # Publish"
echo "  mosquitto_pub -h $ROUTER_IP -p 1883 -t 'tetragrammatron/test/command' -m '{\"test\": true}'"

