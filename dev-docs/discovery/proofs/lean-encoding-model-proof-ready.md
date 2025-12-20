# Lean encoding model (proof-ready)

This matches the binary layout **exactly**.

```lean
/-- 32-bit instruction word -/
structure InstrWord where
  opcode : UInt8
  dst    : UInt8
  srcA   : UInt8
  srcB   : UInt8
  deriving Repr, BEq

/-- Serialize instruction to 4 bytes (big-endian) -/
def InstrWord.encode (i : InstrWord) : Array UInt8 :=
  #[ i.opcode, i.dst, i.srcA, i.srcB ]

/-- Decode exactly 4 bytes into instruction -/
def InstrWord.decode (bs : Array UInt8) : Option InstrWord :=
  if bs.size = 4 then
    some {
      opcode := bs[0]!
      dst    := bs[1]!
      srcA   := bs[2]!
      srcB   := bs[3]!
    }
  else none

/-- Canonical encoding theorem -/
theorem instr_encode_decode_id (i : InstrWord) :
  InstrWord.decode (InstrWord.encode i) = some i := by
  rfl
```

---
