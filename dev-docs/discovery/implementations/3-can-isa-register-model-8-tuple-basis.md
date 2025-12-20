# 3) CAN-ISA register model (8-tuple basis)

Make the ISA **explicitly aware** of the 8-tuple by reserving 3 bits for “axis register id”:

```text
REG_ID (3 bits):
000 state
001 alphabet
010 left
011 right
100 delta
101 start
110 accept
111 reject
```

This is the *mechanical* bridge from your repo topology to bytecode.

---
