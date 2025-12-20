
## 1) RFC-009 SVG Style Sheet (Normative)

### 1.1 Style IDs
Renderers MUST support at least these style IDs:

- `style-0` : default stroke + point + label
- `style-1` : “active” highlight
- `style-2` : “constraint” / “proof barrier”
- `style-3` : “error” / “violation”
- `style-4` : “ghost” / “historical”
- `style-5` : “selection”
- `style-6` : “axis” / “grid”
- `style-7` : “debug”

### 1.2 Class naming
Elements MUST use:

- lines: `class="stroke style-N"`
- circle-line: `class="stroke style-N"`
- points: `class="point style-N"`
- labels: `class="label"` (style comes from surrounding frame or default)

### 1.3 Normative CSS (byte-stable)
This CSS MUST be emitted *exactly* (including whitespace + ordering) if you want strict byte-identical SVG across implementations:

```css
/* RFC-009 SVG STYLESET v1 (NORMATIVE) */
.stroke{fill:none;stroke-linecap:round;stroke-linejoin:round}
.point{stroke-width:0}
.label{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:24px}
.style-0{stroke:#222;stroke-width:6;fill:#222}
.style-1{stroke:#0a0;stroke-width:10;fill:#0a0}
.style-2{stroke:#06c;stroke-width:10;fill:#06c;stroke-dasharray:16 10}
.style-3{stroke:#c00;stroke-width:12;fill:#c00;stroke-dasharray:10 10}
.style-4{stroke:#777;stroke-width:4;fill:#777;stroke-dasharray:6 12}
.style-5{stroke:#a0a;stroke-width:10;fill:#a0a}
.style-6{stroke:#999;stroke-width:2;fill:#999;stroke-dasharray:4 12}
.style-7{stroke:#f80;stroke-width:6;fill:#f80;stroke-dasharray:2 6}
```

**Rule:** emit `<defs><style>…</style></defs>` exactly once at top-level.

---

## 2) Reference Scheme SVG Emitter (Deterministic)

This is intentionally minimal. It expects a “normalized frame plan” like:

- which lines to draw
- which points to draw
- optional labels for points
- one style-id per element type (or a single default)

It emits fixed order, fixed attribute order, fixed numeric formatting.

