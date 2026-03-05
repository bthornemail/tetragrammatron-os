# Termux Integration - Complete Documentation Index

## 📚 Documentation Files

### Main Guides
- **[README.md](README.md)** - Main index and quick start
- **[README_TERMUX.md](README_TERMUX.md)** - Detailed setup and usage guide
- **[PRODUCTION_READY.md](PRODUCTION_READY.md)** - Production status and operations

### Status Reports
- **[FINAL_STATUS.md](FINAL_STATUS.md)** - Complete device status and commands
- **[SETUP_STATUS.md](SETUP_STATUS.md)** - Setup status per device
- **[DEVICE_102_STATUS.md](DEVICE_102_STATUS.md)** - Device 102 specific status
- **[QUICK_SETUP_DEVICE_102.md](QUICK_SETUP_DEVICE_102.md)** - Device 102 quick reference

### Testing & Integration
- **[INTEGRATION_TEST.md](INTEGRATION_TEST.md)** - Integration testing procedures

### SSH Documentation
- **[ssh/device_info.md](ssh/device_info.md)** - Device network information
- **[ssh/TROUBLESHOOTING.md](ssh/TROUBLESHOOTING.md)** - SSH troubleshooting guide
- **[ssh/fix_device_103.md](ssh/fix_device_103.md)** - Device 103 specific fixes

## 🛠️ Scripts

### Setup Scripts
- **`setup_device.sh`** - Automated device setup (recommended)
- **`setup_termux.sh`** - Manual setup script for Termux device

### Probe Scripts
- **`probe_termux.sh`** - Hardware probing script

### Sync Scripts
- **`sync_all_devices.sh`** - Sync all devices (recommended)
- **`sync/sync_probe_data.sh`** - Alternative sync script

### SSH Scripts
- **`ssh/setup_ssh.sh`** - SSH key setup
- **`ssh/fix_key_auth.sh`** - Fix SSH authentication
- **`ssh/fix_device_103.sh`** - Fix device 103 SSH

## 📋 Quick Reference

### Setup New Device
```bash
cd hardware/termux
./setup_device.sh <ip> <username>
```

### Sync All Data
```bash
cd hardware/termux
./sync_all_devices.sh
```

### Test MQTT
```bash
mosquitto_pub -h 192.168.8.101 -p 1883 -t test/device -m "hello"
```

## 🔗 Related Documentation

- [Hardware README](../README.md) - Hardware data layer overview
- [MQTT README](../mqtt/README.md) - MQTT broker configuration
- [Main Project README](../../README.org) - Project overview






