# Minimal ESP32/Pico test program (first runnable)

1. `TIME_RD r0`
2. `BARRIER_T imm16=1000`
3. `RR_INIT imm8=3`
4. `MUX_OPEN chan=TRACE`
5. loop 8 times:
   - `TIME_RD r1`
   - `MUX_EVT TIME_SAMPLE (r1)`
   - `RR_NEXT r2`
   - `MUX_EVT RR_TICK (r2, rr.epoch)`
   - `WAIT 10000` (10ms)
6. `MUX_CLOSE TRACE`
7. `PATCH_BEGIN target=<some scratch segment>`
8. `PATCH_WRITE bytes="..."` (write a tiny new loop body)
9. `PATCH_SEAL`
10. `PATCH_APPLY`
11. rerun loop; confirm packet hash changes *only* when patch is applied

**Pass condition:** both devices produce identical trace packet hashes for the same barrier + RR schedule.

---
