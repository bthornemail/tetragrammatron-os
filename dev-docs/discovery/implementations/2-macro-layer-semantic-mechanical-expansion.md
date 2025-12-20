# 2️⃣ Macro Layer (Semantic → Mechanical Expansion)

This is where **CanvasL becomes ergonomic**, without sacrificing provability.

Macros expand **purely syntactically** into the assembler you already trust.

---

## 🔹 `with-channel` Macro

### Usage

```scheme
(with-channel
  (STATE ALPHABET LEFT TRANSITION)
  GLB_CHUNK
  (emit-bytes "mesh")
  (emit-bytes "data"))
```

### Expansion

```scheme
(define-syntax with-channel
  (syntax-rules ()
    ((_ (a0 a1 a2 a3) format body ...)
     (begin
       (MUX_OPEN (ch 0 a0 a1 a2 a3) format 0)
       body ...
       (MUX_CLOSE (ch 0 a0 a1 a2 a3) 0)))))
```

---

## 🔹 `emit-bytes` Macro

Accepts string or explicit bytes.

```scheme
(define-syntax emit-bytes
  (syntax-rules ()
    ((_ str)
     (MUX_EVT 7 str))
    ((_ b ...)
     (MUX_EVT (length '(b ...)) 7 0 b ...))))
```

---

## 🔹 `fano-triad` Macro (Normative)

This enforces **exactly** what you mean by *idempotent folding consistency*.

### Semantic Meaning
- All three meet pairwise
- Projection stable
- No ambiguity allowed

### Usage

```scheme
(fano-triad rA rB rC rOut)
```

### Expansion

```scheme
(define-syntax fano-triad
  (syntax-rules ()
    ((_ a b c out)
     (begin
       (MEET_GCD out a b)
       (MEET_GCD out out c)
       (ASSERT_TRIAD a b c)))))
```

This is **Origami Axiom 6**, mechanically enforced.

---

## 🔹 `timed-barrier` (Physical Constraint Injection)

```scheme
(define-syntax timed-barrier
  (syntax-rules ()
    ((_ us)
     (BARRIER_T 0 us))))
```

Used to **bind computation to physical time** (clock crystal, entropy source).

---

## 🔹 `circulate` (Round-Robin Biological Loop)

```scheme
(define-syntax circulate
  (syntax-rules ()
    ((_ rr-id count dst)
     (begin
       (RR_INIT rr-id count 0)
       (RR_NEXT rr-id dst 0)))))
```

This is your **circulation / chirality / metabolism** primitive.

---
