# A.9 Implementation Notes (Practical)

- On ESP32/Pico, you can memory-map or stream-parse:
  - Read header
  - Iterate sections
  - When you hit CODE: load words (or execute from flash)
  - When you hit POLY: load CLBC-POLY blobs into constant pool
- For your VM: treat `POLY` indices as handles that ALU/GEOM ops can reference.

---

If you want **next step after A**: I can write the **Scheme encoder/decoder** for CANBC v1 (including deterministic ordering + DGST rules), and a matching **C loader** that reads CODE into a u16 array and exposes a `get_poly_blob(i)` API.

---

## You

Yes

---

## ChatGPT

Perfect — here’s the **next concrete drop-in**: a **Scheme CANBC v1 encoder/decoder** (deterministic) plus a **portable C loader** you can compile on host + ESP32 + Pico. This matches the container spec I just gave: **CLBC-style header + section TLVs + CODE u16 stream + optional POLY blobs containing raw CLBC-POLY encodings**.

I’m keeping this “vertical slice ready”: **VMPR + CODE + POLY + DGST**.

---

## 1) Scheme: `canbc.scm` (encode/decode + deterministic ordering + DGST scope)

Assumptions:
- Racket/Scheme with bytevectors. (If you’re on R5RS-only, tell me and I’ll rewrite to pure lists/ports.)
- You already have `sha256` available (or stub it and compute on host first).

