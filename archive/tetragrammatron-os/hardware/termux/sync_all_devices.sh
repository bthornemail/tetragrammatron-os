#!/usr/bin/env bash
# Sync probe data from all working Termux devices
# Merges data into hardware/probe.jsonl

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
OUTPUT_FILE="$PROJECT_ROOT/hardware/probe.jsonl"
TEMP_DIR=$(mktemp -d)

declare -a DEVICES=(
  "192.168.8.101:u0_a164:termux-101_key"
  "192.168.8.102:u0_a201:termux-102_key"
  "192.168.8.103:u0_a171:termux-103_key"
)

echo "=== Syncing Probe Data from All Devices ==="
echo "Output: $OUTPUT_FILE"
echo ""

SUCCESS_COUNT=0
for device in "${DEVICES[@]}"; do
  IFS=':' read -r ip user key <<< "$device"
  temp_file="$TEMP_DIR/probe_${ip}.jsonl"
  
  echo -n "Syncing $ip... "
  if rsync -q -e "ssh -i ~/.ssh/$key -p 8022 -o IdentitiesOnly=yes" \
    "$user@$ip:~/tetragrammatron-os/hardware/probe.jsonl" "$temp_file" 2>/dev/null; then
    lines=$(wc -l < "$temp_file" 2>/dev/null || echo 0)
    echo "✓ ($lines entries)"
    ((SUCCESS_COUNT++))
  else
    echo "✗ (skipped)"
  fi
done

echo ""
if [ $SUCCESS_COUNT -eq 0 ]; then
  echo "Error: No devices synced successfully"
  rm -rf "$TEMP_DIR"
  exit 1
fi

# Merge all probe files
echo "Merging probe data..."
cat "$TEMP_DIR"/probe_*.jsonl 2>/dev/null > "$OUTPUT_FILE" || true
TOTAL_LINES=$(wc -l < "$OUTPUT_FILE" 2>/dev/null || echo 0)

echo "✓ Merged $TOTAL_LINES entries from $SUCCESS_COUNT device(s)"
echo "✓ Data saved to: $OUTPUT_FILE"

# Cleanup
rm -rf "$TEMP_DIR"

echo ""
echo "=== Sync Complete ==="
