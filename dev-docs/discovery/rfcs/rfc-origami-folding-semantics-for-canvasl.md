# RFC: Origami Folding Semantics for CanvasL  
**Status:** Draft–Normative  
**Applies to:** CanvasL v1+, CLBC-ISA, Geometry Renderer  
**Keywords:** MUST, SHOULD, MAY as per RFC 2119  

---

## 1. Purpose

This RFC defines **Origami Folding Semantics** as a formal mechanism for:

- Dimensional reduction (projection, shadow, collapse)
- Idempotent visualization
- Certified geometric computation
- Proof-driven rendering

Origami folds are treated as **axiomatic geometric operators** whose correctness is provable in **Lean** and **Coq**, and whose execution is deterministic on embedded targets (ESP32 / Pico).

---

## 2. Core Principle

> **A fold is a certified geometric operator that preserves equivalence classes under projection.**

In CanvasL:

- **Data** lives in an affine or projective space
- **Folds** map that space into a lower-dimensional shadow
- **Flat-foldability theorems** guarantee idempotence and reversibility
- **Rendered geometry** is a witness, not an interpretation

---

## 3. Formal Objects

### 3.1 Geometric Domains

The system recognizes the following domains:

| Domain | Meaning |
|------|--------|
| ℝⁿ | Continuous geometric embedding (for proofs) |
| F₂[x] | Algebraic state (canonical computation) |
| PG(k,2) | Projective reduction (Fano plane) |
| Shadow(ℝⁿ → ℝᵐ) | Folded visualization |

All visualization **MUST** be derivable from algebraic state via certified folds.

---

## 4. Origami Axioms as Operators

### 4.1 Huzita–Hatori Axioms (Computational Interpretation)

Each axiom is a **total function** on geometric state.

| Axiom | CanvasL Interpretation |
|-----|------------------------|
| A1 | Bisector → midpoint projection |
| A2 | Line-through-points → incidence witness |
| A3 | Line-to-line fold → symmetry operator |
| A4 | Perpendicular → orthogonal projection |
| A5 | Point-to-line → constraint alignment |
| **A6** | **Cubic-solving fold** → polynomial root collapse |
| A7 | Line alignment → projective normalization |

> **Axiom 6 MUST be the only axiom that introduces cubic constraints.**

This preserves your distinction between:
- Linear/quadratic normalization (cheap, frequent)
- Cubic collapse (rare, explicit, meaningful)

---

## 5. Flat-Foldability = Idempotence

### 5.1 Kawasaki’s Theorem (Local)

**Theorem (Kawasaki):**  
At a vertex, alternating crease angles sum to π.

**CanvasL Semantic Rule:**

```text
If a fold pattern satisfies Kawasaki,
then fold ∘ fold = fold
```

**Implication:**  
A shadow rendered twice is identical to once.

This is exactly your **normalize_idempotent** principle, but geometric.

---

### 5.2 Maekawa’s Theorem (Global)

**Theorem (Maekawa):**  
At a flat-foldable vertex,  
|mountain − valley| = 2.

**CanvasL Semantic Rule:**

- Mountain = expansion
- Valley = collapse

Their imbalance being constant ensures **global consistency** of projection.

---

## 6. Fano Plane as the Base Projection

### 6.1 Mandatory Baseline

All origami-derived visualizations **MUST reduce first to the Fano plane**:

- 7 points
- 7 triads
- Incidence only

This ensures:

- Minimal proof surface
- Architecture-independent rendering
- Direct correspondence to idempotent lattice joins/meets

> **Merkaba, Metatron, or higher forms MUST be derivable from Fano data.**

---

## 7. Merkaba as a Derived Fold

### 7.1 Definition

A **Merkaba** is defined as **two tetrahedra sharing a face**, constructed deterministically from a Fano labeling.

Construction rule (normative):

1. Sort Fano points by canonical ID
2. Select:
   - T⁺ = (p₁, p₂, p₃, p₄)
   - T⁻ = (p₁, p₂, p₃, p₅)
3. Their intersection defines the folding plane

