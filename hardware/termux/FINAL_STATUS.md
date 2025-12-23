# Final Setup Status

## ✅ Device 101 - FULLY OPERATIONAL
- **IP:** 192.168.8.101
- **User:** u0_a164
- **SSH:** ✅ Working
- **Probe:** ✅ Working  
- **MQTT:** ✅ Working

## ✅ Device 102 - FULLY OPERATIONAL  
- **IP:** 192.168.8.102
- **User:** u0_a201
- **SSH:** ✅ Working
- **Probe:** ✅ Working
- **MQTT:** ✅ Working

## ⚠ Device 103 - NEEDS SSH KEY
- **IP:** 192.168.8.103
- **User:** u0_a171
- **Status:** SSH server running, but key not authorized

**To complete device 103 setup:**

1. **Manually add SSH key** (you'll need to enter password `passwd84`):
   ```bash
   ssh -p 8022 u0_a171@192.168.8.103
   # Enter password when prompted: passwd84
   # Then run:
   mkdir -p ~/.ssh
   chmod 700 ~/.ssh
   echo 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIGY9Y5V/69kbhmuh38ktULzQWTvZ/sOIGvpYCRATaYJP termux-setup-20251222' >> ~/.ssh/authorized_keys
   chmod 600 ~/.ssh/authorized_keys
   exit
   ```

2. **Run setup script:**
   ```bash
   cd hardware/termux
   ./setup_device.sh 192.168.8.103 u0_a171
   ```

## Quick Commands for Working Devices

### Device 101
```bash
# Run probe
ssh -i ~/.ssh/termux-101_key -p 8022 u0_a164@192.168.8.101 \
  "~/tetragrammatron-os/hardware/termux/probe_termux.sh"

# Sync data
rsync -avz -e "ssh -i ~/.ssh/termux-101_key -p 8022 -o IdentitiesOnly=yes" \
  u0_a164@192.168.8.101:~/tetragrammatron-os/hardware/probe.jsonl \
  /tmp/probe_101.jsonl

# Test MQTT
mosquitto_pub -h 192.168.8.101 -p 1883 -t test/device101 -m "hello"
```

### Device 102
```bash
# Run probe
ssh -i ~/.ssh/termux-102_key -p 8022 u0_a201@192.168.8.102 \
  "~/tetragrammatron-os/hardware/termux/probe_termux.sh"

# Sync data
rsync -avz -e "ssh -i ~/.ssh/termux-102_key -p 8022 -o IdentitiesOnly=yes" \
  u0_a201@192.168.8.102:~/tetragrammatron-os/hardware/probe.jsonl \
  /tmp/probe_102.jsonl

# Test MQTT
mosquitto_pub -h 192.168.8.102 -p 1883 -t test/device102 -m "hello"
```

## Sync All Working Devices

```bash
# Sync from both working devices
rsync -avz -e "ssh -i ~/.ssh/termux-101_key -p 8022 -o IdentitiesOnly=yes" \
  u0_a164@192.168.8.101:~/tetragrammatron-os/hardware/probe.jsonl \
  /tmp/probe_101.jsonl

rsync -avz -e "ssh -i ~/.ssh/termux-102_key -p 8022 -o IdentitiesOnly=yes" \
  u0_a201@192.168.8.102:~/tetragrammatron-os/hardware/probe.jsonl \
  /tmp/probe_102.jsonl

# Merge into main probe file
cat /tmp/probe_101.jsonl /tmp/probe_102.jsonl > hardware/probe.jsonl
echo "Synced $(wc -l < hardware/probe.jsonl) probe entries"
```

## Summary

✅ **2 out of 3 devices fully operational** (101 and 102)
⚠ **1 device needs manual SSH key setup** (103)

Both working devices have:
- SSH access with key authentication
- Hardware probing generating valid JSONL
- MQTT brokers running on port 1883
- Data sync ready via rsync
