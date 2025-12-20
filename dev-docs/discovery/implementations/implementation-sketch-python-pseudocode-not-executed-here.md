# Implementation sketch (Python pseudocode — not executed here)

`# V: list of vertex ids # partition_tree: recursive structure of blocks (each node has children [B0,B1] or is leaf)  def scaling_function(block):     N = len(block)     vec = np.zeros(len(V))     for v in block: vec[idx(v)] = 1/np.sqrt(N)     return vec  def haar_wavelet(block, B0, B1):     n0, n1 = len(B0), len(B1)     a = np.sqrt(n1 / (n0*(n0+n1)))     b = -np.sqrt(n0 / (n1*(n0+n1)))     vec = np.zeros(len(V))     for v in B0: vec[idx(v)] = a     for v in B1: vec[idx(v)] = b     return vec  # build tree, collect all psi_P vectors -> orthonormal basis`

---
