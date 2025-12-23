---
name: Termux Environment Setup
overview: Set up Termux environment on Android devices for hardware probing, configure SSH access to the three devices, and ensure MQTT broker connectivity for the web viewer.
todos: []
---

# Termux Environment Setup Plan

## Overview

Set up Termux on Android devices for hardware probing, configure SSH access to three devices (192.168.8.101/102/103), and ensure MQTT broker connectivity at 192.168.8.1.

## Components

### 1. Termux Hardware Probing Setup

**Location**: `hardware/termux/`

Create Termux-specific hardware probing scripts based on the existing probe pattern:

- **`probe_termux.sh`**: Shell script for Android/Termux hardware probing
  - Reads `/proc/meminfo`, `/proc/cpuinfo`, `uname` output
  - Emits JSONL to `~/ulp/hardware/probe.jsonl`
  - Validates output to prevent invalid JSON
  - Handles missing values gracefully

- **`setup_termux.sh`**: Setup script to install dependencies and configure environment
  - Creates directory structure: `~/ulp/hardware/`
  - Installs required Termux packages (coreutils, procps)
  - Sets up cron or termux-tasker for periodic probing

- **`README_TERMUX.md`**: Documentation for Termux setup and usage

**Reference**: The conversation history in `dev-docs/01-CONVERSATION.md` contains a `probe_linux.sh` template that can be adapted for Termux.

### 2. SSH Access Configuration

**Location**: `hardware/termux/ssh/`

Create SSH configuration and setup scripts:

- **`ssh_config.example`**: SSH config template with device entries:
  ```
  Host termux-101
    HostName 192.168.8.101
    User <username>
    IdentityFile ~/.ssh/termux_101_key
  
  Host termux-102
    HostName 192.168.8.102
    User <username>
    IdentityFile ~/.ssh/termux_102_key
  
  Host termux-103
    HostName 192.168.8.103
    User <username>
    IdentityFile ~/.ssh/termux_103_key
    # Password: passwd84
  ```

- **`setup_ssh.sh`**: Script to:
  - Generate SSH keys if needed
  - Copy public keys to devices
  - Test SSH connectivity
  - Create `~/.ssh/config` entries

- **`device_info.md`**: Document device information:
  - 192.168.8.101 (cc:a2:12:3f:48:d8)
  - 192.168.8.102 (cc:a2:12:54:b2:55)
  - 192.168.8.103 (74:8a:28:d8:f5:cf) - password: passwd84

### 3. MQTT Broker Configuration

**Location**: `hardware/mqtt/`

Ensure MQTT broker is properly configured at 192.168.8.1:

- **`mosquitto_config.conf`**: Mosquitto broker configuration
  - Listen on 0.0.0.0:1883 (MQTT)
  - Listen on 0.0.0.0:8080 (WebSocket for browser)
  - Allow anonymous connections (or configure auth)
  - Topic patterns: `tetragrammatron/+/canbc/+`

- **`setup_mqtt_broker.sh`**: Setup script for installing/configuring Mosquitto
  - Install mosquitto and mosquitto-clients
  - Configure firewall rules
  - Start/enable mosquitto service
  - Test connectivity

- **`test_mqtt_connection.sh`**: Test script to verify MQTT connectivity
  - Test from Linux host
  - Test from Android devices (via Termux)
  - Verify WebSocket endpoint for browser

### 4. Web Viewer MQTT Configuration Update

**Location**: `trees/web-viewer/`

Update web viewer to use correct MQTT broker:

- **`src/lib/config.ts`**: Update default MQTT broker host
  - Change default from `test.mosquitto.org` to `192.168.8.1`
  - Update WebSocket port to 8080 (or configurable)

- **`src/lib/mqtt.ts`**: Remove hardcoded IP (line 92)
  - Use config system instead of hardcoded `192.168.8.1:1883`
  - Ensure WebSocket connection uses correct port

- **`.env.example`**: Add environment variable examples:
  ```
  VITE_MQTT_BROKER_HOST=192.168.8.1
  VITE_MQTT_BROKER_PORT=1883
  VITE_MQTT_BROKER_WS_PORT=8080
  ```


### 5. Data Sync Scripts

**Location**: `hardware/termux/sync/`

Create scripts to sync probe data from Android devices:

- **`sync_probe_data.sh`**: Sync probe.jsonl from devices to Linux host
  - Uses SSH to copy files
  - Merges data from multiple devices
  - Preserves timestamps and source identifiers

- **`device_mapping.json`**: Map device IPs/MACs to friendly names
  ```json
  {
    "192.168.8.101": {
      "mac": "cc:a2:12:3f:48:d8",
      "name": "termux-device-1",
      "source": "termux-101"
    },
    ...
  }
  ```


## Implementation Order

1. **SSH Setup** (enables remote access)

   - Generate keys, configure access to all three devices
   - Test connectivity

2. **Termux Probing Scripts** (core functionality)

   - Create probe script, test on one device
   - Verify JSONL output format

3. **MQTT Broker Configuration** (if not already running)

   - Install/configure Mosquitto on gateway
   - Test MQTT and WebSocket endpoints

4. **Web Viewer Updates** (connectivity)

   - Update config to use 192.168.8.1
   - Test MQTT connection from browser

5. **Data Sync** (automation)

   - Create sync scripts
   - Set up periodic sync (cron or manual)

## Files to Create/Modify

**New Files**:

- `hardware/termux/probe_termux.sh`
- `hardware/termux/setup_termux.sh`
- `hardware/termux/README_TERMUX.md`
- `hardware/termux/ssh/ssh_config.example`
- `hardware/termux/ssh/setup_ssh.sh`
- `hardware/termux/ssh/device_info.md`
- `hardware/termux/sync/sync_probe_data.sh`
- `hardware/termux/sync/device_mapping.json`
- `hardware/mqtt/mosquitto_config.conf`
- `hardware/mqtt/setup_mqtt_broker.sh`
- `hardware/mqtt/test_mqtt_connection.sh`
- `trees/web-viewer/.env.example`

**Modified Files**:

- `trees/web-viewer/src/lib/config.ts` - Update MQTT defaults
- `trees/web-viewer/src/lib/mqtt.ts` - Remove hardcoded IP

## Testing

- SSH: Test connection to all three devices
- Termux: Run probe script, verify JSONL output
- MQTT: Publish/subscribe test from Linux and Android
- Web Viewer: Connect to MQTT broker, receive ESP32 attestations