#!/data/data/com.termux/files/usr/bin/bash
# hwscan_termux_canvasl.sh — Termux hardware → CanvasL JSONL probe
# HW-TIME-REAL fingerprint: gathers device, network, and proxy facts on
# Android/Termux without root and emits a deterministic JSONL stream that the VM
# can hash, normalize, or replay on other hardware targets.

set -euo pipefail

OUT="${1:-hardware.canvasl.jsonl}"

NOW_MS() {
  local ts
  if ts=$(date +%s%3N 2>/dev/null); then
    printf '%s\n' "$ts"
    return
  fi
  local sec
  sec=$(date +%s 2>/dev/null || printf '0')
  printf '%s\n' "$((sec * 1000))"
}

HOST_ID() {
  # Stable-enough device id without root (ANDROID_ID if available, else hash).
  local aid="" fp un
  if command -v settings >/dev/null 2>&1; then
    aid="$(settings get secure android_id 2>/dev/null || true)"
  fi
  if [[ -n "${aid}" && "${aid}" != "null" ]]; then
    printf 'android:%s\n' "$aid"
    return
  fi
  fp="$(getprop ro.build.fingerprint 2>/dev/null || true)"
  un="$(uname -a 2>/dev/null || true)"
  printf '%s::%s' "$fp" "$un" | sha256sum | awk '{printf "android:sha256:%s\n",$1}'
}

sha256_of_file() {
  local f="$1"
  if [[ -f "$f" ]]; then
    sha256sum "$f" | awk '{print $1}'
  else
    printf '\n'
  fi
}

emit() {
  printf '%s\n' "$1" >>"$OUT"
}

