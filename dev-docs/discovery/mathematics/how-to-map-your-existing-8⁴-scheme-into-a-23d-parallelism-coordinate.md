# How to map your existing 8⁴ scheme into a 23D “parallelism coordinate”

Right now we have a **12-bit channel**:
- 4 axes × 3 bits each = **8⁴ = 4096 channels**

That’s already a strong “local address space”.

To get “23D”, don’t throw it away — **lift it**.

## Proposed: 23D = (12-bit channel) + (11-bit “frame”)
You already mentioned “11D–19D” earlier, so this snaps together cleanly.

### 1) Keep the ChannelID12 exactly as-is
This remains your **inner Fano/Origami/8-tuple semantic channel**.

### 2) Add FrameID11 (11 extra axes compressed)
Define an 11-bit field that selects:
- repo axis branch lane
- device lane (ESP32/Pico/host)
- time/clock domain
- mux bank
- patch epoch
- renderer mode
- etc.

Now you have **23 bits total**:
```
Coord23 = (FrameID11 << 12) | ChannelID12
```

That is literally a **23D coordinate compressed into 23 bits**.

### Why this rocks
- Your existing ISA immediate can remain **imm16** for local work.
- For global routing, use an **extended immediate** instruction (IMM23 / IMM32).
- Deterministic, canonical, easy.

---