```scheme
;; rfc009_fano_svg.scm
;; Deterministic SVG emitter for Fano plane projection (RFC-009)

(define P
  ;; pointId -> (x . y)
  (vector
    (cons 512 256) ; p0
    (cons 707 369) ; p1
    (cons 707 655) ; p2
    (cons 512 768) ; p3
    (cons 317 655) ; p4
    (cons 317 369) ; p5
    (cons 512 512) ; p6
  ))

(define L
  ;; lineId -> (incTriple endpoints)
  ;; incTriple is list (a b c) sorted ascending
  ;; endpoints is cons u . v (lexicographically smallest pair)
  (vector
    (list (list 0 1 2) (cons 0 1))
    (list (list 0 3 4) (cons 0 3))
    (list (list 0 5 6) (cons 0 5))
    (list (list 1 3 5) (cons 1 3))
    (list (list 1 4 6) (cons 1 4))
    (list (list 2 3 6) (cons 2 3))
    (list (list 2 4 5) (cons 2 4))
  ))

(define (escape-xml s)
  ;; minimal escape; deterministic
  (let loop ((chars (string->list s)) (out '()))
    (if (null? chars)
        (list->string (reverse out))
        (let ((c (car chars)))
          (cond
            ((char=? c #\<) (loop (cdr chars) (append (reverse (string->list "&lt;")) out)))
            ((char=? c #\>) (loop (cdr chars) (append (reverse (string->list "&gt;")) out)))
            ((char=? c #\&) (loop (cdr chars) (append (reverse (string->list "&amp;")) out)))
            ((char=? c #") (loop (cdr chars) (append (reverse (string->list "&quot;")) out)))
            (else (loop (cdr chars) (cons c out))))))))

(define (emit port s) (display s port))

(define (emit-int port n)
  ;; MUST be plain base-10 no extra spaces
  (display n port))

(define (emit-style-css port)
  (emit port "<defs><style>")
  (emit port "/* RFC-009 SVG STYLESET v1 (NORMATIVE) */
")
  (emit port ".stroke{fill:none;stroke-linecap:round;stroke-linejoin:round}
")
  (emit port ".point{stroke-width:0}
")
  (emit port ".label{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:24px}
")
  (emit port ".style-0{stroke:#222;stroke-width:6;fill:#222}
")
  (emit port ".style-1{stroke:#0a0;stroke-width:10;fill:#0a0}
")
  (emit port ".style-2{stroke:#06c;stroke-width:10;fill:#06c;stroke-dasharray:16 10}
")
  (emit port ".style-3{stroke:#c00;stroke-width:12;fill:#c00;stroke-dasharray:10 10}
")
  (emit port ".style-4{stroke:#777;stroke-width:4;fill:#777;stroke-dasharray:6 12}
")
  (emit port ".style-5{stroke:#a0a;stroke-width:10;fill:#a0a}
")
  (emit port ".style-6{stroke:#999;stroke-width:2;fill:#999;stroke-dasharray:4 12}
")
  (emit port ".style-7{stroke:#f80;stroke-width:6;fill:#f80;stroke-dasharray:2 6}
")
  (emit port "</style></defs>"))

;; Frame data structure (simple alist):
;; '((frameId . 0)
;;   (drawLines . (0 1 2))
;;   (drawCircle . #t)
;;   (drawPoints . (0 1 2 3 4 5 6))
;;   (labels . ((0 . "Q") (1 . "Sigma") ...))
;;   (styleLines . 0)
;;   (stylePoints . 0)
;;   (styleCircle . 0))

(define (alist-ref key alist default)
  (let ((p (assoc key alist)))
    (if p (cdr p) default)))

(define (emit-line port lineId styleId)
  (let* ((entry (vector-ref L lineId))
         (inc (car entry))
         (endp (cadr entry))
         (u (car endp))
         (v (cdr endp))
         (pu (vector-ref P u))
         (pv (vector-ref P v))
         (x1 (car pu)) (y1 (cdr pu))
         (x2 (car pv)) (y2 (cdr pv)))
    ;; Attribute order MUST match:
    ;; id, data-incidence, x1,y1,x2,y2, class
    (emit port "<line id="L") (emit-int port lineId) (emit port "" data-incidence="p")
    (emit-int port (list-ref inc 0)) (emit port ",p")
    (emit-int port (list-ref inc 1)) (emit port ",p")
    (emit-int port (list-ref inc 2)) (emit port "" x1="")
    (emit-int port x1) (emit port "" y1="") (emit-int port y1)
    (emit port "" x2="") (emit-int port x2) (emit port "" y2="")
    (emit-int port y2) (emit port "" class="stroke style-")
    (emit-int port styleId) (emit port ""/>")))

(define (emit-circle-line port styleId)
  ;; Attribute order MUST match:
  ;; id,data-incidence,cx,cy,r,class
  (emit port "<circle id="Lcircle" data-incidence="p1,p3,p5" cx="512" cy="512" r="192" class="stroke style-")
  (emit-int port styleId)
  (emit port ""/>"))

(define (emit-point port pointId styleId radius)
  (let* ((p (vector-ref P pointId))
         (cx (car p)) (cy (cdr p)))
    ;; Attribute order MUST match:
    ;; id,cx,cy,r,class
    (emit port "<circle id="p") (emit-int port pointId)
    (emit port "" cx="") (emit-int port cx)
    (emit port "" cy="") (emit-int port cy)
    (emit port "" r="") (emit-int port radius)
    (emit port "" class="point style-") (emit-int port styleId)
    (emit port ""/>")))

(define (emit-label port pointId text)
  (let* ((p (vector-ref P pointId))
         (cx (car p)) (cy (cdr p))
         (x (+ cx 14))
         (y (- cy 14)))
    ;; Attribute order MUST match:
    ;; data-label-for,x,y,class, content
    (emit port "<text data-label-for="p") (emit-int port pointId)
    (emit port "" x="") (emit-int port x)
    (emit port "" y="") (emit-int port y)
    (emit port "" class="label">")
    (emit port (escape-xml text))
    (emit port "</text>")))

(define (emit-frame port frame)
  (let* ((fid (alist-ref 'frameId frame 0))
         (lines (alist-ref 'drawLines frame '()))
         (drawCircle (alist-ref 'drawCircle frame #f))
         (points (alist-ref 'drawPoints frame '()))
         (labels (alist-ref 'labels frame '()))
         (styleLines (alist-ref 'styleLines frame 0))
         (stylePoints (alist-ref 'stylePoints frame 0))
         (styleCircle (alist-ref 'styleCircle frame styleLines))
         (pointR (alist-ref 'pointR frame 10)))
    (emit port "<g id="frame") (emit-int port fid) (emit port "">")
    ;; lines in increasing lineId
    (let loopL ((i 0))
      (when (< i 7)
        (when (memv i lines) (emit-line port i styleLines))
        (loopL (+ i 1))))
    (when drawCircle (emit-circle-line port styleCircle))
    ;; points in increasing pointId
    (let loopP ((i 0))
      (when (< i 7)
        (when (memv i points) (emit-point port i stylePoints pointR))
        (loopP (+ i 1))))
    ;; labels in increasing pointId
    (let loopT ((i 0))
      (when (< i 7)
        (let ((lp (assoc i labels)))
          (when lp (emit-label port i (cdr lp))))
        (loopT (+ i 1))))
    (emit port "</g>")))

(define (emit-svg port frames)
  ;; header attribute order MUST match: xmlns, viewBox
  (emit port "<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">")
  (emit-style-css port)
  ;; frames sorted by frameId ascending (assume caller does this)
  (for-each (lambda (fr) (emit-frame port fr)) frames)
  (emit port "</svg>"))

;; Example usage:
;; (emit-svg (current-output-port)
;;   (list
;;     (list (cons 'frameId 0)
;;           (cons 'drawLines '(0 1 2 3 4 5 6))
;;           (cons 'drawCircle #t)
;;           (cons 'drawPoints '(0 1 2 3 4 5 6))
;;           (cons 'labels '((0 . "States") (1 . "Alphabet") (2 . "LeftMarker")
;;                           (3 . "RightMarker") (4 . "Transition") (5 . "Start")
;;                           (6 . "Accept/Reject")))
;;           (cons 'styleLines 0)
;;           (cons 'stylePoints 0)
;;           (cons 'pointR 10))))
```

