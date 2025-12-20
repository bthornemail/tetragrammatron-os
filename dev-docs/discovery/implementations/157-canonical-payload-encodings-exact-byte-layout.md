# 15.7 Canonical payload encodings (exact byte layout)

All payloads are sequences of **16-bit words**. Within each word, bytes are big-endian in canonical form.

## 15.7.1 SVG_LINESET (kind 0x10, channel GEOM_2D)
Payload words:

```
u16  op = 0x0001           ; LINESET opcode inside payload
u16  n  (number of lines)
repeat n:
  i32 x1 (2 words)
  i32 y1 (2 words)
  i32 x2 (2 words)
  i32 y2 (2 words)
```

## 15.7.2 OBJ_MESH (kind 0x20, channel GEOM_3D)
Payload words:

```
u16 op = 0x0020            ; OBJ_MESH opcode inside payload
u16 nv
repeat nv:
  i32 x, i32 y, i32 z
u16 nf
repeat nf:
  u16 a, u16 b, u16 c      ; triangle indices (1-based)
u16 mat_id (0 if none)
```

## 15.7.3 NOTE_EVENT (kind 0x41, channel AUDIO)
Payload words:

```
u16 op = 0x0041
u16 freq_q8_8      ; frequency in Hz as Q8.8 (deterministic)
u16 amp_q0_16      ; amplitude 0..65535
u16 dur_ms         ; duration milliseconds
u16 shape          ; 0=sine,1=square,2=tri,3=noise, etc (deterministic synth)
```

This gives you “harmonics/frequencies” **without floats**.

---
