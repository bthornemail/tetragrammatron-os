# Device 102 Quick Setup - WORKING ✅

Device 102 (192.168.8.102, user: u0_a201) is now fully operational.

## What's Working

1. ✅ SSH access (key-based authentication)
2. ✅ Hardware probing (probe_termux.sh)
3. ✅ MQTT broker (Mosquitto on port 1883)
4. ✅ Data sync (rsync from device to host)

## Quick Commands

### Run probe manually:
```bash
ssh -i ~/.ssh/termux-102_key -p 8022 u0_a201@192.168.8.102 \
  "~/tetragrammatron-os/hardware/termux/probe_termux.sh"
```

### Sync probe data:
```bash
rsync -avz -e "ssh -i ~/.ssh/termux-102_key -p 8022 -o IdentitiesOnly=yes" \
  u0_a201@192.168.8.102:~/tetragrammatron-os/hardware/probe.jsonl \
  hardware/probe.jsonl
```

### Test MQTT:
```bash
mosquitto_pub -h 192.168.8.102 -p 1883 -t test/device102 -m "test"
mosquitto_sub -h 192.168.8.102 -p 1883 -t test/device102 -C 1
```

### Start/stop Mosquitto on device:
```bash
ssh -i ~/.ssh/termux-102_key -p 8022 u0_a201@192.168.8.102 \
  "~/bin/start_mosquitto.sh"
```

## Probe Data Location

- On device: `~/tetragrammatron-os/hardware/probe.jsonl`
- Synced to host: `hardware/probe.jsonl` (via rsync)

## Next Steps

To replicate this setup on devices 101 and 103:
1. Ensure SSH access works
2. Run: `hardware/mqtt/setup_mqtt_broker_termux.sh <IP> <username>`
3. Test with mosquitto_pub/sub
