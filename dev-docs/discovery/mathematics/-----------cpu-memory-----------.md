# ---------- CPU / memory ----------
if [[ -f /proc/cpuinfo ]]; then
  # Extract key cpuinfo fields
  cpu_model="$(grep -m1 -E 'Hardware|model name|Processor' /proc/cpuinfo 2>/dev/null | head -n1 | cut -d: -f2- | sed 's/^ *//')"
  cores="$(grep -c '^processor' /proc/cpuinfo 2>/dev/null || true)"
  emit "{"kind":"HW_CPU","t":$TS,"dev":"$DEV","model":$(jstr "${cpu_model:-unknown}"),"cores":${cores:-0}}"
fi

if [[ -f /proc/meminfo ]]; then
  mem_total_kb="$(grep -m1 '^MemTotal:' /proc/meminfo | awk '{print $2}')"
  mem_avail_kb="$(grep -m1 '^MemAvailable:' /proc/meminfo | awk '{print $2}')"
  emit "{"kind":"HW_MEM","t":$TS,"dev":"$DEV","mem_total_kb":${mem_total_kb:-0},"mem_avail_kb":${mem_avail_kb:-0}}"
fi
