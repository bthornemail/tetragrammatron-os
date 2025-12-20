# 17.1 VM phases (normative)

The VM MUST execute in **deterministic phases** per tick:

1. **FETCH/DECODE**
2. **EXECUTE**
3. **BARRIER CHECK**
4. **EVENT COMMIT (MUX)**
5. **STATE HASH COMMIT**
6. **SCHEDULE NEXT**

A VM implementation MAY run multiple instructions per tick, but MUST preserve:
- deterministic instruction order,
- deterministic event order,
- deterministic patch apply semantics.

---
