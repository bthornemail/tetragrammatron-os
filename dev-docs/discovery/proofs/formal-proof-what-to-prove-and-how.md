# Formal Proof: What to Prove and How

You asked for “full proof with compiler sketch”. Here’s the **provable core** that you can actually mechanize:

## Theorem A (Normalization idempotence)
`canon(canon(x)) = canon(x)`

## Theorem B (Meet/join commutativity + associativity)
- `meet(a,b)=meet(b,a)`
- `join(a,b)=join(b,a)`
- associativity holds

## Theorem C (Projection idempotence)
`proj_fano(proj_fano(x)) = proj_fano(x)`

## Theorem D (Deterministic compilation)
`compile(yaml)` is a function (no nondeterminism): same input → same output bytes.

## Theorem E (VM equivalence with IR)
Executing bytecode is equivalent to interpreting JSONL IR.

---
