# 2. Floating Point Numbers as Algebraic Terms

## 2.1 Standard Interpretation (Insufficient)

Traditionally, a floating-point number is treated as a numeric approximation:

```
value ≈ real number
```

This interpretation obscures structure and introduces architecture-dependent behavior.

---

## 2.2 Algebraic Reinterpretation

We instead define a floating-point number as a **normalized algebraic term**:

\[
	ext{float} := m \cdot 2^e
\]

Where:
- \( m \) is a **coefficient** (mantissa),
- \( 2^e \) is a **scale operator** (exponent),
- normalization enforces a **canonical representative**.

Crucially, the float is **not a value**, but a *term modulo a normalization rule*.

---

## 2.3 Binary as an Equality Operator

Binary encoding does not store information—it enforces equivalence:

\[
m \cdot 2^e \;\equiv\; \frac{m}{2} \cdot 2^{e+1}
\]

This defines a **quotient space** over algebraic expressions. Floating-point arithmetic is therefore a rewrite system over equivalence classes.

---

## 2.4 Consequence

A floating-point unit (FPU) is not a numeric engine—it is a **polynomial normalizer with fixed base scaling**.

This observation is architecture-independent and formally sound.

---
