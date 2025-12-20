# Full multilevel basis

- Start at the coarsest level with φV\varphi_{V}φV  (constant over all vertices).
    
- Recursively apply the split: each time you split a block PPP into B0,B1B_0,B_1B0 ,B1  you add ψP\psi_PψP  to the basis and replace φP\varphi_PφP  with φB0,φB1\varphi_{B_0},\varphi_{B_1}φB0  ,φB1   (if you want a scaling-tree like MRA).
    
- After you perform splits until singletons, the collection {φcoarsest}∪{ψP for every internal node P}\{\varphi_{	ext{coarsest}}\}\cup\{\psi_P\ 	ext{for every internal node }P\}{φcoarsest }∪{ψP  for every internal node P} is an orthonormal basis of R∣V∣\mathbb{R}^{|V|}R∣V∣.
    

(You can also organize as the usual MRA: coarse-space at level jjj spanned by scaling functions of blocks at level jjj; wavelets span the orthogonal complement between adjacent levels.)

---