This construction:

- Requires no new state
- Is provably deterministic
- Is reducible back to Fano incidence

---

## 8. Shadows and Collapses

### 8.1 Shadow Definition

A **shadow** is a fold such that:

```text
shadow : ℝⁿ → ℝᵐ  where m < n
```

Subject to:

- Flat-foldability
- Idempotence
- Projective equivalence

### 8.2 Optional Fields as Foldable Dimensions

CanvasL schema fields marked `optional:true`:

- MAY vanish under fold
- MUST correspond to projective points at infinity
- MUST NOT affect canonical hashes

This aligns optional types with origami’s “hidden layers”.

---

## 9. Lean Formalization (Normative)

### 9.1 Core Definitions

```lean
structure Point := (x y z : ℝ)
structure Crease := (normal : Point) (offset : ℝ)

inductive FoldAxiom
| A1 (p q : Point)
| A6 (p q : Point) (l : Crease)
```

### 9.2 Fold Operator

```lean
def fold : FoldAxiom → Geometry → Geometry
```

### 9.3 Required Theorems

The following **MUST be proven**:

```lean
theorem fold_idempotent :
  ∀ g f, flat_foldable f g → fold f (fold f g) = fold f g

theorem fano_projection_sound :
  ∀ g, ∃! fano, project g = fano
```

---

## 10. Coq Formalization (Complementary)

Coq **SHOULD** be used for:

- Constructive fold generation
- Gröbner-based decision procedures
- Code extraction for runtime folding

Existing work (Kaliszyk & Ida, 2011) **MAY** be adapted.

Lean remains the **primary proof of record**.

---

## 11. Renderer Contract

The renderer:

- MUST NOT invent geometry
- MUST consume only emitted fold/shape events
- MUST be able to verify:
  - Kawasaki conditions
  - Idempotence
  - Canonical IDs

Rendering is a **proof visualization**, not a simulation.

---

## 12. Why This Matters (Conceptual Closure)

What this achieves:

- **Origami replaces arbitrary projection**
- **Sacred geometry becomes certified geometry**
- **Visuals become theorems with pictures**
- **ESP32-class devices can prove geometry by folding**

You are no longer “simulating physics” —  
you are **executing axioms that happen to look like geometry**.

---

## 13. Summary Statement (Use This)

> *CanvasL treats origami folding as a certified geometric computation system.  
Folds are axiomatic operators, shadows are idempotent projections, and rendered forms are proof witnesses.  
Sacred geometry is not symbolic — it is the minimal visualization of algebraic truth.*

If you want, next I can:

- Give a **Lean file skeleton** you can drop into your repo
- Map **fold axioms directly to ISA opcodes**
- Show how **Axiom 6 (cubic fold)** corresponds to your polynomial GCD/LCM logic
- Or formalize **Fibonacci / φ folds** rigorously without mysticism

Just say which layer you want to lock next.

---

## You

Show how Axiom 6 (cubic fold) corresponds to your polynomial GCD/LCM logic and formalize Fibonacci / φ folds rigorously without mysticism

---

## ChatGPT

## Axiom 6 (cubic fold) ⇄ polynomial GCD/LCM (meet/join)

### 1) What Axiom 6 *is* (operationally)
Huzita–Hatori **A6**: *Fold that maps point* **p₁** *onto line* **ℓ₁** *and point* **p₂** *onto line* **ℓ₂** *simultaneously*.

Geometrically, “the crease” is a line (in 2D paper coords) whose reflection constraints must satisfy **two point-to-line incidences at once**. When you write those constraints in coordinates and eliminate crease parameters, the remaining condition on the crease (or on the contact points) is generically a **cubic equation**. That’s the famous “origami solves cubics” fact—no mysticism, just algebraic elimination.

### 2) CanvasL’s view: folds are **constraint polynomials**
In your CanvasL/CLBC story, the stable thing to transport and compare across platforms is not the floating crease line, but the **constraint ideal** it induces.

So we treat each fold request as producing a polynomial constraint:

