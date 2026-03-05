#!/bin/bash
set -euo pipefail
CONFIG=/etc/tinyproxy/tinyproxy.conf
sudo sed -i 's/^Listen .*/Listen 0.0.0.0/' "$CONFIG"
sudo sed -i 's/^Allow /# Allow /' "$CONFIG"
if ! grep -q '^Upstream 10.229.211.162 8888' "$CONFIG"; then
  echo 'Upstream 10.229.211.162 8888' | sudo tee -a "$CONFIG"
fi
sudo systemctl restart tinyproxy
