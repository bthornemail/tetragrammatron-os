#!/usr/bin/env bash
# Sync probe data from all Termux devices to Linux host
# Merges probe.jsonl files from multiple devices into single file
#
# Usage: ./sync_probe_data.sh
#
# This script:
# - Syncs probe.jsonl from devices 101, 102, 103
# - Merges data into hardware/probe.jsonl
# - Uses rsync for efficient transfers (falls back to scp)
# - Handles devices that are offline gracefully
#
# See also: ../sync_all_devices.sh (recommended for production use)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
OUTPUT_FILE="$PROJECT_ROOT/hardware/probe.jsonl"
TEMP_DIR="$(mktemp -d)"
DEVICE_MAPPING="$SCRIPT_DIR/device_mapping.json"

# Device configurations (IP:username:source)
declare -a DEVICES=(
  "192.168.8.101:u0_a164:termux-101"
  "192.168.8.102:u0_a201:termux-102"
  "192.168.8.103:u0_a171:termux-103"
)

# Remote probe file path
REMOTE_PROBE_PATH="~/tetragrammatron-os/hardware/probe.jsonl"

echo "=== Syncing Probe Data from Termux Devices ==="
echo "Output file: $OUTPUT_FILE"
echo ""

# Function to fetch probe data from device
fetch_from_device() {
  local ip="$1"
  local user="$2"
  local source="$3"
  local output_file="$TEMP_DIR/${source}.jsonl"
  
  echo "Fetching from $source ($user@$ip)..."
  
  # Try SSH connection (Termux uses port 8022)
  # Use IdentitiesOnly to prevent "too many authentication failures" error
  if ssh -p 8022 -o IdentitiesOnly=yes -o ConnectTimeout=5 -o StrictHostKeyChecking=no "$user@$ip" "test -f $REMOTE_PROBE_PATH" 2>/dev/null; then
    # Prefer rsync if available (more efficient, handles incremental sync)
    if command -v rsync >/dev/null 2>&1; then
      rsync -avz --timeout=5 -e "ssh -p 8022 -o IdentitiesOnly=yes -o StrictHostKeyChecking=no" \
        "$user@$ip:$REMOTE_PROBE_PATH" "$output_file" 2>/dev/null && {
        echo "  ✓ Fetched $(wc -l < "$output_file" 2>/dev/null || echo 0) lines (via rsync)"
        return 0
      }
    fi
    
    # Fallback to scp
    scp -P 8022 -o IdentitiesOnly=yes -o StrictHostKeyChecking=no "$user@$ip:$REMOTE_PROBE_PATH" "$output_file" 2>/dev/null && {
      echo "  ✓ Fetched $(wc -l < "$output_file" 2>/dev/null || echo 0) lines (via scp)"
      return 0
    }
  fi
  
  echo "  ✗ Failed to fetch from $source"
  return 1
}

# Fetch data from all devices
SUCCESS_COUNT=0
for device in "${DEVICES[@]}"; do
  IFS=':' read -r ip user source <<< "$device"
  if fetch_from_device "$ip" "$user" "$source"; then
    ((SUCCESS_COUNT++))
  fi
done

if [ $SUCCESS_COUNT -eq 0 ]; then
  echo ""
  echo "Error: Failed to fetch data from any device"
  rm -rf "$TEMP_DIR"
  exit 1
fi

# Merge all probe files
echo ""
echo "Merging probe data..."

# Create backup of existing file if it exists
if [ -f "$OUTPUT_FILE" ]; then
  BACKUP_FILE="${OUTPUT_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
  cp "$OUTPUT_FILE" "$BACKUP_FILE"
  echo "Backed up existing file to: $BACKUP_FILE"
fi

# Merge all fetched files, preserving timestamps
cat "$TEMP_DIR"/*.jsonl 2>/dev/null | sort -u > "$OUTPUT_FILE" || {
  # If sort fails, just concatenate
  cat "$TEMP_DIR"/*.jsonl > "$OUTPUT_FILE" 2>/dev/null || true
}

TOTAL_LINES=$(wc -l < "$OUTPUT_FILE" 2>/dev/null || echo 0)
echo "✓ Merged $TOTAL_LINES lines from $SUCCESS_COUNT device(s)"

# Validate merged output
echo ""
echo "Validating merged output..."
if [ -f "$PROJECT_ROOT/tools/validate_jsonl.mjs" ] && [ -f "$PROJECT_ROOT/schemas/hw_event.schema.json" ]; then
  if node "$PROJECT_ROOT/tools/validate_jsonl.mjs" "$OUTPUT_FILE" "$PROJECT_ROOT/schemas/hw_event.schema.json" 2>/dev/null; then
    echo "✓ Validation passed"
  else
    echo "⚠ Validation failed - check output file"
  fi
else
  echo "Note: Validation tools not found, skipping validation"
fi

# Cleanup
rm -rf "$TEMP_DIR"

echo ""
echo "=== Sync Complete ==="
echo "Probe data available at: $OUTPUT_FILE"
echo "Total entries: $TOTAL_LINES"

