# Minimal “Vertical Slice” Invariants (What to implement first)

If you only implement the first critical set for proof-to-firmware:

1. INV-1, INV-3, INV-4 (canonical + codec)  
2. INV-5, INV-6 (determinism + replay)  
3. INV-7..INV-10 (lattice laws)  
4. INV-12 (Fano validity gate)  

Those four clusters are enough to support “dynamic proof” and hardware parity.

---

If you want, next I’ll do **one of these immediately** (no questions needed):

1) A **Lean file skeleton** defining these invariants as theorems/axioms + placeholders for proofs, **matching your repo structure**, or  
2) A **CAN-ISA opcode-to-invariant table** (which opcode is responsible for establishing/preserving which invariant), or  
3) Runtime **assertion macros** in C for ESP32/Pico that enforce INV-1..INV-12 while you build out the full VM.

---

## You

Can-isa invariant

---

## ChatGPT

Below is a **clean, normative CAN-ISA Invariant Specification** you can drop directly into your repo as:

```
rfc/RFC-0000-can-isa-invariants.md
```

This is written to sit **between the abstract math (Fano / lattice / origami)** and the **actual firmware VM**, so every opcode has something it is *responsible* for preserving.

No mysticism, no metaphors — this is the **contract the machine must obey**.

---
