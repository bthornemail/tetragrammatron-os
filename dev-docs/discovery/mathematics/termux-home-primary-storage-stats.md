# Termux home + primary storage stats
df_line="$(df -k "$HOME" 2>/dev/null | tail -n1 || true)"
if [[ -n "$df_line" ]]; then
  read -r fs sz used avail pct mnt <<<"$df_line"
  emit "{"kind":"HW_FS","t":$TS,"dev":"$DEV","mount":$(jstr "$mnt"),"fs":$(jstr "$fs"),"size_kb":${sz:-0},"used_kb":${used:-0},"avail_kb":${avail:-0},"use_pct":$(jstr "${pct:-}"),"scope":"termux_home"}"
fi

if [[ -d /storage/emulated/0 ]]; then
  df_line="$(df -k /storage/emulated/0 2>/dev/null | tail -n1 || true)"
  if [[ -n "$df_line" ]]; then
    read -r fs sz used avail pct mnt <<<"$df_line"
    emit "{"kind":"HW_FS","t":$TS,"dev":"$DEV","mount":$(jstr "$mnt"),"fs":$(jstr "$fs"),"size_kb":${sz:-0},"used_kb":${used:-0},"avail_kb":${avail:-0},"use_pct":$(jstr "${pct:-}"),"scope":"primary_storage"}"
  fi
fi