---

## 3) Mapping to “8-tuple semantic equivalents” (keyboard friendly)

You asked to replace symbols with semantic equivalents. Here’s a clean set that also works for embeddings / mnemonics:

| old | new semantic keyword |
|-----|----------------------|
| Q | `states` |
| Σ | `alphabet` |
| L | `left_marker` |
| R | `right_marker` |
| δ | `transition` |
| s | `start` |
| t | `accept` |
| r | `reject` |

So your default point labels can be:

- p0=`states`
- p1=`alphabet`
- p2=`left_marker`
- p3=`right_marker`
- p4=`transition`
- p5=`start`
- p6=`accept_reject` (or split later once you lift beyond 7-point projection)

If you want *exactly 7 labels* without conflation, we can instead make:
- p6=`decision` (and accept/reject are edges or a style overlay)

---

## 4) Opcode mapping (direct to SVG events)

Here’s the simplest deterministic bridge that matches your CAN-ISA style:

- `OP_PROJ_FANO` → emits the 7 `<line>` + circle + 7 points (frame baseline)
- `OP_STYLE_SET styleId` → selects the style for subsequent draws
- `OP_DRAW_LINE lineId` → adds lineId to frame.drawLines set
- `OP_DRAW_POINT pointId` → adds pointId to frame.drawPoints set
- `OP_LABEL_POINT pointId strId` → adds label entry

Because sets are idempotent, **replay** is guaranteed stable.