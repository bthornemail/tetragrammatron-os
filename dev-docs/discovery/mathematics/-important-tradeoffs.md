# 📌 Important Tradeoffs

### 🧠 Compute vs RAM
ESP32 isn’t huge; if you need complex trace replay or large buffers, you must:

- offload to companion UI device (phone/desktop)
- store only summaries on ESP32
- design trace chunks

---

### 📡 Networking vs Battery
If your device sleeps a lot:

- use MQTT with QoS to avoid missed state writes
- wake periodically to sync
- don’t hold large socket buffers

---

### 💾 Logging Strategy
ESP32 has limited flash write cycles:

- prefer **circular log ring**
- GC old events after checkpointing to the cloud
- use **CBOR/FlatBuffers** (binary) not verbose JSON

---
