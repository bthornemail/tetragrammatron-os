# Patch safety: mechanical constraints you can enforce *in the assembler*

You said: “merge/propagate only if it maintains Fano consistency.” The assembler can do similar *static checks* for patches:

### Rule set (assembler-enforced, cheap)
- `PATCH_BEGIN id` must occur before any `PATCH_WRITE16 id ...`
- `PATCH_SEAL id ...` must occur after all writes and before apply
- `PATCH_APPLY id` must occur after seal
- optional: require `BARRIER_FANO` immediately before `PATCH_APPLY` (hard requirement)

Here’s an optional verifier you can run on the forms **before** assembling:

```scheme
(define (verify-patch-discipline forms)
  ;; Enforce: BEGIN -> (WRITE*) -> SEAL -> APPLY
  ;; and require BARRIER_FANO within last K instructions before APPLY.
  (define (state-init) 'NONE) ; NONE | BEGUN | SEALED
  (let loop ((fs forms) (states '()) (recent '()))
    (if (null? fs) #t
        (let* ((f (car fs))
               (recent2 (let ((r (cons f recent))) (if (> (length r) 8) (take r 8) r))))
          (cond
            ((and (pair? f) (eq? (car f) 'PATCH_BEGIN))
             (let ((id (cadr f)))
               (if (assoc id states) (error "PATCH_BEGIN duplicate id" id))
               (loop (cdr fs) (cons (cons id 'BEGUN) states) recent2)))

            ((and (pair? f) (eq? (car f) 'PATCH_WRITE16))
             (let ((id (cadr f)))
               (let ((st (assoc id states)))
                 (cond
                   ((not st) (error "PATCH_WRITE16 without BEGIN" id))
                   ((eq? (cdr st) 'SEALED) (error "PATCH_WRITE16 after SEAL" id))
                   (else (loop (cdr fs) states recent2))))))

            ((and (pair? f) (eq? (car f) 'PATCH_SEAL))
             (let ((id (cadr f)))
               (let ((st (assoc id states)))
                 (cond
                   ((not st) (error "PATCH_SEAL without BEGIN" id))
                   ((eq? (cdr st) 'SEALED) (error "PATCH_SEAL twice" id))
                   (else
                    ;; update state
                    (loop (cdr fs)
                          (cons (cons id 'SEALED)
                                (filter (lambda (p) (not (= (car p) id))) states))
                          recent2))))))

            ((and (pair? f) (eq? (car f) 'PATCH_APPLY))
             (let ((id (cadr f)))
               (let ((st (assoc id states)))
                 (cond
                   ((not st) (error "PATCH_APPLY without BEGIN" id))
                   ((not (eq? (cdr st) 'SEALED)) (error "PATCH_APPLY before SEAL" id))
                   (else
                    ;; require a recent barrier
                    (if (not (any (lambda (x) (and (pair? x) (eq? (car x) 'BARRIER_FANO))) recent))
                        (error "PATCH_APPLY requires recent BARRIER_FANO" id))
                    (loop (cdr fs) states recent2))))))

            (else (loop (cdr fs) states recent2)))))))

;; helpers take/filter/any (simple versions)
(define (take xs n)
  (if (or (<= n 0) (null? xs)) '()
      (cons (car xs) (take (cdr xs) (- n 1)))))

(define (filter p xs)
  (cond ((null? xs) '())
        ((p (car xs)) (cons (car xs) (filter p (cdr xs))))
        (else (filter p (cdr xs)))))

(define (any p xs)
  (cond ((null? xs) #f)
        ((p (car xs)) #t)
        (else (any p (cdr xs)))))
```

Run `verify-patch-discipline` before `assemble->bytes` and you’ve got an RFC-enforced “safe self-modification gate” at build-time.

---
