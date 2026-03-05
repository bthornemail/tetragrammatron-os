# ESP32 Setup Troubleshooting

## Common Issues and Solutions

### Issue: "tool riscv32-esp-elf has no installed versions"

**Symptom:**
```
ERROR: tool riscv32-esp-elf has no installed versions. Please run '.../idf_tools.py install' to install it.
ERROR: Activation script failed
```

**Cause:** ESP-IDF tools haven't been installed yet.

**Solution:**
```bash
cd hardware/esp32
./install_tools.sh
```

This will download and install all required toolchains (xtensa-esp-elf, riscv32-esp-elf, etc.).

**Note:** Make sure proxy is configured if you're behind a firewall:
```bash
export HTTP_PROXY=http://10.140.8.169:8888
export HTTPS_PROXY=http://10.140.8.169:8888
export http_proxy=$HTTP_PROXY
export https_proxy=$HTTPS_PROXY
```

### Issue: Tool Installation Fails / Downloads Hang

**Symptom:** `./install_tools.sh` hangs or fails to download tools.

**Causes:**
1. Proxy not configured
2. Network connectivity issues
3. Proxy authentication required

**Solutions:**

1. **Check proxy configuration:**
   ```bash
   echo "HTTP_PROXY: $HTTP_PROXY"
   echo "HTTPS_PROXY: $HTTPS_PROXY"
   ```

2. **Test proxy connectivity:**
   ```bash
   curl -x http://10.140.8.169:8888 https://github.com
   ```

3. **Verify Python can use proxy:**
   ```bash
   python3 -c "import urllib.request; print(urllib.request.getproxies())"
   ```

4. **Try manual installation with explicit proxy:**
   ```bash
   export HTTP_PROXY=http://10.140.8.169:8888
   export HTTPS_PROXY=http://10.140.8.169:8888
   export http_proxy=$HTTP_PROXY
   export https_proxy=$HTTPS_PROXY
   
   cd hardware/esp32
   ./install_tools.sh
   ```

### Issue: "ESP-IDF Python environment not found"

**Symptom:**
```
Error: ESP-IDF Python environment not found at /home/main/.espressif/python_env/idf5.4_py3.12_env/bin/python
```

**Cause:** ESP-IDF Python virtual environment wasn't created during ESP-IDF installation.

**Solution:**
The Python environment should be created automatically when ESP-IDF is first used. If it's missing:

1. **Check if ESP-IDF is properly installed:**
   ```bash
   ls -la vendor/esp/idf-v5.4.1/
   ```

2. **Try creating the environment manually:**
   ```bash
   cd vendor/esp/idf-v5.4.1
   ./install.sh
   ```

3. **Or use system Python (fallback):**
   The `install_tools.sh` script will try system Python if the ESP-IDF environment isn't found.

### Issue: Permission Denied on /dev/ttyUSB*

**Symptom:**
```
Permission denied: /dev/ttyUSB0
```

**Cause:** User not in `dialout` group.

**Solution:**
```bash
sudo usermod -a -G dialout $USER
# Log out and log back in for changes to take effect
```

### Issue: Schema Binary Not Found

**Symptom:**
```
Warning: Schema binary not found at build/address-schema.bin
```

**Solution:**
```bash
cd /home/main/devops/tetragrammatron-os
python3 tools/compile_schema.py address-schema.yaml -o build/address-schema.bin
```

Or run `./hardware/esp32/build.sh` which will compile it automatically.

### Issue: Build Fails with "CMake Error"

**Symptom:** Build fails with CMake configuration errors.

**Solutions:**

1. **Clean build directory:**
   ```bash
   cd hardware/esp32/can_app
   idf.py fullclean
   idf.py build
   ```

2. **Verify ESP-IDF environment:**
   ```bash
   cd hardware/esp32
   source setup_idf.sh
   idf.py --version
   ```

3. **Check schema binary exists:**
   ```bash
   ls -lh build/address-schema.bin
   ```

### Issue: Circular Dependency (setup_idf.sh calls install_tools.sh)

**Symptom:** Scripts call each other in a loop.

**Solution:** This has been fixed. The `install_tools.sh` script now:
- Does NOT source `setup_idf.sh`
- Configures proxy directly
- Uses ESP-IDF Python environment directly
- Installs tools before environment activation

**Correct workflow:**
1. First: `./install_tools.sh` (installs tools)
2. Then: `source setup_idf.sh` (activates environment)

## Verification Steps

After setup, verify everything works:

```bash
cd hardware/esp32

# 1. Check tools are installed
source setup_idf.sh
idf.py --version

# 2. Check schema binary
ls -lh ../../build/address-schema.bin

# 3. Test build
cd can_app
idf.py build
```

## Getting Help

If issues persist:

1. **Enable debug output:**
   ```bash
   export ESP_IDF_EXPORT_DEBUG=1
   source hardware/esp32/setup_idf.sh
   ```

2. **Check logs:**
   - Tool installation: Check terminal output for download errors
   - Build errors: Check `can_app/build/log/` directory

3. **Verify environment:**
   ```bash
   echo "IDF_PATH: $IDF_PATH"
   echo "Python: $(which python)"
   echo "Proxy: $HTTP_PROXY"
   ```

