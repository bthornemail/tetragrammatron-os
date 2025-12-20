# Emit: hardware.canvasl.jsonl (CanvasL record-stream suitable for your VM + renderer)

set -euo pipefail

OUT="${1:-hardware.canvasl.jsonl}"
NOW_MS() { date +%s%3N 2>/dev/null || python - <<'PY'
import time; print(int(time.time()*1000))
PY
}

HOST_ID() {
  # Stable-enough device id without root (best-effort)
  # Prefer ANDROID_ID, else a hash of build + uname.
  local aid=""
  if command -v settings >/dev/null 2>&1; then
    aid="$(settings get secure android_id 2>/dev/null || true)"
  fi
  if [[ -n "${aid}" && "${aid}" != "null" ]]; then
    echo "android:${aid}"
    return
  fi
  local fp
  fp="$(getprop ro.build.fingerprint 2>/dev/null || true)"
  local un
  un="$(uname -a 2>/dev/null || true)"
  printf "%s" "${fp}::${un}" | sha256sum | awk '{print "android:sha256:"$1}'
}

sha256_of_file() {
  local f="$1"
  if [[ -f "$f" ]]; then
    sha256sum "$f" | awk '{print $1}'
  else
    echo ""
  fi
}

emit() {
  # emit JSONL line with minimal escaping (values are sanitized below)
  printf "%s
" "$1" >> "$OUT"
}

jstr() {
  # JSON string escape (basic)
  python - <<'PY' "$1"
import json,sys
print(json.dumps(sys.argv[1]))
PY
}

kv() {
  # "k":"v" where v already JSON-escaped
  printf '%s:%s' "$(jstr "$1")" "$2"
}