jstr() {
  local s="$1"
  s=${s//\\/\\\\}
  s=${s//\"/\\\"}
  s=${s//$'\n'/\\n}
  s=${s//$'\r'/\\r}
  s=${s//$'\t'/\\t}
  printf '"%s"' "$s"
}

: >"$OUT"
TS="$(NOW_MS)"
DEV="$(HOST_ID)"
DEV_JSON="$(jstr "$DEV")"

printf -v line '{"$schema":"canvasl://hw/v1","kind":"HW_HEADER","t":%s,"dev":%s,"note":"termux-hwscan"}' \
  "$TS" "$DEV_JSON"
emit "$line"

# ---------- OS / build props ----------
props=(
  ro.product.brand
  ro.product.manufacturer
  ro.product.model
  ro.product.device
  ro.product.name
  ro.build.fingerprint
  ro.build.version.release
  ro.build.version.sdk
  ro.build.version.security_patch
  ro.hardware
  ro.board.platform
  ro.boot.hardware.sku
  ro.bootloader
)

printf -v line '{"kind":"HW_OS","t":%s,"dev":%s,"os":"android","uname":%s}' \
  "$TS" "$DEV_JSON" "$(jstr "$(uname -a 2>/dev/null || true)")"
emit "$line"

for p in "${props[@]}"; do
  v="$(getprop "$p" 2>/dev/null || true)"
  [[ -z "$v" ]] && continue
  printf -v line '{"kind":"HW_PROP","t":%s,"dev":%s,"k":%s,"v":%s}' \
    "$TS" "$DEV_JSON" "$(jstr "$p")" "$(jstr "$v")"
  emit "$line"
done

# ---------- CPU / memory ----------
if [[ -f /proc/cpuinfo ]]; then
  cpu_model="$(grep -m1 -E 'Hardware|model name|Processor' /proc/cpuinfo 2>/dev/null | head -n1 | cut -d: -f2- | sed 's/^ *//')"
  cores="$(grep -c '^processor' /proc/cpuinfo 2>/dev/null || true)"
  printf -v line '{"kind":"HW_CPU","t":%s,"dev":%s,"model":%s,"cores":%s}' \
    "$TS" "$DEV_JSON" "$(jstr "${cpu_model:-unknown}")" "${cores:-0}"
  emit "$line"
fi

if [[ -f /proc/meminfo ]]; then
  mem_total_kb="$(grep -m1 '^MemTotal:' /proc/meminfo | awk '{print $2}')"
  mem_avail_kb="$(grep -m1 '^MemAvailable:' /proc/meminfo | awk '{print $2}')"
  printf -v line '{"kind":"HW_MEM","t":%s,"dev":%s,"mem_total_kb":%s,"mem_avail_kb":%s}' \
    "$TS" "$DEV_JSON" "${mem_total_kb:-0}" "${mem_avail_kb:-0}"
  emit "$line"
fi

# ---------- Storage ----------
if df_line="$(df -k "$HOME" 2>/dev/null | tail -n1 || true)"; then
  read -r fs sz used avail pct mnt <<<"$df_line"
  printf -v line '{"kind":"HW_FS","t":%s,"dev":%s,"mount":%s,"fs":%s,"size_kb":%s,"used_kb":%s,"avail_kb":%s,"use_pct":%s,"scope":"termux_home"}' \
    "$TS" "$DEV_JSON" "$(jstr "$mnt")" "$(jstr "$fs")" "${sz:-0}" "${used:-0}" "${avail:-0}" "$(jstr "${pct:-}")"
  emit "$line"
fi

if [[ -d /storage/emulated/0 ]]; then
  if df_line="$(df -k /storage/emulated/0 2>/dev/null | tail -n1 || true)"; then
    read -r fs sz used avail pct mnt <<<"$df_line"
    printf -v line '{"kind":"HW_FS","t":%s,"dev":%s,"mount":%s,"fs":%s,"size_kb":%s,"used_kb":%s,"avail_kb":%s,"use_pct":%s,"scope":"primary_storage"}' \
      "$TS" "$DEV_JSON" "$(jstr "$mnt")" "$(jstr "$fs")" "${sz:-0}" "${used:-0}" "${avail:-0}" "$(jstr "${pct:-}")"
    emit "$line"
  fi
fi

# ---------- Network interfaces ----------
if command -v ip >/dev/null 2>&1; then
  while IFS= read -r line; do
    ifname="$(echo "$line" | awk -F': ' '{print $2}' | awk '{print $1}')"
    [[ -z "$ifname" ]] && continue
    flags="$(echo "$line" | sed -n 's/.*<\([^>]*\)>.*/\1/p')"
    state="$(echo "$line" | awk '{for(i=1;i<=NF;i++) if($i=="state"){print $(i+1); exit}}')"
    printf -v line '{"kind":"NET_IF","t":%s,"dev":%s,"if":%s,"flags":%s,"state":%s}' \
      "$TS" "$DEV_JSON" "$(jstr "$ifname")" "$(jstr "${flags:-}")" "$(jstr "${state:-}")"
    emit "$line"
  done < <(ip -o link show 2>/dev/null || true)

  while IFS= read -r line; do
    ifname="$(echo "$line" | awk '{print $2}')"
    fam="$(echo "$line" | awk '{print $3}')"
    addr="$(echo "$line" | awk '{print $4}')"
    printf -v line '{"kind":"NET_ADDR","t":%s,"dev":%s,"if":%s,"fam":%s,"addr":%s}' \
      "$TS" "$DEV_JSON" "$(jstr "$ifname")" "$(jstr "$fam")" "$(jstr "$addr")"
    emit "$line"
  done < <(ip -o addr show 2>/dev/null || true)

  while IFS= read -r r; do
    printf -v line '{"kind":"NET_ROUTE","t":%s,"dev":%s,"route":%s}' \
      "$TS" "$DEV_JSON" "$(jstr "$r")"
    emit "$line"
  done < <(ip route 2>/dev/null || true)

  while IFS= read -r r6; do
    printf -v line '{"kind":"NET_ROUTE6","t":%s,"dev":%s,"route":%s}' \
      "$TS" "$DEV_JSON" "$(jstr "$r6")"
    emit "$line"
  done < <(ip -6 route 2>/dev/null || true)
fi

if [[ -f /etc/resolv.conf ]]; then
  while IFS= read -r ns; do
    printf -v line '{"kind":"NET_DNS","t":%s,"dev":%s,"line":%s}' \
      "$TS" "$DEV_JSON" "$(jstr "$ns")"
    emit "$line"
  done < <(grep -E '^(nameserver|search|options)\b' /etc/resolv.conf 2>/dev/null || true)
fi

# ---------- Proxy environment ----------
http_proxy_value="${http_proxy:-${HTTP_PROXY:-}}"
https_proxy_value="${https_proxy:-${HTTPS_PROXY:-}}"
no_proxy_value="${no_proxy:-${NO_PROXY:-}}"
printf -v line '{"kind":"NET_PROXY_ENV","t":%s,"dev":%s,"http_proxy":%s,"https_proxy":%s,"no_proxy":%s}' \
  "$TS" "$DEV_JSON" "$(jstr "$http_proxy_value")" "$(jstr "$https_proxy_value")" "$(jstr "$no_proxy_value")"
emit "$line"

APTCONF="/etc/apt/apt.conf.d/95proxies"
if [[ -f "$APTCONF" ]]; then
  printf -v line '{"kind":"NET_APT_PROXY","t":%s,"dev":%s,"path":%s,"sha256":%s}' \
    "$TS" "$DEV_JSON" "$(jstr "$APTCONF")" "$(jstr "$(sha256_of_file "$APTCONF")")"
  emit "$line"
  while IFS= read -r ln; do
    printf -v line '{"kind":"NET_APT_PROXY_LINE","t":%s,"dev":%s,"line":%s}' \
      "$TS" "$DEV_JSON" "$(jstr "$ln")"
    emit "$line"
  done < <(sed 's/[[:cntrl:]]//g' "$APTCONF" 2>/dev/null || true)
fi

# ---------- Termux details ----------
termux_version="$(termux-info 2>/dev/null | head -n1 || true)"
printf -v line '{"kind":"TERMUX","t":%s,"dev":%s,"prefix":%s,"termux_version":%s}' \
  "$TS" "$DEV_JSON" "$(jstr "${PREFIX:-}")" "$(jstr "$termux_version")"
emit "$line"

# ---------- CanvasL projection hooks ----------
printf -v line '{"kind":"CANVASL_FIELDS","t":%s,"dev":%s,"fields":["os.android","cpu.cores","mem.total_kb","net.if","net.addr","net.route","net.dns","proxy.http","proxy.https","storage.home","storage.primary"]}' \
  "$TS" "$DEV_JSON"
emit "$line"

printf -v line '{"kind":"HW_DONE","t":%s,"dev":%s,"out":%s}' \
  "$(NOW_MS)" "$DEV_JSON" "$(jstr "$OUT")"
emit "$line"

echo "Wrote $OUT"
