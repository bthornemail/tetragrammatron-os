# Prefer iproute2
if command -v ip >/dev/null 2>&1; then
  # link + addr summary
  while IFS= read -r line; do
    # "2: wlan0: <BROADCAST,MULTICAST,UP,LOWER_UP> ..."
    ifname="$(echo "$line" | awk -F': ' '{print $2}' | awk '{print $1}')"
    flags="$(echo "$line" | sed -n 's/.*<\([^>]*\)>.*/\1/p')"
    state="$(echo "$line" | awk '{for(i=1;i<=NF;i++) if($i=="state"){print $(i+1); exit}}')"
    [[ -z "$ifname" ]] && continue
    emit "{"kind":"NET_IF","t":$TS,"dev":"$DEV","if":$(jstr "$ifname"),"flags":$(jstr "${flags:-}"),"state":$(jstr "${state:-}")}"
  done < <(ip -o link show 2>/dev/null || true)

  while IFS= read -r line; do
    # "2: wlan0    inet 192.168.1.5/24 brd ..."
    ifname="$(echo "$line" | awk '{print $2}')"
    fam="$(echo "$line" | awk '{print $3}')"
    addr="$(echo "$line" | awk '{print $4}')"
    emit "{"kind":"NET_ADDR","t":$TS,"dev":"$DEV","if":$(jstr "$ifname"),"fam":$(jstr "$fam"),"addr":$(jstr "$addr")}"
  done < <(ip -o addr show 2>/dev/null || true)

  # Routes + DNS
  while IFS= read -r r; do
    emit "{"kind":"NET_ROUTE","t":$TS,"dev":"$DEV","route":$(jstr "$r")}"
  done < <(ip route 2>/dev/null || true)

  while IFS= read -r r; do
    emit "{"kind":"NET_ROUTE6","t":$TS,"dev":"$DEV","route":$(jstr "$r")}"
  done < <(ip -6 route 2>/dev/null || true)
fi

if [[ -f /etc/resolv.conf ]]; then
  while IFS= read -r ns; do
    emit "{"kind":"NET_DNS","t":$TS,"dev":"$DEV","line":$(jstr "$ns")}"
  done < <(grep -E '^(nameserver|search|options)\b' /etc/resolv.conf 2>/dev/null || true)
fi
