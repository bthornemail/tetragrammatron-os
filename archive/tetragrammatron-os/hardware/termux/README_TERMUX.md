# Termux Hardware Probing Setup

This directory contains scripts and documentation for setting up hardware probing on Android devices using Termux.

## Overview

Termux provides a Linux-like environment on Android devices, allowing us to run hardware probing scripts that collect system information and emit it in JSONL format compatible with the Tetragrammatron-OS hardware data pipeline.

## Current Status ✅

**Production Ready:** 2 out of 3 devices fully operational

- ✅ **Device 101** (192.168.8.101): SSH, Probe, MQTT all working
- ✅ **Device 102** (192.168.8.102): SSH, Probe, MQTT all working
- ⚠ **Device 103** (192.168.8.103): MQTT working, SSH key needs manual setup

**Router MQTT Broker:** ✅ Operational at 192.168.8.1:1883

See `PRODUCTION_READY.md` for complete status and quick commands.

## Quick Start

### Automated Setup (Recommended)

From your Linux development host, use the automated setup script:

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

This script will:
- Test SSH connectivity
- Create directory structure on device
- Install probe script
- Set up MQTT broker
- Verify all components

### Manual Setup

#### 1. Install Termux

Install Termux from [F-Droid](https://f-droid.org/en/packages/com.termux/) or the [Google Play Store](https://play.google.com/store/apps/details?id=com.termux).

#### 2. Start SSH Server

On the Termux device:
```bash
sshd -p 8022
```

#### 3. Run Setup Script

Transfer `setup_termux.sh` to your device and run:

```bash
bash setup_termux.sh
```

This will:
- Install required packages (coreutils, procps-ng, openssh, rsync)
- Create directory structure
- Install the probe script
- Test the probe script

### 3. Run Probe Manually

```bash
~/bin/probe_termux.sh
```

Or if installed in project directory:

```bash
~/tetragrammatron-os/hardware/probe_termux.sh
```

## Files

### `probe_termux.sh`

The main hardware probing script. It:
- Reads system information from `/proc/meminfo`, `/proc/cpuinfo`, and `uname`
- Emits JSONL format compatible with `schemas/hw_event.schema.json`
- Never emits invalid JSON (skips empty values)
- Includes `src` field with device identifier
- Outputs to `~/tetragrammatron-os/hardware/probe.jsonl` by default

**Environment Variables:**
- `ULP_PROBE_OUTPUT`: Override output file path

### `setup_termux.sh`

Setup script that installs dependencies and configures the environment.

### Directory Structure

After setup, the following structure is created:

```
~/tetragrammatron-os/
└── hardware/
    └── probe.jsonl    # Probe data output
```

## Periodic Probing

### Using Termux Job Scheduler

```bash
termux-job-scheduler \
  --period-ms 3600000 \
  --job-id 1 \
  --script ~/bin/probe_termux.sh
```

This runs the probe every hour (3600000 ms).

### Using Termux:Tasker

1. Install [Termux:Tasker](https://f-droid.org/en/packages/com.termux.tasker/)
2. Create a task that runs: `~/bin/probe_termux.sh`
3. Schedule the task using Tasker

## SSH Access

To enable SSH access from your development machine:

1. Generate SSH key on your machine (if not already done)
2. Copy public key to device:
   ```bash
   ssh-copy-id -p 8022 u0_aXXX@192.168.8.XXX
   ```
   (Replace XXX with device-specific values)

3. Connect:
   ```bash
   ssh -p 8022 u0_aXXX@192.168.8.XXX
   ```

Note: Termux SSH server runs on port 8022 by default.

## Device Information

See `ssh/device_info.md` for details about the three Termux devices:
- 192.168.8.101 (u0_a164)
- 192.168.8.102 (u0_a201)
- 192.168.8.103 (u0_a171)

## Troubleshooting

### Probe script fails

- Check that required packages are installed: `pkg list-installed | grep -E 'coreutils|procps'`
- Verify `/proc/meminfo` is readable: `cat /proc/meminfo`
- Check script permissions: `ls -l ~/bin/probe_termux.sh`

### Invalid JSON output

The probe script is designed to never emit invalid JSON. If you see invalid JSON:
- Check for shell syntax errors
- Verify the script hasn't been modified incorrectly
- Ensure all `emit_str()` and `emit_num()` calls validate input

### SSH connection fails

- Verify SSH server is running: `pgrep sshd`
- Check firewall settings on device
- Ensure port 8022 is accessible
- Verify username is correct (check `whoami` on device)

## Data Sync

### Automated Sync (Recommended)

Use the main sync script to collect data from all working devices:

```bash
cd hardware/termux
./sync_all_devices.sh
```

This script:
- Syncs probe data from devices 101, 102, and 103 (if accessible)
- Merges all data into `hardware/probe.jsonl`
- Reports success/failure for each device

### Individual Device Sync

```bash
# Sync from device 101
rsync -avz -e "ssh -i ~/.ssh/termux-101_key -p 8022 -o IdentitiesOnly=yes" \
  u0_a164@192.168.8.101:~/tetragrammatron-os/hardware/probe.jsonl \
  /tmp/probe_101.jsonl

# Sync from device 102
rsync -avz -e "ssh -i ~/.ssh/termux-102_key -p 8022 -o IdentitiesOnly=yes" \
  u0_a201@192.168.8.102:~/tetragrammatron-os/hardware/probe.jsonl \
  /tmp/probe_102.jsonl
```

**Note**: The sync scripts use `rsync` if available (recommended for efficiency), with a fallback to `scp`. Rsync is installed by default in the setup process.

## MQTT Mesh Network

All devices run local MQTT brokers that can bridge to the router broker at 192.168.8.1.

### Test MQTT Connectivity

```bash
# Test device brokers
mosquitto_pub -h 192.168.8.101 -p 1883 -t test/device101 -m "hello"
mosquitto_pub -h 192.168.8.102 -p 1883 -t test/device102 -m "hello"

# Test router broker
mosquitto_pub -h 192.168.8.1 -p 1883 -t test/router -m "hello"
```

### MQTT Setup

MQTT brokers are automatically configured during device setup. To manually set up:

```bash
cd hardware/mqtt
./setup_mqtt_broker_termux.sh <device_ip> <username>
```

## Validation

Probe output can be validated against the schema:

```bash
node ../../tools/validate_jsonl.mjs ~/tetragrammatron-os/hardware/probe.jsonl ../../schemas/hw_event.schema.json
```

## References

- [Termux Wiki](https://wiki.termux.com/)
- [Termux:Tasker Documentation](https://wiki.termux.com/wiki/Termux:Tasker)
- Probe script based on `probe_linux.sh` from `dev-docs/01-CONVERSATION.md`

