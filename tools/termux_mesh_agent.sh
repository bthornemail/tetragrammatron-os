#!/bin/sh
# termux_mesh_agent.sh — Agent 7 helper for phones/Termux nodes
# Periodically emits heartbeat JSONL and (optionally) ships it to an anchor
# endpoint to join the 7-phase mesh automatically. Requires only POSIX tools.

set -eu
if (set -o pipefail) 2>/dev/null; then
  set -o pipefail
fi

SCRIPT_PATH="$0"
SCRIPT_DIR="$(cd "$(dirname "$SCRIPT_PATH")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
HW_SCAN="${ROOT_DIR}/tools/hwscan_termux_canvasl.sh"

if [ ! -f "$HW_SCAN" ]; then
  echo "Cannot find hwscan_termux_canvasl.sh (expected at $HW_SCAN)" >&2
  exit 1
fi

ROLE="${ROLE:-renderer}"
ROLE_OFFSET="${ROLE_OFFSET:-0}"             # 0..6
DEVICE_ID="${DEVICE_ID:-$(uname -n)}"
HEARTBEAT_SEC="${HEARTBEAT_SEC:-1}"         # sleep interval (seconds)
LOG_DIR="${LOG_DIR:-$ROOT_DIR/mesh-logs}"
ANCHOR_HOST="${ANCHOR_HOST:-}"
ANCHOR_PORT="${ANCHOR_PORT:-0}"
ANCHOR_PROTO="${ANCHOR_PROTO:-udp}"         # udp|tcp|file
HW_PROFILE="${HW_PROFILE:-$LOG_DIR/${DEVICE_ID}-hardware.jsonl}"
STATE_FILE="${STATE_FILE:-$LOG_DIR/${DEVICE_ID}-heartbeat.jsonl}"
NC_BIN="${NC_BIN:-nc}"
NC_UDP_ARGS="-u -w0"

if ! command -v "$NC_BIN" >/dev/null 2>&1; then
  if [ -x /system/bin/nc ]; then
    NC_BIN="/system/bin/nc"
  fi
fi

if [ "$NC_BIN" = "/system/bin/nc" ]; then
  NC_UDP_ARGS="-u"
fi

mkdir -p "$LOG_DIR"

timestamp_ms() {
  ts=$(date +%s%3N 2>/dev/null || true)
  if [ -n "$ts" ]; then
    printf '%s\n' "$ts"
  else
    sec=$(date +%s 2>/dev/null || printf '0')
    printf '%s\n' "$((sec * 1000))"
  fi
}

maybe_hw_snapshot() {
  if [ ! -s "$HW_PROFILE" ]; then
    echo "Collecting hardware profile to $HW_PROFILE"
    sh "$HW_SCAN" "$HW_PROFILE"
  fi
}

send_anchor() {
  payload="$1"
  have_timeout=0
  if command -v timeout >/dev/null 2>&1; then
    have_timeout=1
  fi
  case "$ANCHOR_PROTO" in
    udp)
      if [ -n "$ANCHOR_HOST" ] && [ "$ANCHOR_PORT" -gt 0 ]; then
        if [ "$have_timeout" -eq 1 ]; then
          printf '%s\n' "$payload" | timeout 2 "$NC_BIN" $NC_UDP_ARGS "$ANCHOR_HOST" "$ANCHOR_PORT" || true
        else
          printf '%s\n' "$payload" | "$NC_BIN" $NC_UDP_ARGS "$ANCHOR_HOST" "$ANCHOR_PORT" || true
        fi
      fi
      ;;
    tcp)
      if [ -n "$ANCHOR_HOST" ] && [ "$ANCHOR_PORT" -gt 0 ]; then
        if [ "$have_timeout" -eq 1 ]; then
          printf '%s\n' "$payload" | timeout 2 "$NC_BIN" "$ANCHOR_HOST" "$ANCHOR_PORT" || true
        else
          printf '%s\n' "$payload" | "$NC_BIN" "$ANCHOR_HOST" "$ANCHOR_PORT" || true
        fi
      fi
      ;;
    file)
      if [ -n "$ANCHOR_HOST" ]; then
        printf '%s\n' "$payload" >>"$ANCHOR_HOST"
      fi
      ;;
    *)
      ;;
  esac
}

maybe_hw_snapshot

tick=0

echo "Starting Termux mesh agent for role=$ROLE device=$DEVICE_ID (log=$STATE_FILE)"
while true; do
  ts="$(timestamp_ms)"
  phase=$(( (tick + ROLE_OFFSET) % 7 ))
  grade=$(( phase % 3 + 1 ))   # rotate through G1..G3 locally

  payload=$(printf '{"kind":"ROLE_HEARTBEAT","device":"%s","role":"%s","tick":%d,"phase":%d,"grade":%d,"t_ms":%s,"hw_profile":"%s"}' \
    "$DEVICE_ID" "$ROLE" "$tick" "$phase" "$grade" "$ts" "$(basename "$HW_PROFILE")")

  printf '%s\n' "$payload" >>"$STATE_FILE"
  send_anchor "$payload"

  tick=$((tick + 1))
  sleep "$HEARTBEAT_SEC"
done
