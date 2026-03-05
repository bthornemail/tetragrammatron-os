#!/usr/bin/env bash
set -euo pipefail

# Golden replay lock for tetragrammatron-os Producer adapter.
#
# Verifies:
# - permuted fixture yields the same replay hash
# - replay hash matches committed golden value

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PM_ROOT="${PM_ROOT:-$ROOT/../port-matroid}"

fixture="${1:-$ROOT/golden/ulp-producer/mini.jsonl}"
fixture_perm="${3:-$ROOT/golden/ulp-producer/mini.permuted.jsonl}"
want_file="${2:-$ROOT/golden/ulp-producer/mini.replay-hash}"

tmpdir="$(mktemp -d)"
trap 'rm -rf "$tmpdir"' EXIT

store="$tmpdir/pm-store-tos"
"$ROOT/scripts/append-to-port-matroid.sh" "$fixture" "$store" >/dev/null
(cd "$PM_ROOT" && cabal -v0 run port-matroid-tool -- audit "$store" >/dev/null)
got="$(cd "$PM_ROOT" && cabal -v0 run port-matroid-tool -- replay-hash "$store" | tr -d '\n')"

want="$(tr -d '\n' <"$want_file")"
if [ "$got" != "$want" ]; then
  echo "tetragrammatron-os golden replay hash mismatch: expected $want got $got" >&2
  exit 1
fi

store2="$tmpdir/pm-store-tos-perm"
"$ROOT/scripts/append-to-port-matroid.sh" "$fixture_perm" "$store2" >/dev/null
(cd "$PM_ROOT" && cabal -v0 run port-matroid-tool -- audit "$store2" >/dev/null)
got2="$(cd "$PM_ROOT" && cabal -v0 run port-matroid-tool -- replay-hash "$store2" | tr -d '\n')"
if [ "$got2" != "$want" ]; then
  echo "tetragrammatron-os permuted fixture replay hash mismatch: expected $want got $got2" >&2
  exit 1
fi

echo "ok tetragrammatron-os golden replay hash $got"

