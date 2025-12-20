# 6) Binary encoding (bit layout)

You asked for “full instruction binary encoding (bit layout) matching CLBC-POLY codec”. Here’s the **exact** rule for all render opcodes:

## 6.1 Instruction header (always)
```
byte0: OPCODE (u8)
```

## 6.2 Operand encoding rules
- u8: 1 byte
- u16: 2 bytes, **big-endian**
- No varints, no floats
- Any “immediate IDs” are u8 unless stated

### Example encodings

#### Emit p0 default style
```
70 00 00
^  ^  ^
|  |  +-- styleId=0
|  +----- pointId=0
+-------- DRAW_FANO_POINT
```

#### Emit L2 style 1
```
71 02 01
```

#### Emit circle-line style 0
```
72 00
```

#### Begin frame, emit meta hash + points + lines
```
7E 0B
```
(0b00001011 = meta + points + lines)

---
