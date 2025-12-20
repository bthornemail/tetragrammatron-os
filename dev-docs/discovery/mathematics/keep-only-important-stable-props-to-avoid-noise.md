# Keep only important stable props to avoid noise.
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

emit "{"kind":"HW_OS","t":$TS,"dev":"$DEV","os":"android","uname":$(jstr "$(uname -a 2>/dev/null || true)")}"
for p in "${props[@]}"; do
  v="$(getprop "$p" 2>/dev/null || true)"
  [[ -z "$v" ]] && continue
  emit "{"kind":"HW_PROP","t":$TS,"dev":"$DEV","k":$(jstr "$p"),"v":$(jstr "$v")}"
done