```scheme
;; canbc.scm — CANBC container v1 (RFC-009 Appendix A)
;; Provides:
;;   (canbc-write path canbc-obj)
;;   (canbc-read  path) -> canbc-obj
;;   (make-canbc #:vmpr ... #:code ... #:poly ... #:symb ... #:meta ...)
;;
;; Determinism rules enforced:
;; - Section order fixed
;; - POLY blobs sorted by bytewise ascending
;; - SYMB entries sorted by name bytes ascending
;; - META must be minimal JSON (caller responsibility)

(module canbc racket
  (provide canbc-write canbc-read
           make-canbc
           canbc->bytes bytes->canbc
           canbc-header? canbc-section?)

  (require racket/bytes
           racket/list
           racket/match)

  ;; --------------------------
  ;; Utilities: BE writers/readers
  ;; --------------------------

  (define (u8  n) (bytes (bitwise-and n #xFF)))
  (define (be16 n)
    (bytes (bitwise-and (arithmetic-shift n -8) #xFF)
           (bitwise-and n #xFF)))
  (define (be32 n)
    (bytes (bitwise-and (arithmetic-shift n -24) #xFF)
           (bitwise-and (arithmetic-shift n -16) #xFF)
           (bitwise-and (arithmetic-shift n -8) #xFF)
           (bitwise-and n #xFF)))

  (define (read-u8  in) (read-byte in))
  (define (read-be16 in)
    (define b0 (read-byte in))
    (define b1 (read-byte in))
    (when (or (eof-object? b0) (eof-object? b1)) (error 'read-be16 "EOF"))
    (+ (arithmetic-shift b0 8) b1))
  (define (read-be32 in)
    (define b0 (read-byte in))
    (define b1 (read-byte in))
    (define b2 (read-byte in))
    (define b3 (read-byte in))
    (when (ormap eof-object? (list b0 b1 b2 b3)) (error 'read-be32 "EOF"))
    (+ (arithmetic-shift b0 24)
       (arithmetic-shift b1 16)
       (arithmetic-shift b2 8)
       b3))

  (define (ascii4 s)
    (define b (string->bytes/utf-8 s))
    (unless (= (bytes-length b) 4) (error 'ascii4 "need 4 bytes, got ~a" s))
    b)

  ;; FNV-1a 32 over section headers (tag|sflags|align|length) in file order
  (define (fnv1a32 bs)
    (define prime #x01000193)
    (define hash  #x811C9DC5)
    (for/fold ([h hash]) ([i (in-range (bytes-length bs))])
      (define x (bytes-ref bs i))
      (define h2 (bitwise-xor h x))
      (modulo (* h2 prime) (expt 2 32))))

  ;; Stub: replace with your SHA256. Must return 32-byte bytevector.
  ;; For now: errors to force you to wire it.
  (define (sha256 bytes)
    (error 'sha256 "wire SHA256 implementation here"))

  ;; --------------------------
  ;; Data model
  ;; --------------------------

  (struct canbc (ring-id header-flags sections) #:transparent)
  (struct section (tag sflags align payload) #:transparent)

  (define (canbc-header? x) (canbc? x))
  (define (canbc-section? x) (section? x))

  ;; --------------------------
  ;; Section constructors
  ;; --------------------------

  (define (sec-vmpr isa-id reg-count word-bits)
    ;; isa-id: u32, e.g. #x43414E31 "CAN1"
    (define payload
      (bytes-append (be32 isa-id)
                    (be16 reg-count)
                    (be16 word-bits)
                    (be32 0)))
    (section "VMPR" #x0000 1 payload))

  (define (sec-code words entry-pc #:sflags [sflags 0])
    ;; words: list of exact integers 0..65535
    (define n (length words))
    (define words-bytes
      (apply bytes-append (map (λ (w) (be16 w)) words)))
    (define payload
      (bytes-append (be32 n) (be32 entry-pc) words-bytes))
    (section "CODE" sflags 2 payload))

  (define (sec-poly poly-blobs)
    ;; poly-blobs: list of bytes (each is a full CLBC-POLY blob)
    ;; Deterministic: sort by bytewise ascending
    (define sorted
      (sort poly-blobs bytes<?))
    (define payload
      (bytes-append
       (be32 (length sorted))
       (apply bytes-append
              (for/list ([b (in-list sorted)])
                (bytes-append (be32 (bytes-length b)) b)))))
    (section "POLY" #x0000 1 payload))

  (define (sec-meta json-utf8-bytes)
    (section "META" #x0000 1 json-utf8-bytes))

  (define (sec-symb sym-entries)
    ;; sym-entries: list of (cons name-bytes pc-word-u32)
    ;; Sort by name bytes ascending
    (define sorted
      (sort sym-entries (λ (a b) (bytes<? (car a) (car b)))))
    (define payload
      (bytes-append
       (be32 (length sorted))
       (apply bytes-append
              (for/list ([e (in-list sorted)])
                (define name (car e))
                (define pc   (cdr e))
                (bytes-append (be32 (bytes-length name)) name (be32 pc))))))
    (section "SYMB" #x0000 1 payload))

  (define (sec-dgst algo scope hash32bytes)
    (unless (= (bytes-length hash32bytes) 32)
      (error 'sec-dgst "hash must be 32 bytes"))
    (define payload
      (bytes-append (u8 algo) (u8 scope) (be16 0) hash32bytes))
    (section "DGST" #x0000 1 payload))

  ;; --------------------------
  ;; Canonical section order
  ;; --------------------------

  (define SECTION-ORDER '("VMPR" "CODE" "POLY" "SYMB" "META" "DGST" "SIGN"))

  (define (sort-sections secs)
    (define (rank tag)
      (or (index-of SECTION-ORDER tag) 9999))
    (sort secs (λ (a b)
                 (< (rank (section-tag a))
                    (rank (section-tag b))))))

  ;; --------------------------
  ;; Encoding
  ;; --------------------------

  (define (section->bytes s)
    (define tag (ascii4 (section-tag s)))
    (define sflags (section-sflags s))
    (define align  (section-align s))
    (define payload (section-payload s))
    (bytes-append tag (be16 sflags) (be16 align) (be32 (bytes-length payload)) payload))

  (define (align-pad current-offset align)
    (cond
      [(or (zero? align) (= align 1)) 0]
      [else
       (define r (modulo current-offset align))
       (if (= r 0) 0 (- align r))]))

  (define (encode-with-padding header-bytes sections)
    (define out (open-output-bytes))
    (write-bytes header-bytes out)
    (define offset (bytes-length header-bytes))
    (for ([s (in-list sections)])
      ;; Pad before section header if required by previous rule (payload alignment is relative to file start,
      ;; but easiest: ensure next section header starts at current offset and then payload starts at offset+12;
      ;; we honor requested payload alignment by padding BEFORE section header so that (offset+12) % align == 0.
      (define align (section-align s))
      (define pad (align-pad (+ offset 12) align))
      (when (> pad 0)
        (write-bytes (make-bytes pad 0) out)
        (set! offset (+ offset pad)))
      (define sb (section->bytes s))
      (write-bytes sb out)
      (set! offset (+ offset (bytes-length sb))))
    (get-output-bytes out))

  ;; DGST scope 0x01: whole file except DGST payload bytes treated as zero, preserving header/length.
  (define (apply-dgst-scope file-bytes)
    (define out (bytes-copy file-bytes))
    ;; Walk sections; when tag == "DGST", zero its payload bytes (not header)
    (define in (open-input-bytes out))
    (define magic (read-bytes 4 in))
    (unless (bytes=? magic #"CLBC") (error 'apply-dgst-scope "bad magic"))
    (file-position in 0)
    ;; Skip fixed header (24 bytes)
    (file-position in 24)
    (let loop ()
      (unless (eof-object? (peek-byte in))
        (define tag (read-bytes 4 in))
        (define _sflags (read-be16 in))
        (define _align  (read-be16 in))
        (define len (read-be32 in))
        (define payload-start (file-position in))
        (when (bytes=? tag #"DGST")
          (for ([i (in-range len)])
            (bytes-set! out (+ payload-start i) 0)))
        (file-position in (+ payload-start len))
        (loop)))
    out)

  (define (bytes->u32-at bs off)
    (+ (arithmetic-shift (bytes-ref bs off) 24)
       (arithmetic-shift (bytes-ref bs (+ off 1)) 16)
       (arithmetic-shift (bytes-ref bs (+ off 2)) 8)
       (bytes-ref bs (+ off 3))))

  (define (u32->bytes-set! bs off n)
    (bytes-set! bs off       (bitwise-and (arithmetic-shift n -24) #xFF))
    (bytes-set! bs (+ off 1) (bitwise-and (arithmetic-shift n -16) #xFF))
    (bytes-set! bs (+ off 2) (bitwise-and (arithmetic-shift n -8)  #xFF))
    (bytes-set! bs (+ off 3) (bitwise-and n #xFF)))

  (define (canbc->bytes c)
    (define ring-id (canbc-ring-id c))
    (define hdr-flags (canbc-header-flags c))
    (define secs (sort-sections (canbc-sections c)))

    ;; Build section-header concatenation for toc hash
    (define toc-bytes
      (apply bytes-append
             (for/list ([s (in-list secs)])
               (bytes-append (ascii4 (section-tag s))
                             (be16 (section-sflags s))
                             (be16 (section-align s))
                             (be32 (bytes-length (section-payload s)))))))
    (define toc-h (fnv1a32 toc-bytes))

    ;; Provisional header: file_len=0 until final, section_cnt fixed
    (define header
      (bytes-append
       #"CLBC"
       (u8 #x43)              ; 'C'
       (u8 #x01)              ; version
       (u8 ring-id)
       (u8 hdr-flags)
       (be32 0)               ; file_len placeholder
       (be32 (length secs))
       (be32 toc-h)
       (be32 0)))             ; reserved

    (define file0 (encode-with-padding header secs))
    (define file  (bytes-copy file0))
    (u32->bytes-set! file 8 (bytes-length file)) ; set file_len

    ;; If DGST section exists, fill its hash according to scope rule
    ;; We expect DGST payload is [algo u8][scope u8][rsv u16][hash 32B]
    (define in (open-input-bytes file))
    (file-position in 24)
    (let loop ()
      (unless (eof-object? (peek-byte in))
        (define tag (read-bytes 4 in))
        (define _sflags (read-be16 in))
        (define _align  (read-be16 in))
        (define len (read-be32 in))
        (define payload-start (file-position in))
        (when (bytes=? tag #"DGST")
          (unless (>= len 36) (error 'canbc->bytes "DGST too short"))
          (define algo (bytes-ref file payload-start))
          (define scope (bytes-ref file (+ payload-start 1)))
          (define scoped (apply-dgst-scope file))
          (define h (sha256 scoped))
          ;; write hash into DGST payload at +4
          (for ([i (in-range 32)])
            (bytes-set! file (+ payload-start 4 i) (bytes-ref h i))))
        (file-position in (+ payload-start len))
        (loop)))
    file)

  ;; --------------------------
  ;; Decoding
  ;; --------------------------

  (define (bytes->canbc bs)
    (define in (open-input-bytes bs))
    (define magic (read-bytes 4 in))
    (unless (bytes=? magic #"CLBC") (error 'bytes->canbc "bad magic"))
    (define kind (read-u8 in))
    (unless (= kind #x43) (error 'bytes->canbc "expected kind 'C'"))
    (define ver (read-u8 in))
    (unless (= ver #x01) (error 'bytes->canbc "expected version 1"))
    (define ring (read-u8 in))
    (define hflags (read-u8 in))
    (define file-len (read-be32 in))
    (define scnt (read-be32 in))
    (define _toc (read-be32 in))
    (define _rsv (read-be32 in))
    (unless (= file-len (bytes-length bs)) (error 'bytes->canbc "file_len mismatch"))

    (define secs '())
    (let loop ([i 0])
      (if (or (eof-object? (peek-byte in)) (>= i scnt))
          (canbc ring hflags (reverse secs))
          (begin
            (define tagb (read-bytes 4 in))
            (define tag (bytes->string/utf-8 tagb))
            (define sflags (read-be16 in))
            (define align  (read-be16 in))
            (define len    (read-be32 in))
            (define payload (read-bytes len in))
            (set! secs (cons (section tag sflags align payload) secs))
            (loop (+ i 1))))))

  ;; --------------------------
  ;; Public API
  ;; --------------------------

  (define (make-canbc #:ring-id [ring-id #x01]
                      #:header-flags [hflags #x01]
                      #:vmpr [vmpr #f]
                      #:code [code #f]
                      #:poly [poly #f]
                      #:symb [symb #f]
                      #:meta [meta #f]
                      #:dgst [dgst #f])
    (define secs
      (filter values (list vmpr code poly symb meta dgst)))
    (canbc ring-id hflags secs))

  (define (canbc-write path c)
    (call-with-output-file path
      (λ (out) (write-bytes (canbc->bytes c) out))
      #:exists 'replace))

  (define (canbc-read path)
    (call-with-input-file path
      (λ (in) (bytes->canbc (port->bytes in)))))

  ) ;; end module
```