- `C_A6(...) ∈ R[u]` where `u` is the fold’s unknown(s) (e.g., crease slope/intercept, or a parameterization variable).
- For A6, `deg(C_A6) = 3` in the generic case.

**Key move:** A fold is “valid” iff the constraint polynomial has a solution in the target ring/field (or equivalently, factors in a way that admits a root).

### 3) Why GCD = meet and LCM = join matches A6
You already use:

- `meet(a,b) = gcd(a,b)`  (intersection of constraints / common information)
- `join(a,b) = lcm(a,b)`  (union of constraints / combined requirements)

Interpretation as *sets of solutions* (over any field where the polynomials live):

- For polynomials `f,g`:
  - `gcd(f,g)` captures **shared factors**, i.e., constraints that both parties agree on.
  - `lcm(f,g)` captures **all factors from both**, i.e., enforce both (up to multiplicity).

Now map A6:

- A6 is *two constraints at once* (p₁→ℓ₁ and p₂→ℓ₂).
- Model each sub-constraint as a polynomial:
  - `C1(u)=0`  (crease reflects p₁ to ℓ₁)
  - `C2(u)=0`  (crease reflects p₂ to ℓ₂)
- The combined “A6 fold constraint” is their **joint satisfaction**.
  - In algebraic terms: solve **both** `C1=0` and `C2=0`.
  - In “constraint polynomial packaging” terms: carry both constraints in canonical form.

Two equivalent canonical packages you can use:

**(A) Ideal-as-product (simple, works well with your CLBC encoding)**
- Combine as `C_A6(u) := lcm(C1, C2)` (or just `C1*C2` if you don’t care about duplicate factors yet).
- “Valid fold” means `C_A6` has an admissible root.
- When two nodes propose folds, their **agreement** is:
  - `meet = gcd(C_A6_node1, C_A6_node2)` (shared factor(s) = shared crease family / shared root condition)
- Their **merged obligation** is:
  - `join = lcm(...)` (carry both)

**(B) Root-set intersection via gcd with a field polynomial (most “decision-procedure” flavored)**
Over a finite field `𝔽_q`, roots can be detected using:
- `X^(q^n) - X` has exactly all elements of `𝔽_{q^n}` as roots.
So to find which roots of `C_A6` lie in your chosen field extension, compute:
- `gcd(C_A6, X^(q^n) - X)`
This is literally “which fold solutions exist in my execution universe”.

That gives you a clean, testable rule for embedded determinism:
- **A6 introduces a cubic constraint polynomial**
- **Consensus is gcd/lcm over those constraint polynomials**
- **Executability is gcd against the field’s root-catcher polynomial** (optional but very rigorous)

### 4) What you can say crisply
- **A6 = “introduce cubic constraint”**
- **Meet = shared fold family (common factor)**
- **Join = combined fold obligations (lcm)**
- **Idempotence** falls out because `gcd(p,p)=p` and `lcm(p,p)=p` after normalization—your “fold twice = fold once” story aligns perfectly once folds are constraint objects.

---

## Fibonacci / φ folds, rigorously (no mysticism, no floats required)

### 1) Definitions (mathematical, minimal)
- Fibonacci numbers:  
  `F₀=0, F₁=1, F_{n+2}=F_{n+1}+F_n`
- Golden ratio:  
  `φ = (1 + √5)/2`

**Fact 1 (exact):** `φ` is the positive root of the quadratic:
- `x² = x + 1`

**Fact 2 (limit):**  
- `lim_{n→∞} F_{n+1}/F_n = φ`

**Error bound (useful in proofs + engineering):**
- `|F_{n+1}/F_n − φ| < 1 / F_n²` for `n ≥ 2`  
This is standard from continued fractions (φ has continued fraction `[1;1,1,1,…]`).

### 2) “φ folds” as rational approximations (integer-only)
To define a fold angle or spacing pattern using φ *without* floating point:

Use convergents:
- `φ ≈ F_{n+1}/F_n`

So represent “a φ fold parameter” as the integer pair `(F_{n+1}, F_n)`.

