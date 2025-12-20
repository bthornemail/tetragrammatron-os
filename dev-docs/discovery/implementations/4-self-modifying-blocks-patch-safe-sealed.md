# 4) Self-Modifying Blocks: PATCH (Safe + Sealed)

We’ll add **CLASS-PATCH = 0x3** with a tiny patch VM protocol:

- `PATCH_BEGIN dst` opens a patch buffer (target address in dst via EXT)
- `PATCH_WRITE src` writes 16-bit word from register src into buffer
- `PATCH_SEAL` finalizes digest (prevents mutation)
- `PATCH_APPLY` commits to code memory if seal matches policy

This gives you “circulation” / “self-modifying” **without losing determinism**.

```scheme
(define CLASS-PATCH #x3)

(define PATCH-OPS
  '((PATCH_BEGIN . #x0)  ;; EXT=target_pc
    (PATCH_WRITE . #x1)  ;; write R[src] as next u16
    (PATCH_SEAL  . #x2)
    (PATCH_APPLY . #x3)
    (PATCH_ABORT . #x4)))

(define (patch-op x) (lookup PATCH-OPS x))

(define (PATCH op src dst)
  (encode-instr CLASS-PATCH (patch-op op) (reg src) (reg dst)))
```

Example patch sequence (writes one instruction word):

```scheme
(define prog-patch-demo
  (list
   '(label entry)

   ;; open patch targeting label target (pc-relative computed by rel -> absolute in a real linker;
   ;; for now treat it as immediate absolute PC word index)
   `(ins2 ,(PATCH 'PATCH_BEGIN 'R0 'R0) 16)

   ;; put a word into R1 (host sets registers; later add LIT)
   ;; write it into patch buffer
   `(ins ,(PATCH 'PATCH_WRITE 'R1 'R0))

   ;; seal + apply
   `(ins ,(PATCH 'PATCH_SEAL  'R0 'R0))
   `(ins ,(PATCH 'PATCH_APPLY 'R0 'R0))

   `(ins2 ,(CTRL 'JMP 'R0 'R0) (rel entry))

   '(label target)
   `(ins ,(CTRL 'NOP 'R0 'R0))))
```

---
