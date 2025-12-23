#!/usr/bin/env sh
# ULP Hardware Probe — Termux/Android
# Append-only, never invalid JSON
#
# Usage: ./probe_termux.sh
#
# This script:
# - Collects hardware information from Android/Termux device
# - Emits valid JSONL to ~/tetragrammatron-os/hardware/probe.jsonl
# - Never emits invalid JSON (skips empty/missing values)
# - Includes src field with device identifier
#
# Output format: {"t":"timestamp","k":"key","v":"value","src":"device_id"}
# Validated against: schemas/hw_event.schema.json
#
# Based on probe_linux.sh from dev-docs/01-CONVERSATION.md

# Output path (configurable via environment variable)
OUT="${ULP_PROBE_OUTPUT:-$HOME/tetragrammatron-os/hardware/probe.jsonl}"
NOW="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

# Device source identifier (from IP or hostname)
DEVICE_IP="$(ip route get 1.1.1.1 2>/dev/null | grep -oP 'src \K\S+' || echo 'unknown')"
DEVICE_SRC="termux-$(echo "$DEVICE_IP" | tr '.' '-' 2>/dev/null || echo 'unknown')"

# Create output directory if it doesn't exist
mkdir -p "$(dirname "$OUT")"

emit_str() {
  key="$1"
  val="$2"
  [ -n "$val" ] || return 0
  printf '{"t":"%s","k":"%s","v":"%s","src":"%s"}\n' "$NOW" "$key" "$val" "$DEVICE_SRC" >> "$OUT"
}

emit_num() {
  key="$1"
  val="$2"
  case "$val" in
    ''|*[!0-9]*) return 0 ;;
  esac
  printf '{"t":"%s","k":"%s","v":%s,"src":"%s"}\n' "$NOW" "$key" "$val" "$DEVICE_SRC" >> "$OUT"
}

# --- CPU architecture ---
emit_str "cpu.arch" "$(uname -m 2>/dev/null)"

# --- Kernel (strip newlines defensively) ---
emit_str "os.kernel" "$(uname -r 2>/dev/null | tr -d '\n\r')"

# --- OS name ---
emit_str "os.name" "$(uname -s 2>/dev/null | tr -d '\n\r')"

# --- Memory ---
if [ -r /proc/meminfo ]; then
  mem_kb="$(awk '/MemTotal:/ {print $2}' /proc/meminfo 2>/dev/null)"
  if [ -n "$mem_kb" ]; then
    emit_num "mem.total_bytes" "$((mem_kb * 1024))"
  fi
fi

# --- CPU cores (multiple fallbacks) ---
cores=""
if command -v getconf >/dev/null 2>&1; then
  cores="$(getconf _NPROCESSORS_ONLN 2>/dev/null)"
fi

if [ -z "$cores" ] && [ -r /proc/cpuinfo ]; then
  cores="$(grep -c '^processor' /proc/cpuinfo 2>/dev/null)"
fi

emit_num "cpu.cores" "$cores"

# --- Network interface info (if available) ---
if command -v ip >/dev/null 2>&1; then
  wlan_ip="$(ip addr show wlan0 2>/dev/null | grep -oP 'inet \K[\d.]+' | head -1)"
  if [ -n "$wlan_ip" ]; then
    emit_str "net.wlan0.ip" "$wlan_ip"
  fi
fi

# --- Device identifier ---
emit_str "device.src" "$DEVICE_SRC"
emit_str "device.ip" "$DEVICE_IP"

echo "Probe data written to: $OUT"