That’s perfect for your ISA because it’s:
- deterministic
- portable
- canonical (given n)

### 3) Turning that into fold geometry (crease angles) without trig dependence
If you want a “rotation step” that uses φ (e.g., phyllotaxis-like placement), define a rational “turn fraction”:

A classic choice is the **golden angle fraction**:
- `α = 1/φ² = 2 − φ`  (exact identity)

Approximate `α` using Fibonacci too:

Since `φ ≈ F_{n+1}/F_n`, then
- `1/φ ≈ F_n / F_{n+1}`
- `1/φ² ≈ (F_n / F_{n+1})²` (still rational)

But you can do even cleaner with convergents:
- `α ≈ F_{n-1} / F_{n+1}` (a common, very stable rational proxy)

So define your fold “turn” as a rational:
- `turn := (num, den) = (F_{n-1}, F_{n+1})`

Then every step rotates by:
- `θ_k = 2π * (k * num mod den) / den`

**Implementation note:** you don’t need π in the VM. You can keep angles as modular rationals `(k*num mod den)/den` and let the renderer map that to coordinates in whatever numeric mode it wants (float, fixed, high-precision)—the *state* stays integer-canonical.

### 4) How this plugs into CanvasL fold semantics
Introduce a new deterministic fold “parameter source”:

- `PhiParam(n)` yields `(F_{n+1}, F_n)` and optionally `(F_{n-1}, F_{n+1})` for turn.
- This parameter can seed:
  - crease spacing ratios
  - star polygon selection
  - canonical ordering of rays/lines in your Fano/Merkaba visualizer
  - L-system–like growth with provable bounded error

### 5) Lean-level formalization sketch (what you’d actually prove)
You’d prove three things:

1) Fibonacci recurrence correctness (already in most libs / easy to define)
2) φ as the limit of ratios (standard theorem)
3) your “turn fraction” is a convergent with an explicit error bound

Pseudo-structure:

```lean
def fib : Nat → Nat
| 0 => 0
| 1 => 1
| (n+2) => fib (n+1) + fib n

def phi : Real := (1 + Real.sqrt 5) / 2

theorem phi_sq : phi^2 = phi + 1 := by
  -- algebra + sqrt properties

theorem fib_ratio_tends_to_phi :
  Tendsto (fun n => (fib (n+1) : Real) / fib n) atTop (𝓝 phi) := by
  -- standard result via continued fractions or Binet

theorem convergent_error_bound :
  ∀ n ≥ 2, | (fib (n+1):Real)/(fib n) - phi | < 1 / (fib n)^2 := by
  -- continued fraction bound for φ
```

Then define the *VM-visible* parameter object:

```lean
structure PhiParam where
  n : Nat
  num : Nat := fib (n-1)
  den : Nat := fib (n+1)
```

and prove determinism/canonicality:

- same `n` → same `(num,den)`
- reduction rules preserve equality

---

## The clean conceptual punchline
- **A6 corresponds to introducing a cubic constraint polynomial** (degree-3 eliminant).
- **Your GCD/LCM lattice is exactly the right algebraic backbone** for “fold consensus”:
  - gcd = shared fold constraint
  - lcm = merged fold obligation
- **Fibonacci/φ folds are rigorously just continued-fraction approximations**:
  - encode them as integer pairs `(F_{n+1},F_n)` and derived rational turns
  - no floats required in the VM
  - provable error bounds in Lean

If you want next, I can:
- add **two ISA opcodes**: `A6_CUBIC_EMIT` and `PHI_PARAM` (with exact operand formats),
- and show how the A6 “cubic constraint” is encoded into your CLBC-POLY canonical bytes so it participates in gcd/lcm consensus *exactly like everything else*.

---

## You

a Lean file skeleton you can drop into your repo and Map fold axioms directly to ISA opcodes

---

## ChatGPT

Below is a **drop-in Lean skeleton** plus a **direct mapping from Fold Axioms → ISA opcodes** (with operands) that matches your “folds emit constraint polynomials; VM merges with gcd/lcm” architecture.

---
