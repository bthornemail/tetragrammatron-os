# D.7 Next: Add Macro Expansion (Optional)

If you want, I’ll extend this assembler with:
- `(COMMIT/DEFAULT)` macro
- `(PROJ_FANO/ALL)` macro that sets flags safely
- label resolution + relative branch encoding (once you define jump/call opcodes)

Say **“Appendix C”** if you want the `.canbc` container header (magic, version, section table) to match your CLBC-POLY container style.

---

## ChatGPT

## Appendix C — `.canbc` Container Format (Normative) aligned with CLBC-POLY style

This appendix defines a **binary container** for the Origami Fold VM bytecode stream (CAN-ISA) that:

- Looks/feels like your CLBC-POLY codec containers (magic + kind + version + ring-id + flags)
- Carries a **word-aligned instruction stream**
- Optionally carries **poly blobs** (CLBC-POLY canonical bytes), a **symbol table**, and a **viz/event contract seed**
- Is deterministic, streaming-friendly, and easy to parse on ESP32/Pico

The container name is **`.canbc`** (“CAN ByteCode”) to avoid confusion with the existing CLBC record-stream VM.

---
