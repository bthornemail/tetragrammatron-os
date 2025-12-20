# 2. CanvasL Reference Interpreter (R5RS Scheme)

This interpreter is:
- small,
- readable,
- faithful to the formal model,
- and easy to compile to your assembly backend.

You can publish this as:

```
canvasl-interpreter.scm
```

---

## 2.1 Data model

```scheme
;; CanvasL runtime state
(define *boundaries* '())
(define *tickets* '())
```

---

## 2.2 Utility helpers

```scheme
(define (member? x xs)
  (cond ((null? xs) #f)
        ((equal? x (car xs)) #t)
        (else (member? x (cdr xs)))))

(define (count pred xs)
  (if (null? xs) 0
      (+ (if (pred (car xs)) 1 0)
         (count pred (cdr xs)))))
```

---

## 2.3 Ticket matching predicate (PCG core)

```scheme
(define (matches-two? ticket a b c)
  (let ((in? (lambda (x) (member? x ticket))))
    (or (and (in? a) (in? b))
        (and (in? a) (in? c))
        (and (in? b) (in? c)))))
```

---

## 2.4 Boundary loader

```scheme
(define (load-boundary record)
  (set! *boundaries* (cons record *boundaries*))
  'ok)
```

---

## 2.5 Ticket loader

```scheme
(define (load-tickets record)
  (set! *tickets*
        (append (cdr (assoc 'tickets (cdr (assoc 'body record))))
                *tickets*))
  'ok)
```

---

## 2.6 PCG verifier (exhaustive)

```scheme
(define (verify-pcg)
  (let loop-a ((a 1))
    (if (> a 14) #t
        (let loop-b ((b (+ a 1)))
          (if (> b 14)
              (loop-a (+ a 1))
              (let loop-c ((c (+ b 1)))
                (if (> c 14)
                    (loop-b (+ b 1))
                    (let ((ok?
                           (let loop-t ((ts *tickets*))
                             (cond ((null? ts) #f)
                                   ((matches-two? (car ts) a b c) #t)
                                   (else (loop-t (cdr ts)))))))
                      (if ok?
                          (loop-c (+ c 1))
                          (error "PCG violation" a b c)))))))))
```

---

## 2.7 Main dispatcher (CanvasL execution)

```scheme
(define (execute-record record)
  (case (string->symbol (cdr (assoc 'type record)))
    ((boundary) (load-boundary record))
    ((ticket)   (load-tickets record))
    ((guarantee)
     (if (verify-pcg)
         'pcg-verified
         (error "PCG failed")))
    (else (error "Unknown CanvasL record"))))
```

---

## 2.8 JSONL execution loop (conceptual)

In practice you’ll parse JSON → alists.

```scheme
(define (execute-canvasl records)
  (for-each execute-record records)
  'done)
```

---
