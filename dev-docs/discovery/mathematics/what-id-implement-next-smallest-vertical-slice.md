# What I’d implement next (smallest vertical slice)

If you want the fastest proof-to-firmware bridge, do this order:

1) **TIME_RD + WAIT + BARRIER_T** (adds physical constraint now)
2) **RR_INIT + RR_NEXT** (gives circulation topology)
3) **MUX_OPEN + MUX_EVT + MUX_CLOSE** (gives visuals + wave channels)
4) **PATCH_BEGIN/WRITE/SEAL/APPLY** (self-modifying, but safe)

No need to touch MQTT yet.

---
