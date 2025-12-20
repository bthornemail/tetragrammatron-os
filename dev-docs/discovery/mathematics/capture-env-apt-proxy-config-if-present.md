# Capture env + apt proxy config if present
emit "{"kind":"NET_PROXY_ENV","t":$TS,"dev":"$DEV","http_proxy":$(jstr "${http_proxy:-${HTTP_PROXY:-}}"),"https_proxy":$(jstr "${https_proxy:-${HTTPS_PROXY:-}}"),"no_proxy":$(jstr "${no_proxy:-${NO_PROXY:-}}")}"

APTCONF="/etc/apt/apt.conf.d/95proxies"
if [[ -f "$APTCONF" ]]; then
  emit "{"kind":"NET_APT_PROXY","t":$TS,"dev":"$DEV","path":$(jstr "$APTCONF"),"sha256":$(jstr "$(sha256_of_file "$APTCONF")")}"
  # emit the lines too (sanitized)
  while IFS= read -r ln; do
    emit "{"kind":"NET_APT_PROXY_LINE","t":$TS,"dev":"$DEV","line":$(jstr "$ln")}"
  done < <(sed 's/[[:cntrl:]]//g' "$APTCONF" 2>/dev/null || true)
fi
