#!/usr/bin/env bash
set -euo pipefail

# Producer append wrapper: tetragrammatron-os probe facts -> seam envelopes -> port-matroid store.

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PM_ROOT="${PM_ROOT:-$ROOT/../port-matroid}"

if [ "$#" -ne 2 ]; then
  echo "usage: append-to-port-matroid.sh <probe.jsonl> <store-dir>" >&2
  exit 2
fi

inp="$1"
store="$2"

tmpdir="$(mktemp -d)"
trap 'rm -rf "$tmpdir"' EXIT

events="$tmpdir/tetragrammatron_os.events.ndjson"
python3 "$ROOT/scripts/emit-seam-envelopes.py" --input "$inp" >"$events"
(cd "$PM_ROOT" && cabal -v0 run port-matroid-tool -- append-envelope "$store" "$events" >/dev/null)