### Minimal “make a file” usage
```scheme
(require "canbc.scm")

(define vmpr (sec-vmpr #x43414E31 16 16)) ; "CAN1", 16 regs, 16-bit words
(define code (sec-code (list #x1234 #xABCD #x0000) 0))
(define poly (sec-poly (list some-clbc-poly-bytes ...)))

;; DGST placeholder; canbc->bytes will fill the hash
(define dgst (sec-dgst #x01 #x01 (make-bytes 32 0)))

(define c (make-canbc #:vmpr vmpr #:code code #:poly poly #:dgst dgst))
(canbc-write "demo.canbc" c)
```

---

## 2) C: `canbc_loader.h/.c` (portable loader for ESP32/Pico)

This does:
- validate header
- iterate sections
- load CODE words into user buffer (or expose pointer into memory blob)
- expose POLY constant pool blobs (raw CLBC-POLY bytes)

### `canbc_loader.h`
```c
#pragma once
#include <stdint.h>
#include <stddef.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

typedef struct {
    const uint8_t *base;
    size_t len;
} canbc_blob_t;

typedef struct {
    // Header
    uint8_t  ring_id;
    uint8_t  header_flags;
    uint32_t section_cnt;

    // VMPR
    uint32_t isa_id;      // "CAN1"
    uint16_t reg_count;
    uint16_t word_bits;

    // CODE
    uint32_t code_words;
    uint32_t entry_pc_words;
    const uint8_t *code_words_be; // pointer into file payload (u16 BE stream)

    // POLY
    uint32_t poly_cnt;
    const uint8_t *poly_table;    // pointer into POLY payload (u32 len + blob bytes)

} canbc_view_t;

typedef enum {
    CANBC_OK = 0,
    CANBC_ERR_MAGIC,
    CANBC_ERR_VERSION,
    CANBC_ERR_TRUNC,
    CANBC_ERR_SECTION,
    CANBC_ERR_REQUIRED_MISSING,
    CANBC_ERR_BAD_VMPR,
    CANBC_ERR_BAD_CODE,
} canbc_status_t;

// Parse file into a view (no allocations). base MUST remain valid.
canbc_status_t canbc_parse(const uint8_t *base, size_t len, canbc_view_t *out);

// Fetch ith polynomial blob from POLY section (raw CLBC-POLY bytes)
bool canbc_poly_get(const canbc_view_t *v, uint32_t i, canbc_blob_t *out_blob);

// Copy CODE words into host-endian u16 array
bool canbc_copy_code_u16(const canbc_view_t *v, uint16_t *dst, uint32_t cap_words);

#ifdef __cplusplus
}
#endif
```

