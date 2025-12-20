#!/usr/bin/env bash
set -e

OUT="hardware.canvasl.json"

ARCH=$(uname -m)
CORES=$(getconf _NPROCESSORS_ONLN 2>/dev/null || echo 1)

CPU_FREQ=$( \
  cat /proc/cpuinfo 2>/dev/null | \
  grep -m1 "cpu MHz" | \
  awk '{printf "%.0f
", $4 * 1000000}' \
  || echo 0
)

RAM_TOTAL=$(grep MemTotal /proc/meminfo 2>/dev/null | awk '{print $2 * 1024}')
RAM_FREE=$(grep MemAvailable /proc/meminfo 2>/dev/null | awk '{print $2 * 1024}')

POWER_SRC="unknown"
if [ -d /sys/class/power_supply ]; then
  if ls /sys/class/power_supply/BAT* >/dev/null 2>&1; then
    POWER_SRC="battery"
  else
    POWER_SRC="wall"
  fi
fi

NET_AVAIL=$(ping -c1 -W1 1.1.1.1 >/dev/null 2>&1 && echo true || echo false)

LATENCY=$(ping -c3 1.1.1.1 2>/dev/null | grep avg | cut -d'/' -f5 || echo 0)

cat > "$OUT" <<EOF
{
  "device": {
    "class": "mobile",
    "arch": "$ARCH",
    "model": "$(uname -n)",
    "cores": $CORES,
    "freq_hz": $CPU_FREQ
  },
  "memory": {
    "ram_bytes": ${RAM_TOTAL:-0},
    "heap_free_bytes": ${RAM_FREE:-0},
    "flash_bytes": 0
  },
  "timing": {
    "clock_source": "os",
    "tick_hz": 1000000,
    "drift_ppm": 100
  },
  "power": {
    "source": "$POWER_SRC",
    "voltage_mv": 5000,
    "state": "stable"
  },
  "network": {
    "available": $NET_AVAIL,
    "latency_ms": ${LATENCY:-0},
    "loss_pct": 0,
    "proxy": "unknown"
  },
  "constraints": {
    "deterministic": true,
    "self_modify": "sealed",
    "visual_dim": "2D"
  }
}
EOF

echo "✓ Hardware context written to $OUT"
```

You can now:

