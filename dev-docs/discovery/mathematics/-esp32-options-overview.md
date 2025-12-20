# 🧠 ESP32 Options Overview

Here are the current ESP32 family variants you’re likely considering:

| Model | CPU | RAM | Flash | Connectivity | Notes |
|-------|-----|-----|-------|--------------|-------|
| **ESP32-S3** | Tensilica LX7 (dual) | ~512–1024 KB | Up to 16 MB | Wi-Fi 4 + BLE | Best balance for apps with some ML / complex logic |
| **ESP32-C6** | RISC-V | ~400–800 KB | Up to 16 MB | Wi-Fi 6 + BLE | Newer wireless, better power, future-friendly |
| **ESP32-P4** | RISC-V with vector accelerator | ~768 KB | Up to 16 MB | Wi-Fi + BLE | Good for DSP/compute-heavy tasks |

---

## 🛠️ What You Should Be Aware Of

### 1️⃣ **RAM (SRAM)** — Most Important

ESP32 devices have **limited RAM**, and this is the primary limiter for your project.

You WILL need RAM for:

- Polynomial evaluation state
- Hash context
- MQTT/WebRTC buffers (especially WebRTC)
- Any JSON/CBOR parsing
- Camera/graphics buffers (if visual display)
- RTOS tasks and stacks

**Target Minimum:** **512 KB SRAM**  
**Preferred:** **768–1024 KB SRAM**  
Less than ~400 KB severely constrains networking + security.

---

### 2️⃣ **Flash Storage**

ESP32 doesn’t have huge persistent storage unless you add an external flash chip or SD card.

You’ll want flash for:

- Boundary artifacts
- Trace event logs
- FS + config + credentials
- OTA updates

At least **4 MB flash recommended**, **8–16 MB ideal**, especially if you store CanvasL/trace logs locally.

---

### 3️⃣ **Networking**

Your system will likely need:

- **MQTT**
- **WebRTC signaling**
- **Connection to companion UIs**

Key points:

- **Wi-Fi**: Required for MQTT; choose **Wi-Fi 4 or 6** if possible.
- **BLE**: Optional but nice for QR-gated pairing / service advertising.
- **WebRTC**: Not currently available natively; you’ll run lightweight signaling on ESP32, not full WebRTC.

---

### 4️⃣ **Hardware Acceleration**

ESP32 variants vary:

| Feature | Importance | Notes |
|---------|------------|-------|
| **SHA / AES Engine** | High | Useful for hashing, signatures, HMAC |
| **SPI / SDIO** | Medium | For external storage |
| **Vector DSP** | Low for your core | Useful for signal processing, not essential for BICF logic |

Ensure the chip has **hardware crypto** (most have SHA/AES) so signature/validation code is efficient.

---

### 5️⃣ **Power Consumption & Modes**

If you want:

- battery operation
- sleep / deep sleep
- periodic batching

Then you must plan for:

- **deep sleep state retention**
- waking without hash state loss (checkpoint to flash)
- RTC memory use

This influences how you structure trace logging.

---