### `canbc_loader.c`
```c
#include "canbc_loader.h"

static uint16_t be16(const uint8_t *p) { return (uint16_t)((p[0] << 8) | p[1]); }
static uint32_t be32(const uint8_t *p) { return (uint32_t)(p[0]<<24 | p[1]<<16 | p[2]<<8 | p[3]); }

static bool tag_eq(const uint8_t *tag4, const char *s4) {
    return tag4[0]==(uint8_t)s4[0] && tag4[1]==(uint8_t)s4[1] && tag4[2]==(uint8_t)s4[2] && tag4[3]==(uint8_t)s4[3];
}

canbc_status_t canbc_parse(const uint8_t *base, size_t len, canbc_view_t *out) {
    if (!base || !out || len < 24) return CANBC_ERR_TRUNC;

    if (!(base[0]=='C' && base[1]=='L' && base[2]=='B' && base[3]=='C')) return CANBC_ERR_MAGIC;
    if (base[4] != (uint8_t)'C') return CANBC_ERR_SECTION;   // kind
    if (base[5] != 0x01) return CANBC_ERR_VERSION;

    const uint8_t ring_id = base[6];
    const uint8_t hflags  = base[7];
    const uint32_t file_len = be32(base + 8);
    const uint32_t scnt     = be32(base + 12);

    if ((size_t)file_len != len) return CANBC_ERR_TRUNC;

    // init view
    *out = (canbc_view_t){0};
    out->ring_id = ring_id;
    out->header_flags = hflags;
    out->section_cnt = scnt;

    bool have_vmpr = false;
    bool have_code = false;

    size_t off = 24;
    for (uint32_t si=0; si<scnt; si++) {
        if (off + 12 > len) return CANBC_ERR_TRUNC;

        const uint8_t *tag = base + off;      // 4
        const uint16_t sflags = be16(base + off + 4);
        const uint16_t align  = be16(base + off + 6);
        const uint32_t slen   = be32(base + off + 8);
        (void)sflags; (void)align;

        const size_t payload_off = off + 12;
        if (payload_off + slen > len) return CANBC_ERR_TRUNC;
        const uint8_t *payload = base + payload_off;

        if (tag_eq(tag, "VMPR")) {
            if (slen < 12) return CANBC_ERR_BAD_VMPR;
            out->isa_id    = be32(payload + 0);
            out->reg_count = be16(payload + 4);
            out->word_bits = be16(payload + 6);
            have_vmpr = true;
        } else if (tag_eq(tag, "CODE")) {
            if (slen < 8) return CANBC_ERR_BAD_CODE;
            out->code_words      = be32(payload + 0);
            out->entry_pc_words  = be32(payload + 4);
            const size_t words_bytes = (size_t)out->code_words * 2;
            if (slen < 8 + words_bytes) return CANBC_ERR_BAD_CODE;
            out->code_words_be = payload + 8;
            have_code = true;
        } else if (tag_eq(tag, "POLY")) {
            if (slen < 4) return CANBC_ERR_SECTION;
            out->poly_cnt   = be32(payload + 0);
            out->poly_table = payload + 4; // sequence: u32 len + blob
        }

        off = payload_off + slen;
    }

    if (!have_vmpr || !have_code) return CANBC_ERR_REQUIRED_MISSING;
    // VM profile sanity:
    if (out->isa_id != 0x43414E31U) return CANBC_ERR_BAD_VMPR; // "CAN1"
    if (out->word_bits != 16) return CANBC_ERR_BAD_VMPR;

    return CANBC_OK;
}

bool canbc_poly_get(const canbc_view_t *v, uint32_t i, canbc_blob_t *out_blob) {
    if (!v || !out_blob) return false;
    if (v->poly_cnt == 0 || !v->poly_table) return false;
    if (i >= v->poly_cnt) return false;

    const uint8_t *p = v->poly_table;
    for (uint32_t k=0; k<v->poly_cnt; k++) {
        uint32_t blen = be32(p);
        p += 4;
        if (k == i) {
            out_blob->base = p;
            out_blob->len  = blen;
            return true;
        }
        p += blen;
    }
    return false;
}

bool canbc_copy_code_u16(const canbc_view_t *v, uint16_t *dst, uint32_t cap_words) {
    if (!v || !dst) return false;
    if (cap_words < v->code_words) return false;
    const uint8_t *p = v->code_words_be;
    for (uint32_t i=0; i<v->code_words; i++) {
        dst[i] = be16(p + (size_t)i*2);
    }
    return true;
}
```

