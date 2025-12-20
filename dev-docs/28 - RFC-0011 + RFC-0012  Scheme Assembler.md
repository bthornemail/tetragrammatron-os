**Bundle C (vertical slice)**: **RFC-0011 + RFC-0012**, plus a **Scheme assembler** that enforces the RFC mechanically, and a **C VM loop skeleton** (ESP32/Pico-friendly) that decodes/executes the minimal instruction set.

Below are **drop-in files** (copy into your repo). I’m assuming your canonical polynomial blobs use your **CLBC-POLY v1** framing (the `CLBC` + kind/version/ring/flags + degree/nwords + words layout you already sketched).

---

## 0) Repo layout for the vertical slice

```
/rfc/
  RFC-0011.md
  RFC-0012.md

/tools/
  can-asm.scm          ; Scheme assembler (CANB v1.0, fixed 16-byte inst)
  can-dis.scm          ; optional: disassembler (stub)
  can-pack.scm         ; byte packing helpers

/vm/
  can_vm.h
  can_vm.c             ; minimal Fold VM loop + object pool hooks
  can_codec.h
  can_codec.c          ; CANB encoding/decoding helpers (big-endian)

/examples/
  fold_min.canasm      ; sample assembly program (CANON+MEET+JOIN+PROJ_FANO+COMMIT+EMIT_GEOM)
```

---

# 1) `rfc/RFC-0011.md`

```markdown
# RFC-0011 — Repository Kernel Lattice and Fano-Safe Propagation

Status: Proposed (Normative Core)

## 1. Purpose

This RFC specifies a repository-as-lattice kernel that makes development flow a deterministic algebra:

- Work occurs along eight semantic axes ("registers").
- Propagation follows a monotone pipeline: feature/<axis> → current → main.
- Merges are accepted iff they preserve Fano-triad consistency.
- Canonical artifacts are byte-stable and compile to VM bytecode.

## 2. Terminology

### 2.1 Branch roles
- main: canonical fixed point; MUST be stable.
- current: integration manifold; MAY change.
- feature/<axis>: axis work branches; MAY change.

### 2.2 Eight semantic axes (keyboard-safe)
The kernel MUST use exactly these eight axes:

1. state
2. symbol
3. boundary
4. relation
5. transition
6. source
7. terminal
8. rejection

These names MUST be used for folder and branch naming.

### 2.3 Register semantics
Each axis corresponds to a register-like state file. Register updates MUST be performed via propagation events and MUST normalize to canonical JSON.

### 2.4 Fano-triad consistency
A merge is valid iff the induced triad set is valid under the repository’s configured Fano incidence constraint set.

RFC-0011 does not mandate a specific triad encoding; it mandates the invariant:
- The triad witness attached to a merge MUST validate under fano_valid(…).

## 3. Kernel Layout (Required)

Repo root MUST contain:

- repo.canvasl  (YAML front matter + kernel declaration)
- kernel/       (schemas, normalizers, triad constraint definitions)
- axes/<axis>/  (one per axis)
- ir/           (canonical JSON + JSONL traces)
- bytecode/     (CANB bytecode)

Each axis MUST include:
- axes/<axis>/register.canvasl
- axes/<axis>/layers/

## 4. Minimal lattice: 8^3

The repo MUST predeclare a minimal lattice of 8^3 nodes (512) addressed by:
axis / subaxis / cell

Each node is a .canvasl file treated as a register:
- MAY be updated only through propagation events
- MUST normalize to canonical JSON
- MUST validate under Fano-triad merge rules

## 5. Propagation and merge rules (Normative)

### 5.1 Allowed propagation
- feature/<axis> MUST merge into current (never directly into main).
- current MUST merge into main only if merge validation passes.

### 5.2 Monotonicity
Propagation functions MUST be monotone with respect to the repo’s partial order ⊑.

### 5.3 Merge acceptance
A merge MUST be accepted iff all hold:
1) Canonicalization succeeds on both sides.
2) Compilation to JSONL + bytecode is deterministic (byte-identical given identical canonical input).
3) Fano consistency validates for the merge’s triad witness.
4) Idempotence checks pass for declared idempotent transforms.

## 6. Required repo.canvasl front matter keys
repo.canvasl MUST include:
- canvasl.spec = RFC-0011
- kernel.axes = [state, symbol, boundary, relation, transition, source, terminal, rejection]
- constraints.fano.triads = enforced
- constraints.determinism.byte_stable = true
```

---

