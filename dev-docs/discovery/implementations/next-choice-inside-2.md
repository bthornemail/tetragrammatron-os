# Next choice inside “2”
Do you want animation to be:

- **2a)** *pulse* only (what we implemented), or  
- **2b)** *accumulating* (once highlighted, stays highlighted), or  
- **2c)** *frame-by-frame* (only current step visible; previous fades)?

Reply `2a`, `2b`, or `2c` and I’ll lock that as the RFC-009 animation mode and adjust the renderer + opcode hooks accordingly.

---

## You

2

---

## ChatGPT

Got it — **(2) animated, accumulating** (what I called **2b**): once a point/line is “proven/activated” in the trace, it **stays on** for the rest of the run. This matches “monotone evidence growth” and feels right for proofs.

Here’s the exact change set.

---