---

## 3) Wiring to ESP32/Pico (tiny “boot + execute” shim)

### ESP32 (ESP-IDF) idea
- put CANBC file in SPIFFS or flash partition
- `canbc_parse(...)`
- `canbc_copy_code_u16(...)` into IRAM/DRAM
- run your CAN-ISA interpreter loop on that u16 array

### Pico 2 W idea
- store CANBC in flash
- parse view
- execute directly from flash (code_words_be pointer) if your fetch reads BE u16

---

## 4) Next: mapping **Fold Axioms → Opcodes** into this container

Once you confirm you want **u16 “imm16 layouts”** for the opcodes (you’ve been asking “Imm16 layouts”), I’ll do:

1. A **single canonical instruction word format** (major opcode bits + minor + reg fields)
2. A second optional “EXT” word format for larger immediates/offsets
3. The actual **assembler in Scheme** that emits the CODE word stream and **then wraps into CANBC** with DGST.

To keep it aligned with your polynomial codec, I’ll also define:
- `POLY` pool indices referenced by instructions (e.g., `MEET rD, rA, poly#k`)
- strict deterministic rules for constant pool ordering (already in Scheme `sec-poly`)

---

### Quick check (no need to answer unless you want)
For “Imm16 layouts”, do you want:
- **Format-1:** `OP(5) RD(4) RA(4) RB(3)` (no immediate)
- **Format-2:** `OP(5) RD(4) RA(4) IMM3(3)` (tiny imm)
- **EXT:** next word is full `IMM16` / `PCREL16`

If you don’t reply, I’ll pick a sane CAN-ISA v1 baseline and keep EXT optional.

Say “go” and I’ll output the **u16 opcode bit layouts + Scheme assembler** that generates a `demo.canbc` which loads a POLY pool and runs `CANON → MEET(GCD) → JOIN(LCM) → PROJ_FANO → HALT`.

---

## You

Go

---

## ChatGPT

Alright — **CAN-ISA v1 (u16 words)** with **EXT** immediates, plus a **Scheme assembler** that emits a **`.canbc`** file (VMPR+CODE+POLY+SYMB+DGST) and a **demo program**: `CANON → MEET(GCD) → JOIN(LCM) → PROJ_FANO → HALT` (with optional `JMP/JZ` labels).

Below is the **normative encoding** you can paste straight into your RFC-009 Appendix A/B, and the assembler can be dropped into your repo.

---

## A) CAN-ISA v1 — 16-bit instruction word (normative)

### A.1 Register file
- `R0..R15` (4-bit register IDs)
- Convention:
  - `R0` is hardwired zero **(recommended)** for determinism; writes to R0 are ignored.
  - `R14` = scratch, `R15` = SP/optional (your call later).