# 2) `rfc/RFC-0012.md` (CANB v1 Fold VM, binary encoding)

```markdown
# RFC-0012 — Origami Fold VM Semantics and CANB v1 Encoding

Status: Proposed (Normative VM + Compiler Contract)

## 1. Purpose

Defines:
- Fold VM semantics: CANON, MEET(GCD), JOIN(LCM), PROJ_FANO, ASSERT_IDEMP, COMMIT, EMIT_GEOM
- Fixed-width 16-byte instruction encoding (CANB v1)
- Object pool referencing compatible with CLBC-POLY canonical blobs
- Determinism and proof-carrying hooks

## 2. Data model

VM operates on tagged objects:
- POLY: canonical F₂[x] polynomial encoded with CLBC-POLY v1
- TRIADS: compact triad witness
- HASH: commit digest bytes
- GEOM: renderer events (SVG/OBJ/GLB events), deterministic

## 3. Instruction set (minimal vertical slice)

Opcodes:
- 0x10 CANON        normalize object
- 0x20 MEET         gcd/meet
- 0x21 JOIN         lcm/join
- 0x30 PROJ_FANO    project + validate triads
- 0x31 ASSERT_IDEMP assert idempotence for a selected op
- 0x40 COMMIT       commit hash + witness
- 0x50 EMIT_GEOM    emit renderer events

## 4. CANB v1 instruction encoding (16 bytes, fixed width)

All integers are big-endian.

Offset Size Field
0      4    MAGIC  = "CANB" (0x43 0x41 0x4E 0x42)
4      1    VER    = 0x01
5      1    OPCODE
6      1    FLAGS
7      1    RDST
8      1    RA
9      1    RB
10     2    IMM16
12     4    REF32

FLAGS bit layout:
- bit0 CANON_IN
- bit1 CANON_OUT
- bit2 PROOF_REQUIRED
- bit3 EMIT
- bit4..7 reserved (MUST be 0)

Registers are 0..255.
REF32 indexes the object pool or stream offset per container format.

## 5. Semantics (Normative)

### 5.1 CANON (0x10)
Rdst := canon(Ra)
If FLAGS.CANON_IN is set, input MUST already be canonical.
If FLAGS.CANON_OUT is set, output MUST be canonical (VM MUST enforce).

### 5.2 MEET (0x20)
Rdst := gcd(Ra, Rb)
Inputs MUST be POLY (canonical if PROOF_REQUIRED).
Output MUST be canonical POLY.

### 5.3 JOIN (0x21)
Rdst := lcm(Ra, Rb)
Same requirements as MEET.

### 5.4 PROJ_FANO (0x30)
Rdst := proj_fano(Ra)
proj_fano produces (poly', triads) and MUST enforce fano_valid(triads) if PROOF_REQUIRED.

### 5.5 ASSERT_IDEMP (0x31)
Asserts op(op(x)) = op(x) on the current register x=Ra.
IMM16 selects op:
- 0x0010 CANON
- 0x0030 PROJ_FANO
- 0x0020 MEET (uses RB)
- 0x0021 JOIN (uses RB)

If assertion fails, VM MUST halt with error.

### 5.6 COMMIT (0x40)
Computes and stores a commit hash for Ra and attaches triad witness if present.
If PROOF_REQUIRED, commit MUST include witness and the witness MUST validate.

### 5.7 EMIT_GEOM (0x50)
Emits deterministic renderer events derived from Ra:
- Either direct Fano projection rendering
- Or canonical geometry events from POLY/triads

## 6. Object pool and CLBC-POLY compatibility

When REF32 references a POLY blob, the blob MUST be encoded using CLBC-POLY v1 canonical encoding.
VM MUST reject non-canonical blobs when PROOF_REQUIRED is set.

## 7. Compiler contract

Pipeline:
repo.canvasl (YAML) → canonical JSON → JSONL IR → CANB bytecode (+ embedded canonical POLY blobs)

Determinism:
Given identical canonical JSON input, the compiler MUST produce byte-identical JSONL and CANB.
```

---

# 3) Scheme Assembler — `tools/can-pack.scm`

```scheme
;; tools/can-pack.scm
;; Pure byte packing helpers (big-endian)

(define (u8 n) (bitwise-and n #xff))

(define (u16be n)
  (list (u8 (arithmetic-shift n -8))
        (u8 n)))

(define (u32be n)
  (list (u8 (arithmetic-shift n -24))
        (u8 (arithmetic-shift n -16))
        (u8 (arithmetic-shift n -8))
        (u8 n)))

(define (ascii-bytes s)
  (map char->integer (string->list s)))

(define (append* xs) (apply append xs))

(define (write-bytes-to-port bs port)
  (for-each (lambda (b) (write-u8 b port)) bs))

(define (write-u8 b port)
  (write-byte (u8 b) port))
```

