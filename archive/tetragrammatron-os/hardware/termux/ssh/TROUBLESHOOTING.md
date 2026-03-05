# SSH Setup Troubleshooting

## Common Issues

### "Too many authentication failures"

This happens when SSH tries multiple keys before the correct one. The fix is to use `IdentitiesOnly=yes`.

**Solution**: The `setup_ssh.sh` script has been updated to use `IdentitiesOnly=yes`. If you still see this error:

1. Make sure you're using the latest version of the script
2. Manually add the key:
   ```bash
   ssh -i ~/.ssh/termux-102_key -p 8022 -o IdentitiesOnly=yes u0_a201@192.168.8.102
   # Then on the device:
   echo 'YOUR_PUBLIC_KEY' >> ~/.ssh/authorized_keys
   chmod 600 ~/.ssh/authorized_keys
   ```

### Device 102 Authentication Issues

If device 102 specifically fails:

1. **Test manual connection**:
   ```bash
   ssh -i ~/.ssh/termux-102_key -p 8022 -o IdentitiesOnly=yes u0_a201@192.168.8.102 "whoami"
   ```

2. **If that works but setup_ssh.sh fails**, the key might not be in authorized_keys. Add it manually:
   ```bash
   # Get the public key
   cat ~/.ssh/termux-102_key.pub
   
   # SSH to device and add it
   ssh -p 8022 u0_a201@192.168.8.102
   # Enter password: passwd84
   mkdir -p ~/.ssh
   chmod 700 ~/.ssh
   echo 'PASTE_PUBLIC_KEY_HERE' >> ~/.ssh/authorized_keys
   chmod 600 ~/.ssh/authorized_keys
   exit
   ```

3. **Re-run setup script**:
   ```bash
   cd hardware/termux/ssh
   ./setup_ssh.sh
   ```

## Router SSH Issues

### "sftp-server: not found" when using scp

The router setup script now uses SSH with cat/echo instead of scp to avoid this issue.

**Manual fix if needed**:
```bash
# Copy config file manually
cat hardware/mqtt/mosquitto_config_router.conf | \
  ssh root@192.168.8.1 "cat > /etc/mosquitto/mosquitto.conf"
```

### Router asking for password

If the router doesn't have your SSH key:

1. **Add key to router**:
   ```bash
   ssh-copy-id -i ~/.ssh/router_key root@192.168.8.1
   ```

2. **Or manually**:
   ```bash
   cat ~/.ssh/router_key.pub | ssh root@192.168.8.1 \
     "mkdir -p ~/.ssh && chmod 700 ~/.ssh && \
      cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"
   ```

## MQTT WebSocket Issues

### Port 8080 not working

1. **Check if config was applied**:
   ```bash
   ssh root@192.168.8.1 "cat /etc/mosquitto/mosquitto.conf | grep -A2 'listener 8080'"
   ```

2. **Check if mosquitto is running**:
   ```bash
   ssh root@192.168.8.1 "/etc/init.d/mosquitto status"
   ```

3. **Check if port is listening**:
   ```bash
   ssh root@192.168.8.1 "netstat -tlnp | grep 8080 || ss -tlnp | grep 8080"
   ```

4. **Restart mosquitto**:
   ```bash
   ssh root@192.168.8.1 "/etc/init.d/mosquitto restart"
   ```

5. **Check logs**:
   ```bash
   ssh root@192.168.8.1 "tail -20 /var/log/mosquitto/mosquitto.log"
   ```

## Quick Fix Script

Run this to fix device 102 specifically:

```bash
#!/bin/bash
PUBKEY=$(cat ~/.ssh/termux-102_key.pub)
ssh -p 8022 u0_a201@192.168.8.102 << EOF
mkdir -p ~/.ssh
chmod 700 ~/.ssh
grep -qF '$PUBKEY' ~/.ssh/authorized_keys 2>/dev/null || echo '$PUBKEY' >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
echo "Key added/verified"
EOF
```

Enter password: `passwd84` when prompted.






