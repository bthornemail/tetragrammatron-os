# RFC-0000 — CAN-ISA Invariants  
**Title:** Canonical Algebraic Normal (CAN) Instruction Set Architecture — Invariant Semantics  
**Status:** Normative  
**Applies to:**  
- CAN-ISA v1.x bytecode  
- Origami Fold VM  
- ESP32 / Pico firmware  
- CanvasL core  
- Repo merge semantics (RFC-0011)

---

## 1. Scope and Purpose

CAN-ISA invariants define **what must never break**, regardless of:

- instruction ordering  
- platform (Xtensa, ARM, host)  
- timing source  
- self-modifying behavior  
- visualization backend  

If an instruction violates an invariant, execution MUST fail closed.

---

## 2. Canonical State Model

Let:

- `S` = machine state  
- `Norm(S)` = canonical normalized state  
- `Enc(S)` = canonical binary encoding  
- `Dec(B)` = decode binary → state  
- `ProjF(S)` = Fano projection  
- `⊥` = invalid / rejected state  

---

## 3. Global CAN-ISA Invariants (ALL opcodes)

These MUST hold **before and after every instruction**.

### CAN-INV-1: Canonical Idempotence
```
Norm(Norm(S)) = Norm(S)
```

> Canonicalization is a projection, not a transformation.

---

### CAN-INV-2: Canonical Encoding Uniqueness
```
Norm(S₁) = Norm(S₂)  ⇒  Enc(S₁) = Enc(S₂)
```

> No two distinct byte sequences may represent the same canonical state.

---

### CAN-INV-3: Decode / Encode Soundness
```
Norm(Dec(Enc(Norm(S)))) = Norm(S)
```

> Binary is the truth source, not memory layout.

---

### CAN-INV-4: Deterministic Execution
```
Enc(Norm(S)) + Instr  ⇒  Enc(Norm(S′))  (pure function)
```

No hidden entropy.  
No timing unless explicitly read.

---

## 4. Lattice (Fold) Invariants

These are enforced by **MEET / JOIN / FOLD** instructions.

### CAN-INV-5: Meet Idempotence
```
MEET(x, x) = x
```

---

### CAN-INV-6: Join Idempotence
```
JOIN(x, x) = x
```

---

### CAN-INV-7: Commutativity
```
MEET(x, y) = MEET(y, x)
JOIN(x, y) = JOIN(y, x)
```

---

### CAN-INV-8: Associativity
```
MEET(x, MEET(y, z)) = MEET(MEET(x, y), z)
JOIN(x, JOIN(y, z)) = JOIN(JOIN(x, y), z)
```

---

### CAN-INV-9: Absorption (Fold Closure)
```
MEET(x, JOIN(x, y)) = x
JOIN(x, MEET(x, y)) = x
```

This is **origami flat-fold closure** in executable form.

---

## 5. Fano Projection Invariants

These are enforced by `PROJ_FANO` and any instruction that changes structure.

### CAN-INV-10: Fano Structural Validity

For `F = ProjF(S)`:

- |Points| = 7  
- |Lines| = 7  
- Each point lies on exactly 3 lines  
- Each line contains exactly 3 points  
- Any two points share exactly one line  

If violated:
```
S′ = ⊥
```

---

### CAN-INV-11: Projection Homomorphism
```
ProjF(MEET(x,y)) = MEET_F(ProjF(x), ProjF(y))
ProjF(JOIN(x,y)) = JOIN_F(ProjF(x), ProjF(y))
```

> Folding then projecting = projecting then folding.

---

### CAN-INV-12: Triad Closure (Fano Line Law)

For any declared triad `{a,b,c}`:
```
MEET(a,b) ≠ ⊥
MEET(b,c) ≠ ⊥
MEET(c,a) ≠ ⊥
```

Triads are **lines**, not suggestions.

---

## 6. Time & Physical Constraint Invariants

### CAN-INV-13: Explicit Time Source
Any instruction that depends on time MUST read from a declared clock register.

No implicit CPU cycle leakage.

---

### CAN-INV-14: Barrier Monotonicity
Once a barrier is set:
```
BARRIER(S) ⇒ BARRIER(S′)
```
unless explicitly released by a barrier opcode.

---

## 7. Self-Modifying Code Invariants

### CAN-INV-15: Patch Isolation
While a patch region is open:
```
EXEC / JUMP into patch = ⊥
```

---

### CAN-INV-16: Patch Atomicity
A patch is either:
- not visible  
- fully visible  

Never partial.

---

### CAN-INV-17: Patch Canonicalization
Applied patches MUST normalize before execution.
```
PATCH_APPLY ⇒ Norm(code)
```

---

## 8. Instruction Responsibility Table (Excerpt)

| Opcode        | Must Preserve Invariants |
|---------------|--------------------------|
| CANON         | 1–4                      |
| MEET          | 1–9, 11–12               |
| JOIN          | 1–9, 11–12               |
| PROJ_FANO     | 1–4, 10–12               |
| TIME_RD       | 1–4, 13                  |
| BARRIER_T     | 1–4, 14                  |
| PATCH_*       | 1–4, 15–17               |
| JUMP / EXEC   | 1–4, 15                  |

---

## 9. Why This Matters (Plain Language)

These invariants guarantee:

- **Self-modifying code that cannot corrupt itself**
- **Distributed nodes that always converge**
- **Visual geometry that is provably correct**
- **Repo merges that behave like algebra, not politics**
- **Hardware timing that becomes a constraint, not a bug**

This is why CAN-ISA is **not just an instruction set** — it’s a **computational ontology**.
