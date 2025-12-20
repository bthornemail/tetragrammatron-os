# 🛠 Minimal Starting Bill of Materials (BOM)

- **1 × ESP32-S3 module** (e.g., WROOM-1)
- **1 × LiPo battery + charger**
- **1 × microSD slot** (optional, for larger logs)
- **1 × USB-C serial for dev**
- **Optional regulator + RTC memory**

---

## 🧪 Quick Performance Targets

| Work | Expected | Notes |
|-----|----------|-------|
| Polynomial eval (deg ≤3) | < 1 ms | Fixed-point |
| Fano check (7 lines) | ~10 µs | Bitmask |
| MQTT publish | 10–100 ms | Wifi overhead |
| Hash compute (SHA-256) | ~0.5–1 ms | hardware accel |
| Full trace chunk emit | 50–200 ms | depends on size |

---
