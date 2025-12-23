# Fixing Device 103 After Reset

Device 103 (192.168.8.103) has been reset. Follow these steps to restore SSH access.

## Step 1: Start SSH Server on Device 103

**On the Termux device (192.168.8.103):**

1. Open Termux app on the device
2. Start SSH server:
   ```bash
   sshd -p 8022
   ```

3. (Optional) To make it start automatically, add to `~/.bashrc`:
   ```bash
   echo 'sshd -p 8022' >> ~/.bashrc
   ```

## Step 2: Add SSH Key from Linux Host

**On your Linux host:**

Once SSH server is running on device 103, run:

```bash
cd /home/main/devops/tetragrammatron-os/hardware/termux/ssh
./fix_device_103.sh
```

Or manually:

```bash
# Get the public key
PUBKEY="ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIGY9Y5V/69kbhmuh38ktULzQWTvZ/sOIGvpYCRATaYJP termux-setup-20251222"

# Add it to device (enter password: passwd84 when prompted)
ssh -p 8022 u0_a171@192.168.8.103 << EOF
mkdir -p ~/.ssh
chmod 700 ~/.ssh
echo '$PUBKEY' >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
echo "Key added successfully"
EOF
```

## Step 3: Verify Connection

```bash
ssh -i ~/.ssh/termux-103_key -p 8022 -o IdentitiesOnly=yes u0_a171@192.168.8.103 "whoami"
```

Should output: `u0_a171`

## Step 4: Re-run Setup Scripts (if needed)

After SSH is working, you can re-run setup scripts:

```bash
# Re-run SSH setup to verify all devices
cd /home/main/devops/tetragrammatron-os/hardware/termux/ssh
./setup_ssh.sh

# Set up MQTT broker on device 103
cd /home/main/devops/tetragrammatron-os/hardware/mqtt
./setup_mqtt_broker_termux.sh 192.168.8.103 u0_a171
```

## Quick One-Liner (if you have physical access)

If you can access the Termux device directly, you can run this on the device:

```bash
# On device 103, in Termux:
sshd -p 8022
mkdir -p ~/.ssh
chmod 700 ~/.ssh
echo 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIGY9Y5V/69kbhmuh38ktULzQWTvZ/sOIGvpYCRATaYJP termux-setup-20251222' >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

Then test from Linux host:
```bash
ssh -i ~/.ssh/termux-103_key -p 8022 -o IdentitiesOnly=yes u0_a171@192.168.8.103 "whoami"
```