### A.2 Word endianness
- In `CODE` section, instruction words are stored **big-endian u16** (network order).
- VM reads as u16 logical word.

### A.3 Instruction formats

#### **FMT-R (register)**
Used for pure register ops.

```
15..12  OPC   (4)
11..8   RD    (4)
7..4    RA    (4)
3..0    RB    (4)
```

#### **FMT-I8 (small immediate / index)**
Used for `POLY_REF`, `PROJ_FANO` options, tiny immediates.

```
15..12  OPC   (4)
11..8   RD    (4)
7..0    IMM8  (8)   (unsigned)
```

#### **FMT-COND (conditional branch)**
Condition on one register, small PC-relative jump.

```
15..12  OPC   (4)
11..8   RA    (4)    ; test register
7..0    OFF8  (8)    ; signed two's complement, PC-relative in *words*
```

Branch target:
- `PC := PC + 1 + sign_extend8(OFF8)` (PC counts u16 words)

#### **FMT-EXT (extended immediate)**
`OPC=0xF` introduces a second word (IMM16 or PCREL16). Deterministic, easy to assemble.

Word0:
```
15..12  1111        ; EXT
11..8   EXT_OP (4)
7..4    RD     (4)
3..0    RA     (4)
```

Word1:
```
IMM16 (16) ; unsigned or signed depending on EXT_OP
```

---

## B) Opcode map (minimal vertical slice)

### B.1 Core fold/polynomial VM ops

| OPC | Mnemonic      | Format   | Semantics |
|-----|---------------|----------|----------|
| 0x0 | `HALT`        | FMT-R    | Stop execution. (RD/RA/RB ignored) |
| 0x1 | `CANON`       | FMT-R    | `RD := canon(RA)` (idempotent normal form) |
| 0x2 | `MEET`        | FMT-R    | `RD := gcd(RA, RB)` |
| 0x3 | `JOIN`        | FMT-R    | `RD := lcm(RA, RB)` |
| 0x4 | `PROJ_FANO`   | FMT-I8   | `RD := proj_fano(RD, IMM8)` (IMM8 = mode/plane selector) |
| 0x5 | `POLY_LOAD`   | FMT-I8   | `RD := poly_const[IMM8]` (raw CLBC-POLY decoded to VM poly type) |
| 0x6 | `ASSERT_EQ`   | FMT-R    | If `RA != RB` → trap/fail (deterministic failure) |
| 0x7 | `ASSERT_IDEM` | FMT-R    | Check `canon(RA) == RA` else fail. (RB ignored) |

### B.2 Control-flow (labels/jumps)

| OPC | Mnemonic  | Format    | Semantics |
|-----|-----------|-----------|----------|
| 0x8 | `JMP`     | FMT-COND  | Unconditional: ignore RA, always jump by OFF8 |
| 0x9 | `JZ`      | FMT-COND  | If `RA == 0` jump by OFF8 |
| 0xA | `JNZ`     | FMT-COND  | If `RA != 0` jump by OFF8 |

### B.3 EXT opcodes (optional now, but wired)

| EXT_OP | Mnemonic     | Words | Semantics |
|--------|--------------|-------|----------|
| 0x0    | `LI`         | 2     | `RD := IMM16` (small integers / tags / mode) |
| 0x1    | `JMP16`      | 2     | `PC := IMM16` absolute word address |
| 0x2    | `PCREL16`    | 2     | `PC := PC + 1 + sign_extend16(IMM16)` |
| 0x3    | `POLY_LOAD16`| 2     | `RD := poly_const[IMM16]` (for >255 constants later) |

---

## C) Binary encoding helpers (canonical)

Let:
- `W = (op<<12) | (rd<<8) | (ra<<4) | rb` for FMT-R
- `W = (op<<12) | (rd<<8) | imm8` for FMT-I8
- `W = (op<<12) | (ra<<8) | (off8 & 0xFF)` for FMT-COND
- EXT word0: `W0 = (0xF<<12) | (extop<<8) | (rd<<4) | ra`, word1 = imm16

---

## D) Scheme assembler (labels + emits `.canbc`)

This assumes you already have the earlier `canbc.scm` module (container writer). If not, paste this next to it and `require` it.