---

# 4) Scheme Assembler — `tools/can-asm.scm` (enforces RFC-0012)

This assembler produces **CANB v1 fixed 16-byte instructions**. It enforces:
- valid opcodes
- valid register indices
- imm16 bounds
- flags bounds + reserved bits = 0
- emits exact 16-byte layout per instruction

```scheme
;; tools/can-asm.scm
;; Usage: (can-assemble-file "examples/fold_min.canasm" "bytecode/fold_min.canb")
;;
;; Assembly format (S-expressions, one per line):
;; (inst OPCODE FLAGS RDST RA RB IMM16 REF32)
;; Example:
;; (inst CANON  (flags canon_out proof)  1 0 0 0  0)
;;
;; Notes:
;; - OPCODE is a symbol: CANON MEET JOIN PROJ_FANO ASSERT_IDEMP COMMIT EMIT_GEOM
;; - FLAGS is (flags <flag> ...)
;; - RDST/RA/RB are 0..255
;; - IMM16 is 0..65535
;; - REF32 is 0..2^32-1

(load "tools/can-pack.scm")

(define (die msg . args)
  (display "can-asm error: ") (apply printf msg args) (newline)
  (error "can-asm"))

(define opcode->byte
  `((CANON . #x10)
    (MEET . #x20)
    (JOIN . #x21)
    (PROJ_FANO . #x30)
    (ASSERT_IDEMP . #x31)
    (COMMIT . #x40)
    (EMIT_GEOM . #x50)))

(define flag->bit
  `((canon_in . 0)
    (canon_out . 1)
    (proof . 2)
    (emit . 3)))

(define (lookup alist k)
  (let ((p (assoc k alist)))
    (and p (cdr p))))

(define (reg? n) (and (integer? n) (<= 0 n) (<= n 255)))
(define (imm16? n) (and (integer? n) (<= 0 n) (<= n 65535)))
(define (ref32? n) (and (integer? n) (<= 0 n) (<= n 4294967295)))

(define (flags->byte form)
  (cond
    ((and (pair? form) (eq? (car form) 'flags))
     (let* ((flags (cdr form))
            (bits (map (lambda (f)
                         (let ((b (lookup flag->bit f)))
                           (if b b (die "unknown flag ~a" f))))
                       flags))
            (mask (foldl (lambda (b acc) (bitwise-ior acc (arithmetic-shift 1 b))) 0 bits)))
       ;; reserved bits must be 0
       (when (not (= (bitwise-and mask #xF0) 0))
         (die "reserved flag bits set: ~x" mask))
       mask))
    (else (die "FLAGS must be (flags ...), got ~s" form))))

(define (encode-inst opcode-sym flags-form rdst ra rb imm16 ref32)
  (let ((opb (lookup opcode->byte opcode-sym)))
    (unless opb (die "unknown opcode ~a" opcode-sym))
    (unless (reg? rdst) (die "bad RDST ~s" rdst))
    (unless (reg? ra) (die "bad RA ~s" ra))
    (unless (reg? rb) (die "bad RB ~s" rb))
    (unless (imm16? imm16) (die "bad IMM16 ~s" imm16))
    (unless (ref32? ref32) (die "bad REF32 ~s" ref32))
    (let ((flagsb (flags->byte flags-form)))
      (append
        (ascii-bytes "CANB")
        (list #x01)           ;; VER
        (list opb)
        (list flagsb)
        (list (u8 rdst))
        (list (u8 ra))
        (list (u8 rb))
        (u16be imm16)
        (u32be ref32)))))

(define (read-all-sexps port)
  (let loop ((acc '()))
    (let ((x (read port)))
      (if (eof-object? x) (reverse acc)
          (loop (cons x acc))))))

(define (assemble-forms forms)
  (append*
    (map (lambda (f)
           (match f
             (('inst op flags rdst ra rb imm16 ref32)
              (encode-inst op flags rdst ra rb imm16 ref32))
             (else
              (die "expected (inst ...), got ~s" f))))
         forms)))

(define (can-assemble-file in-path out-path)
  (call-with-input-file in-path
    (lambda (in)
      (let* ((forms (read-all-sexps in))
             (bytes (assemble-forms forms)))
        (call-with-output-file out-path
          (lambda (out) (write-bytes-to-port bytes out))
          #:exists 'replace)
        (printf "Wrote ~a bytes to ~a
" (length bytes) out-path)))))

;; If run as script: arguments: input output
(define (main argv)
  (when (< (length argv) 3)
    (display "usage: can-asm.scm <input.canasm> <output.canb>
")
    (exit 2))
  (can-assemble-file (list-ref argv 1) (list-ref argv 2)))

;; Racket/Guile compatibility: comment/uncomment as needed
;; (main (command-line))
```

> If you’re using **Guile**, replace `match` usage with a small pattern matcher or use `(ice-9 match)`.

---

# 5) Example Assembly Program — `examples/fold_min.canasm`

This is the minimal “vertical slice” you asked for:  
**CANON + MEET + JOIN + PROJ_FANO + ASSERT_IDEMP + COMMIT + EMIT_GEOM**

```scheme
;; examples/fold_min.canasm
;;
;; Register conventions in this example:
;; R0 = input poly (loaded by VM via object pool at REF32)
;; R1 = canon(R0)
;; R2 = meet(R1,R1)   (trivial gcd)
;; R3 = join(R1,R1)   (trivial lcm)
;; R4 = proj_fano(R1)
;;
;; REF32 used here:
;; - first instruction uses REF32=1 meaning "load poly object #1 into R0" (VM-specific)
;;
;; NOTE: loader semantics are VM-implementation specific; we keep it simple:
;; Use CANON with REF32 to indicate "Ra refers to object pool index".

(inst CANON (flags canon_out proof)  1 0 0 0     1)     ;; R1 := canon(R0)   (R0 preloaded from object 1)
(inst MEET  (flags canon_out proof)  2 1 1 0     0)     ;; R2 := gcd(R1,R1)
(inst JOIN  (flags canon_out proof)  3 1 1 0     0)     ;; R3 := lcm(R1,R1)

(inst PROJ_FANO (flags proof)        4 1 0 0     0)     ;; R4 := proj_fano(R1)

(inst ASSERT_IDEMP (flags proof)     0 1 0 #x0030 0)    ;; assert proj_fano(proj_fano(x))=proj_fano(x) on x=R1

(inst COMMIT (flags proof)           0 4 0 0     0)     ;; commit projected state (R4)
(inst EMIT_GEOM (flags emit)         0 4 0 0     0)     ;; emit geometry events from R4
```

---

# 6) VM C Skeleton — `vm/can_vm.h`

```c
// vm/can_vm.h
#pragma once
#include <stdint.h>
#include <stddef.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

// --- CANB v1 constants ---
#define CANB_MAGIC0 0x43u
#define CANB_MAGIC1 0x41u
#define CANB_MAGIC2 0x4Eu
#define CANB_MAGIC3 0x42u

#define CANB_VER_V1 0x01u

// Opcodes (RFC-0012)
#define OP_CANON       0x10u
#define OP_MEET        0x20u
#define OP_JOIN        0x21u
#define OP_PROJ_FANO   0x30u
#define OP_ASSERT_IDEMP 0x31u
#define OP_COMMIT      0x40u
#define OP_EMIT_GEOM   0x50u

// Flags
#define FL_CANON_IN      (1u<<0)
#define FL_CANON_OUT     (1u<<1)
#define FL_PROOF_REQ     (1u<<2)
#define FL_EMIT          (1u<<3)

// Tag types for registers
typedef enum {
  TAG_EMPTY = 0,
  TAG_POLY  = 1,
  TAG_FANO  = 2,   // projected poly + triads
  TAG_HASH  = 3,
  TAG_GEOM  = 4
} can_tag_t;

// Forward declarations for canonical objects
typedef struct f2poly f2poly_t;

// Minimal Fano projection container
typedef struct {
  f2poly_t* poly;        // canonical poly
  uint8_t* triads;       // witness bytes
  uint32_t triads_len;
} fano_obj_t;

// Register cell
typedef struct {
  can_tag_t tag;
  union {
    f2poly_t* poly;
    fano_obj_t fano;
    struct { uint8_t bytes[32]; } hash;
    struct { uint32_t dummy; } geom;
  } as;
} can_reg_t;

// VM state
typedef struct {
  can_reg_t regs[256];

  // object pool (VM-specific): map REF32 -> canonical poly bytes / parsed poly
  const uint8_t* obj_pool;
  uint32_t obj_pool_len;

  // output hooks
  void (*emit_geom)(const uint8_t* evt, uint32_t len, void* user);
  void* emit_user;

  // error reporting
  int last_error;
} can_vm_t;

// Instruction decoded view (CANB v1)
typedef struct {
  uint8_t ver;
  uint8_t opcode;
  uint8_t flags;
  uint8_t rdst;
  uint8_t ra;
  uint8_t rb;
  uint16_t imm16;
  uint32_t ref32;
} can_inst_t;

// API
void can_vm_init(can_vm_t* vm);
int  can_vm_exec_stream(can_vm_t* vm, const uint8_t* code, uint32_t code_len);

// Implementations you provide (poly + codec + projection)
int can_load_poly_from_ref(can_vm_t* vm, uint32_t ref, f2poly_t** out_poly);   // MUST return canonical poly
int can_poly_canon(const f2poly_t* in, f2poly_t** out);
int can_poly_gcd(const f2poly_t* a, const f2poly_t* b, f2poly_t** out);
int can_poly_lcm(const f2poly_t* a, const f2poly_t* b, f2poly_t** out);
int can_proj_fano(const f2poly_t* in, fano_obj_t* out);                        // MUST fill triads
bool can_fano_valid(const uint8_t* triads, uint32_t len);
int can_commit_hash(const can_reg_t* obj, uint8_t out32[32]);

#ifdef __cplusplus
}
#endif
```

---

# 7) VM C Skeleton — `vm/can_codec.h` and `vm/can_codec.c`

```c
// vm/can_codec.h
#pragma once
#include <stdint.h>
#include <stdbool.h>
#include "can_vm.h"

static inline uint16_t read_u16be(const uint8_t* p) {
  return (uint16_t)((p[0] << 8) | p[1]);
}

static inline uint32_t read_u32be(const uint8_t* p) {
  return ((uint32_t)p[0] << 24) | ((uint32_t)p[1] << 16) | ((uint32_t)p[2] << 8) | (uint32_t)p[3];
}

bool can_decode_inst(const uint8_t* p, uint32_t remaining, can_inst_t* out);
```

```c
// vm/can_codec.c
#include "can_codec.h"

bool can_decode_inst(const uint8_t* p, uint32_t remaining, can_inst_t* out) {
  if (remaining < 16) return false;

  if (p[0]!=CANB_MAGIC0 || p[1]!=CANB_MAGIC1 || p[2]!=CANB_MAGIC2 || p[3]!=CANB_MAGIC3) return false;
  out->ver = p[4];
  if (out->ver != CANB_VER_V1) return false;

  out->opcode = p[5];
  out->flags  = p[6];
  // reserved bits must be 0
  if ((out->flags & 0xF0u) != 0) return false;

  out->rdst = p[7];
  out->ra   = p[8];
  out->rb   = p[9];
  out->imm16 = read_u16be(p + 10);
  out->ref32 = read_u32be(p + 12);
  return true;
}
```

---

# 8) VM Loop — `vm/can_vm.c`

This is the core execution loop. It’s written so you can wire it to:
- your **CLBC-POLY canonical decoder**
- your **poly gcd/lcm**
- your **Fano projection validator**
- your **hash function** (SHA-256)

```c
// vm/can_vm.c
#include "can_vm.h"
#include "can_codec.h"
#include <string.h>

enum {
  ERR_OK = 0,
  ERR_DECODE = 1,
  ERR_BADTAG = 2,
  ERR_PROOF  = 3,
  ERR_OP     = 4,
  ERR_LOAD   = 5,
  ERR_ASSERT = 6,
};

static void reg_clear(can_reg_t* r) {
  r->tag = TAG_EMPTY;
  memset(&r->as, 0, sizeof(r->as));
}

void can_vm_init(can_vm_t* vm) {
  memset(vm, 0, sizeof(*vm));
  for (int i=0;i<256;i++) reg_clear(&vm->regs[i]);
  vm->last_error = ERR_OK;
}

static int ensure_poly(can_vm_t* vm, uint8_t rix, f2poly_t** out) {
  can_reg_t* r = &vm->regs[rix];
  if (r->tag != TAG_POLY || r->as.poly == NULL) return ERR_BADTAG;
  *out = r->as.poly;
  return ERR_OK;
}

static int ensure_fano(can_vm_t* vm, uint8_t rix, fano_obj_t** out) {
  can_reg_t* r = &vm->regs[rix];
  if (r->tag != TAG_FANO) return ERR_BADTAG;
  *out = &r->as.fano;
  return ERR_OK;
}

static int op_canon(can_vm_t* vm, const can_inst_t* in) {
  // If REF32 is nonzero and RA is empty, allow loading into RA or treating RA as preloaded.
  // Minimal convention for demos: if ref32 != 0, load poly from ref32 into RA (if RA empty),
  // then canon into RDST.
  f2poly_t* a = NULL;

  if (in->ref32 != 0) {
    // load into RA register (overwrite allowed in demo mode)
    if (can_load_poly_from_ref(vm, in->ref32, &a) != 0) return ERR_LOAD;
    vm->regs[in->ra].tag = TAG_POLY;
    vm->regs[in->ra].as.poly = a;
  }

  if (ensure_poly(vm, in->ra, &a) != ERR_OK) return ERR_BADTAG;

  f2poly_t* out = NULL;
  if (can_poly_canon(a, &out) != 0) return ERR_OP;

  vm->regs[in->rdst].tag = TAG_POLY;
  vm->regs[in->rdst].as.poly = out;
  return ERR_OK;
}

static int op_meet(can_vm_t* vm, const can_inst_t* in) {
  f2poly_t* a=NULL; f2poly_t* b=NULL;
  if (ensure_poly(vm, in->ra, &a)!=ERR_OK) return ERR_BADTAG;
  if (ensure_poly(vm, in->rb, &b)!=ERR_OK) return ERR_BADTAG;

  f2poly_t* out=NULL;
  if (can_poly_gcd(a,b,&out)!=0) return ERR_OP;

  vm->regs[in->rdst].tag = TAG_POLY;
  vm->regs[in->rdst].as.poly = out;
  return ERR_OK;
}

static int op_join(can_vm_t* vm, const can_inst_t* in) {
  f2poly_t* a=NULL; f2poly_t* b=NULL;
  if (ensure_poly(vm, in->ra, &a)!=ERR_OK) return ERR_BADTAG;
  if (ensure_poly(vm, in->rb, &b)!=ERR_OK) return ERR_BADTAG;

  f2poly_t* out=NULL;
  if (can_poly_lcm(a,b,&out)!=0) return ERR_OP;

  vm->regs[in->rdst].tag = TAG_POLY;
  vm->regs[in->rdst].as.poly = out;
  return ERR_OK;
}

static int op_proj_fano(can_vm_t* vm, const can_inst_t* in) {
  f2poly_t* a=NULL;
  if (ensure_poly(vm, in->ra, &a)!=ERR_OK) return ERR_BADTAG;

  fano_obj_t fo;
  memset(&fo, 0, sizeof(fo));

  if (can_proj_fano(a, &fo) != 0) return ERR_OP;

  if ((in->flags & FL_PROOF_REQ) != 0) {
    if (!can_fano_valid(fo.triads, fo.triads_len)) return ERR_PROOF;
  }

  vm->regs[in->rdst].tag = TAG_FANO;
  vm->regs[in->rdst].as.fano = fo;
  return ERR_OK;
}

static int op_assert_idemp(can_vm_t* vm, const can_inst_t* in) {
  // Asserts op(op(x)) == op(x) for selected op in IMM16.
  // IMM16 codes from RFC-0012:
  // 0x0010 CANON, 0x0030 PROJ_FANO, 0x0020 MEET, 0x0021 JOIN
  const uint16_t sel = in->imm16;

  // We'll compute y=op(x) and z=op(y) and compare canonical bytes via commit_hash placeholder.
  // In a real implementation: compare canonical encodings byte-for-byte.
  uint8_t h_y[32], h_z[32];
  memset(h_y,0,32); memset(h_z,0,32);

  if (sel == 0x0010) {
    // CANON idempotence on Ra
    can_inst_t t = *in;
    t.opcode = OP_CANON;
    t.rdst = 250; t.ra = in->ra; t.rb = 0; t.ref32 = 0;
    if (op_canon(vm, &t)!=ERR_OK) return ERR_ASSERT;
    can_reg_t* ry = &vm->regs[250];
    if (can_commit_hash(ry, h_y)!=0) return ERR_ASSERT;

    t.rdst = 251; t.ra = 250;
    if (op_canon(vm, &t)!=ERR_OK) return ERR_ASSERT;
    can_reg_t* rz = &vm->regs[251];
    if (can_commit_hash(rz, h_z)!=0) return ERR_ASSERT;

  } else if (sel == 0x0030) {
    // PROJ_FANO idempotence on Ra (project twice)
    can_inst_t t = *in;
    t.opcode = OP_PROJ_FANO;
    t.rdst = 250; t.ra = in->ra; t.ref32 = 0;
    if (op_proj_fano(vm, &t)!=ERR_OK) return ERR_ASSERT;
    can_reg_t* ry = &vm->regs[250];
    if (can_commit_hash(ry, h_y)!=0) return ERR_ASSERT;

    // second projection uses the poly inside fano object
    fano_obj_t* fo=NULL;
    if (ensure_fano(vm, 250, &fo)!=ERR_OK) return ERR_ASSERT;
    // overwrite temp poly reg 252 with fo->poly then project again
    vm->regs[252].tag = TAG_POLY;
    vm->regs[252].as.poly = fo->poly;

    t.rdst = 251; t.ra = 252;
    if (op_proj_fano(vm, &t)!=ERR_OK) return ERR_ASSERT;
    can_reg_t* rz = &vm->regs[251];
    if (can_commit_hash(rz, h_z)!=0) return ERR_ASSERT;

  } else if (sel == 0x0020) {
    // MEET idempotence variant: meet(meet(x,b),b)=meet(x,b)
    can_inst_t t = *in;
    t.opcode = OP_MEET;
    t.rdst = 250; t.ra = in->ra; t.rb = in->rb;
    if (op_meet(vm, &t)!=ERR_OK) return ERR_ASSERT;
    if (can_commit_hash(&vm->regs[250], h_y)!=0) return ERR_ASSERT;

    t.rdst = 251; t.ra = 250; t.rb = in->rb;
    if (op_meet(vm, &t)!=ERR_OK) return ERR_ASSERT;
    if (can_commit_hash(&vm->regs[251], h_z)!=0) return ERR_ASSERT;

  } else if (sel == 0x0021) {
    // JOIN idempotence variant: join(join(x,b),b)=join(x,b)
    can_inst_t t = *in;
    t.opcode = OP_JOIN;
    t.rdst = 250; t.ra = in->ra; t.rb = in->rb;
    if (op_join(vm, &t)!=ERR_OK) return ERR_ASSERT;
    if (can_commit_hash(&vm->regs[250], h_y)!=0) return ERR_ASSERT;

    t.rdst = 251; t.ra = 250; t.rb = in->rb;
    if (op_join(vm, &t)!=ERR_OK) return ERR_ASSERT;
    if (can_commit_hash(&vm->regs[251], h_z)!=0) return ERR_ASSERT;

  } else {
    return ERR_ASSERT;
  }

  if (memcmp(h_y, h_z, 32) != 0) return ERR_ASSERT;
  return ERR_OK;
}

static int op_commit(can_vm_t* vm, const can_inst_t* in) {
  can_reg_t* a = &vm->regs[in->ra];
  uint8_t h[32];
  if (can_commit_hash(a, h)!=0) return ERR_OP;
  vm->regs[in->rdst].tag = TAG_HASH;
  memcpy(vm->regs[in->rdst].as.hash.bytes, h, 32);
  return ERR_OK;
}

static int op_emit_geom(can_vm_t* vm, const can_inst_t* in) {
  if (!vm->emit_geom) return ERR_OK;

  // For this vertical slice: emit a tiny event blob (opcode + reg tag).
  // Replace with deterministic SVG/OBJ/GLB event stream later.
  uint8_t evt[8];
  evt[0] = 0xEE;
  evt[1] = vm->regs[in->ra].tag;
  evt[2] = in->opcode;
  evt[3] = in->flags;
  evt[4] = in->ra;
  evt[5] = 0;
  evt[6] = 0;
  evt[7] = 0;
  vm->emit_geom(evt, (uint32_t)sizeof(evt), vm->emit_user);
  return ERR_OK;
}

int can_vm_exec_stream(can_vm_t* vm, const uint8_t* code, uint32_t code_len) {
  uint32_t pc = 0;
  vm->last_error = ERR_OK;

  while (pc + 16 <= code_len) {
    can_inst_t inst;
    if (!can_decode_inst(code + pc, code_len - pc, &inst)) {
      vm->last_error = ERR_DECODE;
      return vm->last_error;
    }

    int rc = ERR_OK;
    switch (inst.opcode) {
      case OP_CANON:        rc = op_canon(vm, &inst); break;
      case OP_MEET:         rc = op_meet(vm, &inst); break;
      case OP_JOIN:         rc = op_join(vm, &inst); break;
      case OP_PROJ_FANO:    rc = op_proj_fano(vm, &inst); break;
      case OP_ASSERT_IDEMP: rc = op_assert_idemp(vm, &inst); break;
      case OP_COMMIT:       rc = op_commit(vm, &inst); break;
      case OP_EMIT_GEOM:    rc = op_emit_geom(vm, &inst); break;
      default:
        rc = ERR_OP; break;
    }

    if (rc != ERR_OK) {
      vm->last_error = rc;
      return rc;
    }

    pc += 16;
  }
  return ERR_OK;
}
```

---

# 9) Minimal “stubs” you must wire to your existing code

Create `vm/can_poly_stub.c` (temporary) and replace stubs with your real:

- `clbc_poly_decode`
- `f2poly_normalize`
- `f2poly_gcd`
- `f2poly_lcm`
- `sha256`

```c
// vm/can_poly_stub.c
#include "can_vm.h"
#include <string.h>

// IMPORTANT: Replace f2poly_t with your real type.
struct f2poly { uint32_t dummy; };

int can_load_poly_from_ref(can_vm_t* vm, uint32_t ref, f2poly_t** out_poly) {
  // TODO: interpret vm->obj_pool as a container; locate object "ref".
  // For now: just return a non-null pointer to show the pipeline works.
  static f2poly_t P;
  *out_poly = &P;
  return 0;
}

int can_poly_canon(const f2poly_t* in, f2poly_t** out) {
  *out = (f2poly_t*)in;
  return 0;
}

int can_poly_gcd(const f2poly_t* a, const f2poly_t* b, f2poly_t** out) {
  *out = (f2poly_t*)a;
  return 0;
}

int can_poly_lcm(const f2poly_t* a, const f2poly_t* b, f2poly_t** out) {
  *out = (f2poly_t*)a;
  return 0;
}

int can_proj_fano(const f2poly_t* in, fano_obj_t* out) {
  static uint8_t triads[3] = {1,2,4}; // placeholder
  out->poly = (f2poly_t*)in;
  out->triads = triads;
  out->triads_len = 3;
  return 0;
}

bool can_fano_valid(const uint8_t* triads, uint32_t len) {
  // TODO: validate against your canonical 7 triads
  (void)triads; (void)len;
  return true;
}

int can_commit_hash(const can_reg_t* obj, uint8_t out32[32]) {
  // TODO: replace with SHA256(canonical-bytes(obj))
  memset(out32, 0, 32);
  out32[0] = (uint8_t)obj->tag;
  return 0;
}
```

---

# 10) How to run the vertical slice (host)

1) Assemble:

```bash
scheme tools/can-asm.scm examples/fold_min.canasm bytecode/fold_min.canb
```

2) Execute on host (tiny harness you can add):

```c
// examples/run_host.c
#include "vm/can_vm.h"
#include <stdio.h>
#include <stdlib.h>

static void on_emit(const uint8_t* evt, uint32_t len, void* user) {
  (void)user;
  printf("EMIT (%u):", len);
  for (uint32_t i=0;i<len;i++) printf(" %02x", evt[i]);
  printf("
");
}

int main(int argc, char** argv) {
  if (argc < 2) { printf("usage: run_host <file.canb>
"); return 2; }
  FILE* f = fopen(argv[1], "rb");
  if (!f) return 3;
  fseek(f, 0, SEEK_END);
  long n = ftell(f);
  fseek(f, 0, SEEK_SET);
  uint8_t* buf = (uint8_t*)malloc((size_t)n);
  fread(buf, 1, (size_t)n, f);
  fclose(f);

  can_vm_t vm;
  can_vm_init(&vm);
  vm.emit_geom = on_emit;

  int rc = can_vm_exec_stream(&vm, buf, (uint32_t)n);
  printf("rc=%d last_error=%d
", rc, vm.last_error);
  free(buf);
  return rc;
}
```

---

## What you’ll have after this bundle

- A **mechanically enforced** assembler for **CANB v1** (fixed-width 16 bytes, RFC-0012)
- A VM loop that already supports your required minimal op set:
  - **CANON / MEET(GCD) / JOIN(LCM) / PROJ_FANO / ASSERT_IDEMP / COMMIT / EMIT_GEOM**
- Clean “ports” to plug in your existing:
  - `clbc_poly_decode/encode`
  - `f2poly_gcd/lcm`
  - Fano triad validator
  - SHA-256

---
