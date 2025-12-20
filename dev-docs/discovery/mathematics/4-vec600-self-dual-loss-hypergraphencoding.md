# 4) Vec600 self-dual loss (hypergraph.encoding)

A minimal, clear sketch that computes a distance-based loss between two feature slices. Uses Euclidean distance; replace with your domain-specific poly.distance4 if you have it.

`(ns hypergraph.encoding   (:require [clojure.core.matrix :as m]))  (defn euclidean-dist-sq [a b]   (reduce + (map (fn [x y] (let [d (- x y)] (* d d))) a b)))  (defn calculate-self-dual-loss   "Compute loss between primal (600-slice) and dual (120-slice) components.    tetra is expected to have :vec600 as a vector of floats at least length 550."   [tetra]   (let [v (:vec600 tetra)         ;; adjust indices to your actual layout; these are examples         p600 (subvec v 150 350) ;; length 200         p120 (subvec v 350 550) ;; length 200         loss (euclidean-dist-sq p600 p120)]     loss))  ;; Example usage: (comment   (calculate-self-dual-loss {:vec600 (vec (repeat 600 0.1))}))`

**Notes**

- Keep slices the same length. If they differ, either interpolate/align or reduce to comparable features (PCA, projection).
    

---
