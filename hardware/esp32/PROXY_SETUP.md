# ESP-IDF Proxy Configuration

If you're behind a proxy (like `http://10.140.8.169:8888`), ESP-IDF tool installation needs proxy configuration.

## Quick Setup

### Option 1: Use ~/.proxy-env.sh (Recommended)

If you have a `~/.proxy-env.sh` file that sets proxy variables:

```bash
source ~/.proxy-env.sh
cd hardware/esp32
./install_tools.sh
```

### Option 2: Set Environment Variables Manually

```bash
export HTTP_PROXY=http://10.140.8.169:8888
export HTTPS_PROXY=http://10.140.8.169:8888
export http_proxy=$HTTP_PROXY
export https_proxy=$HTTPS_PROXY

cd hardware/esp32
./install_tools.sh
```

### Option 3: One-Line Setup

```bash
export HTTP_PROXY=http://10.140.8.169:8888 HTTPS_PROXY=http://10.140.8.169:8888 http_proxy=$HTTP_PROXY https_proxy=$HTTPS_PROXY && cd hardware/esp32 && ./install_tools.sh
```

## How It Works

The `setup_idf.sh` script automatically:
1. Checks for `~/.proxy-env.sh` and sources it
2. Sets `HTTP_PROXY` and `HTTPS_PROXY` from `http_proxy`/`https_proxy` if needed
3. Sets lowercase versions for Python urllib compatibility
4. Displays proxy status

## Verify Proxy

After setting up, verify proxy is active:

```bash
cd hardware/esp32
source setup_idf.sh
echo "HTTP_PROXY: $HTTP_PROXY"
echo "HTTPS_PROXY: $HTTPS_PROXY"
```

## Install Tools

Once proxy is configured:

```bash
cd hardware/esp32
./install_tools.sh
```

This will install all required ESP-IDF tools (toolchains, GDB, OpenOCD, etc.) using the proxy.

## Troubleshooting

### Proxy Not Working

If tools still fail to download:

1. **Check proxy is accessible:**
   ```bash
   curl -x http://10.140.8.169:8888 https://github.com
   ```

2. **Verify environment variables:**
   ```bash
   env | grep -i proxy
   ```

3. **Test Python urllib:**
   ```bash
   python3 -c "import urllib.request; print(urllib.request.getproxies())"
   ```

### Git Proxy vs Python Proxy

Note: Git proxy (`git config --global http.proxy`) is separate from Python proxy. Python needs environment variables:
- `HTTP_PROXY` / `http_proxy`
- `HTTPS_PROXY` / `https_proxy`

Both should be set for ESP-IDF tool installation.

## Persistent Configuration

To make proxy persistent, add to `~/.bashrc` or `~/.zshrc`:

```bash
# ESP-IDF Proxy Configuration
export HTTP_PROXY=http://10.140.8.169:8888
export HTTPS_PROXY=http://10.140.8.169:8888
export http_proxy=$HTTP_PROXY
export https_proxy=$HTTPS_PROXY
```

Or use your existing `~/.proxy-env.sh` file.

