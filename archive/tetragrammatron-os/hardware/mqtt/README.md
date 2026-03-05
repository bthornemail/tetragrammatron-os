# MQTT Broker Configuration

MQTT broker setup for the Tetragrammatron-OS mesh network.

## Architecture

### Mesh Network Topology
```
Router Broker (192.168.8.1:1883)
    ↕ bridge
Device 101 Broker (192.168.8.101:1883)
Device 102 Broker (192.168.8.102:1883)
Device 103 Broker (192.168.8.103:1883)
```

All device brokers bridge to the router broker, creating a mesh network where messages can propagate between all nodes.

## Status

✅ **Router Broker** (192.168.8.1) - Operational
- MQTT: Port 1883
- WebSocket: Port 8080 (for browser clients)

✅ **Device 101 Broker** (192.168.8.101) - Operational
✅ **Device 102 Broker** (192.168.8.102) - Operational
✅ **Device 103 Broker** (192.168.8.103) - Operational

## Setup Scripts

### Router Setup
```bash
cd hardware/mqtt
./setup_mqtt_broker_openwrt.sh
```

This script:
- Installs Mosquitto on OpenWrt router
- Configures ports 1883 (MQTT) and 8080 (WebSocket)
- Sets up firewall rules
- Starts and enables service

### Termux Device Setup
```bash
cd hardware/mqtt
./setup_mqtt_broker_termux.sh <device_ip> <username>
```

**Examples:**
```bash
./setup_mqtt_broker_termux.sh 192.168.8.101 u0_a164
./setup_mqtt_broker_termux.sh 192.168.8.102 u0_a201
./setup_mqtt_broker_termux.sh 192.168.8.103 u0_a171
```

This script:
- Auto-detects if running on Termux or Linux host
- Installs Mosquitto on Termux device
- Configures local broker on port 1883
- Sets up bridge to router broker
- Creates startup script

## Configuration Files

- **`mosquitto_config_router.conf`** - Router broker configuration
- **`mosquitto_config_termux.conf`** - Termux device broker template
- **`mosquitto_bridge_config.conf.example`** - Bridge configuration example

## Testing

### Test Router Broker
```bash
mosquitto_pub -h 192.168.8.1 -p 1883 -t test/router -m "hello"
mosquitto_sub -h 192.168.8.1 -p 1883 -t test/router -C 1
```

### Test Device Brokers
```bash
mosquitto_pub -h 192.168.8.101 -p 1883 -t test/device101 -m "hello"
mosquitto_pub -h 192.168.8.102 -p 1883 -t test/device102 -m "hello"
mosquitto_pub -h 192.168.8.103 -p 1883 -t test/device103 -m "hello"
```

### Test WebSocket (Browser)
The web viewer connects to: `ws://192.168.8.1:8080/mqtt`

## Web Viewer Integration

The web viewer (`trees/web-viewer/`) is configured to connect to the router broker:
- **MQTT Host:** 192.168.8.1 (configurable via environment variables)
- **MQTT Port:** 1883
- **WebSocket Port:** 8080

Configuration in `trees/web-viewer/src/lib/config.ts`:
- Default broker: `192.168.8.1`
- Environment variable override: `VITE_MQTT_BROKER_HOST`

## Troubleshooting

### Broker Not Starting
```bash
# Check if running
ssh root@192.168.8.1 "pgrep mosquitto"
ssh -p 8022 u0_a164@192.168.8.101 "pgrep mosquitto"

# Check logs
ssh root@192.168.8.1 "tail -20 /var/log/mosquitto/mosquitto.log"
ssh -p 8022 u0_a164@192.168.8.101 "tail -20 ~/var/log/mosquitto.log"
```

### Connection Refused
- Verify broker is running
- Check firewall rules
- Verify port is listening: `netstat -tlnp | grep 1883`

### Bridge Not Working
- Check bridge configuration in device config
- Verify router broker is accessible from device
- Check bridge logs in device mosquitto log

## Topic Patterns

Recommended topic structure:
- `tetragrammatron/+/canbc/+` - ESP32 CAN VM attestations
- `test/+` - Test topics
- `device101/+`, `device102/+`, `device103/+` - Device-specific topics

## Security

Current configuration uses `allow_anonymous true` for development. For production:
- Set up authentication (password file or certificates)
- Configure ACLs for topic access control
- Use TLS/SSL for encrypted connections

See Mosquitto documentation for security best practices.






