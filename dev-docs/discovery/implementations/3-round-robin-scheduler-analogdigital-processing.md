# 3) Round-Robin Scheduler (Analog/Digital Processing)

Treat “analog/digital” as **two interleaved lanes** with time slicing.

### VM lanes
- Lane A: “symbolic / algebraic” (poly ops)
- Lane B: “physical / sensory” (timing, IO, rendering)

### Opcodes
```
0x80 SCHED_SET     set quantum size (imm16 ticks)
0x81 SCHED_YIELD   yield current lane
0x82 SCHED_NEXT    rotate to next lane/agent
0x83 SCHED_TRiad   rotate across Fano triad (a,b,c) deterministically
0x84 SCHED_ASSERT  assert fairness counters within bounds
```

**SCHED_TRiad** is the magic one: it makes a *literal* “Fano circulation”:
- you execute A→B→C→A with a proofable invariant (“no starvation” + “phase coherence”).

---
