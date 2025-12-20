# 4) Binary encoding layout (CLBC-POLY compatible container)

You asked that instruction encoding “match CLBC-POLY codec”. The clean way:

### 4.1 CAN container = CLBC-style framing + instruction stream

```
CANBC v1 container (big-endian fields)

0..3   magic      = "CANB"
4      version    = 0x01
5      flags      = bitfield
6      ring_id    = 0x01  (F2[x])
7      hdr_len    = 0x10  (16 bytes header)

8..11  code_len   = u32   (# bytes of instruction stream)
12..15 poly_len   = u32   (# bytes of CLBC-POLY blobs section)

[code section: code_len bytes]
[poly section: poly_len bytes, concatenated CLBC-POLY v1 records]
```

Then instructions refer to polynomial blobs by **index** (or offset) deterministically.

---

# 5) Instruction bit layout (16-bit fixed words + optional immediates)

### 5.1 16-bit instruction word

```
15..12  OPC (4 bits)   # 16 core opcodes
11..9   DST (3 bits)   # destination 8-tuple register
8..6    A   (3 bits)   # source A register
5..3    B   (3 bits)   # source B register
2..0    M   (3 bits)   # mode / sub-op / predicate selector
```

This supports:
- **register → register** ops
- **mode** for variants (e.g., MEET vs MEET_INTO, PROJ variants)
- deterministic decode everywhere

### 5.2 Core opcode assignment (example, stable)

| OPC | Mnemonic | Meaning |
|---:|---|---|
| 0x0 | `NOP` | no-op |
| 0x1 | `POLY_LOAD` | load poly blob into DST (uses following u16 blob index) |
| 0x2 | `CANON` | DST := canon(A) |
| 0x3 | `MEET` | DST := gcd(A,B) |
| 0x4 | `JOIN` | DST := lcm(A,B) |
| 0x5 | `FANO_S` | barrier check triad (A,B,DST or using M to select) |
| 0x6 | `PROJ_FANO` | DST := fano_projection(A) |
| 0x7 | `ASSERT_EQ` | assert A == B (canonical bytes) |
| 0x8 | `COMMIT` | emit hash / finalize state |
| 0x9..0xF | reserved | later ladder (0D–19D) |

### 5.3 Immediate format for `POLY_LOAD`

After `POLY_LOAD`, read one extra word:

```
u16 POLY_INDEX   # index into poly section records
```

This makes the container CLBC-POLY compatible: polynomials remain identical byte blobs, and code only references them.

---

# 6) “Codebase lattice” edges = build graph

You wanted the edge direction “related to branch structure” **and** folders mapped to CAN-ISA. Here is the **directed build lattice**:

## 6.1 Edges (normative)

- `layers/*/*.canvasl  →  programs/*.can.jsonl`  
  (register snapshots become fold programs)
- `programs/*.can.jsonl → artifacts/*.canbc`  
  (assembler)
- `artifacts/*.canbc → src/vm/*`  
  (execution)
- `src/vm/* → src/render/* → obsidian/*.canvas`  
  (visualization emission)

So the repo is literally: **inputs → opcodes → execution → render**.