### `can_isa_asm.scm`
```scheme
#lang racket
(require racket/match
         racket/list
         racket/bytes
         "canbc.scm")

(provide assemble-can
         emit-demo-canbc)

;; ----------------------------
;; Opcode constants
;; ----------------------------
(define OPC/HALT        #x0)
(define OPC/CANON       #x1)
(define OPC/MEET        #x2)
(define OPC/JOIN        #x3)
(define OPC/PROJ_FANO   #x4)
(define OPC/POLY_LOAD   #x5)
(define OPC/ASSERT_EQ   #x6)
(define OPC/ASSERT_IDEM #x7)
(define OPC/JMP         #x8)
(define OPC/JZ          #x9)
(define OPC/JNZ         #xA)
(define OPC/EXT         #xF)

(define EXT/LI          #x0)
(define EXT/JMP16       #x1)
(define EXT/PCREL16     #x2)
(define EXT/POLY_LOAD16 #x3)

;; ----------------------------
;; Encoding
;; ----------------------------
(define (u16 x)
  (unless (and (integer? x) (<= 0 x #xFFFF))
    (error 'u16 "bad u16: ~a" x))
  x)

(define (enc-r op rd ra rb)
  (u16 (bitwise-ior (arithmetic-shift op 12)
                    (arithmetic-shift rd 8)
                    (arithmetic-shift ra 4)
                    rb)))

(define (enc-i8 op rd imm8)
  (u16 (bitwise-ior (arithmetic-shift op 12)
                    (arithmetic-shift rd 8)
                    (bitwise-and imm8 #xFF))))

(define (enc-cond op ra off8)
  (u16 (bitwise-ior (arithmetic-shift op 12)
                    (arithmetic-shift ra 8)
                    (bitwise-and off8 #xFF))))

(define (enc-ext extop rd ra imm16)
  (list (u16 (bitwise-ior (arithmetic-shift OPC/EXT 12)
                          (arithmetic-shift extop 8)
                          (arithmetic-shift rd 4)
                          ra))
        (u16 (bitwise-and imm16 #xFFFF))))

;; ----------------------------
;; Assembly AST
;; ----------------------------
;; instruction forms:
;;   '(HALT)
;;   '(CANON rd ra)
;;   '(MEET rd ra rb)
;;   '(JOIN rd ra rb)
;;   '(PROJ_FANO rd mode8)
;;   '(POLY_LOAD rd idx8)
;;   '(ASSERT_EQ ra rb)
;;   '(ASSERT_IDEM ra)
;;   '(JMP label)
;;   '(JZ ra label)
;;   '(JNZ ra label)
;;   '(LI rd imm16)   ; EXT
;; labels:
;;   '(LABEL name)

(define (reg x)
  (unless (and (integer? x) (<= 0 x 15)) (error 'reg "bad reg: ~a" x))
  x)

(define (imm8 x)
  (unless (and (integer? x) (<= 0 x 255)) (error 'imm8 "bad imm8: ~a" x))
  x)

(define (imm16 x)
  (unless (and (integer? x) (<= 0 x 65535)) (error 'imm16 "bad imm16: ~a" x))
  x)

;; ----------------------------
;; Pass 1: label addresses (in words)
;; ----------------------------
(define (instr-size i)
  (match i
    [(list 'LABEL _) 0]
    [(list 'LI _ _) 2]
    [_ 1]))

(define (pass1 prog)
  (define pc 0)
  (define labels (make-hash))
  (for ([i (in-list prog)])
    (match i
      [(list 'LABEL name)
       (when (hash-has-key? labels name)
         (error 'pass1 "duplicate label: ~a" name))
       (hash-set! labels name pc)]
      [_ (set! pc (+ pc (instr-size i)))]))
  labels)

;; signed off8 = target - (pc+1)
(define (off8-for labels pc label)
  (define tgt (hash-ref labels label (λ () (error 'assemble "unknown label: ~a" label))))
  (define delta (- tgt (+ pc 1)))
  (when (or (< delta -128) (> delta 127))
    (error 'assemble "branch out of range for OFF8 (pc ~a -> ~a = ~a)" pc tgt delta))
  (bitwise-and delta #xFF))

;; ----------------------------
;; Pass 2: encode to u16 list
;; ----------------------------
(define (assemble-can prog #:entry [entry 0])
  (define labels (pass1 prog))
  (define pc 0)
  (define words '())
  (define symb '()) ; (cons name-bytes pc)
  (define (emit w)
    (set! words (append words w))
    (set! pc (+ pc (length w))))
  (for ([i (in-list prog)])
    (match i
      [(list 'LABEL name)
       (set! symb (cons (cons (string->bytes/utf-8 (symbol->string name))
                              pc)
                        symb))]
      [(list 'HALT)
       (emit (list (enc-r OPC/HALT 0 0 0)))]
      [(list 'CANON rd ra)
       (emit (list (enc-r OPC/CANON (reg rd) (reg ra) 0)))]
      [(list 'MEET rd ra rb)
       (emit (list (enc-r OPC/MEET (reg rd) (reg ra) (reg rb))))]
      [(list 'JOIN rd ra rb)
       (emit (list (enc-r OPC/JOIN (reg rd) (reg ra) (reg rb))))]
      [(list 'PROJ_FANO rd mode)
       (emit (list (enc-i8 OPC/PROJ_FANO (reg rd) (imm8 mode))))]
      [(list 'POLY_LOAD rd idx)
       (emit (list (enc-i8 OPC/POLY_LOAD (reg rd) (imm8 idx))))]
      [(list 'ASSERT_EQ ra rb)
       (emit (list (enc-r OPC/ASSERT_EQ 0 (reg ra) (reg rb))))]
      [(list 'ASSERT_IDEM ra)
       (emit (list (enc-r OPC/ASSERT_IDEM 0 (reg ra) 0)))]
      [(list 'JMP label)
       (define off (off8-for labels pc label))
       (emit (list (enc-cond OPC/JMP 0 off)))]
      [(list 'JZ ra label)
       (define off (off8-for labels pc label))
       (emit (list (enc-cond OPC/JZ (reg ra) off)))]
      [(list 'JNZ ra label)
       (define off (off8-for labels pc label))
       (emit (list (enc-cond OPC/JNZ (reg ra) off)))]
      [(list 'LI rd imm)
       (emit (enc-ext EXT/LI (reg rd) 0 (imm16 imm)))]
      [else
       (error 'assemble-can "unknown instruction: ~a" i)]))
  (values words entry (reverse symb)))

;; ----------------------------
;; Emit .canbc container
;; ----------------------------
(define (emit-demo-canbc out-path poly-blobs)
  ;; poly-blobs: list of bytes (raw CLBC-POLY encodings)
  (define prog
    (list
     '(LABEL entry)
     '(POLY_LOAD 1 0)      ; R1 = P0
     '(POLY_LOAD 2 1)      ; R2 = P1
     '(CANON 1 1)          ; R1 = canon(R1)
     '(CANON 2 2)          ; R2 = canon(R2)
     '(MEET 3 1 2)         ; R3 = gcd(R1,R2)
     '(JOIN 4 1 2)         ; R4 = lcm(R1,R2)
     '(PROJ_FANO 3 0)      ; project gcd
     '(PROJ_FANO 4 0)      ; project lcm
     '(ASSERT_IDEM 3)      ; projections should be stable after CANON in your VM
     '(ASSERT_IDEM 4)
     '(HALT)))

  (define-values (words entry symb) (assemble-can prog #:entry 0))

  ;; VM profile
  (define vmpr (sec-vmpr #x43414E31 16 16)) ; "CAN1", 16 regs, 16-bit words

  ;; CODE
  (define code (sec-code words entry))

  ;; POLY constant pool (sorted deterministically by sec-poly)
  (define poly (sec-poly poly-blobs))

  ;; SYMB
  (define symb-sec (sec-symb symb))

  ;; DGST placeholder (filled by canbc->bytes)
  (define dgst (sec-dgst #x01 #x01 (make-bytes 32 0)))

  (define c (make-canbc #:vmpr vmpr #:code code #:poly poly #:symb symb-sec #:dgst dgst))
  (canbc-write out-path c)
  out-path)
```

