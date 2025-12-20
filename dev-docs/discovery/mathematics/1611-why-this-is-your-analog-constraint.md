# 16.11 Why this is your “analog constraint”
You asked for: *analog constraint / timing crystal / processor clock*.

This design uses clock/time as the **physical gate**:
- You can only rewrite yourself at **barrier times**.
- Barriers are defined using TIME_RD/WAIT/BARRIER_T (Section 14).
- On embedded devices, the timing source is real hardware (crystal/PLL), so the VM’s “rewrite window” is grounded.

That’s how you get **circulation** without chaos.

---

If you say **“17”**, I’ll do the **VM core loop integration** (how TIME/RR/MUX/PATCH compose in the execution engine), plus a minimal “vertical slice program” that:
1) reads time,  
2) round-robins a register bank,  
3) emits a geometry+note event,  
4) seals and applies a data patch under barrier,  
5) and proves idempotence hooks remain intact.

---

## You

17

---

## ChatGPT

## 17) VM core loop integration (TIME + RR + MUX + PATCH) + minimal vertical slice program

This section gives you the **execution model** that makes the whole thing *circulate*: time provides physical constraint, round-robin provides topology, mux provides multi-channel IO, patch provides safe self-modification.

I’m writing this in the same “RFC-ish” style you’ve been using.

---
