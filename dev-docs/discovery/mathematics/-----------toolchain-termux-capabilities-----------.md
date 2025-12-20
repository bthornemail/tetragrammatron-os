# ---------- Toolchain + Termux capabilities ----------
emit "{"kind":"TERMUX","t":$TS,"dev":"$DEV","prefix":$(jstr "${PREFIX:-}"),"termux_version":$(jstr "$(termux-info 2>/dev/null | head -n1 || true)")}"
