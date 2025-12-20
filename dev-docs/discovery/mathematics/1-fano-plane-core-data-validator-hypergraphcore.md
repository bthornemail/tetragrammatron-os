# 1) Fano Plane — core data + validator (hypergraph.core)

`(ns hypergraph.core   (:require [clojure.set :as set]))  ;; 7 points labeled 1..7 (7 is the fixed point / x7) (def fano-points (set (range 1 8)))  (def fano-blocks   "The 7 lines (sets of 3 incident points) of the Fano Plane."   #{#{1 2 4}     #{2 3 5}     #{3 4 6}     #{4 5 7}   ;; note: cycle through fixed-point 7     #{5 6 1}     #{6 7 2}     #{7 1 3}})  (defn valid-fano-block?   "True if the provided collection of addresses is exactly one of the Fano blocks."   [coll]   (contains? fano-blocks (set coll)))  ;; Quick REPL sanity-check (comment   (valid-fano-block? [4 5 7]) ;; => true   (valid-fano-block? [1 2 3]) ;; => false   (count fano-points)         ;; => 7   )`

**Notes**

- Use `set` comparisons so order doesn't matter.
    
- `fano-blocks` is the immutable global truth for incidence.
    

---
