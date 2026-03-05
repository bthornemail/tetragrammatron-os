# Device Setup Status

## Device 102 ✅ FULLY OPERATIONAL
- **IP:** 192.168.8.102
- **User:** u0_a201
- **SSH:** ✅ Working
- **Probe:** ✅ Working
- **MQTT:** ✅ Working
- **Data Sync:** ✅ Working

## Device 101 ✅ MOSTLY WORKING
- **IP:** 192.168.8.101
- **User:** u0_a164
- **SSH:** ✅ Working
- **Probe:** ✅ Working
- **MQTT:** ⚠ Needs verification (may need manual start)
- **Data Sync:** ✅ Ready

**To fix MQTT on 101:**
```bash
ssh -i ~/.ssh/termux-101_key -p 8022 u0_a164@192.168.8.101 \
  "mosquitto -c ~/.config/mosquitto/mosquitto.conf -d"
```

## Device 103 ⚠ NEEDS SETUP
- **IP:** 192.168.8.103
- **User:** u0_a171
- **Status:** Device was reset, SSH server not running

**To set up device 103:**

1. **On device 103 (Termux app):**
   ```bash
   sshd -p 8022
   ```

2. **From Linux host, add SSH key:**
   ```bash
   ssh -p 8022 u0_a171@192.168.8.103
   # Enter password: passwd84
   # Then run:
   mkdir -p ~/.ssh
   chmod 700 ~/.ssh
   echo 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIGY9Y5V/69kbhmuh38ktULzQWTvZ/sOIGvpYCRATaYJP termux-setup-20251222' >> ~/.ssh/authorized_keys
   chmod 600 ~/.ssh/authorized_keys
   exit
   ```

3. **Run setup script:**
   ```bash
   cd hardware/termux
   ./setup_device.sh 192.168.8.103 u0_a171
   ```

## Quick Sync All Devices

```bash
# Sync from device 101
rsync -avz -e "ssh -i ~/.ssh/termux-101_key -p 8022 -o IdentitiesOnly=yes" \
  u0_a164@192.168.8.101:~/tetragrammatron-os/hardware/probe.jsonl \
  /tmp/probe_101.jsonl

# Sync from device 102
rsync -avz -e "ssh -i ~/.ssh/termux-102_key -p 8022 -o IdentitiesOnly=yes" \
  u0_a201@192.168.8.102:~/tetragrammatron-os/hardware/probe.jsonl \
  /tmp/probe_102.jsonl

# Merge all probe data
cat /tmp/probe_*.jsonl > hardware/probe.jsonl
```
