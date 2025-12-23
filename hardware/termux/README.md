# Termux Hardware Integration

Complete setup and operational documentation for Termux Android devices in the Tetragrammatron-OS hardware data collection network.

## Quick Status

✅ **2 devices fully operational** (101, 102)  
✅ **Router MQTT broker operational**  
⚠ **1 device partial** (103 - MQTT working, SSH needs key)

## Documentation Index

- **[README_TERMUX.md](README_TERMUX.md)** - Detailed setup and usage guide
- **[PRODUCTION_READY.md](PRODUCTION_READY.md)** - Production status and quick commands
- **[FINAL_STATUS.md](FINAL_STATUS.md)** - Complete device status
- **[INTEGRATION_TEST.md](INTEGRATION_TEST.md)** - Integration testing procedures
- **[SETUP_STATUS.md](SETUP_STATUS.md)** - Setup status per device

## Quick Start

### Setup a New Device

```bash
cd hardware/termux
./setup_device.sh <device_ip> <username>
```

**Examples:**
```bash
./setup_device.sh 192.168.8.101 u0_a164
./setup_device.sh 192.168.8.102 u0_a201
./setup_device.sh 192.168.8.103 u0_a171
```

### Sync All Probe Data

```bash
cd hardware/termux
./sync_all_devices.sh
```

### Test MQTT Mesh

```bash
# Test device brokers
mosquitto_pub -h 192.168.8.101 -p 1883 -t test/device101 -m "hello"
mosquitto_pub -h 192.168.8.102 -p 1883 -t test/device102 -m "hello"

# Test router broker
mosquitto_pub -h 192.168.8.1 -p 1883 -t test/router -m "hello"
```

## Device Information

| Device | IP | User | Status | SSH | Probe | MQTT |
|--------|----|----|--------|-----|-------|------|
| 101 | 192.168.8.101 | u0_a164 | ✅ Operational | ✅ | ✅ | ✅ |
| 102 | 192.168.8.102 | u0_a201 | ✅ Operational | ✅ | ✅ | ✅ |
| 103 | 192.168.8.103 | u0_a171 | ⚠ Partial | ⚠ | ⚠ | ✅ |

## Scripts

### Setup Scripts
- **`setup_device.sh`** - Automated device setup (run from Linux host)
- **`setup_termux.sh`** - Manual setup script (run on Termux device)

### Probe Scripts
- **`probe_termux.sh`** - Hardware probing script (generates JSONL)

### Sync Scripts
- **`sync_all_devices.sh`** - Sync probe data from all devices (recommended)
- **`sync/sync_probe_data.sh`** - Alternative sync script

### SSH Scripts
- **`ssh/setup_ssh.sh`** - SSH key setup and configuration
- **`ssh/fix_key_auth.sh`** - Fix SSH key authentication issues

### MQTT Scripts
- **`../mqtt/setup_mqtt_broker_termux.sh`** - MQTT broker setup for Termux devices
- **`../mqtt/setup_mqtt_broker_openwrt.sh`** - Router MQTT broker setup

## Directory Structure

```
hardware/termux/
├── README.md (this file)
├── README_TERMUX.md (detailed guide)
├── PRODUCTION_READY.md (production status)
├── setup_device.sh (automated setup)
├── setup_termux.sh (manual setup)
├── probe_termux.sh (probe script)
├── sync_all_devices.sh (sync all devices)
├── ssh/ (SSH configuration)
│   ├── setup_ssh.sh
│   ├── ssh_config.example
│   └── device_info.md
└── sync/ (data sync)
    ├── sync_probe_data.sh
    └── device_mapping.json
```

## Architecture

### MQTT Mesh Network
- **Router Broker** (192.168.8.1:1883) - Primary hub
- **Device Brokers** (192.168.8.101/102/103:1883) - Local brokers with bridge to router
- **WebSocket** (192.168.8.1:8080) - Browser connectivity

### Data Flow
```
Termux Device → probe_termux.sh → probe.jsonl
                    ↓
              rsync/SSH sync
                    ↓
         Linux Host → hardware/probe.jsonl
                    ↓
              hw_canon.mjs → canon.json
                    ↓
              hw_project.mjs → sphere.json
```

## Troubleshooting

See `ssh/TROUBLESHOOTING.md` for SSH issues and `FINAL_STATUS.md` for device-specific status.

## References

- [Termux Wiki](https://wiki.termux.com/)
- [Mosquitto MQTT Broker](https://mosquitto.org/)
- Main project: `README.org`