---

## E) Demo: producing `demo.canbc`

You need **two** CLBC-POLY blobs as constants (P0, P1). If you already have your `clbc_poly_encode()` on host, just load those bytes into Scheme.

Example (placeholder) — replace with actual bytes from your C encoder:

```scheme
#lang racket
(require "can_isa_asm.scm")

;; TODO: replace with real CLBC-POLY blobs (raw bytes), produced by your C encoder.
(define P0 (bytes #x43 #x4C #x42 #x43 #x50 #x01 #x01 #x00 ...)) ; "CLBC" "P" ...
(define P1 (bytes #x43 #x4C #x42 #x43 #x50 #x01 #x01 #x00 ...))

(emit-demo-canbc "demo.canbc" (list P0 P1))
```

---

## F) What your VM implements first (smallest firmware slice)

To run `demo.canbc`, the VM only needs:

1. **POLY_LOAD**: load constant blob index → decode CLBC-POLY into your `f2poly_t`
2. **CANON**: normalize polynomial (idempotent)
3. **MEET** / **JOIN**: gcd/lcm using your deterministic library
4. **PROJ_FANO**: your “fold projection” (can be a deterministic hash-to-7-incidence first, then upgraded)
5. **ASSERT_IDEM** / **ASSERT_EQ**: trap on mismatch
6. **HALT**

Everything else (patching, multiplexers, timing opcodes) can land later without breaking this encoding.

---

## G) Immediate next deliverable (tell me “next”)
I’ll output:

1) **C VM core** (`can_vm.c`) that fetches u16 words and executes these opcodes, using your existing `f2poly_*` library, and  
2) a **host test runner** that loads `demo.canbc`, executes, and prints a final digest + trace compatible with ESP32/Pico serial logs.

Just say **“next: VM core”**.

---

## You

Vm core

---

## ChatGPT

Perfect — here is the **CAN-ISA v1 VM core** in **portable C**, written to be:

- **Deterministic**
- **Microcontroller-friendly** (ESP32 / Pico)
- **Proof-aligned** with RFC-009 (Origami Fold VM)
- **Minimal but complete** for the first vertical slice

This VM executes the exact instruction set you just standardized.

---
