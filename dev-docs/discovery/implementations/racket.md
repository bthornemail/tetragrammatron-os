# Racket:
racket hw_norm.scm hardware.canvasl.jsonl hardware.norm.jsonl hardware.f2poly.jsonl 1024
```

---

## 2) `hw_view.scm` (JSONL → deterministic SVG “7-point basis”)

This generates an SVG with **exact coordinates** for 7 semantic points:

1. `OS`
2. `CPU`
3. `MEM`
4. `STORAGE`
5. `NET`
6. `PROXY`
7. `TIME`

…and highlights which are present in your hardware scan.

```scheme
;; hw_view.scm
;; Reads hardware.canvasl.jsonl (or hardware.norm.jsonl) and emits hardware.fano.svg

(define (read-lines path)
  (call-with-input-file path
    (lambda (p)
      (let loop ((acc '()))
        (let ((ln (read-line p)))
          (if (eof-object? ln) (reverse acc)
              (loop (cons ln acc))))))))

;; Minimal: detect presence by substring match (fast + robust).
;; If you want strict parsing, point this at hardware.norm.jsonl and match "HW_FEATURE".
(define (has? lines needle)
  (let loop ((xs lines))
    (cond ((null? xs) #f)
          ((let ((s (car xs)))
             (and (>= (string-length s) (string-length needle))
                  (not (equal? #f (string-contains s needle)))))
           #t)
          (else (loop (cdr xs))))))

(define (svg-circle x y r fill stroke)
  (string-append
   "<circle cx="" (number->string x) "" cy="" (number->string y)
   "" r="" (number->string r) "" fill="" fill "" stroke="" stroke "" stroke-width="2"/>
"))

(define (svg-text x y txt)
  (string-append
   "<text x="" (number->string x) "" y="" (number->string y)
   "" font-family="monospace" font-size="14" text-anchor="middle" dominant-baseline="middle">"
   txt "</text>
"))

(define (svg-line x1 y1 x2 y2 stroke)
  (string-append
   "<line x1="" (number->string x1) "" y1="" (number->string y1)
   "" x2="" (number->string x2) "" y2="" (number->string y2)
   "" stroke="" stroke "" stroke-width="2"/>
"))

(define (write-file path s)
  (call-with-output-file path
    (lambda (p) (display s p))
    'truncate))

(define (main argv)
  (let* ((in (if (>= (length argv) 2) (list-ref argv 1) "hardware.canvasl.jsonl"))
         (out (if (>= (length argv) 3) (list-ref argv 2) "hardware.fano.svg"))
         (lines (read-lines in)))

    ;; Presence tests (works on raw scan OR normalized features)
    (define present-os (or (has? lines ""kind":"HW_OS"") (has? lines "os.android")))
    (define present-cpu (or (has? lines ""kind":"HW_CPU"") (has? lines "cpu.cores")))
    (define present-mem (or (has? lines ""kind":"HW_MEM"") (has? lines "mem.total_kb")))
    (define present-storage (or (has? lines ""kind":"HW_FS"") (has? lines "storage.home")))
    (define present-net (or (has? lines ""kind":"NET_IF"") (has? lines "net.if")))
    (define present-proxy (or (has? lines ""kind":"NET_PROXY_ENV"") (has? lines "proxy.http")))
    (define present-time (has? lines ""t":"))

    ;; Exact coordinate system (deterministic, no layout engine)
    ;; 700x500 canvas, 7 points around a heptagon-ish + center-ish feel
    ;; (Not claiming true projective incidence embedding; this is a fixed “semantic basis” picture.)
    (define W 700) (define H 500)
    (define cx 350) (define cy 250)
    (define R 170)

    ;; Points (x,y) for 7 nodes:
    ;; index: 0..6 with fixed angles
    (define pts
      (list
       (list "OS"      (+ cx (* R (cos 0.0)))           (+ cy (* R (sin 0.0)))           present-os)
       (list "CPU"     (+ cx (* R (cos 0.9)))           (+ cy (* R (sin 0.9)))           present-cpu)
       (list "MEM"     (+ cx (* R (cos 1.8)))           (+ cy (* R (sin 1.8)))           present-mem)
       (list "STORAGE" (+ cx (* R (cos 2.7)))           (+ cy (* R (sin 2.7)))           present-storage)
       (list "NET"     (+ cx (* R (cos 3.6)))           (+ cy (* R (sin 3.6)))           present-net)
       (list "PROXY"   (+ cx (* R (cos 4.5)))           (+ cy (* R (sin 4.5)))           present-proxy)
       (list "TIME"    (+ cx (* R (cos 5.4)))           (+ cy (* R (sin 5.4)))           present-time)))

    ;; Core edges: connect center to all 7, plus a ring
    (define center (list cx cy))
    (define stroke-on "#111")
    (define stroke-off "#999")
    (define fill-on "#fff")
    (define fill-off "#eee")

    (define (pt-x p) (cadr p))
    (define (pt-y p) (caddr p))
    (define (pt-label p) (car p))
    (define (pt-on? p) (cadddr p))

    ;; SVG header
    (define svg
      (string-append
       "<?xml version="1.0" encoding="UTF-8"?>
"
       "<svg xmlns="http://www.w3.org/2000/svg" width="" (number->string W) "" height="" (number->string H)
       "" viewBox="0 0 " (number->string W) " " (number->string H) "">
"
       "<rect x="0" y="0" width="" (number->string W) "" height="" (number->string H) "" fill="#fafafa"/>
"
       "<text x="20" y="30" font-family="monospace" font-size="16">CanvasL Hardware Projection (7-point semantic basis)</text>
"))

    ;; draw center
    (set! svg (string-append svg (svg-circle cx cy 10 "#222" "#222")))
    (set! svg (string-append svg (svg-text cx (+ cy 25) "DEVICE")))

    ;; edges center->each
    (for-each
     (lambda (p)
       (set! svg
             (string-append svg
                            (svg-line cx cy (pt-x p) (pt-y p) (if (pt-on? p) stroke-on stroke-off)))))
     pts)

    ;; ring edges
    (let loop ((i 0))
      (if (< i 7)
          (let* ((p1 (list-ref pts i))
                 (p2 (list-ref pts (modulo (+ i 1) 7))))
            (set! svg
                  (string-append svg
                                 (svg-line (pt-x p1) (pt-y p1) (pt-x p2) (pt-y p2)
                                           (if (and (pt-on? p1) (pt-on? p2)) stroke-on stroke-off))))
            (loop (+ i 1)))
          #t))

    ;; nodes
    (for-each
     (lambda (p)
       (let ((fill (if (pt-on? p) fill-on fill-off))
             (stroke (if (pt-on? p) "#111" "#aaa")))
         (set! svg (string-append svg (svg-circle (pt-x p) (pt-y p) 26 fill stroke)))
         (set! svg (string-append svg (svg-text (pt-x p) (pt-y p) (pt-label p))))))
     pts)

    ;; footer
    (set! svg (string-append svg "</svg>
"))

    (write-file out svg)
    (display "Wrote ") (display out) (newline)))

;; entry
(let ((argv (if (procedure? command-line) (command-line) (list "hw_view.scm"))))
  (main argv))
```

### Run it
```bash